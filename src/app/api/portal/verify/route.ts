// POST /api/portal/verify { email, code } → sets the session cookie.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDbConfigured } from "@/lib/db";
import { createSession, normalizeEmail, verifyCode } from "@/lib/portal/identity";
import { PORTAL_COOKIE, PORTAL_HEADERS, sessionCookieOptions } from "@/lib/portal/session";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().trim().email().max(255),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

const REASON_MESSAGES: Record<string, string> = {
  no_code: "That code is not valid. Request a new one.",
  expired: "That code has expired. Request a new one.",
  mismatch: "That code does not match. Check the email and try again.",
  too_many_attempts: "Too many wrong attempts. Request a new code.",
  unavailable: "The portal is not available right now.",
};

export async function POST(request: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: REASON_MESSAGES.unavailable }, { status: 503, headers: PORTAL_HEADERS });
  }

  const limit = rateLimit(`portal-verify:${clientKey(request.headers)}`, 20, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes." },
      { status: 429, headers: { ...PORTAL_HEADERS, "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let input: z.infer<typeof bodySchema>;
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter your email and the 6-digit code." },
        { status: 400, headers: PORTAL_HEADERS }
      );
    }
    input = parsed.data;
  } catch {
    return NextResponse.json(
      { error: "Enter your email and the 6-digit code." },
      { status: 400, headers: PORTAL_HEADERS }
    );
  }

  const result = await verifyCode(normalizeEmail(input.email), input.code);
  if (!result.ok) {
    const status = result.reason === "unavailable" ? 503 : 401;
    return NextResponse.json({ error: REASON_MESSAGES[result.reason] }, { status, headers: PORTAL_HEADERS });
  }

  const token = await createSession(result.borrower.id);
  if (!token) {
    return NextResponse.json({ error: REASON_MESSAGES.unavailable }, { status: 503, headers: PORTAL_HEADERS });
  }

  const res = NextResponse.json(
    { ok: true, borrower: { firstName: result.borrower.firstName, email: result.borrower.email } },
    { headers: PORTAL_HEADERS }
  );
  res.cookies.set(PORTAL_COOKIE, token, sessionCookieOptions());
  return res;
}
