// Contract tests for the draft endpoints, hermetic: DATABASE_URL unset means
// every store call short-circuits, which is the "not configured" production
// shape the wizard must survive silently.

import { randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetRateLimits } from "@/lib/rate-limit";
import { generateToken } from "@/lib/drafts/token";
import { GET, POST } from "./route";
import { POST as runReminders } from "./reminders/route";
import { GET as optOutPage, POST as optOutSubmit } from "./opt-out/route";

const CLEARED = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "CRON_SECRET",
  "DRAFT_LINK_KEY",
  "SMTP_HOST",
];
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of CLEARED) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  resetRateLimits();
});

afterEach(() => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function req(url: string, init?: RequestInit & { ip?: string }): NextRequest {
  const headers = new Headers(init?.headers);
  if (init?.ip) headers.set("x-forwarded-for", init.ip);
  const request = new Request(url, { ...init, headers });
  // NextRequest adds nextUrl; the handlers only read searchParams/origin from it.
  Object.defineProperty(request, "nextUrl", { value: new URL(url) });
  return request as unknown as NextRequest;
}

function postDraft(body: unknown, ip = "203.0.113.5"): Promise<Response> {
  return POST(
    req("http://localhost/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      ip,
    })
  );
}

describe("POST /api/drafts", () => {
  it("reports unavailable when the database is not configured", async () => {
    const res = await postDraft({ data: { email: "d@example.test" }, furthestStep: 2 });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ available: false });
  });
});

describe("POST /api/drafts with a database configured (validation only)", () => {
  // Setting DATABASE_URL makes isDbConfigured() true. The pool is created
  // lazily and never used before validation rejects the request, so no
  // connection is attempted for these cases.
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://u:p@db.invalid:5432/n";
  });

  it("rejects an oversized body before parsing it", async () => {
    const res = await postDraft({ data: { note: "x".repeat(70_000) } });
    expect(res.status).toBe(413);
  });

  it("rejects malformed JSON", async () => {
    const res = await POST(
      req("http://localhost/api/drafts", { method: "POST", body: "{not json", ip: "1.1.1.1" })
    );
    expect(res.status).toBe(400);
  });

  it("rejects a token that is not token-shaped", async () => {
    const res = await postDraft({ token: "abc", data: { email: "d@example.test" } });
    expect(res.status).toBe(400);
  });

  it("refuses a draft with no email to file it under", async () => {
    const res = await postDraft({ data: { firstName: "Dana" }, furthestStep: 1 });
    expect(res.status).toBe(422);
  });

  it("rate-limits draft creation per client", async () => {
    const ip = "198.51.100.7";
    let last: Response | undefined;
    for (let i = 0; i < 11; i++) {
      last = await postDraft({ data: { firstName: "only" } }, ip);
    }
    expect(last!.status).toBe(429);
    expect(last!.headers.get("Retry-After")).toMatch(/^\d+$/);
  });

  it("keeps clients' limits separate", async () => {
    for (let i = 0; i < 10; i++) await postDraft({ data: {} }, "198.51.100.8");
    const other = await postDraft({ data: {} }, "198.51.100.9");
    expect(other.status).not.toBe(429);
  });
});

describe("GET /api/drafts", () => {
  it("reports unavailable without a database", async () => {
    const res = await GET(req(`http://localhost/api/drafts?token=${generateToken()}`));
    expect(res.status).toBe(503);
  });

  it("answers 404 to a malformed token without touching the database", async () => {
    process.env.DATABASE_URL = "postgres://u:p@db.invalid:5432/n";
    const res = await GET(req("http://localhost/api/drafts?token=nope"));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/drafts/reminders", () => {
  function run(auth?: string): Promise<Response> {
    return runReminders(
      req("http://localhost/api/drafts/reminders", {
        method: "POST",
        headers: auth ? { authorization: auth } : {},
      })
    );
  }

  it("is disabled until CRON_SECRET is set", async () => {
    const res = await run("Bearer anything");
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("CRON_SECRET");
  });

  it("rejects a missing or wrong secret", async () => {
    process.env.CRON_SECRET = "correct-horse";
    expect((await run()).status).toBe(401);
    expect((await run("Bearer wrong")).status).toBe(401);
    expect((await run("correct-horse")).status).toBe(401);
  });

  it("requires the link key before it will try to send", async () => {
    process.env.CRON_SECRET = "correct-horse";
    const res = await run("Bearer correct-horse");
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("DRAFT_LINK_KEY");
  });

  it("runs to completion with nothing to do when there is no database", async () => {
    process.env.CRON_SECRET = "correct-horse";
    process.env.DRAFT_LINK_KEY = randomBytes(32).toString("base64");
    const res = await run("Bearer correct-horse");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sent: 0, failed: 0, skipped: 0, unlinkable: 0, purged: 0 });
  });
});

describe("/api/drafts/opt-out", () => {
  it("renders a confirmation form rather than opting out on GET", async () => {
    const token = generateToken();
    const res = await optOutPage(req(`http://localhost/api/drafts/opt-out?token=${token}`));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const html = await res.text();
    expect(html).toContain('method="post"');
    expect(html).toContain(`value="${token}"`);
    expect(html).toContain("Stop reminders");
  });

  it("explains an invalid link instead of erroring", async () => {
    const res = await optOutPage(req("http://localhost/api/drafts/opt-out?token=bad"));
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("isn't valid");
  });

  it("confirms on POST even without a database, and never reveals token validity", async () => {
    const form = new FormData();
    form.set("token", generateToken());
    const res = await optOutSubmit(
      req("http://localhost/api/drafts/opt-out", { method: "POST", body: form })
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Reminders stopped");
  });

  it("escapes the token when echoing it into the form", async () => {
    // isTokenShaped already rejects this, but the page must still be inert.
    const res = await optOutPage(
      req(`http://localhost/api/drafts/opt-out?token=${encodeURIComponent('"><script>')}`)
    );
    expect(await res.text()).not.toContain("<script>");
  });
});
