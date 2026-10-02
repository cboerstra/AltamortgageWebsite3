// POST /api/portal/login { email }
//
// Always answers 200 with the same body. Whether a code was sent depends on
// whether the email has an application or a draft, and the response never
// says which, so this endpoint cannot be used to test addresses.
//
// What actually happened is recorded in portal_login_events for staff — the
// only way anyone at Alta can tell "no matching application" from "SMTP is
// down" from "they asked for too many codes", all of which look identical to
// the borrower.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendPortalLoginCode } from "@/lib/email";
import { isDbConfigured } from "@/lib/db";
import {
  CODE_TTL_MS,
  CODE_WINDOW_MS,
  CODES_PER_WINDOW,
  ensureBorrower,
  findEligibleIdentity,
  issueCode,
  normalizeEmail,
} from "@/lib/portal/identity";
import { recordLoginEvent } from "@/lib/portal/login-events";
import { PORTAL_HEADERS } from "@/lib/portal/session";
import { siteOrigin } from "@/lib/portal/site-url";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({ email: z.string().trim().email().max(255) });

const WINDOW_MINUTES = CODE_WINDOW_MS / 60_000;
const CODE_TTL_MINUTES = CODE_TTL_MS / 60_000;

/**
 * The one response every request gets. It states the per-email cap up front:
 * a borrower who never saw the first email (spam, a slow mail server) tends to
 * click "Send a new code" until they hit it, after which nothing more is sent.
 * Saying so tells them to wait and check spam without revealing whether the
 * address exists — the cap applies to everyone, so stating it gives nothing
 * away. The limits travel with it so the form can explain them without its
 * own copy of the numbers drifting out of step with the server.
 */
const OK = {
  ok: true,
  message:
    `If that email has an application with us, a sign-in code is on its way. ` +
    `It can take a minute or two — check your spam or junk folder too. ` +
    `For your security we send at most ${CODES_PER_WINDOW} codes every ${WINDOW_MINUTES} minutes, ` +
    `and each new code replaces the one before it.`,
  codesPerWindow: CODES_PER_WINDOW,
  windowMinutes: WINDOW_MINUTES,
  codeTtlMinutes: CODE_TTL_MINUTES,
};

function ok() {
  return NextResponse.json(OK, { headers: PORTAL_HEADERS });
}

export async function POST(request: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "The portal is not available right now." },
      { status: 503, headers: PORTAL_HEADERS }
    );
  }

  // Per-client cap on top of the per-email cap inside issueCode.
  const limit = rateLimit(`portal-login:${clientKey(request.headers)}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes." },
      { status: 429, headers: { ...PORTAL_HEADERS, "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let email: string;
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400, headers: PORTAL_HEADERS });
    }
    email = normalizeEmail(parsed.data.email);
  } catch {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400, headers: PORTAL_HEADERS });
  }

  const eligibility = await findEligibleIdentity(email);
  if (!eligibility.ok) {
    if (eligibility.reason === "no_match") {
      await recordLoginEvent(email, "no_match", "no application or draft uses this email");
    } else {
      await recordLoginEvent(email, "error", `eligibility lookup failed: ${eligibility.error}`);
    }
    return ok();
  }

  const created = await ensureBorrower(email, eligibility.name);
  if (!created.ok) {
    await recordLoginEvent(email, "error", `borrower record failed: ${created.error}`);
    return ok();
  }
  const borrower = created.borrower;

  const issued = await issueCode(borrower.id);
  if (!issued.ok) {
    if (issued.reason === "rate_limited") {
      await recordLoginEvent(
        email,
        "rate_limited",
        `${CODES_PER_WINDOW} codes already sent in the last ${WINDOW_MINUTES} minutes`
      );
    } else {
      await recordLoginEvent(email, "error", `code could not be issued: ${issued.error}`);
    }
    return ok();
  }

  const result = await sendPortalLoginCode({
    to: borrower.email,
    firstName: borrower.firstName,
    code: issued.code,
    portalUrl: `${siteOrigin(request)}/portal/login`,
  });

  if (result.status === "sent") {
    await recordLoginEvent(email, "sent");
  } else {
    console.error(
      `[portal] login code not sent to borrower ${borrower.id}: ${result.status} ${result.error ?? ""}`
    );
    await recordLoginEvent(
      email,
      result.status === "skipped" ? "email_not_configured" : "email_failed",
      result.error ?? null
    );
  }

  return ok();
}
