// GET /api/staff/portal/login-events?email=&limit=&problemsOnly=1
//
// Borrower portal sign-in attempts, newest first: what each code request
// actually did — sent, matched no application, hit the per-email cap, or
// failed to send. The public login endpoint answers all of these identically,
// so this is the only place the difference is visible.
//
// With `email`, one borrower's attempts. Without it, everyone's — which is how
// staff find the most common failure, a borrower signing in with a different
// email than they applied with, since that attempt belongs to no application.

import { NextRequest, NextResponse } from "next/server";
import { listLoginEvents } from "@/lib/portal/login-events";
import { requireStaffKey, STAFF_HEADERS } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const denied = requireStaffKey(request);
  if (denied) return denied;

  const params = request.nextUrl.searchParams;
  const email = params.get("email")?.trim() || undefined;
  const limitParam = params.get("limit");
  const limit = limitParam === null ? undefined : Number.parseInt(limitParam, 10) || undefined;
  const problemsOnly = params.get("problemsOnly") === "1";

  const result = await listLoginEvents({ email, limit, problemsOnly });

  if (result.status === "table_missing") {
    return NextResponse.json(
      {
        error:
          "Sign-in logging is not set up on the website: the portal_login_events table does not exist. " +
          "Run the portal_login_events block of db/schema.sql against the website's database.",
      },
      { status: 503, headers: STAFF_HEADERS }
    );
  }
  if (result.status === "unavailable") {
    return NextResponse.json(
      { error: "Database not configured or unreachable" },
      { status: 503, headers: STAFF_HEADERS }
    );
  }
  return NextResponse.json({ events: result.events }, { headers: STAFF_HEADERS });
}
