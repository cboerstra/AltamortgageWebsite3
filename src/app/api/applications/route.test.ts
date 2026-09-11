// Contract tests for the submission handler.
//
// Hermetic: with CRM_*, SMTP_*, DATABASE_URL and the BLOB_* credentials unset,
// forwardToCRM, the mailer and the Postgres pool all short-circuit to "skipped"
// and the MISMO store writes to a tmpdir, without touching the network. That
// is exactly the misconfigured production shape that used to report success
// while dropping the application, so it is the case worth pinning down.

import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { completeApplication } from "@/lib/mismo/__fixtures__/application";
import { POST } from "./route";

let storageRoot = "";

const CLEARED_ENV = [
  "CRM_API_URL",
  "CRM_API_KEY",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
  "NOTIFICATION_EMAIL",
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "BLOB_READ_WRITE_TOKEN",
  "BLOB_STORE_ID",
];

const savedEnv: Record<string, string | undefined> = {};

beforeEach(async () => {
  for (const key of [...CLEARED_ENV, "MISMO_STORAGE_DIR"]) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
  storageRoot = await mkdtemp(path.join(tmpdir(), "mismo-route-"));
  process.env.MISMO_STORAGE_DIR = storageRoot;
});

afterEach(async () => {
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  await rm(storageRoot, { recursive: true, force: true });
});

function post(body: unknown): Promise<Response> {
  const request = new Request("http://localhost/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(request as NextRequest);
}

async function writtenFiles(): Promise<string[]> {
  const monthDir = path.join(storageRoot, "2026", "09");
  try {
    return await readdir(monthDir);
  } catch {
    return [];
  }
}

const VALID_BODY = { ...completeApplication, source: "/apply" };

describe("POST /api/applications", () => {
  it("stores the application and reports success", async () => {
    const res = await post(VALID_BODY);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.stored).toBe(true);
    expect(body.referenceNumber).toMatch(/^ALT-[A-Z2-9]{5}$/);
    // The CRM is unconfigured here, and the response says so rather than
    // implying the lead reached it.
    expect(body.forwarded).toBe(false);
  });

  it("writes exactly one MISMO document per submission", async () => {
    await post(VALID_BODY);
    const files = await writtenFiles();
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^ALT-[A-Z2-9]{5}-\d{8}T\d{6}Z\.xml$/);
  });

  it("names the file after the reference number it returned", async () => {
    const body = await (await post(VALID_BODY)).json();
    const [file] = await writtenFiles();
    expect(file.startsWith(body.referenceNumber)).toBe(true);
  });

  it("writes a document that carries the applicant's answers", async () => {
    const body = await (await post(VALID_BODY)).json();
    const [file] = await writtenFiles();
    const xml = await readFile(path.join(storageRoot, "2026", "09", file), "utf8");

    expect(xml).toContain(`<LoanIdentifier>${body.referenceNumber}</LoanIdentifier>`);
    expect(xml).toContain("<CurrentIncomeMonthlyTotalAmount>9400.00</CurrentIncomeMonthlyTotalAmount>");
    // The declarations and signature that the old pipeline discarded.
    expect(xml).toContain("<BankruptcyIndicator>false</BankruptcyIndicator>");
    expect(xml).toContain("<alta:ElectronicSignatureName>Dana Lee O'Brien</alta:ElectronicSignatureName>");
  });

  it("never writes the full SSN to disk", async () => {
    await post(VALID_BODY);
    const [file] = await writtenFiles();
    const xml = await readFile(path.join(storageRoot, "2026", "09", file), "utf8");

    expect(xml).not.toContain("123-45-6789");
    expect(xml).not.toContain("123456789");
    expect(xml).toContain("XXX-XX-6789");
  });

  it("rejects an invalid application without writing anything", async () => {
    const res = await post({ ...VALID_BODY, email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(await writtenFiles()).toEqual([]);
  });

  it("requires the consent checkbox", async () => {
    const res = await post({ ...VALID_BODY, consentAuthorization: false });
    expect(res.status).toBe(400);
  });

  it("reports failure when the application could not be stored anywhere", async () => {
    // Point the storage root at a path under a regular file so mkdir fails.
    const blocker = path.join(storageRoot, "blocker");
    await writeFile(blocker, "not a directory");
    process.env.MISMO_STORAGE_DIR = path.join(blocker, "nested");

    const res = await post(VALID_BODY);

    // The old handler answered 200 here and the application vanished.
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.success).toBeUndefined();
    expect(body.error).toContain("could not save");
  });
});
