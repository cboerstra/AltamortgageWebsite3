// The portal session cookie, and the two ways of requiring a signed-in
// borrower: from a route handler (returns a 401 response) and from a server
// component (redirects to the login page).

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { resolveSession, SESSION_TTL_MS, type Borrower } from "./identity";

export const PORTAL_COOKIE = "alta_portal";

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

/** Parse the cookie header of a raw Request (route handlers). */
export function tokenFromRequest(request: Request): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === PORTAL_COOKIE) return decodeURIComponent(rest.join("=")).trim() || null;
  }
  return null;
}

export const PORTAL_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

/**
 * Route-handler guard. Returns the borrower, or a response to send instead.
 * Callers: `const auth = await requireBorrower(req); if ("response" in auth) return auth.response;`
 */
export async function requireBorrower(
  request: Request
): Promise<{ borrower: Borrower } | { response: NextResponse }> {
  const token = tokenFromRequest(request);
  const borrower = token ? await resolveSession(token) : null;
  if (!borrower) {
    return {
      response: NextResponse.json(
        { error: "Sign in to continue" },
        { status: 401, headers: PORTAL_HEADERS }
      ),
    };
  }
  return { borrower };
}

/** Server-component guard. Redirects to the login page when not signed in. */
export async function requireBorrowerPage(): Promise<Borrower> {
  const jar = await cookies();
  const token = jar.get(PORTAL_COOKIE)?.value ?? null;
  const borrower = token ? await resolveSession(token) : null;
  if (!borrower) redirect("/portal/login");
  return borrower;
}

/** Server-component peek: the borrower if signed in, else null. */
export async function currentBorrower(): Promise<Borrower | null> {
  const jar = await cookies();
  const token = jar.get(PORTAL_COOKIE)?.value ?? null;
  return token ? resolveSession(token) : null;
}
