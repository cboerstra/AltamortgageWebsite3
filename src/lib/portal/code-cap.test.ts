// The login form's own count of codes requested, which is what stops a
// borrower clicking "Send a new code" past the server's silent cap.

import { describe, expect, it } from "vitest";
import { codeCapState, DEFAULT_CODE_LIMITS } from "./code-cap";
import { CODE_WINDOW_MS, CODES_PER_WINDOW } from "./identity";

const LIMITS = { codesPerWindow: 3, windowMinutes: 15 };
const MIN = 60_000;

describe("codeCapState", () => {
  it("is not capped before any request", () => {
    expect(codeCapState([], 0, LIMITS)).toEqual({ recent: 0, capped: false, nextAllowedAt: null });
  });

  it("allows requests up to the cap", () => {
    const state = codeCapState([0, 1 * MIN], 2 * MIN, LIMITS);
    expect(state.capped).toBe(false);
    expect(state.recent).toBe(2);
  });

  it("is capped at exactly the limit — the request that would send nothing", () => {
    const state = codeCapState([0, 1 * MIN, 2 * MIN], 3 * MIN, LIMITS);
    expect(state.capped).toBe(true);
    // The oldest request in the window expires first.
    expect(state.nextAllowedAt).toBe(15 * MIN);
  });

  it("frees a slot once the oldest request leaves the window", () => {
    expect(codeCapState([0, 1 * MIN, 2 * MIN], 15 * MIN, LIMITS).capped).toBe(false);
  });

  it("ignores requests older than the window", () => {
    const state = codeCapState([0, 1 * MIN, 20 * MIN, 21 * MIN], 22 * MIN, LIMITS);
    expect(state.recent).toBe(2);
    expect(state.capped).toBe(false);
  });

  it("reports the next opening from the oldest request still in the window", () => {
    const state = codeCapState([0, 16 * MIN, 17 * MIN, 18 * MIN], 19 * MIN, LIMITS);
    expect(state.capped).toBe(true);
    expect(state.nextAllowedAt).toBe(31 * MIN);
  });
});

describe("DEFAULT_CODE_LIMITS", () => {
  // The client cannot import identity.ts (it pulls in node:crypto), so it keeps
  // its own copy of the limits for the moment before the server first answers.
  // If the two drift, the form would disable resend at the wrong time.
  it("matches the limits the server enforces", () => {
    expect(DEFAULT_CODE_LIMITS.codesPerWindow).toBe(CODES_PER_WINDOW);
    expect(DEFAULT_CODE_LIMITS.windowMinutes * MIN).toBe(CODE_WINDOW_MS);
  });
});
