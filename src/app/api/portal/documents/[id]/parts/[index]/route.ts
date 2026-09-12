// PUT /api/portal/documents/{id}/parts/{index}   body: raw bytes of one chunk

import { NextRequest, NextResponse } from "next/server";
import { CHUNK_BYTES, getOwnedDocument, storePart } from "@/lib/portal/documents";
import { PORTAL_HEADERS, requireBorrower } from "@/lib/portal/session";

export const runtime = "nodejs";

// A chunk plus a little slack; anything larger is rejected before it is read.
const MAX_BODY = CHUNK_BYTES + 1024;

export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; index: string }> }
) {
  const auth = await requireBorrower(request);
  if ("response" in auth) return auth.response;

  const { id, index } = await ctx.params;
  const documentId = Number.parseInt(id, 10);
  const partIndex = Number.parseInt(index, 10);
  if (!Number.isInteger(documentId) || !Number.isInteger(partIndex)) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: PORTAL_HEADERS });
  }

  const declared = Number.parseInt(request.headers.get("content-length") ?? "", 10);
  if (Number.isInteger(declared) && declared > MAX_BODY) {
    return NextResponse.json({ error: "Chunk too large." }, { status: 413, headers: PORTAL_HEADERS });
  }

  const doc = await getOwnedDocument(auth.borrower.id, documentId);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: PORTAL_HEADERS });
  }

  const bytes = Buffer.from(await request.arrayBuffer());
  if (bytes.length > MAX_BODY) {
    return NextResponse.json({ error: "Chunk too large." }, { status: 413, headers: PORTAL_HEADERS });
  }

  const result = await storePart(doc, partIndex, bytes);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status, headers: PORTAL_HEADERS });
  }
  return NextResponse.json({ ok: true, partIndex }, { headers: PORTAL_HEADERS });
}
