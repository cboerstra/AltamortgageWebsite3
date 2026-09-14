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
import {
  DELETE as deleteApplicationRoute,
  GET as getApplication,
  PATCH as patchApplication,
} from "./applications/[ref]/route";
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

function req(url: string, auth?: string, init?: { method?: string; body?: unknown }): NextRequest {
  const request = new Request(url, {
    method: init?.method ?? "GET",
    headers: {
      ...(auth ? { authorization: auth } : {}),
      ...(init?.body !== undefined ? { "content-type": "application/json" } : {}),
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
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
  reviewStatus: "new",
  staffNotes: null,
  reviewedAt: null,
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

  it("guards every route, including the download and the writes", async () => {
    process.env.STAFF_API_KEY = KEY;
    expect((await getApplication(req("http://x/a"), params("ALT-AAAAA"))).status).toBe(401);
    expect((await downloadMismo(req("http://x/a"), params("ALT-AAAAA"))).status).toBe(401);
    expect((await listDrafts(req("http://x/api/staff/drafts"))).status).toBe(401);
    const patch = req("http://x/a", undefined, { method: "PATCH", body: { reviewStatus: "closed" } });
    expect((await patchApplication(patch, params("ALT-AAAAA"))).status).toBe(401);
    const del = req("http://x/a", undefined, { method: "DELETE" });
    expect((await deleteApplicationRoute(del, params("ALT-AAAAA"))).status).toBe(401);
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

describe("review (PATCH)", () => {
  beforeEach(() => {
    process.env.STAFF_API_KEY = KEY;
  });

  const patch = (ref: string, body: unknown) =>
    patchApplication(req("http://x/a", `Bearer ${KEY}`, { method: "PATCH", body }), params(ref));

  it("answers 503 without a database, before validating the body", async () => {
    const res = await patch("ALT-K7M2Q", { reviewStatus: "approved" });
    expect(res.status).toBe(503);
  });

  it("rejects an unknown status, an empty update, and a malformed reference", async () => {
    process.env.DATABASE_URL = "postgres://u:p@db.invalid:5432/n";
    expect((await patch("ALT-K7M2Q", { reviewStatus: "funded" })).status).toBe(400);
    expect((await patch("ALT-K7M2Q", {})).status).toBe(400);
    expect((await patch("ALT-K7M2Q", "not json object")).status).toBe(400);
    expect((await patch("../x", { reviewStatus: "approved" })).status).toBe(404);
  });

  it("passes only the two staff-owned fields through and returns the presented row", async () => {
    process.env.DATABASE_URL = "postgres://u:p@db.invalid:5432/n";
    const db = await import("@/lib/db");
    const spy = vi.spyOn(db, "updateApplicationReview").mockResolvedValue({
      ...baseDetail,
      reviewStatus: "in_review",
      staffNotes: "Called, left voicemail",
      reviewedAt: "2026-09-13T20:00:00.000Z",
    });
    const res = await patch("alt-k7m2q", {
      reviewStatus: "in_review",
      staffNotes: "Called, left voicemail",
      firstName: "Mallory",
      loanAmount: 1,
    });
    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith("ALT-K7M2Q", {
      reviewStatus: "in_review",
      staffNotes: "Called, left voicemail",
    });
    const body = await res.json();
    expect(body.reviewStatus).toBe("in_review");
    expect(body.staffNotes).toBe("Called, left voicemail");
    expect(body.rawPayload).toBeUndefined();
  });

  it("answers 404 when the reference does not exist", async () => {
    process.env.DATABASE_URL = "postgres://u:p@db.invalid:5432/n";
    const db = await import("@/lib/db");
    vi.spyOn(db, "updateApplicationReview").mockResolvedValue(null);
    expect((await patch("ALT-K7M2Q", { staffNotes: null })).status).toBe(404);
  });
});

describe("delete", () => {
  beforeEach(() => {
    process.env.STAFF_API_KEY = KEY;
  });

  const del = (ref: string) =>
    deleteApplicationRoute(req("http://x/a", `Bearer ${KEY}`, { method: "DELETE" }), params(ref));

  it("answers 503 without a database and 404 for a malformed reference", async () => {
    expect((await del("ALT-K7M2Q")).status).toBe(503);
    process.env.DATABASE_URL = "postgres://u:p@db.invalid:5432/n";
    expect((await del("nope")).status).toBe(404);
  });

  it("answers 404 when the row does not exist and touches nothing else", async () => {
    process.env.DATABASE_URL = "postgres://u:p@db.invalid:5432/n";
    const db = await import("@/lib/db");
    vi.spyOn(db, "deleteApplication").mockResolvedValue(null);
    const docs = await import("@/lib/portal/documents");
    const purge = vi.spyOn(docs, "purgeBorrowerByEmail");
    expect((await del("ALT-K7M2Q")).status).toBe(404);
    expect(purge).not.toHaveBeenCalled();
  });

  it("removes the MISMO file, and the borrower's documents and drafts when it was their last application", async () => {
    process.env.DATABASE_URL = "postgres://u:p@db.invalid:5432/n";
    const abs = path.join(storageRoot, ...baseDetail.mismoPath!.split("/"));
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, "<x/>", "utf8");

    const db = await import("@/lib/db");
    vi.spyOn(db, "deleteApplication").mockResolvedValue({
      email: baseDetail.email,
      mismoPath: baseDetail.mismoPath,
      lastForEmail: true,
    });
    const docs = await import("@/lib/portal/documents");
    const purge = vi.spyOn(docs, "purgeBorrowerByEmail").mockResolvedValue(2);
    const drafts = await import("@/lib/drafts/store");
    const dropDrafts = vi.spyOn(drafts, "deleteDraftsByEmail").mockResolvedValue(1);

    const res = await del("ALT-K7M2Q");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      deleted: true,
      refNumber: "ALT-K7M2Q",
      documentsRemoved: 2,
      draftsRemoved: 1,
      borrowerPurged: true,
      warnings: [],
    });
    expect(purge).toHaveBeenCalledWith(baseDetail.email);
    expect(dropDrafts).toHaveBeenCalledWith(baseDetail.email);
    expect(await readMismoFile(baseDetail.mismoPath!)).toBeNull();
  });

  it("leaves the borrower's documents alone when another application remains", async () => {
    process.env.DATABASE_URL = "postgres://u:p@db.invalid:5432/n";
    const db = await import("@/lib/db");
    vi.spyOn(db, "deleteApplication").mockResolvedValue({
      email: baseDetail.email,
      mismoPath: null,
      lastForEmail: false,
    });
    const docs = await import("@/lib/portal/documents");
    const purge = vi.spyOn(docs, "purgeBorrowerByEmail");
    const drafts = await import("@/lib/drafts/store");
    const dropDrafts = vi.spyOn(drafts, "deleteDraftsByEmail");

    const res = await del("ALT-K7M2Q");
    expect(res.status).toBe(200);
    expect((await res.json()).borrowerPurged).toBe(false);
    expect(purge).not.toHaveBeenCalled();
    expect(dropDrafts).not.toHaveBeenCalled();
  });

  it("still reports the row as deleted when storage cleanup fails", async () => {
    process.env.DATABASE_URL = "postgres://u:p@db.invalid:5432/n";
    const db = await import("@/lib/db");
    vi.spyOn(db, "deleteApplication").mockResolvedValue({
      email: baseDetail.email,
      mismoPath: baseDetail.mismoPath,
      lastForEmail: true,
    });
    const docs = await import("@/lib/portal/documents");
    vi.spyOn(docs, "purgeBorrowerByEmail").mockRejectedValue(new Error("blob down"));
    const drafts = await import("@/lib/drafts/store");
    vi.spyOn(drafts, "deleteDraftsByEmail").mockResolvedValue(0);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await del("ALT-K7M2Q");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(body.warnings).toEqual(["Uploaded documents could not be removed"]);
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
