// GET /api/staff/applications?q=&page=
//
// Consumed by the CRM server (see src/lib/staff-auth.ts). Lists submitted
// applications, newest first.

import { NextRequest, NextResponse } from "next/server";
import { listApplications, STAFF_PAGE_SIZE } from "@/lib/db";
import { requireStaffKey, STAFF_HEADERS } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const denied = requireStaffKey(request);
  if (denied) return denied;

  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.slice(0, 200) ?? undefined;
  const page = Number.parseInt(params.get("page") ?? "1", 10) || 1;

  const result = await listApplications({ q, page });
  if (!result) {
    return NextResponse.json(
      { error: "Database not configured or unreachable" },
      { status: 503, headers: STAFF_HEADERS }
    );
  }

  return NextResponse.json({ ...result, pageSize: STAFF_PAGE_SIZE }, { headers: STAFF_HEADERS });
}
