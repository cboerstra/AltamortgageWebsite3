// The document vault: slots, validation, and the database side of uploads.
//
// An upload is three steps — start, parts, complete — because Vercel caps a
// single request at 4.5 MB and a tax return can be 10. Each part is
// encrypted independently (see crypto.ts) and stored under its own key (see
// document-store.ts). A document is invisible to everyone, including its
// owner, until `complete` has verified every part is present and hashed the
// plaintext end to end.

import { createHash } from "node:crypto";
import { getPool } from "@/lib/db";
import { chunkAad, decryptChunk, documentKey, encryptChunk } from "./crypto";
import { deleteParts, getPart, partPathname, putPart } from "./document-store";
import {
  ALLOWED_TYPES,
  CHUNK_BYTES,
  MAX_FILE_BYTES,
  MAX_FILENAME_CHARS,
  MAX_TOTAL_BYTES,
  isSlotId,
  type BorrowerDocument,
  type DocumentStatus,
  type SlotId,
} from "./document-types";

export * from "./document-types";

/** What the file's first bytes must be for each type. Names lie; bytes do not. */
const MAGIC: Record<string, number[][]> = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46, 0x2d]], // %PDF-
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
};

export function matchesMagic(mimeType: string, head: Buffer): boolean {
  const candidates = MAGIC[mimeType];
  if (!candidates) return false;
  return candidates.some((sig) => head.length >= sig.length && sig.every((b, i) => head[i] === b));
}

// C0 controls, DEL, and the characters that break a header or a shell.
// Built from code points so this file never contains a raw control byte.
const FORBIDDEN_FILENAME_CHARS = new RegExp(
  "[" +
    Array.from({ length: 32 }, (_, i) => "\\u" + i.toString(16).padStart(4, "0")).join("") +
    "\\u007f\"<>|]",
  "g"
);

/** Keep the applicant's name for display, but never as a path or a header injection. */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "document";
  const cleaned = base
    .replace(FORBIDDEN_FILENAME_CHARS, "")
    .trim()
    .slice(0, MAX_FILENAME_CHARS);
  return cleaned === "" ? "document" : cleaned;
}

export interface StartInput {
  slot: unknown;
  filename: unknown;
  mimeType: unknown;
  byteSize: unknown;
}

export type StartValidation =
  | { ok: true; slot: SlotId; filename: string; mimeType: string; byteSize: number; partCount: number }
  | { ok: false; error: string };

export function validateStart(input: StartInput): StartValidation {
  if (!isSlotId(input.slot)) return { ok: false, error: "Choose which document this is." };
  if (typeof input.filename !== "string" || input.filename.trim() === "") {
    return { ok: false, error: "The file has no name." };
  }
  if (typeof input.mimeType !== "string" || !ALLOWED_TYPES[input.mimeType]) {
    return { ok: false, error: "Please upload a PDF, JPG or PNG." };
  }
  const filename = sanitizeFilename(input.filename);
  const ext = filename.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";
  if (!ALLOWED_TYPES[input.mimeType].extensions.includes(ext)) {
    return { ok: false, error: `That file does not look like a ${ALLOWED_TYPES[input.mimeType].label}.` };
  }
  if (typeof input.byteSize !== "number" || !Number.isInteger(input.byteSize) || input.byteSize <= 0) {
    return { ok: false, error: "The file is empty." };
  }
  if (input.byteSize > MAX_FILE_BYTES) {
    return { ok: false, error: `Files must be under ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB.` };
  }
  return {
    ok: true,
    slot: input.slot,
    filename,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
    partCount: Math.ceil(input.byteSize / CHUNK_BYTES),
  };
}

/** RFC 5987 filename*, plus a plain ASCII fallback for older clients. */
export function attachmentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

// ---- Records ----------------------------------------------------------------

interface DocumentRow {
  id: number;
  borrower_id: number;
  slot: SlotId;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  sha256: string | null;
  part_count: number;
  status: DocumentStatus;
  created_at: Date;
  completed_at: Date | null;
}

function toDocument(row: DocumentRow): BorrowerDocument {
  return {
    id: row.id,
    borrowerId: row.borrower_id,
    slot: row.slot,
    filename: row.original_filename,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
    sha256: row.sha256,
    partCount: row.part_count,
    status: row.status,
    uploadedAt: row.created_at.toISOString(),
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
  };
}

const COLUMNS = `id, borrower_id, slot, original_filename, mime_type, byte_size, sha256,
  part_count, status, created_at, completed_at`;

/** Completed documents a borrower can see, oldest first within a slot. */
export async function listBorrowerDocuments(borrowerId: number): Promise<BorrowerDocument[]> {
  const p = getPool();
  if (!p) return [];
  try {
    const { rows } = await p.query<DocumentRow>(
      `SELECT ${COLUMNS} FROM borrower_documents
        WHERE borrower_id = $1 AND status = 'available'
        ORDER BY slot, id`,
      [borrowerId]
    );
    return rows.map(toDocument);
  } catch (err) {
    console.error("listBorrowerDocuments error:", err);
    return [];
  }
}

/** For staff: completed documents for an email, with the borrower id. */
export async function listDocumentsByEmail(email: string): Promise<BorrowerDocument[]> {
  const p = getPool();
  if (!p) return [];
  try {
    const { rows } = await p.query<DocumentRow>(
      `SELECT d.id, d.borrower_id, d.slot, d.original_filename, d.mime_type, d.byte_size,
              d.sha256, d.part_count, d.status, d.created_at, d.completed_at
         FROM borrower_documents d
         JOIN borrowers b ON b.id = d.borrower_id
        WHERE LOWER(b.email) = $1 AND d.status = 'available'
        ORDER BY d.slot, d.id`,
      [email.trim().toLowerCase()]
    );
    return rows.map(toDocument);
  } catch (err) {
    console.error("listDocumentsByEmail error:", err);
    return [];
  }
}

/** Any document by id, regardless of owner. Staff use only. */
export async function getDocumentForStaff(id: number): Promise<BorrowerDocument | null> {
  const p = getPool();
  if (!p) return null;
  try {
    const { rows } = await p.query<DocumentRow>(
      `SELECT ${COLUMNS} FROM borrower_documents WHERE id = $1 AND status = 'available'`,
      [id]
    );
    return rows[0] ? toDocument(rows[0]) : null;
  } catch (err) {
    console.error("getDocumentForStaff error:", err);
    return null;
  }
}

/** A document only if it belongs to this borrower. Any status. */
export async function getOwnedDocument(borrowerId: number, id: number): Promise<BorrowerDocument | null> {
  const p = getPool();
  if (!p) return null;
  try {
    const { rows } = await p.query<DocumentRow>(
      `SELECT ${COLUMNS} FROM borrower_documents WHERE id = $1 AND borrower_id = $2`,
      [id, borrowerId]
    );
    return rows[0] ? toDocument(rows[0]) : null;
  } catch (err) {
    console.error("getOwnedDocument error:", err);
    return null;
  }
}

export type StartResult =
  | { ok: true; documentId: number; partCount: number; chunkBytes: number }
  | { ok: false; status: number; error: string };

export async function startDocument(
  borrowerId: number,
  input: { slot: SlotId; filename: string; mimeType: string; byteSize: number; partCount: number }
): Promise<StartResult> {
  const p = getPool();
  if (!p) return { ok: false, status: 503, error: "Uploads are not available right now." };
  if (!documentKey()) return { ok: false, status: 503, error: "Uploads are not available right now." };

  try {
    const usage = await p.query<{ total: string }>(
      `SELECT COALESCE(SUM(byte_size), 0) AS total FROM borrower_documents
        WHERE borrower_id = $1 AND status IN ('uploading', 'available')`,
      [borrowerId]
    );
    if (Number(usage.rows[0]?.total ?? 0) + input.byteSize > MAX_TOTAL_BYTES) {
      return { ok: false, status: 413, error: "You have reached the storage limit for your account. Delete a document to make room." };
    }

    const { rows } = await p.query<{ id: number }>(
      `INSERT INTO borrower_documents
         (borrower_id, slot, original_filename, mime_type, byte_size, part_count, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'uploading')
       RETURNING id`,
      [borrowerId, input.slot, input.filename, input.mimeType, input.byteSize, input.partCount]
    );
    return { ok: true, documentId: rows[0].id, partCount: input.partCount, chunkBytes: CHUNK_BYTES };
  } catch (err) {
    console.error("startDocument error:", err);
    return { ok: false, status: 500, error: "Could not start the upload." };
  }
}

export type PartResult = { ok: true } | { ok: false; status: number; error: string };

/**
 * Accept one raw chunk. Part 0 must carry the declared type's signature.
 * Encrypts, stores, records. Re-sending a part that already landed is a
 * no-op success, so a retried request cannot fail on the overwrite guard.
 */
export async function storePart(
  doc: BorrowerDocument,
  partIndex: number,
  bytes: Buffer
): Promise<PartResult> {
  const p = getPool();
  const key = documentKey();
  if (!p || !key) return { ok: false, status: 503, error: "Uploads are not available right now." };

  if (doc.status !== "uploading") return { ok: false, status: 409, error: "This upload is already finished." };
  if (!Number.isInteger(partIndex) || partIndex < 0 || partIndex >= doc.partCount) {
    return { ok: false, status: 400, error: "Invalid part number." };
  }
  const isLast = partIndex === doc.partCount - 1;
  const expected = isLast ? doc.byteSize - CHUNK_BYTES * (doc.partCount - 1) : CHUNK_BYTES;
  if (bytes.length !== expected) {
    return { ok: false, status: 400, error: "Chunk size does not match the file." };
  }
  if (partIndex === 0 && !matchesMagic(doc.mimeType, bytes.subarray(0, 16))) {
    return { ok: false, status: 415, error: `That file is not really a ${ALLOWED_TYPES[doc.mimeType]?.label ?? "supported file"}. Please upload a PDF, JPG or PNG.` };
  }

  try {
    const existing = await p.query(
      `SELECT 1 FROM borrower_document_parts WHERE document_id = $1 AND part_index = $2`,
      [doc.id, partIndex]
    );
    if ((existing.rowCount ?? 0) > 0) return { ok: true };

    const pathname = partPathname(doc.borrowerId, doc.id, partIndex);
    const sealed = encryptChunk(bytes, chunkAad(doc.id, partIndex), key);
    await putPart(pathname, sealed);
    await p.query(
      `INSERT INTO borrower_document_parts (document_id, part_index, blob_pathname, cipher_bytes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (document_id, part_index) DO NOTHING`,
      [doc.id, partIndex, pathname, sealed.length]
    );
    return { ok: true };
  } catch (err) {
    console.error(`storePart(${doc.id}, ${partIndex}) error:`, err);
    return { ok: false, status: 500, error: "Could not store that part. Please try again." };
  }
}

export type CompleteResult =
  | { ok: true; document: BorrowerDocument }
  | { ok: false; status: number; error: string };

/**
 * Verify every part is present, read them all back, decrypt, hash the
 * plaintext, and only then make the document visible. The read-back is the
 * point: it proves the stored bytes decrypt under this key today.
 */
export async function completeDocument(
  doc: BorrowerDocument,
  claimedSha256?: string
): Promise<CompleteResult> {
  const p = getPool();
  const key = documentKey();
  if (!p || !key) return { ok: false, status: 503, error: "Uploads are not available right now." };
  if (doc.status === "available") return { ok: true, document: doc };
  if (doc.status !== "uploading") return { ok: false, status: 409, error: "This upload was cancelled." };

  try {
    const { rows: parts } = await p.query<{ part_index: number; blob_pathname: string }>(
      `SELECT part_index, blob_pathname FROM borrower_document_parts
        WHERE document_id = $1 ORDER BY part_index`,
      [doc.id]
    );
    if (parts.length !== doc.partCount || parts.some((row, i) => row.part_index !== i)) {
      return { ok: false, status: 409, error: "Some parts of the file are missing. Please upload it again." };
    }

    const hash = createHash("sha256");
    let total = 0;
    for (const part of parts) {
      const stored = await getPart(part.blob_pathname);
      if (!stored) return { ok: false, status: 409, error: "Some parts of the file are missing. Please upload it again." };
      const plain = decryptChunk(stored, chunkAad(doc.id, part.part_index), key);
      hash.update(plain);
      total += plain.length;
    }
    if (total !== doc.byteSize) {
      return { ok: false, status: 409, error: "The uploaded size does not match the file. Please upload it again." };
    }
    const digest = hash.digest("hex");
    if (claimedSha256 && claimedSha256.toLowerCase() !== digest) {
      return { ok: false, status: 409, error: "The file changed during upload. Please upload it again." };
    }

    const { rows } = await p.query<DocumentRow>(
      `UPDATE borrower_documents
          SET status = 'available', sha256 = $2, completed_at = NOW()
        WHERE id = $1 AND status = 'uploading'
        RETURNING ${COLUMNS}`,
      [doc.id, digest]
    );
    return rows[0] ? { ok: true, document: toDocument(rows[0]) } : { ok: false, status: 409, error: "This upload was cancelled." };
  } catch (err) {
    console.error(`completeDocument(${doc.id}) error:`, err);
    return { ok: false, status: 500, error: "Could not finish the upload. Please try again." };
  }
}

/**
 * Decrypted plaintext as a stream, part by part, so a 25 MB download does
 * not need 25 MB of memory at once.
 */
export function openDocumentStream(doc: BorrowerDocument): ReadableStream<Uint8Array> {
  const key = documentKey();
  let index = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (!key) {
        controller.error(new Error("DOCUMENT_ENCRYPTION_KEY is not configured"));
        return;
      }
      if (index >= doc.partCount) {
        controller.close();
        return;
      }
      const stored = await getPart(partPathname(doc.borrowerId, doc.id, index));
      if (!stored) {
        controller.error(new Error(`Part ${index} of document ${doc.id} is missing from storage`));
        return;
      }
      controller.enqueue(new Uint8Array(decryptChunk(stored, chunkAad(doc.id, index), key)));
      index += 1;
    },
  });
}

/** Soft-delete and remove the bytes. Owner only; idempotent. */
export async function deleteDocument(borrowerId: number, id: number): Promise<boolean> {
  const p = getPool();
  if (!p) return false;
  try {
    const { rows } = await p.query<{ id: number }>(
      `UPDATE borrower_documents SET status = 'deleted', deleted_at = NOW()
        WHERE id = $1 AND borrower_id = $2 AND status <> 'deleted'
        RETURNING id`,
      [id, borrowerId]
    );
    if (rows.length === 0) return false;

    const { rows: parts } = await p.query<{ blob_pathname: string }>(
      `SELECT blob_pathname FROM borrower_document_parts WHERE document_id = $1`,
      [id]
    );
    await deleteParts(parts.map((r) => r.blob_pathname));
    await p.query(`DELETE FROM borrower_document_parts WHERE document_id = $1`, [id]);
    console.log(`[portal] borrower ${borrowerId} deleted document ${id}`);
    return true;
  } catch (err) {
    console.error(`deleteDocument(${id}) error:`, err);
    return false;
  }
}

/** Uploads that never completed. Run from the cron job. Returns how many were removed. */
export async function purgeAbandonedUploads(olderThanHours = 24): Promise<number> {
  const p = getPool();
  if (!p) return 0;
  try {
    const { rows } = await p.query<{ id: number }>(
      `SELECT id FROM borrower_documents
        WHERE status = 'uploading' AND created_at < NOW() - make_interval(hours => $1)`,
      [olderThanHours]
    );
    for (const row of rows) {
      const { rows: parts } = await p.query<{ blob_pathname: string }>(
        `SELECT blob_pathname FROM borrower_document_parts WHERE document_id = $1`,
        [row.id]
      );
      await deleteParts(parts.map((r) => r.blob_pathname));
      await p.query(`DELETE FROM borrower_documents WHERE id = $1`, [row.id]);
    }
    return rows.length;
  } catch (err) {
    console.error("purgeAbandonedUploads error:", err);
    return 0;
  }
}
