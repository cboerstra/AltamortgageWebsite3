// Resume tokens for server-side application drafts.
//
// The database holds two forms of each token, for two different jobs:
//
//   token_hash  SHA-256. Used for lookup. One-way, so a leaked table cannot
//               be turned into a list of working links.
//   token_enc   AES-256-GCM under DRAFT_LINK_KEY. Used by the reminder job,
//               which has to put the real link in an email long after the
//               raw token left the request. A leaked table plus a leaked
//               environment is needed to recover links — the same two
//               things an attacker would need to read the drafts anyway.
//
// Without DRAFT_LINK_KEY, drafts still save and the applicant's own browser
// can still resume; only the emailed reminders are impossible.

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/** 32 random bytes → 43 base64url characters. Far beyond guessable. */
export const TOKEN_BYTES = 32;

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,64}$/;

export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Cheap shape check before touching the database, so a garbage query string
 * never becomes a query. Accepts only what generateToken() produces.
 */
export function isTokenShaped(value: unknown): value is string {
  return typeof value === "string" && TOKEN_PATTERN.test(value);
}

// ---- Link encryption --------------------------------------------------------

const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const FORMAT_VERSION = 1;

let keyWarned = false;

/** The link key, or null when unset or malformed. Warns once, not per call. */
export function linkKey(): Buffer | null {
  const raw = process.env.DRAFT_LINK_KEY?.trim();
  if (!raw) return null;

  let key: Buffer;
  try {
    key = Buffer.from(raw, "base64");
  } catch {
    key = Buffer.alloc(0);
  }
  if (key.length !== KEY_BYTES) {
    if (!keyWarned) {
      console.warn(
        `DRAFT_LINK_KEY must be ${KEY_BYTES} random bytes, base64-encoded; got ${key.length} bytes. Reminders disabled.`
      );
      keyWarned = true;
    }
    return null;
  }
  return key;
}

/** Test hook: forget the one-time warning. */
export function resetLinkKeyWarning(): void {
  keyWarned = false;
}

/**
 * Encrypt a raw token for storage. Returns null when no key is configured,
 * and the caller stores null — reminders for that draft are then impossible,
 * which is the honest outcome.
 *
 * Layout, base64url: version(1) | iv(12) | tag(16) | ciphertext.
 */
export function sealToken(token: string, key: Buffer | null = linkKey()): string | null {
  if (!key) return null;
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([FORMAT_VERSION]), iv, tag, ciphertext]).toString("base64url");
}

/** Decrypt a stored token. Null on any failure — wrong key, tampering, garbage. */
export function openToken(sealed: string | null, key: Buffer | null = linkKey()): string | null {
  if (!sealed || !key) return null;
  try {
    const buf = Buffer.from(sealed, "base64url");
    if (buf.length < 1 + IV_BYTES + TAG_BYTES + 1) return null;
    if (buf[0] !== FORMAT_VERSION) return null;

    const iv = buf.subarray(1, 1 + IV_BYTES);
    const tag = buf.subarray(1 + IV_BYTES, 1 + IV_BYTES + TAG_BYTES);
    const ciphertext = buf.subarray(1 + IV_BYTES + TAG_BYTES);

    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const token = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    return isTokenShaped(token) ? token : null;
  } catch {
    return null;
  }
}
