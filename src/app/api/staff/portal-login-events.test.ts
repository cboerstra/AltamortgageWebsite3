// GET /api/staff/portal/login-events: the CRM's window onto portal sign-ins.

import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as listEvents } from "./portal/login-events/route";

const KEY = "test-staff-key-with-enough-length";
const CLEARED = ["STAFF_API_KEY", "DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL"];
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of CLEARED) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

function req(url: string, auth?: string): NextRequest {
  const request = new Request(url, { headers: auth ? { authorization: auth } : {} });
  Object.defineProperty(request, "nextUrl", { value: new URL(url) });
  return request as unknown as NextRequest;
}

const URL_BASE = "http://x/api/staff/portal/login-events";

describe("GET /api/staff/portal/login-events", () => {
  it("is refused without the staff key", async () => {
    process.env.STAFF_API_KEY = KEY;
    expect((await listEvents(req(URL_BASE))).status).toBe(401);
    expect((await listEvents(req(URL_BASE, "Bearer nope"))).status).toBe(401);
  });

  it("answers 503 without a database", async () => {
    process.env.STAFF_API_KEY = KEY;
    const res = await listEvents(req(URL_BASE, `Bearer ${KEY}`));
    expect(res.status).toBe(503);
  });

  it("says exactly what to run when the table was never created", async () => {
    process.env.STAFF_API_KEY = KEY;
    const events = await import("@/lib/portal/login-events");
    vi.spyOn(events, "listLoginEvents").mockResolvedValue({ status: "table_missing" });

    const res = await listEvents(req(URL_BASE, `Bearer ${KEY}`));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("db/schema.sql");
  });

  it("returns events and passes the filters through", async () => {
    process.env.STAFF_API_KEY = KEY;
    const events = await import("@/lib/portal/login-events");
    const rows = [
      { id: 2, email: "dana@example.test", outcome: "no_match" as const, detail: "x", createdAt: "2026-10-02T12:00:00.000Z" },
    ];
    const spy = vi.spyOn(events, "listLoginEvents").mockResolvedValue({ status: "ok", events: rows });

    const res = await listEvents(req(`${URL_BASE}?email=Dana@Example.test&limit=25&problemsOnly=1`, `Bearer ${KEY}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ events: rows });
    expect(spy).toHaveBeenCalledWith({ email: "Dana@Example.test", limit: 25, problemsOnly: true });
    expect(res.headers.get("cache-control")).toContain("no-store");
  });

  it("treats a missing or junk limit as the default", async () => {
    process.env.STAFF_API_KEY = KEY;
    const events = await import("@/lib/portal/login-events");
    const spy = vi.spyOn(events, "listLoginEvents").mockResolvedValue({ status: "ok", events: [] });

    await listEvents(req(`${URL_BASE}?limit=abc`, `Bearer ${KEY}`));
    expect(spy).toHaveBeenLastCalledWith({ email: undefined, limit: undefined, problemsOnly: false });
  });
});
