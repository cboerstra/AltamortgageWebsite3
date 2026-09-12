// GET  /api/portal/documents          → the signed-in borrower's documents
// POST /api/portal/documents/start    → begin an upload (see start/route.ts)

import { NextRequest, NextResponse } from "next/server";
import { listBorrowerDocuments, SLOTS } from "@/lib/portal/documents";
import { PORTAL_HEADERS, requireBorrower } from "@/lib/portal/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireBorrower(request);
  if ("response" in auth) return auth.response;

  const documents = await listBorrowerDocuments(auth.borrower.id);
  return NextResponse.json({ slots: SLOTS, documents }, { headers: PORTAL_HEADERS });
}
