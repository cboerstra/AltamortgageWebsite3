// Contract tests for the staff API.
//
// Hermetic. DATABASE_URL is unset, so every data route answers 503 once the
// key check passes — that is the shape the CRM must display as "website
// database unavailable" rather than "no applications". The download route is
// exercised against the disk backend with a real file in a tmpdir.

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApplicationDetail } from "@/lib/db";
import { isMismoRelativePath, readMismoFile } from "@/lib/mismo/store";
import { GET as listApplications } from "./applications/route";
import { GET as getApplication } from "./applications/[ref]/route";
import { GET as downloadMismo } from "./applications/[ref]/mismo/route";
import { GET as listDrafts } from "./drafts/route";

const KEY = "test-staff-key-with-enough-length";
const CLEARED = [
  "STAFF_API_KEY",
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "BLOB_STORE_ID",
  "BLOB_READ_WRITE_TOKEN",
];
const saved: Record<string, string | undefined> = {};
let storageRoot = "";

beforeEach(async () => {
  for (const k of CLEARED) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  storageRoot = await mkdtemp(path.join(tmpdir(), "staff-api-"));
  process.env.MISMO_STORAGE_DIR = storageRoot;
});

afterEach(async () => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  delete process.env.MISMO_STORAGE_DIR;
  await rm(storageRoot, { recursive: true, force: true });
  vi.restoreAllMocks();
});

function req(url: string, auth?: string): NextRequest {
  const request = new Request(url, { headers: auth ? { authorization: auth } : {} });
  Object.defineProperty(request, "nextUrl", { value: new URL(url) });
  return request as unknown as NextRequest;
}

const params = (ref: string) => ({ params: Promise.resolve({ ref }) });

const baseDetail: ApplicationDetail = {
  refNumber: "ALT-K7M2Q",
  firstName: "Dana",
  lastName: "Lee",
  email: "dana@example.test",
  phone: null,
  loanPurpose: "purchase",
  loanAmount: 400000,
  createdAt: "2026-09-08T14:30:12.000Z",
  mismoStatus: "written",
  crmStatus: "skipped",
  emailStatus: "sent",
  ssnLast4: "6789",
  rawPayload: {},
  mismoPath: "2026/09/ALT-K7M2Q-20260908T143012Z.xml",
  mismoSha256: "abc",
  mismoError: null,
  crmResponse: null,
  emailError: null,
};

describe("staff key", () => {
  it("is disabled until STAFF_API_KEY is set", async () => {
    const res = await listApplications(req("http://x/api/staff/applications", `Bearer ${KEY}`));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("STAFF_API_KEY");
  });

  it("rejects a missing, malformed, or wrong key", async () => {
    process.env.STAFF_API_KEY = KEY;
    const url = "http://x/api/staff/applications";
    expect((await listApplications(req(url))).status).toBe(401);
    expect((await listApplications(req(url, KEY))).status).toBe(401);
    expect((await listApplications(req(url, "Bearer nope"))).status).toBe(401);
    // Same length, different bytes — the constant-time compare must still say no.
    const sameLength = KEY.replace(/./g, "x");
    expect((await listApplications(req(url, `Bearer ${sameLength}`))).status).toBe(401);
  });

  it("guards every route, including the download", async () => {
    process.env.STAFF_API_KEY = KEY;
    expect((await getApplication(req("http://x/a"), params("ALT-AAAAA"))).status).toBe(401);
    expect((await downloadMismo(req("http://x/a"), params("ALT-AAAAA"))).status).toBe(401);
    expect((await listDrafts(req("http://x/api/staff/drafts"))).status).toBe(401);
  });

  it("never lets a staff response be cached or indexed", async () => {
    process.env.STAFF_API_KEY = KEY;
    const res = await listDrafts(req("http://x/api/staff/drafts", `Bearer ${KEY}`));
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(res.headers.get("x-robots-tag")).toContain("noindex");
  });
});

describe("without a database", () => {
  beforeEach(() => {
    process.env.STAFF_API_KEY = KEY;
  });

  it("reports the database as unavailable rather than empty", async () => {
    const res = await listApplications(req("http://x/api/staff/applications", `Bearer ${KEY}`));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/database/i);
  });

  it("answers 404 for a malformed reference without querying", async () => {
    const res = await getApplication(req("http://x/a", `Bearer ${KEY}`), params("../etc/passwd"));
    expect(res.status).toBe(404);
  });

  it("answers 404 for a well-formed reference it cannot find", async () => {
    const res = await downloadMismo(req("http://x/a", `Bearer ${KEY}`), params("alt-k7m2q"));
    expect(res.status).toBe(404);
  });
});

describe("download from the disk backend", () => {
  beforeEach(() => {
    process.env.STAFF_API_KEY = KEY;
  });

  async function seed(relativePath: string, xml: string): Promise<void> {
    const abs = path.join(storageRoot, ...relativePath.split("/"));
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, xml, "utf8");
  }

  it("streams the stored document as an attachment", async () => {
    const xml = '<?xml version="1.0"?><MESSAGE>ok</MESSAGE>';
    await seed(baseDetail.mismoPath!, xml);

    const db = await import("@/lib/db");
    vi.spyOn(db, "getApplicationByRef").mockResolvedValue(baseDetail);

    const res = await downloadMismo(req("http://x/a", `Bearer ${KEY}`), params("ALT-K7M2Q"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/xml");
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="ALT-K7M2Q-20260908T143012Z.xml"'
    );
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await res.text()).toBe(xml);
  });

  it("answers 409 when no document was written for the row", async () => {
    const db = await import("@/lib/db");
    vi.spyOn(db, "getApplicationByRef").mockResolvedValue({
      ...baseDetail,
      mismoStatus: "failed",
      mismoPath: null,
      mismoSha256: null,
      mismoError: "disk full",
    });
    const res = await downloadMismo(req("http://x/a", `Bearer ${KEY}`), params("ALT-K7M2Q"));
    expect(res.status).toBe(409);
    expect((await res.json()).mismoStatus).toBe("failed");
  });

  it("answers 404 when the row points at a document that is gone", async () => {
    const db = await import("@/lib/db");
    vi.spyOn(db, "getApplicationByRef").mockResolvedValue(baseDetail);
    const res = await downloadMismo(req("http://x/a", `Bearer ${KEY}`), params("ALT-K7M2Q"));
    expect(res.status).toBe(404);
  });
});

describe("detail response", () => {
  beforeEach(() => {
    process.env.STAFF_API_KEY = KEY;
  });

  it("never echoes the raw payload, and degrades to summary: null on an unparseable row", async () => {
    const db = await import("@/lib/db");
    vi.spyOn(db, "getApplicationByRef").mockResolvedValue({
      ...baseDetail,
      rawPayload: { legacy: true },
    });
    const res = await getApplication(req("http://x/a", `Bearer ${KEY}`), params("ALT-K7M2Q"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rawPayload).toBeUndefined();
    expect(body.summary).toBeNull();
    expect(body.mismoAvailable).toBe(true);
    expect(body.mismoFilename).toBe("ALT-K7M2Q-20260908T143012Z.xml");
  });
});

describe("readMismoFile key validation", () => {
  it("accepts only keys shaped like ones we write", () => {
    expect(isMismoRelativePath("2026/09/ALT-K7M2Q-20260908T143012Z.xml")).toBe(true);
    expect(isMismoRelativePath("../2026/09/x.xml")).toBe(false);
    expect(isMismoRelativePath("2026/09/../../etc/passwd")).toBe(false);
    expect(isMismoRelativePath("/etc/passwd")).toBe(false);
    expect(isMismoRelativePath("2026/09/x.txt")).toBe(false);
    expect(isMismoRelativePath("mismo/2026/09/x.xml")).toBe(false);
  });

  it("refuses a malformed key before touching storage", async () => {
    await expect(readMismoFile("../../etc/passwd")).rejects.toThrow(/malformed/);
  });

  it("returns null for a well-formed key that does not exist", async () => {
    expect(await readMismoFile("2026/01/ALT-NOPE1-20260101T000000Z.xml")).toBeNull();
  });
});
