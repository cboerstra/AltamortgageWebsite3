// POST /api/portal/documents/start { slot, filename, mimeType, byteSize }
// → { documentId, partCount, chunkBytes }

import { NextRequest, NextResponse } from "next/server";
import { startDocument, validateStart } from "@/lib/portal/documents";
import { PORTAL_HEADERS, requireBorrower } from "@/lib/portal/session";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireBorrower(request);
  if ("response" in auth) return auth.response;

  const limit = rateLimit(`portal-upload:${clientKey(request.headers)}`, 60, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many uploads at once. Please wait a few minutes." },
      { status: 429, headers: { ...PORTAL_HEADERS, "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400, headers: PORTAL_HEADERS });
  }

  const valid = validateStart({
    slot: body?.slot,
    filename: body?.filename,
    mimeType: body?.mimeType,
    byteSize: body?.byteSize,
  });
  if (!valid.ok) {
    return NextResponse.json({ error: valid.error }, { status: 400, headers: PORTAL_HEADERS });
  }

  const started = await startDocument(auth.borrower.id, valid);
  if (!started.ok) {
    return NextResponse.json({ error: started.error }, { status: started.status, headers: PORTAL_HEADERS });
  }
  return NextResponse.json(
    { documentId: started.documentId, partCount: started.partCount, chunkBytes: started.chunkBytes },
    { headers: PORTAL_HEADERS }
  );
}
