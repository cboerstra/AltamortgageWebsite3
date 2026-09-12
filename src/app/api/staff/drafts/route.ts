// GET /api/staff/drafts?page=
//
// In-progress applications: who started, how far they got, whether they have
// been reminded. Never the draft contents, never a token.

import { NextRequest, NextResponse } from "next/server";
import { listDraftsForStaff } from "@/lib/drafts/store";
import { requireStaffKey, STAFF_HEADERS } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const denied = requireStaffKey(request);
  if (denied) return denied;

  const page = Number.parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10) || 1;
  const result = await listDraftsForStaff({ page });
  if (!result) {
    return NextResponse.json(
      { error: "Database not configured or unreachable" },
      { status: 503, headers: STAFF_HEADERS }
    );
  }
  return NextResponse.json(result, { headers: STAFF_HEADERS });
}
