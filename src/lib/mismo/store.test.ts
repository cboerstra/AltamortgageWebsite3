import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildRelativePath, resolveStorageRoot, writeMismoFile } from "./store";

let root = "";
const originalEnv = process.env.MISMO_STORAGE_DIR;

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "mismo-store-"));
  process.env.MISMO_STORAGE_DIR = root;
});

afterEach(async () => {
  if (originalEnv === undefined) delete process.env.MISMO_STORAGE_DIR;
  else process.env.MISMO_STORAGE_DIR = originalEnv;
  await rm(root, { recursive: true, force: true });
});

const INPUT = { referenceNumber: "ALT-K7M2Q", submittedAt: "2026-09-08T14:30:12.000Z" };

describe("resolveStorageRoot", () => {
  it("honours MISMO_STORAGE_DIR", () => {
    expect(resolveStorageRoot()).toBe(path.resolve(root));
  });

  it("falls back to a sibling of the app directory, never inside public/", () => {
    delete process.env.MISMO_STORAGE_DIR;
    const resolved = resolveStorageRoot();
    expect(resolved).toBe(path.resolve(process.cwd(), "..", "storage", "mismo"));
    expect(resolved.includes(`${path.sep}public${path.sep}`)).toBe(false);
  });
});

describe("buildRelativePath", () => {
  it("files documents by UTC year and month, as a forward-slash storage key", () => {
    // A key, not a filesystem path: Blob pathnames use "/" on every platform.
    expect(buildRelativePath("ALT-K7M2Q", "2026-09-08T14:30:12.000Z")).toBe(
      "2026/09/ALT-K7M2Q-20260908T143012Z.xml"
    );
  });

  it("strips characters that have no business in a filename", () => {
    const relative = buildRelativePath("../../etc/passwd", "2026-09-08T14:30:12.000Z");
    expect(relative.split("/").pop()).toBe("....etcpasswd-20260908T143012Z.xml");
    expect(relative.includes("../")).toBe(false);
  });
});

describe("writeMismoFile", () => {
  it("writes the document and reports its size and digest", async () => {
    const xml = "<MESSAGE>hello</MESSAGE>";
    const stored = await writeMismoFile(xml, INPUT);

    expect(await readFile(stored.path, "utf8")).toBe(xml);
    expect(stored.bytes).toBe(Buffer.byteLength(xml, "utf8"));
    expect(stored.sha256).toBe(createHash("sha256").update(xml).digest("hex"));
    // The key is the same string in both backends — never a platform path.
    expect(stored.relativePath).toBe("2026/09/ALT-K7M2Q-20260908T143012Z.xml");
  });

  it("leaves no temp file behind", async () => {
    const stored = await writeMismoFile("<MESSAGE />", INPUT);
    const entries = await readdir(path.dirname(stored.path));
    expect(entries).toEqual(["ALT-K7M2Q-20260908T143012Z.xml"]);
  });

  it("writes a deny-all rule at the storage root", async () => {
    await writeMismoFile("<MESSAGE />", INPUT);
    const htaccess = await readFile(path.join(root, ".htaccess"), "utf8");
    expect(htaccess).toContain("Require all denied");
    expect(htaccess).toContain("Deny from all");
  });

  it("does not clobber an existing deny rule on a later write", async () => {
    await writeMismoFile("<MESSAGE />", INPUT);
    await writeMismoFile("<MESSAGE />", { ...INPUT, referenceNumber: "ALT-AAAAA" });
    const htaccess = await readFile(path.join(root, ".htaccess"), "utf8");
    expect(htaccess.match(/Require all denied/g)).toHaveLength(1);
  });

  it("round-trips non-ASCII content as UTF-8", async () => {
    const xml = "<MESSAGE><Name>Zoë Ortiz-Muñoz</Name></MESSAGE>";
    const stored = await writeMismoFile(xml, INPUT);
    expect(await readFile(stored.path, "utf8")).toBe(xml);
    expect(stored.bytes).toBe(Buffer.byteLength(xml, "utf8"));
  });
});
