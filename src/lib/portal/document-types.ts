// Client-safe definitions for the document vault: slots, limits, allowed
// types, and the record shape. No Node imports — this file is bundled into
// the browser. Server-only logic lives in documents.ts.

// ---- Slots ------------------------------------------------------------------

export const SLOT_IDS = ["bank_statement", "w2", "paystub", "tax_return", "other"] as const;
export type SlotId = (typeof SLOT_IDS)[number];

export interface SlotSpec {
  id: SlotId;
  label: string;
  required: number;
  hint: string;
}

export const SLOTS: readonly SlotSpec[] = [
  { id: "bank_statement", label: "Bank statements", required: 2, hint: "The last two months, every page — including blank ones." },
  { id: "w2", label: "W-2 forms", required: 2, hint: "The last two years." },
  { id: "paystub", label: "Pay stubs", required: 2, hint: "Covering the most recent 30 days." },
  { id: "tax_return", label: "Tax returns", required: 2, hint: "The last two years, all pages and schedules." },
  { id: "other", label: "Other documents", required: 0, hint: "Anything else your loan specialist has asked for." },
];

export function isSlotId(value: unknown): value is SlotId {
  return typeof value === "string" && (SLOT_IDS as readonly string[]).includes(value);
}

// ---- Limits and types -------------------------------------------------------

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 150 * 1024 * 1024;
/** Under Vercel's 4.5 MB request cap with room for the encryption header. */
export const CHUNK_BYTES = 3 * 1024 * 1024;
export const MAX_PARTS = Math.ceil(MAX_FILE_BYTES / CHUNK_BYTES);
export const MAX_FILENAME_CHARS = 255;

export const ALLOWED_TYPES: Record<string, { extensions: string[]; label: string }> = {
  "application/pdf": { extensions: [".pdf"], label: "PDF" },
  "image/jpeg": { extensions: [".jpg", ".jpeg"], label: "JPEG" },
  "image/png": { extensions: [".png"], label: "PNG" },
};

export type DocumentStatus = "uploading" | "available" | "deleted";

export interface BorrowerDocument {
  id: number;
  borrowerId: number;
  slot: SlotId;
  filename: string;
  mimeType: string;
  byteSize: number;
  sha256: string | null;
  partCount: number;
  status: DocumentStatus;
  uploadedAt: string;
  completedAt: string | null;
}

