// Shared-key guard for the /api/staff/* routes.
//
// These routes are consumed by the CRM's SERVER, never by a browser: the CRM
// authenticates its own users, then calls here with the key. This is the
// mirror image of how the website calls the CRM's /api/website-lead with
// WEBSITE_API_KEY.
//
// The key is compared in constant time so response timing cannot be used to
// recover it byte by byte.

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Returns a response to send when the request is NOT authorised, or null
 * when it is. Callers write `const denied = requireStaffKey(req); if (denied)
 * return denied;`.
 */
export function requireStaffKey(request: Request): NextResponse | null {
  const expected = process.env.STAFF_API_KEY;
  if (!expected || expected.trim() === "") {
    return NextResponse.json(
      { error: "Staff API is disabled: STAFF_API_KEY is not set." },
      { status: 503 }
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (presented === "" || !constantTimeEquals(presented, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** Common headers for staff responses: never cache, never index. */
export const STAFF_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "X-Robots-Tag": "noindex, nofollow",
} as const;
