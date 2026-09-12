// Persistence for server-side application drafts.
//
// Every function short-circuits when the database is not configured, in the
// same way the rest of db.ts does: the wizard then keeps working with the
// local-only draft, and no reminder is ever attempted.
//
// Drafts are addressed by token hash, never by email. Looking a draft up by
// email would turn the endpoint into an oracle for "does this person have a
// mortgage application in progress".

import { getPool } from "@/lib/db";
import type { DraftData, DraftIdentity } from "./partial";
import { DRAFT_RETENTION_DAYS, MAX_REMINDERS } from "./reminders";
import { hashToken, openToken, sealToken } from "./token";

export interface DraftRecord {
  id: number;
  email: string;
  /** Encrypted raw token, or null if DRAFT_LINK_KEY was unset at creation. */
  tokenEnc: string | null;
  firstName: string | null;
  lastName: string | null;
  data: DraftData;
  schemaVersion: number;
  furthestStep: number;
  remindersSent: number;
  lastReminderAt: Date | null;
  optedOut: boolean;
  submittedRef: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DraftRow {
  id: number;
  email: string;
  token_enc: string | null;
  first_name: string | null;
  last_name: string | null;
  data: DraftData;
  schema_version: number;
  furthest_step: number;
  reminders_sent: number;
  last_reminder_at: Date | null;
  opted_out: boolean;
  submitted_ref: string | null;
  created_at: Date;
  updated_at: Date;
}

function toRecord(row: DraftRow): DraftRecord {
  // pg parses jsonb columns for us.
  const data = row.data;
  return {
    id: row.id,
    email: row.email,
    tokenEnc: row.token_enc,
    firstName: row.first_name,
    lastName: row.last_name,
    data,
    schemaVersion: row.schema_version,
    furthestStep: row.furthest_step,
    remindersSent: row.reminders_sent,
    lastReminderAt: row.last_reminder_at,
    optedOut: row.opted_out,
    submittedRef: row.submitted_ref,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * The raw token for a stored draft, recovered from its encrypted copy. Null
 * when the link key is unset or has changed since the draft was created — in
 * which case no reminder can be sent for it, and the job says so.
 */
export function resumeTokenFor(draft: DraftRecord): string | null {
  return openToken(draft.tokenEnc);
}

export interface UpsertDraftInput {
  token: string;
  identity: DraftIdentity;
  data: DraftData;
  schemaVersion: number;
  furthestStep: number;
}

/**
 * Create or update the draft for a token. Returns false when there is no
 * database, so the caller can tell the wizard to stay local-only.
 *
 * `furthest_step` only ever grows: going back to fix step 1 must not make the
 * draft look less complete than it is. `updated_at` is set here and only
 * here — it means "the applicant last touched this", and the reminder job
 * deliberately never writes it.
 */
export async function upsertDraft(input: UpsertDraftInput): Promise<boolean> {
  const p = getPool();
  if (!p) return false;

  try {
    await p.query(
      `INSERT INTO application_drafts
         (token_hash, token_enc, email, first_name, last_name, data, schema_version, furthest_step)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (token_hash) DO UPDATE SET
         token_enc = COALESCE(application_drafts.token_enc, EXCLUDED.token_enc),
         email = EXCLUDED.email,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         data = EXCLUDED.data,
         schema_version = EXCLUDED.schema_version,
         furthest_step = GREATEST(application_drafts.furthest_step, EXCLUDED.furthest_step),
         updated_at = NOW()`,
      [
        hashToken(input.token),
        // Set on first insert. A later update only fills it in if it was
        // null — i.e. the link key was configured after the draft began.
        sealToken(input.token),
        input.identity.email,
        input.identity.firstName ?? null,
        input.identity.lastName ?? null,
        JSON.stringify(input.data),
        input.schemaVersion,
        input.furthestStep,
      ]
    );
    return true;
  } catch (err) {
    console.error("upsertDraft error:", err);
    return false;
  }
}

/** Load by raw token. Unknown, purged, or submitted drafts all return null. */
export async function loadDraft(token: string): Promise<DraftRecord | null> {
  const p = getPool();
  if (!p) return null;

  try {
    const { rows } = await p.query<DraftRow>(
      `SELECT * FROM application_drafts WHERE token_hash = $1 LIMIT 1`,
      [hashToken(token)]
    );
    if (rows.length === 0) return null;
    const record = toRecord(rows[0]);
    return record.submittedRef === null ? record : null;
  } catch (err) {
    console.error("loadDraft error:", err);
    return null;
  }
}

/** Called after a successful submission so reminders stop. */
export async function markDraftSubmitted(token: string, referenceNumber: string): Promise<void> {
  const p = getPool();
  if (!p) return;

  try {
    await p.query(
      `UPDATE application_drafts
          SET submitted_ref = $1
        WHERE token_hash = $2 AND submitted_ref IS NULL`,
      [referenceNumber, hashToken(token)]
    );
  } catch (err) {
    console.error("markDraftSubmitted error:", err);
  }
}

/** Honour a stop link. Idempotent; an unknown token is a silent no-op. */
export async function optOutDraft(token: string): Promise<boolean> {
  const p = getPool();
  if (!p) return false;

  try {
    const result = await p.query(
      `UPDATE application_drafts SET opted_out = TRUE WHERE token_hash = $1`,
      [hashToken(token)]
    );
    return (result.rowCount ?? 0) > 0;
  } catch (err) {
    console.error("optOutDraft error:", err);
    return false;
  }
}

/**
 * Drafts that might be due a reminder. The filter is deliberately loose —
 * the exact schedule lives in reminders.ts — so a change to the delays does
 * not require a change to SQL. `updated_at` ordering means the longest-waiting
 * applicant is handled first if the batch is cut short.
 */
export async function selectReminderCandidates(limit = 200): Promise<DraftRecord[]> {
  const p = getPool();
  if (!p) return [];

  try {
    const { rows } = await p.query<DraftRow>(
      `SELECT * FROM application_drafts
        WHERE opted_out = FALSE
          AND submitted_ref IS NULL
          AND reminders_sent < $1
        ORDER BY updated_at ASC
        LIMIT $2`,
      [MAX_REMINDERS, limit]
    );
    return rows.map(toRecord);
  } catch (err) {
    console.error("selectReminderCandidates error:", err);
    return [];
  }
}

/**
 * Claim one reminder stage for a draft. The conditional update makes two
 * concurrent job runs safe: only one of them sees rowCount = 1, and only
 * that one sends. The failure mode is a missed reminder, never a duplicate.
 *
 * Does not touch `updated_at`: a reminder is not applicant activity, and
 * treating it as such would push the next reminder and the purge date back
 * every time we wrote.
 */
export async function claimReminder(id: number, expectedSent: number): Promise<boolean> {
  const p = getPool();
  if (!p) return false;

  try {
    const result = await p.query(
      `UPDATE application_drafts
          SET reminders_sent = reminders_sent + 1,
              last_reminder_at = NOW()
        WHERE id = $1 AND reminders_sent = $2`,
      [id, expectedSent]
    );
    return result.rowCount === 1;
  } catch (err) {
    console.error("claimReminder error:", err);
    return false;
  }
}

/**
 * Delete drafts untouched for longer than the retention window. Submitted
 * drafts go too: the application itself lives in `applications`, and the
 * draft copy has nothing left to do.
 */
export async function purgeStaleDrafts(): Promise<number> {
  const p = getPool();
  if (!p) return 0;

  try {
    const result = await p.query(
      `DELETE FROM application_drafts
        WHERE updated_at < NOW() - make_interval(days => $1)`,
      [DRAFT_RETENTION_DAYS]
    );
    return result.rowCount ?? 0;
  } catch (err) {
    console.error("purgeStaleDrafts error:", err);
    return 0;
  }
}

// ---- Staff view -------------------------------------------------------------

/**
 * What a loan officer may see about an in-progress application. Deliberately
 * excludes the form data and both token columns: the data is the applicant's
 * unfinished draft, and a token is a login.
 */
export interface DraftStaffItem {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  furthestStep: number;
  remindersSent: number;
  lastReminderAt: string | null;
  optedOut: boolean;
  submittedRef: string | null;
  startedAt: string;
  lastActivityAt: string;
}

export async function listDraftsForStaff(input: {
  page?: number;
  pageSize?: number;
}): Promise<{ items: DraftStaffItem[]; total: number; page: number } | null> {
  const p = getPool();
  if (!p) return null;

  const pageSize = Math.min(200, Math.max(1, Math.floor(input.pageSize ?? 50)));
  const page = Math.max(1, Math.floor(input.page ?? 1));

  try {
    const [rows, count] = await Promise.all([
      p.query<Omit<DraftRow, "token_enc" | "data" | "schema_version">>(
        `SELECT id, email, first_name, last_name, furthest_step, reminders_sent,
                last_reminder_at, opted_out, submitted_ref, created_at, updated_at
           FROM application_drafts
          ORDER BY updated_at DESC
          LIMIT $1 OFFSET $2`,
        [pageSize, (page - 1) * pageSize]
      ),
      p.query<{ n: string }>(`SELECT COUNT(*) AS n FROM application_drafts`),
    ]);
    return {
      items: rows.rows.map((row) => ({
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        furthestStep: row.furthest_step,
        remindersSent: row.reminders_sent,
        lastReminderAt: row.last_reminder_at ? row.last_reminder_at.toISOString() : null,
        optedOut: row.opted_out,
        submittedRef: row.submitted_ref,
        startedAt: row.created_at.toISOString(),
        lastActivityAt: row.updated_at.toISOString(),
      })),
      total: Number(count.rows[0]?.n ?? 0),
      page,
    };
  } catch (err) {
    console.error("listDraftsForStaff error:", err);
    return null;
  }
}

/**
 * The latest unsubmitted, non-opted-out draft for an email. For the portal,
 * where the caller has already proven they own the address — the reason the
 * rest of this module refuses to look up by email does not apply.
 */
export async function findOpenDraftByEmail(email: string): Promise<DraftRecord | null> {
  const p = getPool();
  if (!p) return null;
  try {
    const { rows } = await p.query<DraftRow>(
      `SELECT * FROM application_drafts
        WHERE LOWER(email) = $1 AND submitted_ref IS NULL
        ORDER BY updated_at DESC
        LIMIT 1`,
      [email.trim().toLowerCase()]
    );
    return rows[0] ? toRecord(rows[0]) : null;
  } catch (err) {
    console.error("findOpenDraftByEmail error:", err);
    return null;
  }
}
