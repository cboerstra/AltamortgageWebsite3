// GET /api/staff/applications/{ref}/documents
//
// The borrower's uploaded documents, matched by the application's email.
// Never the bytes — those come from /api/staff/documents/{id}.

import { NextRequest, NextResponse } from "next/server";
import { getApplicationByRef } from "@/lib/db";
import { listDocumentsByEmail, SLOTS } from "@/lib/portal/documents";
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

  const documents = await listDocumentsByEmail(app.email);
  return NextResponse.json(
    {
      refNumber,
      email: app.email,
      slots: SLOTS,
      documents: documents.map((d) => ({
        id: d.id,
        slot: d.slot,
        filename: d.filename,
        mimeType: d.mimeType,
        byteSize: d.byteSize,
        sha256: d.sha256,
        uploadedAt: d.completedAt ?? d.uploadedAt,
        // No scanner runs on Vercel; say so rather than imply otherwise.
        scanned: false,
      })),
    },
    { headers: STAFF_HEADERS }
  );
}
