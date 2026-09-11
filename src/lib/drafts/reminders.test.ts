import { describe, expect, it } from "vitest";
import {
  MAX_REMINDERS,
  REMINDER_DELAYS_MS,
  reminderDue,
  reminderMessage,
  type ReminderCandidate,
} from "./reminders";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const t0 = new Date("2026-09-11T12:00:00Z");
const at = (offsetMs: number) => new Date(t0.getTime() + offsetMs);

function draft(overrides: Partial<ReminderCandidate> = {}): ReminderCandidate {
  return {
    remindersSent: 0,
    updatedAt: t0,
    optedOut: false,
    submittedRef: null,
    ...overrides,
  };
}

describe("reminderDue", () => {
  it("is quiet before the first delay", () => {
    expect(reminderDue(draft(), at(59 * 60 * 1000))).toBeNull();
  });

  it("selects stage 0 exactly at one hour", () => {
    expect(reminderDue(draft(), at(HOUR))).toBe(0);
  });

  it("tolerates lateness — a stale draft is still stage 0 if nothing was sent", () => {
    expect(reminderDue(draft(), at(10 * DAY))).toBe(0);
  });

  it("selects stage 1 at 24 hours once stage 0 is sent", () => {
    expect(reminderDue(draft({ remindersSent: 1 }), at(DAY - 1))).toBeNull();
    expect(reminderDue(draft({ remindersSent: 1 }), at(DAY))).toBe(1);
  });

  it("selects stage 2 at 7 days once stage 1 is sent", () => {
    expect(reminderDue(draft({ remindersSent: 2 }), at(7 * DAY - 1))).toBeNull();
    expect(reminderDue(draft({ remindersSent: 2 }), at(7 * DAY))).toBe(2);
  });

  it("never sends a fourth", () => {
    expect(reminderDue(draft({ remindersSent: MAX_REMINDERS }), at(365 * DAY))).toBeNull();
  });

  it("is silent after opt-out", () => {
    expect(reminderDue(draft({ optedOut: true }), at(30 * DAY))).toBeNull();
  });

  it("is silent after submission", () => {
    expect(reminderDue(draft({ submittedRef: "ALT-ABCDE" }), at(30 * DAY))).toBeNull();
  });

  it("measures from the applicant's last edit, not from the previous reminder", () => {
    // Stage 0 sent, but updated_at unchanged (the job preserves it). Stage 1
    // is due 24h after the edit, not 24h after stage 0.
    expect(reminderDue(draft({ remindersSent: 1, updatedAt: t0 }), at(DAY))).toBe(1);
  });

  it("has exactly one delay per stage", () => {
    expect(REMINDER_DELAYS_MS).toHaveLength(MAX_REMINDERS);
    expect(REMINDER_DELAYS_MS).toEqual([HOUR, DAY, 7 * DAY]);
  });
});

describe("reminderMessage", () => {
  const ctx = {
    firstName: "Dana",
    resumeUrl: "https://example.test/apply?resume=abc",
    optOutUrl: "https://example.test/api/drafts/opt-out?token=abc",
    furthestStep: 3,
    totalSteps: 6,
  };

  it("carries the resume and opt-out links in both text and HTML", () => {
    for (const stage of [0, 1, 2]) {
      const msg = reminderMessage(stage, ctx);
      expect(msg.text).toContain(ctx.resumeUrl);
      expect(msg.text).toContain(ctx.optOutUrl);
      expect(msg.html).toContain(ctx.resumeUrl);
      expect(msg.html).toContain(ctx.optOutUrl);
    }
  });

  it("uses distinct subjects per stage and marks the last as final", () => {
    const subjects = [0, 1, 2].map((s) => reminderMessage(s, ctx).subject);
    expect(new Set(subjects).size).toBe(3);
    expect(subjects[2].toLowerCase()).toContain("last");
  });

  it("counts remaining steps from the furthest reached", () => {
    expect(reminderMessage(0, ctx).text).toContain("2 short steps");
    expect(reminderMessage(0, { ...ctx, furthestStep: 4 }).text).toContain("one short step");
  });

  it("escapes applicant-controlled values in HTML", () => {
    const msg = reminderMessage(0, { ...ctx, firstName: `<img src=x onerror="1">` });
    expect(msg.html).not.toContain("<img");
    expect(msg.html).toContain("&lt;img");
  });

  it("falls back to a neutral greeting when the name is blank", () => {
    expect(reminderMessage(0, { ...ctx, firstName: "  " }).text).toContain("Hi there,");
  });

  it("marks links noreferrer so the token does not leak via Referer", () => {
    expect(reminderMessage(0, ctx).html).toMatch(/href="[^"]*resume=abc"[^>]*rel="noreferrer"/);
  });
});
