// Portal sign-in attempt log — the staff-facing side of POST /api/portal/login.
//
// That endpoint answers every request with the same body, so it cannot be used
// to discover which emails have applications. Right for the public, but it hid
// every failure from staff too: a borrower whose code was never sent was told
// "a code is on its way", and the only trace was a console.error nobody reads.
// Each request now leaves one row here saying what actually happened, readable
// only through the staff API.
//
// Recording is best-effort and never throws. A sign-in must not fail because
// its log row could not be written — and the table is created by hand from
// db/schema.sql, so on a given deployment it may simply not exist yet.

import type { Pool } from "pg";
import { getPool } from "@/lib/db";
import { normalizeEmail } from "./identity";

export const LOGIN_OUTCOMES = [
  "sent",
  "no_match",
  "rate_limited",
  "email_not_configured",
  "email_failed",
  "error",
] as const;
export type LoginOutcome = (typeof LOGIN_OUTCOMES)[number];

/** Rows include addresses that matched nothing, so they are not kept forever. */
export const LOGIN_EVENT_RETENTION_DAYS = 90;
const PRUNE_INTERVAL_MS = 60 * 60 * 1000;
const DETAIL_MAX = 500;
export const LOGIN_EVENTS_MAX_LIMIT = 200;
const LOGIN_EVENTS_DEFAULT_LIMIT = 50;

export interface LoginEvent {
  id: number;
  email: string;
  outcome: LoginOutcome;
  detail: string | null;
  createdAt: string;
}

let lastPrunedAt = 0;
let missingTableWarned = false;

/** Postgres "relation does not exist": schema.sql has not been run here yet. */
function isMissingTable(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === "42P01";
}

async function pruneIfDue(p: Pool): Promise<void> {
  const now = Date.now();
  if (now - lastPrunedAt < PRUNE_INTERVAL_MS) return;
  lastPrunedAt = now;
  try {
    await p.query(
      `DELETE FROM portal_login_events WHERE created_at < NOW() - make_interval(days => $1)`,
      [LOGIN_EVENT_RETENTION_DAYS]
    );
  } catch (err) {
    console.error("pruneLoginEvents error:", err);
  }
}

/** Record one sign-in attempt. Resolves in every case; never rejects. */
export async function recordLoginEvent(
  email: string,
  outcome: LoginOutcome,
  detail?: string | null
): Promise<void> {
  const p = getPool();
  if (!p) return;

  try {
    await p.query(`INSERT INTO portal_login_events (email, outcome, detail) VALUES ($1, $2, $3)`, [
      normalizeEmail(email).slice(0, 255),
      outcome,
      detail ? detail.slice(0, DETAIL_MAX) : null,
    ]);
  } catch (err) {
    if (isMissingTable(err)) {
      if (!missingTableWarned) {
        console.warn(
          "[portal] portal_login_events does not exist — run db/schema.sql. Sign-in attempts are not being logged."
        );
        missingTableWarned = true;
      }
      return;
    }
    console.error("recordLoginEvent error:", err);
    return;
  }

  await pruneIfDue(p);
}

export type ListLoginEventsResult =
  | { status: "ok"; events: LoginEvent[] }
  | { status: "table_missing" }
  | { status: "unavailable" };

/**
 * Recent sign-in attempts, newest first. With `email`, only that borrower's;
 * with `problemsOnly`, everything except successful sends.
 */
export async function listLoginEvents(input: {
  email?: string;
  limit?: number;
  problemsOnly?: boolean;
}): Promise<ListLoginEventsResult> {
  const p = getPool();
  if (!p) return { status: "unavailable" };

  const requested = input.limit ?? LOGIN_EVENTS_DEFAULT_LIMIT;
  const limit = Math.min(Math.max(Number.isFinite(requested) ? Math.trunc(requested) : 0, 1), LOGIN_EVENTS_MAX_LIMIT);

  const conditions: string[] = [];
  const values: unknown[] = [];
  if (input.email) {
    values.push(normalizeEmail(input.email));
    conditions.push(`email = $${values.length}`);
  }
  if (input.problemsOnly) conditions.push(`outcome <> 'sent'`);
  values.push(limit);

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const { rows } = await p.query<{
      id: number;
      email: string;
      outcome: LoginOutcome;
      detail: string | null;
      created_at: Date;
    }>(
      `SELECT id, email, outcome, detail, created_at
         FROM portal_login_events
         ${where}
        ORDER BY created_at DESC, id DESC
        LIMIT $${values.length}`,
      values
    );
    return {
      status: "ok",
      events: rows.map((r) => ({
        id: r.id,
        email: r.email,
        outcome: r.outcome,
        detail: r.detail,
        createdAt: r.created_at.toISOString(),
      })),
    };
  } catch (err) {
    if (isMissingTable(err)) return { status: "table_missing" };
    console.error("listLoginEvents error:", err);
    return { status: "unavailable" };
  }
}

/** Test seam: forget the prune and warning timers between tests. */
export function resetLoginEventState(): void {
  lastPrunedAt = 0;
  missingTableWarned = false;
}
