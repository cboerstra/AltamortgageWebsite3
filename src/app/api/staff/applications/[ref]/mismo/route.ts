// GET /api/staff/applications/{ref}/mismo
//
// The MISMO v3.4 document itself, as a download. Fetched from Blob storage
// (private) in production, from disk locally. The storage key comes from the
// database row, never from the URL, and is validated before use.

import { NextRequest, NextResponse } from "next/server";
import { getApplicationByRef } from "@/lib/db";
import { readMismoFile } from "@/lib/mismo";
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
