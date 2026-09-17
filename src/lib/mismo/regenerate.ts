// Rebuild an application's MISMO document from what is stored, with the
// current generator. The store is write-once, so the new document gets a new
// key; the row is pointed at it before the old file is removed, so a failure
// part-way leaves a working (if stale or duplicated) document, never none.

import { getApplicationByRef, updateMismoRecord } from "@/lib/db";
import { applicationSchema, type ApplicationFormData } from "@/lib/schemas";
import { generateMismoDocument } from "./index";
import { deleteMismoFile, writeMismoFile } from "./store";

export interface RegeneratedMismo {
  relativePath: string;
  filename: string;
  sha256: string;
  bytes: number;
}

export class StalePayloadError extends Error {
  constructor() {
    super("Stored application no longer matches the current form; cannot regenerate.");
    this.name = "StalePayloadError";
  }
}

/** Validate a stored payload; throws StalePayloadError when it no longer fits the form. */
export function parseStoredApplication(rawPayload: Record<string, unknown>): ApplicationFormData {
  const parsed = applicationSchema.safeParse(rawPayload);
  if (!parsed.success) throw new StalePayloadError();
  return parsed.data;
}

export async function regenerateMismo(
  refNumber: string,
  app: ApplicationFormData,
  input: { submittedAt: string; previousPath: string | null }
): Promise<RegeneratedMismo> {
  const xml = generateMismoDocument(app, { referenceNumber: refNumber, submittedAt: input.submittedAt });
  const stored = await writeMismoFile(xml, { referenceNumber: refNumber, submittedAt: new Date().toISOString() });
  await updateMismoRecord(refNumber, { status: "written", path: stored.relativePath, sha256: stored.sha256 });

  if (input.previousPath && input.previousPath !== stored.relativePath) {
    try {
      await deleteMismoFile(input.previousPath);
    } catch (err) {
      console.error(`[${refNumber}] old MISMO document not removed:`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`[staff] regenerated MISMO for ${refNumber} -> ${stored.relativePath}`);
  return {
    relativePath: stored.relativePath,
    filename: stored.relativePath.split("/").pop() ?? `${refNumber}.xml`,
    sha256: stored.sha256,
    bytes: stored.bytes,
  };
}

/** Convenience for the route: load, validate, regenerate. Null when the reference is unknown. */
export async function regenerateMismoByRef(refNumber: string): Promise<RegeneratedMismo | null> {
  const app = await getApplicationByRef(refNumber);
  if (!app) return null;
  const parsed = parseStoredApplication(app.rawPayload);
  return regenerateMismo(refNumber, parsed, { submittedAt: app.createdAt, previousPath: app.mismoPath });
}
