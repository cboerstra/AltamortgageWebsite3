// GET /api/staff/documents/{id} → the decrypted document, as a download.

import { NextRequest, NextResponse } from "next/server";
import { attachmentDisposition, getDocumentForStaff, openDocumentStream } from "@/lib/portal/documents";
import { requireStaffKey, STAFF_HEADERS } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = requireStaffKey(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  const documentId = Number.parseInt(id, 10);
  const doc = Number.isInteger(documentId) ? await getDocumentForStaff(documentId) : null;
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: STAFF_HEADERS });
  }

  return new NextResponse(openDocumentStream(doc), {
    status: 200,
    headers: {
      ...STAFF_HEADERS,
      "Content-Type": doc.mimeType,
      "Content-Length": String(doc.byteSize),
      "Content-Disposition": attachmentDisposition(doc.filename),
      "X-Content-Type-Options": "nosniff",
      ...(doc.sha256 ? { "X-Content-SHA256": doc.sha256 } : {}),
    },
  });
}
