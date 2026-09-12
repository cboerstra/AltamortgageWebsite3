// Borrower identity: who may sign in, one-time codes, sessions.
//
// Storage rules, all enforced here:
//   - A code is stored only as its SHA-256. The plaintext exists in the email
//     and nowhere else.
//   - A session token is stored only as its SHA-256. The plaintext exists in
//     the cookie and nowhere else.
//   - Comparisons are constant-time.
//   - Every function no-ops (returns null/false) without a database, so the
//     portal degrades to "unavailable" rather than crashing.

import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { getPool } from "@/lib/db";

export const CODE_TTL_MS = 10 * 60 * 1000;
export const CODE_MAX_ATTEMPTS = 5;
export const CODES_PER_WINDOW = 3;
export const CODE_WINDOW_MS = 15 * 60 * 1000;
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Refresh the expiry when a session is used with less than this left. */
const SESSION_SLIDE_THRESHOLD_MS = 6 * 24 * 60 * 60 * 1000;

export interface Borrower {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface BorrowerRow {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

function toBorrower(row: BorrowerRow): Borrower {
  return { id: row.id, email: row.email, firstName: row.first_name, lastName: row.last_name };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

// ---- Eligibility ------------------------------------------------------------

/**
 * Whether this email has anything to see: a submitted application or a
 * draft. Returns the name to greet them with when it can. Null means "send
 * nothing" — and the caller must answer exactly as it would on success.
 */
export async function findEligibleIdentity(
  email: string
): Promise<{ firstName: string | null; lastName: string | null } | null> {
  const p = getPool();
  if (!p) return null;
  const normalized = normalizeEmail(email);

  try {
    const { rows } = await p.query<{ first_name: string | null; last_name: string | null }>(
      `SELECT first_name, last_name FROM applications WHERE LOWER(email) = $1
       UNION ALL
       SELECT first_name, last_name FROM application_drafts WHERE LOWER(email) = $1
       LIMIT 1`,
      [normalized]
    );
    const row = rows[0];
    return row ? { firstName: row.first_name, lastName: row.last_name } : null;
  } catch (err) {
    console.error("findEligibleIdentity error:", err);
    return null;
  }
}

/** Get or create the borrower row for an email that has been proven eligible. */
export async function ensureBorrower(
  email: string,
  name: { firstName: string | null; lastName: string | null }
): Promise<Borrower | null> {
  const p = getPool();
  if (!p) return null;

  try {
    const { rows } = await p.query<BorrowerRow>(
      `INSERT INTO borrowers (email, first_name, last_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET
         first_name = COALESCE(borrowers.first_name, EXCLUDED.first_name),
         last_name  = COALESCE(borrowers.last_name,  EXCLUDED.last_name)
       RETURNING id, email, first_name, last_name`,
      [normalizeEmail(email), name.firstName, name.lastName]
    );
    return rows[0] ? toBorrower(rows[0]) : null;
  } catch (err) {
    console.error("ensureBorrower error:", err);
    return null;
  }
}

// ---- One-time codes ---------------------------------------------------------

export function generateCode(): string {
  // randomInt is uniform; padStart keeps leading zeros so every code is 6 digits.
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Issue a code, subject to the per-email window. Returns the plaintext code
 * to email, or null if the window is exhausted or there is no database.
 */
export async function issueCode(borrowerId: number): Promise<string | null> {
  const p = getPool();
  if (!p) return null;

  try {
    const recent = await p.query<{ n: string }>(
      `SELECT COUNT(*) AS n FROM borrower_login_codes
        WHERE borrower_id = $1 AND created_at > NOW() - make_interval(secs => $2)`,
      [borrowerId, CODE_WINDOW_MS / 1000]
    );
    if (Number(recent.rows[0]?.n ?? 0) >= CODES_PER_WINDOW) return null;

    // Any earlier live code for this borrower is retired: exactly one code is
    // valid at a time, so a stale email cannot be used after a fresh one.
    await p.query(
      `UPDATE borrower_login_codes SET consumed_at = NOW()
        WHERE borrower_id = $1 AND consumed_at IS NULL`,
      [borrowerId]
    );

    const code = generateCode();
    await p.query(
      `INSERT INTO borrower_login_codes (borrower_id, code_hash, expires_at)
       VALUES ($1, $2, NOW() + make_interval(secs => $3))`,
      [borrowerId, sha256(code), CODE_TTL_MS / 1000]
    );
    return code;
  } catch (err) {
    console.error("issueCode error:", err);
    return null;
  }
}

export type VerifyResult =
  | { ok: true; borrower: Borrower }
  | { ok: false; reason: "no_code" | "expired" | "mismatch" | "too_many_attempts" | "unavailable" };

/**
 * Check a code against the borrower's single live code. Every failed attempt
 * is counted even when the code was wrong, and the code is retired after
 * CODE_MAX_ATTEMPTS regardless of outcome.
 */
export async function verifyCode(email: string, code: string): Promise<VerifyResult> {
  const p = getPool();
  if (!p) return { ok: false, reason: "unavailable" };

  try {
    const { rows } = await p.query<
      BorrowerRow & { code_id: number; code_hash: string; expires_at: Date; attempts: number }
    >(
      `SELECT b.id, b.email, b.first_name, b.last_name,
              c.id AS code_id, c.code_hash, c.expires_at, c.attempts
         FROM borrowers b
         JOIN borrower_login_codes c ON c.borrower_id = b.id
        WHERE LOWER(b.email) = $1 AND c.consumed_at IS NULL
        ORDER BY c.created_at DESC
        LIMIT 1`,
      [normalizeEmail(email)]
    );
    const row = rows[0];
    if (!row) return { ok: false, reason: "no_code" };

    if (row.expires_at.getTime() < Date.now()) {
      await p.query(`UPDATE borrower_login_codes SET consumed_at = NOW() WHERE id = $1`, [row.code_id]);
      return { ok: false, reason: "expired" };
    }

    const matches = constantTimeEquals(sha256(code.trim()), row.code_hash);
    const attempts = row.attempts + 1;
    const exhausted = attempts >= CODE_MAX_ATTEMPTS;

    await p.query(
      `UPDATE borrower_login_codes
          SET attempts = $2, consumed_at = CASE WHEN $3 THEN NOW() ELSE consumed_at END
        WHERE id = $1`,
      [row.code_id, attempts, matches || exhausted]
    );

    if (matches) {
      await p.query(`UPDATE borrowers SET last_login_at = NOW() WHERE id = $1`, [row.id]);
      return { ok: true, borrower: toBorrower(row) };
    }
    return { ok: false, reason: exhausted ? "too_many_attempts" : "mismatch" };
  } catch (err) {
    console.error("verifyCode error:", err);
    return { ok: false, reason: "unavailable" };
  }
}

// ---- Sessions ---------------------------------------------------------------

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,64}$/;

export function isSessionTokenShaped(value: unknown): value is string {
  return typeof value === "string" && SESSION_TOKEN_PATTERN.test(value);
}

/** Create a session; returns the plaintext token for the cookie. */
export async function createSession(borrowerId: number): Promise<string | null> {
  const p = getPool();
  if (!p) return null;
  const token = generateSessionToken();
  try {
    await p.query(
      `INSERT INTO borrower_sessions (borrower_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + make_interval(secs => $3))`,
      [borrowerId, sha256(token), SESSION_TTL_MS / 1000]
    );
    return token;
  } catch (err) {
    console.error("createSession error:", err);
    return null;
  }
}

/**
 * Resolve a cookie token to a borrower. Slides the expiry forward when the
 * session has been used recently enough to be worth keeping alive.
 */
export async function resolveSession(token: string): Promise<Borrower | null> {
  if (!isSessionTokenShaped(token)) return null;
  const p = getPool();
  if (!p) return null;

  try {
    const { rows } = await p.query<BorrowerRow & { session_id: number; expires_at: Date }>(
      `SELECT b.id, b.email, b.first_name, b.last_name, s.id AS session_id, s.expires_at
         FROM borrower_sessions s
         JOIN borrowers b ON b.id = s.borrower_id
        WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > NOW()
        LIMIT 1`,
      [sha256(token)]
    );
    const row = rows[0];
    if (!row) return null;

    const remaining = row.expires_at.getTime() - Date.now();
    if (remaining < SESSION_SLIDE_THRESHOLD_MS) {
      await p.query(
        `UPDATE borrower_sessions
            SET last_seen_at = NOW(), expires_at = NOW() + make_interval(secs => $2)
          WHERE id = $1`,
        [row.session_id, SESSION_TTL_MS / 1000]
      );
    }
    return toBorrower(row);
  } catch (err) {
    console.error("resolveSession error:", err);
    return null;
  }
}

export async function revokeSession(token: string): Promise<void> {
  if (!isSessionTokenShaped(token)) return;
  const p = getPool();
  if (!p) return;
  try {
    await p.query(
      `UPDATE borrower_sessions SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL`,
      [sha256(token)]
    );
  } catch (err) {
    console.error("revokeSession error:", err);
  }
}
