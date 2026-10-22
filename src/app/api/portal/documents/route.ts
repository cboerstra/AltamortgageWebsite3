// GET  /api/portal/documents          → the signed-in borrower's documents
// POST /api/portal/documents/start    → begin an upload (see start/route.ts)

import { NextRequest, NextResponse } from "next/server";
import { listBorrowerDocuments } from "@/lib/portal/documents";
import { getDocumentPlan } from "@/lib/portal/overview";
import { PORTAL_HEADERS, requireBorrower } from "@/lib/portal/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireBorrower(request);
  if ("response" in auth) return auth.response;

  const [documents, slots] = await Promise.all([
    listBorrowerDocuments(auth.borrower.id),
    getDocumentPlan(auth.borrower.email),
  ]);
  return NextResponse.json({ slots, documents }, { headers: PORTAL_HEADERS });
}
