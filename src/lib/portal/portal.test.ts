// The parts of the portal that can be proven without a database: the
// encryption layer, upload validation, the storage key discipline, the
// decrypting stream, and the session cookie parsing.

import { randomBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  chunkAad,
  decryptChunk,
  documentKey,
  encryptChunk,
  encryptedSize,
  resetDocumentKeyWarning,
} from "./crypto";
import { deleteParts, getPart, isPartPathname, partPathname, putPart } from "./document-store";
import {
  attachmentDisposition,
  CHUNK_BYTES,
  MAX_FILE_BYTES,
  matchesMagic,
  openDocumentStream,
  sanitizeFilename,
  validateStart,
  type BorrowerDocument,
} from "./documents";
import { generateCode, isSessionTokenShaped, normalizeEmail } from "./identity";
import { PORTAL_COOKIE, tokenFromRequest } from "./session";

const KEY = randomBytes(32);
const saved: Record<string, string | undefined> = {};
let root = "";

beforeEach(async () => {
  for (const k of ["DOCUMENT_ENCRYPTION_KEY", "DOCUMENT_STORAGE_DIR", "BLOB_STORE_ID", "BLOB_READ_WRITE_TOKEN", "DATABASE_URL"]) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  root = await mkdtemp(path.join(tmpdir(), "portal-"));
  process.env.DOCUMENT_STORAGE_DIR = root;
  process.env.DOCUMENT_ENCRYPTION_KEY = KEY.toString("base64");
  resetDocumentKeyWarning();
});

afterEach(async () => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  await rm(root, { recursive: true, force: true });
});

describe("crypto", () => {
  it("round-trips a chunk and grows it by exactly the header", () => {
    const plain = randomBytes(1000);
    const sealed = encryptChunk(plain, chunkAad(7, 0), KEY);
    expect(sealed.length).toBe(encryptedSize(plain.length));
    expect(decryptChunk(sealed, chunkAad(7, 0), KEY).equals(plain)).toBe(true);
  });

  it("uses a fresh IV every time", () => {
    const plain = Buffer.from("same bytes");
    const a = encryptChunk(plain, chunkAad(1, 0), KEY);
    const b = encryptChunk(plain, chunkAad(1, 0), KEY);
    expect(a.equals(b)).toBe(false);
  });

  it("rejects a chunk moved to another document or position", () => {
    const sealed = encryptChunk(Buffer.from("part"), chunkAad(7, 2), KEY);
    expect(() => decryptChunk(sealed, chunkAad(7, 3), KEY)).toThrow();
    expect(() => decryptChunk(sealed, chunkAad(8, 2), KEY)).toThrow();
  });

  it("rejects the wrong key and any tampering", () => {
    const sealed = encryptChunk(Buffer.from("secret"), chunkAad(1, 0), KEY);
    expect(() => decryptChunk(sealed, chunkAad(1, 0), randomBytes(32))).toThrow();
    const flipped = Buffer.from(sealed);
    flipped[flipped.length - 1] ^= 0x01;
    expect(() => decryptChunk(flipped, chunkAad(1, 0), KEY)).toThrow();
    expect(() => decryptChunk(sealed.subarray(0, 20), chunkAad(1, 0), KEY)).toThrow(/truncated/);
  });

  it("treats a malformed key as unset", () => {
    process.env.DOCUMENT_ENCRYPTION_KEY = "too-short";
    expect(documentKey()).toBeNull();
    delete process.env.DOCUMENT_ENCRYPTION_KEY;
    expect(documentKey()).toBeNull();
  });
});

describe("upload validation", () => {
  const good = { slot: "w2", filename: "W2 2025.pdf", mimeType: "application/pdf", byteSize: 1234 };

  it("accepts a well-formed start and computes the part count", () => {
    const v = validateStart(good);
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.partCount).toBe(1);
      expect(v.filename).toBe("W2 2025.pdf");
    }
    const big = validateStart({ ...good, byteSize: CHUNK_BYTES * 2 + 1 });
    expect(big.ok && big.partCount).toBe(3);
  });

  it("rejects unknown slots, disallowed types, and mismatched extensions", () => {
    expect(validateStart({ ...good, slot: "passport" }).ok).toBe(false);
    expect(validateStart({ ...good, mimeType: "application/zip", filename: "x.zip" }).ok).toBe(false);
    expect(validateStart({ ...good, mimeType: "image/png", filename: "not-a-png.pdf" }).ok).toBe(false);
    expect(validateStart({ ...good, filename: "resume.exe", mimeType: "application/pdf" }).ok).toBe(false);
  });

  it("rejects empty and oversized files", () => {
    expect(validateStart({ ...good, byteSize: 0 }).ok).toBe(false);
    expect(validateStart({ ...good, byteSize: MAX_FILE_BYTES + 1 }).ok).toBe(false);
    expect(validateStart({ ...good, byteSize: 12.5 }).ok).toBe(false);
  });

  it("checks the file's real bytes, not its name", () => {
    expect(matchesMagic("application/pdf", Buffer.from("%PDF-1.7\n"))).toBe(true);
    expect(matchesMagic("application/pdf", Buffer.from("MZ\x90\x00"))).toBe(false);
    expect(matchesMagic("image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
    expect(matchesMagic("image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
    expect(matchesMagic("image/png", Buffer.from("%PDF-"))).toBe(false);
    expect(matchesMagic("text/html", Buffer.from("<html>"))).toBe(false);
  });

  it("keeps a display name but strips paths and header-breaking characters", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("C:\\Users\\me\\Tax 2025.pdf")).toBe("Tax 2025.pdf");
    expect(sanitizeFilename('bad"name<x>.pdf')).toBe("badnamex.pdf");
    expect(sanitizeFilename("   ")).toBe("document");
    expect(sanitizeFilename("statement\u0000.pdf")).toBe("statement.pdf");
  });

  it("builds a Content-Disposition safe for any filename", () => {
    const d = attachmentDisposition('Tax "2025" ü.pdf');
    expect(d).toMatch(/^attachment; filename="Tax 2025 _\.pdf"; filename\*=UTF-8''/);
    expect(d).toContain(encodeURIComponent('Tax "2025" ü.pdf'));
  });
});

describe("document store (disk backend)", () => {
  it("only accepts storage keys of the shape it produces", async () => {
    expect(isPartPathname(partPathname(3, 44, 0))).toBe(true);
    expect(isPartPathname("documents/3/44/0.enc")).toBe(true);
    expect(isPartPathname("documents/../3/44/0.enc")).toBe(false);
    expect(isPartPathname("mismo/2026/09/x.xml")).toBe(false);
    expect(isPartPathname("documents/3/44/0.pdf")).toBe(false);
    await expect(putPart("documents/../x/0.enc", Buffer.from("x"))).rejects.toThrow(/malformed/);
  });

  it("writes, reads back, refuses overwrite, and deletes", async () => {
    const key = partPathname(1, 2, 0);
    await putPart(key, Buffer.from("hello"));
    expect((await getPart(key))?.toString()).toBe("hello");
    await expect(putPart(key, Buffer.from("again"))).rejects.toThrow();
    await deleteParts([key]);
    expect(await getPart(key)).toBeNull();
    await expect(deleteParts([key])).resolves.toBeUndefined();
  });
});

describe("openDocumentStream", () => {
  it("streams the decrypted parts in order and byte-for-byte", async () => {
    const plain = randomBytes(CHUNK_BYTES + 777);
    const doc: BorrowerDocument = {
      id: 9,
      borrowerId: 4,
      slot: "bank_statement",
      filename: "statement.pdf",
      mimeType: "application/pdf",
      byteSize: plain.length,
      sha256: null,
      partCount: 2,
      status: "available",
      uploadedAt: new Date().toISOString(),
      completedAt: null,
    };
    for (let i = 0; i < 2; i++) {
      const slice = plain.subarray(i * CHUNK_BYTES, Math.min((i + 1) * CHUNK_BYTES, plain.length));
      await putPart(partPathname(doc.borrowerId, doc.id, i), encryptChunk(slice, chunkAad(doc.id, i), KEY));
    }

    const out = Buffer.from(await new Response(openDocumentStream(doc)).arrayBuffer());
    expect(out.equals(plain)).toBe(true);
  });

  it("fails the stream rather than emitting garbage when a part is missing", async () => {
    const doc: BorrowerDocument = {
      id: 10,
      borrowerId: 4,
      slot: "other",
      filename: "x.pdf",
      mimeType: "application/pdf",
      byteSize: 10,
      sha256: null,
      partCount: 1,
      status: "available",
      uploadedAt: new Date().toISOString(),
      completedAt: null,
    };
    await expect(new Response(openDocumentStream(doc)).arrayBuffer()).rejects.toThrow(/missing/);
  });
});

describe("identity helpers", () => {
  it("generates six-digit codes with leading zeros preserved", () => {
    for (let i = 0; i < 200; i++) expect(generateCode()).toMatch(/^\d{6}$/);
  });

  it("normalizes email for matching", () => {
    expect(normalizeEmail("  Dana@Example.TEST ")).toBe("dana@example.test");
  });

  it("recognises only real session tokens", () => {
    expect(isSessionTokenShaped(randomBytes(32).toString("base64url"))).toBe(true);
    expect(isSessionTokenShaped("short")).toBe(false);
    expect(isSessionTokenShaped("x".repeat(43) + "!")).toBe(false);
    expect(isSessionTokenShaped(42)).toBe(false);
  });
});

describe("session cookie", () => {
  it("reads the portal cookie from a raw request", () => {
    const req = new Request("http://x/", { headers: { cookie: `other=1; ${PORTAL_COOKIE}=abc%3D; last=2` } });
    expect(tokenFromRequest(req)).toBe("abc=");
    expect(tokenFromRequest(new Request("http://x/"))).toBeNull();
  });
});
