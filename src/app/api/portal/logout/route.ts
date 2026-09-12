// POST /api/portal/logout → revokes the session and clears the cookie.

import { NextRequest, NextResponse } from "next/server";
import { revokeSession } from "@/lib/portal/identity";
import {
  PORTAL_COOKIE,
  PORTAL_HEADERS,
  sessionCookieOptions,
  tokenFromRequest,
} from "@/lib/portal/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = tokenFromRequest(request);
  if (token) await revokeSession(token);

  const res = NextResponse.json({ ok: true }, { headers: PORTAL_HEADERS });
  res.cookies.set(PORTAL_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return res;
}
