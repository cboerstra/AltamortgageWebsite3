// Encryption for uploaded documents.
//
// AES-256-GCM under DOCUMENT_ENCRYPTION_KEY, one fresh IV per chunk, and the
// document id + chunk index bound in as additional authenticated data so a
// chunk cannot be replayed into a different document or a different position.
//
// Layout of each stored blob: version(1) | iv(12) | tag(16) | ciphertext.
//
// The key is separate from DRAFT_LINK_KEY on purpose: rotating one must not
// affect the other, and the two protect very different things.

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const FORMAT_VERSION = 1;
const HEADER_BYTES = 1 + IV_BYTES + TAG_BYTES;

let keyWarned = false;

/** The document key, or null when unset or malformed. Warns once. */
export function documentKey(): Buffer | null {
  const raw = process.env.DOCUMENT_ENCRYPTION_KEY?.trim();
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
        `DOCUMENT_ENCRYPTION_KEY must be ${KEY_BYTES} random bytes, base64-encoded; got ${key.length} bytes. Uploads disabled.`
      );
      keyWarned = true;
    }
    return null;
  }
  return key;
}

export function isDocumentEncryptionConfigured(): boolean {
  return documentKey() !== null;
}

/** Test hook. */
export function resetDocumentKeyWarning(): void {
  keyWarned = false;
}

export function chunkAad(documentId: number, partIndex: number): Buffer {
  return Buffer.from(`alta-document:${documentId}:${partIndex}`, "utf8");
}

export function encryptChunk(plaintext: Buffer, aad: Buffer, key: Buffer): Buffer {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([FORMAT_VERSION]), iv, tag, ciphertext]);
}

/** Throws on any failure: wrong key, wrong AAD, tampering, truncation. */
export function decryptChunk(stored: Buffer, aad: Buffer, key: Buffer): Buffer {
  if (stored.length < HEADER_BYTES) throw new Error("Encrypted chunk is truncated");
  if (stored[0] !== FORMAT_VERSION) throw new Error(`Unknown encrypted chunk version ${stored[0]}`);

  const iv = stored.subarray(1, 1 + IV_BYTES);
  const tag = stored.subarray(1 + IV_BYTES, HEADER_BYTES);
  const ciphertext = stored.subarray(HEADER_BYTES);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAAD(aad);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/** Size on disk for a plaintext of the given length. */
export function encryptedSize(plaintextBytes: number): number {
  return HEADER_BYTES + plaintextBytes;
}
