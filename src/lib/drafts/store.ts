// Persistence for server-side application drafts.
//
// Every function short-circuits when the database is not configured, in the
// same way the rest of db.ts does: the wizard then keeps working with the
// local-only draft, and no reminder is ever attempted.
//
// Drafts are addressed by token hash, never by email. Looking a draft up by
// email would turn the endpoint into an oracle for "does this person have a
// mortgage application in progress".

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
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

interface DraftRow extends RowDataPacket {
  id: number;
  email: string;
  token_enc: string | null;
  first_name: string | null;
  last_name: string | null;
  data: string | DraftData;
  schema_version: number;
  furthest_step: number;
  reminders_sent: number;
  last_reminder_at: Date | null;
  opted_out: number;
  submitted_ref: string | null;
  created_at: Date;
  updated_at: Date;
}

function toRecord(row: DraftRow): DraftRecord {
  // mysql2 returns JSON columns already parsed on MySQL, as text on MariaDB.
  const data = typeof row.data === "string" ? (JSON.parse(row.data) as DraftData) : row.data;
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
    optedOut: row.opted_out === 1,
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
 * draft look less complete than it is.
 */
export async function upsertDraft(input: UpsertDraftInput): Promise<boolean> {
  const p = getPool();
  if (!p) return false;

  try {
    await p.execute(
      `INSERT INTO application_drafts
         (token_hash, token_enc, email, first_name, last_name, data, schema_version, furthest_step)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         token_enc = COALESCE(token_enc, VALUES(token_enc)),
         email = VALUES(email),
         first_name = VALUES(first_name),
         last_name = VALUES(last_name),
         data = VALUES(data),
         schema_version = VALUES(schema_version),
         furthest_step = GREATEST(furthest_step, VALUES(furthest_step))`,
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
    const [rows] = await p.execute<DraftRow[]>(
      `SELECT * FROM application_drafts WHERE token_hash = ? LIMIT 1`,
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
    await p.execute(
      `UPDATE application_drafts
          SET submitted_ref = ?, updated_at = updated_at
        WHERE token_hash = ? AND submitted_ref IS NULL`,
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
    const [result] = await p.execute<ResultSetHeader>(
      `UPDATE application_drafts
          SET opted_out = 1, updated_at = updated_at
        WHERE token_hash = ?`,
      [hashToken(token)]
    );
    return result.affectedRows > 0;
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
    const [rows] = await p.query<DraftRow[]>(
      `SELECT * FROM application_drafts
        WHERE opted_out = 0
          AND submitted_ref IS NULL
          AND reminders_sent < ?
        ORDER BY updated_at ASC
        LIMIT ?`,
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
 * concurrent job runs safe: only one of them sees affectedRows = 1, and only
 * that one sends. The failure mode is a missed reminder, never a duplicate.
 *
 * `updated_at = updated_at` stops the ON UPDATE trigger from treating the
 * reminder as applicant activity, which would push the next reminder and the
 * purge date back every time we wrote.
 */
export async function claimReminder(id: number, expectedSent: number): Promise<boolean> {
  const p = getPool();
  if (!p) return false;

  try {
    const [result] = await p.execute<ResultSetHeader>(
      `UPDATE application_drafts
          SET reminders_sent = reminders_sent + 1,
              last_reminder_at = NOW(),
              updated_at = updated_at
        WHERE id = ? AND reminders_sent = ?`,
      [id, expectedSent]
    );
    return result.affectedRows === 1;
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
    const [result] = await p.execute<ResultSetHeader>(
      `DELETE FROM application_drafts
        WHERE updated_at < NOW() - INTERVAL ? DAY`,
      [DRAFT_RETENTION_DAYS]
    );
    return result.affectedRows;
  } catch (err) {
    console.error("purgeStaleDrafts error:", err);
    return 0;
  }
}
