// GET /api/staff/applications/{ref}
//
// One application, with the same curated summary the loan-officer email
// carries, rebuilt from the stored payload.

import { NextRequest, NextResponse } from "next/server";
import { buildApplicationSummary, type SummarySection } from "@/lib/application-summary";
import { getApplicationByRef } from "@/lib/db";
import { applicationSchema } from "@/lib/schemas";
import { requireStaffKey, STAFF_HEADERS } from "@/lib/staff-auth";

export const runtime = "nodejs";

const REF_PATTERN = /^ALT-[A-Z2-9]{5}$/;

export async function GET(request: NextRequest, ctx: { params: Promise<{ ref: string }> }) {
  const denied = requireStaffKey(request);
  if (denied) return denied;

  const { ref } = await ctx.params;
  const refNumber = ref.toUpperCase();
  if (!REF_PATTERN.test(refNumber)) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: STAFF_HEADERS });
  }

  const app = await getApplicationByRef(refNumber);
  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: STAFF_HEADERS });
  }

  // raw_payload is the validated form minus the SSN. Re-validate rather than
  // trust it blindly: a row written by an older schema should degrade to
  // "summary unavailable", not crash the CRM page.
  let summary: SummarySection[] | null = null;
  const parsed = applicationSchema.safeParse({
    ...app.rawPayload,
    // ssnLast4() takes the last four digits of whatever it is given, so this
    // reconstructs the masked row without the real number ever existing here.
    ssn: app.ssnLast4 ? `XXX-XX-${app.ssnLast4}` : undefined,
  });
  if (parsed.success) {
    summary = buildApplicationSummary(parsed.data, {
      referenceNumber: app.refNumber,
      submittedAt: app.createdAt,
      mismoFilename: app.mismoPath ? app.mismoPath.split("/").pop() : undefined,
    });
  }

  const { rawPayload: _raw, ...rest } = app;
  void _raw;

  return NextResponse.json(
    {
      ...rest,
      summary,
      mismoFilename: app.mismoPath ? app.mismoPath.split("/").pop() : null,
      mismoAvailable: app.mismoStatus === "written" && Boolean(app.mismoPath),
    },
    { headers: STAFF_HEADERS }
  );
}
