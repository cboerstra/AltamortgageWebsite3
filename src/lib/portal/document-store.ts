// Byte storage for encrypted document chunks. Private Vercel Blob in
// production; local disk for development and tests. Same backend switch as
// the MISMO store. Nothing here knows about encryption — it moves opaque
// bytes under a key.

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, put } from "@vercel/blob";

export type DocumentBackend = "blob" | "disk";

export function documentBackend(): DocumentBackend {
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID ? "blob" : "disk";
}

const PREFIX = "documents";

/** documents/<borrowerId>/<documentId>/<partIndex>.enc */
export function partPathname(borrowerId: number, documentId: number, partIndex: number): string {
  return `${PREFIX}/${borrowerId}/${documentId}/${partIndex}.enc`;
}

const PATHNAME_PATTERN = new RegExp(`^${PREFIX}/[0-9]+/[0-9]+/[0-9]+[.]enc$`);

export function isPartPathname(value: string): boolean {
  return PATHNAME_PATTERN.test(value);
}

function assertPathname(pathname: string): void {
  if (!isPartPathname(pathname)) {
    throw new Error("Refusing to touch a document part with a malformed storage key");
  }
}

export function resolveDocumentRoot(): string {
  const configured = process.env.DOCUMENT_STORAGE_DIR?.trim();
  if (configured) return path.resolve(configured);
  return path.resolve(process.cwd(), "..", "storage", "documents");
}

function diskPath(pathname: string): string {
  return path.join(resolveDocumentRoot(), ...pathname.split("/"));
}

export async function putPart(pathname: string, bytes: Buffer): Promise<void> {
  assertPathname(pathname);
  if (documentBackend() === "blob") {
    await put(pathname, bytes, {
      access: "private",
      contentType: "application/octet-stream",
      addRandomSuffix: false,
      allowOverwrite: false,
    });
    return;
  }
  const abs = diskPath(pathname);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, bytes, { flag: "wx" });
}

export async function getPart(pathname: string): Promise<Buffer | null> {
  assertPathname(pathname);
  if (documentBackend() === "blob") {
    const result = await get(pathname, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const chunks: Uint8Array[] = [];
    const reader = result.stream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    return Buffer.concat(chunks);
  }
  try {
    return await readFile(diskPath(pathname));
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return null;
    throw err;
  }
}

/** Best effort: a part that is already gone is not an error. */
export async function deleteParts(pathnames: string[]): Promise<void> {
  const valid = pathnames.filter(isPartPathname);
  if (valid.length === 0) return;
  if (documentBackend() === "blob") {
    try {
      await del(valid);
    } catch (err) {
      console.error("deleteParts (blob) error:", err instanceof Error ? err.message : err);
    }
    return;
  }
  await Promise.all(valid.map((p) => rm(diskPath(p), { force: true })));
}
