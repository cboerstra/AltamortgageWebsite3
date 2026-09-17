// /api/staff/applications/{ref}/mismo
//
//   GET   the MISMO v3.4 document itself, as a download. Fetched from Blob
//         storage (private) in production, from disk locally. The storage key
//         comes from the database row, never from the URL, and is validated
//         before use.
//   POST  regenerate the document from the stored application with the
//         current generator — for when the generator improves after a
//         submission. The store is write-once, so the new document gets a
//         new key and the old one is removed after the row points at the new.

import { NextRequest, NextResponse } from "next/server";
import { getApplicationByRef, isDbConfigured } from "@/lib/db";
import { readMismoFile } from "@/lib/mismo";
import { regenerateMismoByRef, StalePayloadError } from "@/lib/mismo/regenerate";
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
  if (app.mismoStatus !== "written" || !app.mismoPath) {
    return NextResponse.json(
      { error: "No MISMO document was written for this application", mismoStatus: app.mismoStatus },
      { status: 409, headers: STAFF_HEADERS }
    );
  }

  let body: Buffer | null;
  try {
    body = await readMismoFile(app.mismoPath);
  } catch (err) {
    console.error(`[${refNumber}] MISMO read failed:`, err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not read document" }, { status: 502, headers: STAFF_HEADERS });
  }
  if (!body) {
    return NextResponse.json({ error: "Document missing from storage" }, { status: 404, headers: STAFF_HEADERS });
  }

  const filename = app.mismoPath.split("/").pop() ?? `${refNumber}.xml`;
  return new NextResponse(new Uint8Array(body), {
    status: 200,
    headers: {
      ...STAFF_HEADERS,
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Length": String(body.byteLength),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
      ...(app.mismoSha256 ? { "X-Content-SHA256": app.mismoSha256 } : {}),
    },
  });
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ ref: string }> }) {
  const denied = requireStaffKey(request);
  if (denied) return denied;

  const { ref } = await ctx.params;
  const refNumber = ref.toUpperCase();
  if (!REF_PATTERN.test(refNumber)) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: STAFF_HEADERS });
  }
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "Website database is not configured or unreachable." },
      { status: 503, headers: STAFF_HEADERS }
    );
  }

  try {
    const result = await regenerateMismoByRef(refNumber);
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404, headers: STAFF_HEADERS });
    return NextResponse.json(
      { regenerated: true, refNumber, mismoFilename: result.filename, mismoSha256: result.sha256, bytes: result.bytes },
      { headers: STAFF_HEADERS }
    );
  } catch (err) {
    if (err instanceof StalePayloadError) {
      return NextResponse.json({ error: err.message }, { status: 422, headers: STAFF_HEADERS });
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${refNumber}] MISMO regeneration failed:`, message);
    return NextResponse.json({ error: `Regeneration failed: ${message}` }, { status: 500, headers: STAFF_HEADERS });
  }
}
