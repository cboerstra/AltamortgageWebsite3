// POST /api/portal/login { email }
//
// Always answers 200 with the same body. Whether a code was sent depends on
// whether the email has an application or a draft, and the response never
// says which, so this endpoint cannot be used to test addresses.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendPortalLoginCode } from "@/lib/email";
import { isDbConfigured } from "@/lib/db";
import { ensureBorrower, findEligibleIdentity, issueCode, normalizeEmail } from "@/lib/portal/identity";
import { PORTAL_HEADERS } from "@/lib/portal/session";
import { siteOrigin } from "@/lib/portal/site-url";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({ email: z.string().trim().email().max(255) });

const OK = {
  ok: true,
  message: "If that email has an application with us, a sign-in code is on its way.",
};

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

  const identity = await findEligibleIdentity(email);
  if (!identity) return NextResponse.json(OK, { headers: PORTAL_HEADERS });

  const borrower = await ensureBorrower(email, identity);
  if (!borrower) return NextResponse.json(OK, { headers: PORTAL_HEADERS });

  const code = await issueCode(borrower.id);
  if (!code) return NextResponse.json(OK, { headers: PORTAL_HEADERS });

  const result = await sendPortalLoginCode({
    to: borrower.email,
    firstName: borrower.firstName,
    code,
    portalUrl: `${siteOrigin(request)}/portal/login`,
  });
  if (result.status !== "sent") {
    console.error(
      `[portal] login code not sent to borrower ${borrower.id}: ${result.status} ${result.error ?? ""}`
    );
  }

  return NextResponse.json(OK, { headers: PORTAL_HEADERS });
}
