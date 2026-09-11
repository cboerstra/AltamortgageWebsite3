// Server-side drafts for the application wizard.
//
//   POST /api/drafts          create (no token) or update (with token)
//   GET  /api/drafts?token=…  load for hydration on another device
//
// Unauthenticated by necessity — the applicant has no identity yet — so the
// endpoint is deliberately narrow: a size cap, a per-client rate limit, field
// level validation that discards anything unrecognised, and a token that is
// the only way to address a draft. There is no lookup by email.

import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db";
import { draftIdentity, sanitizeDraft } from "@/lib/drafts/partial";
import { loadDraft, upsertDraft } from "@/lib/drafts/store";
import { generateToken, isTokenShaped } from "@/lib/drafts/token";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** A complete application serialises to well under 8 KB. */
const MAX_BODY_BYTES = 64 * 1024;

const WINDOW_MS = 10 * 60 * 1000;
/** New drafts per client per window. A person needs one. */
const CREATE_LIMIT = 10;
/** Updates per client per window. One per step advance, with room for retries. */
const UPDATE_LIMIT = 120;

const TOTAL_STEPS = 6;

function tooMany(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

function unavailable(): NextResponse {
  // The wizard treats this as "stay local-only"; it is not an error to it.
  return NextResponse.json({ available: false }, { status: 503 });
}

export async function POST(request: NextRequest) {
  if (!isDbConfigured()) return unavailable();

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (body === null || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { token: suppliedToken, data, furthestStep, schemaVersion } = body as Record<string, unknown>;

  const isUpdate = suppliedToken !== undefined;
  if (isUpdate && !isTokenShaped(suppliedToken)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const client = clientKey(request.headers);
  const limit = isUpdate
    ? rateLimit(`drafts:update:${client}`, UPDATE_LIMIT, WINDOW_MS)
    : rateLimit(`drafts:create:${client}`, CREATE_LIMIT, WINDOW_MS);
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

  const sanitized = sanitizeDraft(data);
  if (!sanitized) {
    return NextResponse.json({ error: "Invalid draft" }, { status: 400 });
  }

  // Nothing to send a resume link to means nothing to store.
  const identity = draftIdentity(sanitized);
  if (!identity) {
    return NextResponse.json({ error: "Draft has no email address yet" }, { status: 422 });
  }

  const step =
    typeof furthestStep === "number" && Number.isInteger(furthestStep)
      ? Math.min(Math.max(furthestStep, 0), TOTAL_STEPS - 1)
      : 0;
  const version =
    typeof schemaVersion === "number" && Number.isInteger(schemaVersion) ? schemaVersion : 0;

  const token = isUpdate ? (suppliedToken as string) : generateToken();

  const stored = await upsertDraft({
    token,
    identity,
    data: sanitized,
    schemaVersion: version,
    furthestStep: step,
  });
  if (!stored) return unavailable();

  // The raw token is returned exactly once, on creation. It is never stored
  // server-side and never returned again.
  return NextResponse.json(isUpdate ? { ok: true } : { ok: true, token });
}

export async function GET(request: NextRequest) {
  if (!isDbConfigured()) return unavailable();

  const token = request.nextUrl.searchParams.get("token");
  if (!isTokenShaped(token)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const client = clientKey(request.headers);
  const limit = rateLimit(`drafts:load:${client}`, UPDATE_LIMIT, WINDOW_MS);
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

  const draft = await loadDraft(token);
  // Wrong, purged, and submitted all look the same from outside.
  if (!draft) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      data: draft.data,
      furthestStep: draft.furthestStep,
      schemaVersion: draft.schemaVersion,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
