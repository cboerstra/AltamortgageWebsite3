// GET    /api/portal/documents/{id} → download (owner only)
// DELETE /api/portal/documents/{id} → remove (owner only)

import { NextRequest, NextResponse } from "next/server";
import {
  attachmentDisposition,
  deleteDocument,
  getOwnedDocument,
  openDocumentStream,
} from "@/lib/portal/documents";
import { PORTAL_HEADERS, requireBorrower } from "@/lib/portal/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireBorrower(request);
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const documentId = Number.parseInt(id, 10);
  const doc = Number.isInteger(documentId) ? await getOwnedDocument(auth.borrower.id, documentId) : null;
  if (!doc || doc.status !== "available") {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: PORTAL_HEADERS });
  }

  return new NextResponse(openDocumentStream(doc), {
    status: 200,
    headers: {
      ...PORTAL_HEADERS,
      "Content-Type": doc.mimeType,
      "Content-Length": String(doc.byteSize),
      "Content-Disposition": attachmentDisposition(doc.filename),
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireBorrower(request);
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const documentId = Number.parseInt(id, 10);
  if (!Number.isInteger(documentId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: PORTAL_HEADERS });
  }

  const removed = await deleteDocument(auth.borrower.id, documentId);
  if (!removed) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: PORTAL_HEADERS });
  }
  return NextResponse.json({ ok: true }, { headers: PORTAL_HEADERS });
}
