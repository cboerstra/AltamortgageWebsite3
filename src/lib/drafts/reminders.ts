// Which reminder an abandoned draft is due, and what it says.
//
// Pure: takes a clock, returns decisions and copy. The database and the
// mailer live elsewhere, so the schedule can be tested against fixed times
// without either.

import { COMPANY } from "@/lib/constants";
import { escapeHtml } from "@/lib/html";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * Delay after the applicant's last edit before each reminder goes out.
 * Index = how many have already been sent.
 */
export const REMINDER_DELAYS_MS: readonly number[] = [1 * HOUR, 1 * DAY, 7 * DAY];

export const MAX_REMINDERS = REMINDER_DELAYS_MS.length;

/** Abandoned drafts older than this are deleted by the reminder job. */
export const DRAFT_RETENTION_DAYS = 30;

export interface ReminderCandidate {
  remindersSent: number;
  /** Last time the applicant touched the draft. Reminders do not bump it. */
  updatedAt: Date;
  optedOut: boolean;
  submittedRef: string | null;
}

/**
 * The zero-based stage that is due now, or null if nothing is.
 *
 * Silent forever once the applicant submits, opts out, or has had every
 * reminder. Lateness is fine — a cron tick that runs at minute 17 sends the
 * one-hour reminder at minute 17, not never.
 */
export function reminderDue(draft: ReminderCandidate, now: Date): number | null {
  if (draft.optedOut || draft.submittedRef !== null) return null;
  if (draft.remindersSent >= MAX_REMINDERS) return null;

  const stage = draft.remindersSent;
  const dueAt = draft.updatedAt.getTime() + REMINDER_DELAYS_MS[stage];
  return now.getTime() >= dueAt ? stage : null;
}

export interface ReminderContext {
  firstName: string;
  resumeUrl: string;
  optOutUrl: string;
  /** Zero-based index of the furthest step reached. */
  furthestStep: number;
  totalSteps: number;
}

export interface ReminderMessage {
  subject: string;
  text: string;
  html: string;
}

interface StageCopy {
  subject: string;
  opening: string;
  closing: string;
}

function stageCopy(stage: number, ctx: ReminderContext): StageCopy {
  const stepsLeft = Math.max(ctx.totalSteps - ctx.furthestStep - 1, 1);
  const stepsLeftText = stepsLeft === 1 ? "one short step" : `${stepsLeft} short steps`;

  switch (stage) {
    case 0:
      return {
        subject: "You were nearly there — finish your mortgage application",
        opening:
          `You started a mortgage application with ${COMPANY.name} a little while ago and ` +
          `got most of the way through. Your answers are saved — you have ${stepsLeftText} left.`,
        closing: "Pick up where you left off whenever you're ready. It only takes a few minutes.",
      };
    case 1:
      return {
        subject: "Your mortgage application is saved and waiting",
        opening:
          `Just a reminder that your application with ${COMPANY.name} is saved exactly where ` +
          `you left it, with ${stepsLeftText} to go.`,
        closing:
          "If anything on the form was unclear, reply to this email or call us and we'll walk you through it.",
      };
    default:
      return {
        subject: "Last reminder — your saved application expires soon",
        opening:
          `This is the last time we'll write about it: your unfinished application with ` +
          `${COMPANY.name} is still saved, but we delete unfinished applications after ` +
          `${DRAFT_RETENTION_DAYS} days.`,
        closing:
          "If now isn't the right time, no problem — you can always start fresh later.",
      };
  }
}

export function reminderMessage(stage: number, ctx: ReminderContext): ReminderMessage {
  const copy = stageCopy(stage, ctx);
  const name = ctx.firstName.trim() || "there";

  const text =
    `Hi ${name},\n\n` +
    `${copy.opening}\n\n` +
    `Finish your application:\n${ctx.resumeUrl}\n\n` +
    `${copy.closing}\n\n` +
    `Questions? Call us at ${COMPANY.phone}.\n\n` +
    `${COMPANY.name} — NMLS #${COMPANY.nmlsId}\n\n` +
    `Don't want these reminders? Stop them here:\n${ctx.optOutUrl}\n`;

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:600px;color:#1f2937;line-height:1.5">
      <h2 style="color:#003087;margin-bottom:4px">${escapeHtml(copy.subject)}</h2>
      <p style="margin-top:0">Hi ${escapeHtml(name)},</p>
      <p>${escapeHtml(copy.opening)}</p>
      <p style="margin:24px 0">
        <a href="${escapeHtml(ctx.resumeUrl)}" rel="noreferrer"
           style="display:inline-block;background:#003087;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">
          Finish my application
        </a>
      </p>
      <p style="font-size:14px;color:#4b5563">
        Or copy this link into your browser:<br />
        <a href="${escapeHtml(ctx.resumeUrl)}" rel="noreferrer" style="word-break:break-all">${escapeHtml(ctx.resumeUrl)}</a>
      </p>
      <p>${escapeHtml(copy.closing)}</p>
      <p style="font-size:14px;color:#4b5563;margin-top:28px">
        Questions? Call us at <a href="tel:${escapeHtml(COMPANY.phone)}">${escapeHtml(COMPANY.phone)}</a>.<br />
        ${escapeHtml(COMPANY.name)} — NMLS #${escapeHtml(COMPANY.nmlsId)}
      </p>
      <p style="font-size:12px;color:#6b7280;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:12px">
        Don't want these reminders?
        <a href="${escapeHtml(ctx.optOutUrl)}" rel="noreferrer" style="color:#6b7280">Stop them here</a>.
        This link only affects reminders about this application.
      </p>
    </div>
  `;

  return { subject: copy.subject, text, html };
}
