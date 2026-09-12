// POST /api/portal/documents/{id}/complete { sha256? } → the finished document

import { NextRequest, NextResponse } from "next/server";
import { completeDocument, getOwnedDocument } from "@/lib/portal/documents";
import { PORTAL_HEADERS, requireBorrower } from "@/lib/portal/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireBorrower(request);
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const documentId = Number.parseInt(id, 10);
  if (!Number.isInteger(documentId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: PORTAL_HEADERS });
  }

  const doc = await getOwnedDocument(auth.borrower.id, documentId);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: PORTAL_HEADERS });
  }

  let claimed: string | undefined;
  try {
    const body = (await request.json().catch(() => ({}))) as { sha256?: unknown };
    if (typeof body.sha256 === "string" && /^[0-9a-f]{64}$/i.test(body.sha256)) claimed = body.sha256;
  } catch {
    // No body is fine.
  }

  const result = await completeDocument(doc, claimed);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status, headers: PORTAL_HEADERS });
  }
  return NextResponse.json({ document: result.document }, { headers: PORTAL_HEADERS });
}
