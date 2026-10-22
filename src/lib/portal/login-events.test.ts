// The sign-in log must never cost a borrower their sign-in: recording is
// best-effort and resolves whatever the database is doing.

import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { listLoginEvents, LOGIN_OUTCOMES, recordLoginEvent, resetLoginEventState } from "./login-events";

const CLEARED = ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL"];
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of CLEARED) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  resetLoginEventState();
});

afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe("recordLoginEvent", () => {
  it("resolves without a database", async () => {
    await expect(recordLoginEvent("a@b.test", "sent")).resolves.toBeUndefined();
  });
});

describe("listLoginEvents", () => {
  it("reports unavailable without a database rather than throwing", async () => {
    await expect(listLoginEvents({})).resolves.toEqual({ status: "unavailable" });
  });
});

describe("outcomes", () => {
  // The table's CHECK constraint and the code's list of outcomes are written
  // in two places. If they drift, the insert for the missing outcome fails —
  // silently, because recording never throws — and that failure stops being
  // visible to staff, which is the one thing this log exists to prevent.
  it("match the CHECK constraint on portal_login_events in db/schema.sql", () => {
    const schema = readFileSync(path.join(process.cwd(), "db/schema.sql"), "utf8");
    const table = schema.slice(schema.indexOf("CREATE TABLE IF NOT EXISTS portal_login_events"));
    const check = table.match(/outcome IN \(([^)]*)\)/);
    expect(check).not.toBeNull();
    const allowed = check![1].split(",").map((v) => v.trim().replace(/'/g, ""));
    expect([...allowed].sort()).toEqual([...LOGIN_OUTCOMES].sort());
  });
});
