// Contract tests for the portal routes without a database: every data route
// refuses an unauthenticated request, login never reveals whether an email
// is known, and the whole portal answers "unavailable" rather than crashing
// when the database is unset.

import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimits } from "@/lib/rate-limit";
import { POST as login } from "./login/route";
import { POST as verify } from "./verify/route";
import { POST as logout } from "./logout/route";
import { GET as listDocs } from "./documents/route";
import { POST as startUpload } from "./documents/start/route";
import { PUT as putPart } from "./documents/[id]/parts/[index]/route";
import { POST as complete } from "./documents/[id]/complete/route";
import { GET as download, DELETE as remove } from "./documents/[id]/route";

const CLEARED = ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "DOCUMENT_ENCRYPTION_KEY", "SMTP_HOST"];
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of CLEARED) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  resetRateLimits();
});

afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

function req(url: string, init?: RequestInit & { ip?: string }): NextRequest {
  const headers = new Headers(init?.headers);
  if (init?.ip) headers.set("x-forwarded-for", init.ip);
  const request = new Request(url, { ...init, headers });
  Object.defineProperty(request, "nextUrl", { value: new URL(url) });
  return request as unknown as NextRequest;
}

const json = (body: unknown) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });

describe("without a database", () => {
  it("login and verify say the portal is unavailable, never 500", async () => {
    expect((await login(req("http://x/api/portal/login", json({ email: "a@b.test" })))).status).toBe(503);
    expect((await verify(req("http://x/api/portal/verify", json({ email: "a@b.test", code: "123456" })))).status).toBe(503);
  });

  it("logout always succeeds and clears the cookie", async () => {
    const res = await logout(req("http://x/api/portal/logout", { method: "POST" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/alta_portal=;.*Max-Age=0/);
  });
});

describe("authentication gate", () => {
  beforeEach(() => {
    // A configured-but-unreachable database: the session lookup fails closed.
    process.env.DATABASE_URL = "postgres://u:p@db.invalid:5432/n";
  });

  it("every document route answers 401 without a session cookie", async () => {
    const results = await Promise.all([
      listDocs(req("http://x/api/portal/documents")),
      startUpload(req("http://x/api/portal/documents/start", json({}))),
      putPart(req("http://x/a", { method: "PUT", body: "x" }), params({ id: "1", index: "0" })),
      complete(req("http://x/a", json({})), params({ id: "1" })),
      download(req("http://x/a"), params({ id: "1" })),
      remove(req("http://x/a", { method: "DELETE" }), params({ id: "1" })),
    ]);
    for (const res of results) expect(res.status).toBe(401);
  });

  it("ignores a cookie that is not token-shaped without touching the database", async () => {
    const res = await listDocs(req("http://x/api/portal/documents", { headers: { cookie: "alta_portal=nope" } }));
    expect(res.status).toBe(401);
  });

  it("never caches or indexes a portal response", async () => {
    const res = await listDocs(req("http://x/api/portal/documents"));
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(res.headers.get("x-robots-tag")).toContain("noindex");
  });
});

describe("login input", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://u:p@db.invalid:5432/n";
  });

  it("rejects a malformed email before any lookup", async () => {
    const res = await login(req("http://x/api/portal/login", json({ email: "not-an-email" })));
    expect(res.status).toBe(400);
  });

  it("rejects a code that is not six digits before any lookup", async () => {
    const res = await verify(req("http://x/api/portal/verify", json({ email: "a@b.test", code: "12" })));
    expect(res.status).toBe(400);
  });

  it("rate-limits code requests per client", async () => {
    let last: Response | undefined;
    for (let i = 0; i < 11; i++) {
      last = await login(req("http://x/api/portal/login", { ...json({ email: "bad" }), ip: "198.51.100.1" }));
    }
    expect(last!.status).toBe(429);
    expect(last!.headers.get("Retry-After")).toMatch(/^\d+$/);
  });
});

describe("sign-in outcomes are recorded for staff", () => {
  // The login endpoint must answer every request identically, so the borrower
  // cannot tell these apart — and until now neither could anyone at Alta. Each
  // outcome must land in the staff log as what actually happened.

  const EMAIL = "Dana.Lee@Example.test";
  const NORMALIZED = "dana.lee@example.test";
  const borrower = { id: 7, email: NORMALIZED, firstName: "Dana", lastName: "Lee" };

  let identity: typeof import("@/lib/portal/identity");
  let mail: typeof import("@/lib/email");
  let record: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    process.env.DATABASE_URL = "postgres://u:p@db.invalid:5432/n";
    identity = await import("@/lib/portal/identity");
    mail = await import("@/lib/email");
    const events = await import("@/lib/portal/login-events");
    record = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(events, "recordLoginEvent").mockImplementation(record);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function eligible() {
    vi.spyOn(identity, "findEligibleIdentity").mockResolvedValue({
      ok: true,
      name: { firstName: "Dana", lastName: "Lee" },
    });
    vi.spyOn(identity, "ensureBorrower").mockResolvedValue({ ok: true, borrower });
  }

  async function attempt(): Promise<{ status: number; body: string }> {
    const res = await login(req("http://x/api/portal/login", json({ email: EMAIL })));
    return { status: res.status, body: await res.text() };
  }

  it("records a successful send", async () => {
    eligible();
    vi.spyOn(identity, "issueCode").mockResolvedValue({ ok: true, code: "123456" });
    vi.spyOn(mail, "sendPortalLoginCode").mockResolvedValue({ status: "sent" });

    expect((await attempt()).status).toBe(200);
    expect(record).toHaveBeenCalledWith(NORMALIZED, "sent");
  });

  it("records an email that matches no application — the usual cause", async () => {
    vi.spyOn(identity, "findEligibleIdentity").mockResolvedValue({ ok: false, reason: "no_match" });

    await attempt();
    expect(record).toHaveBeenCalledWith(NORMALIZED, "no_match", expect.any(String));
  });

  it("records the per-email cap, which the borrower is never told they hit", async () => {
    eligible();
    vi.spyOn(identity, "issueCode").mockResolvedValue({ ok: false, reason: "rate_limited" });
    const send = vi.spyOn(mail, "sendPortalLoginCode");

    await attempt();
    expect(record).toHaveBeenCalledWith(NORMALIZED, "rate_limited", expect.stringContaining("codes already sent"));
    expect(send).not.toHaveBeenCalled();
  });

  it("records SMTP not being configured", async () => {
    eligible();
    vi.spyOn(identity, "issueCode").mockResolvedValue({ ok: true, code: "123456" });
    vi.spyOn(mail, "sendPortalLoginCode").mockResolvedValue({ status: "skipped", error: "SMTP_HOST/USER/PASS not set" });

    await attempt();
    expect(record).toHaveBeenCalledWith(NORMALIZED, "email_not_configured", "SMTP_HOST/USER/PASS not set");
  });

  it("records the mail server refusing the message, with its reason", async () => {
    eligible();
    vi.spyOn(identity, "issueCode").mockResolvedValue({ ok: true, code: "123456" });
    vi.spyOn(mail, "sendPortalLoginCode").mockResolvedValue({ status: "failed", error: "535 Authentication failed" });

    await attempt();
    expect(record).toHaveBeenCalledWith(NORMALIZED, "email_failed", "535 Authentication failed");
  });

  it("records a database failure with the error, e.g. portal tables never created", async () => {
    vi.spyOn(identity, "findEligibleIdentity").mockResolvedValue({
      ok: true,
      name: { firstName: "Dana", lastName: "Lee" },
    });
    vi.spyOn(identity, "ensureBorrower").mockResolvedValue({
      ok: false,
      error: 'relation "borrowers" does not exist',
    });

    await attempt();
    expect(record).toHaveBeenCalledWith(
      NORMALIZED,
      "error",
      expect.stringContaining('relation "borrowers" does not exist')
    );
  });

  it("answers every outcome with a byte-identical body, so the log reveals nothing publicly", async () => {
    const bodies: string[] = [];

    vi.spyOn(identity, "findEligibleIdentity").mockResolvedValue({ ok: false, reason: "no_match" });
    bodies.push((await attempt()).body);
    vi.restoreAllMocks();
    record = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(await import("@/lib/portal/login-events"), "recordLoginEvent").mockImplementation(record);

    eligible();
    const issue = vi.spyOn(identity, "issueCode");
    const send = vi.spyOn(mail, "sendPortalLoginCode");

    issue.mockResolvedValue({ ok: false, reason: "rate_limited" });
    bodies.push((await attempt()).body);

    issue.mockResolvedValue({ ok: true, code: "123456" });
    send.mockResolvedValue({ status: "skipped", error: "x" });
    bodies.push((await attempt()).body);

    send.mockResolvedValue({ status: "failed", error: "y" });
    bodies.push((await attempt()).body);

    send.mockResolvedValue({ status: "sent" });
    bodies.push((await attempt()).body);

    expect(bodies).toHaveLength(5);
    expect(new Set(bodies).size).toBe(1);
  });

  it("tells the borrower the cap and to check spam, in that one shared answer", async () => {
    vi.spyOn(identity, "findEligibleIdentity").mockResolvedValue({ ok: false, reason: "no_match" });
    const body = JSON.parse((await attempt()).body);

    expect(body.message).toContain(`${identity.CODES_PER_WINDOW} codes every ${identity.CODE_WINDOW_MS / 60_000} minutes`);
    expect(body.message).toMatch(/spam/i);
    expect(body.message).toMatch(/replaces the one before it/);
    expect(body.codesPerWindow).toBe(identity.CODES_PER_WINDOW);
    expect(body.windowMinutes).toBe(identity.CODE_WINDOW_MS / 60_000);
  });
});

