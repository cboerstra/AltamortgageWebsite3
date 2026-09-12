import nodemailer from "nodemailer";
import type { SummarySection } from "@/lib/application-summary";
import { checklistToText, type ChecklistGroup } from "@/lib/document-checklist";
import { COMPANY } from "@/lib/constants";
import type { ReminderMessage } from "@/lib/drafts/reminders";
// Applicant-supplied values end up inside HTML, so nothing goes in unescaped.
import { escapeHtml } from "@/lib/html";

let transporter: nodemailer.Transporter | null = null;

export interface EmailResult {
  status: "sent" | "failed" | "skipped";
  error?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("SMTP not configured — skipping email");
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

const CELL = "padding:8px;border:1px solid #ddd";

function renderSections(sections: SummarySection[]): string {
  return sections
    .map((section) => {
      const rows = section.rows
        .map(
          (row) =>
            `<tr><td style="${CELL};font-weight:bold;width:40%">${escapeHtml(row.label)}</td>` +
            `<td style="${CELL}">${escapeHtml(row.value)}</td></tr>`
        )
        .join("");
      return (
        `<h3 style="margin:24px 0 8px">${escapeHtml(section.title)}</h3>` +
        `<table style="border-collapse:collapse;width:100%">${rows}</table>`
      );
    })
    .join("");
}

export async function sendLeadNotification(
  lead: Record<string, unknown>
): Promise<EmailResult> {
  const t = getTransporter();
  const to = process.env.NOTIFICATION_EMAIL;
  if (!t || !to) {
    return { status: "skipped", error: "SMTP_HOST/USER/PASS or NOTIFICATION_EMAIL not set" };
  }

  try {
    await t.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: `New Lead — ${lead.name} — ${lead.loanPurpose}`,
      html: `
        <h2>New Lead Received</h2>
        <table style="border-collapse:collapse;width:100%">
          ${Object.entries(lead)
            .filter(([, v]) => v !== undefined && v !== null && v !== "")
            .map(
              ([k, v]) =>
                `<tr><td style="${CELL};font-weight:bold">${escapeHtml(k)}</td><td style="${CELL}">${escapeHtml(
                  typeof v === "object" ? JSON.stringify(v) : String(v)
                )}</td></tr>`
            )
            .join("")}
        </table>
      `,
    });
    return { status: "sent" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Email send error:", err);
    return { status: "failed", error: msg };
  }
}

/**
 * Notify the loan officer of a new application, with the MISMO document
 * attached.
 *
 * Takes a curated section list rather than the raw payload: the SSN and any
 * future sensitive field cannot reach this function to begin with.
 */
export async function sendApplicationNotification(input: {
  sections: SummarySection[];
  referenceNumber: string;
  applicantName: string;
  attachments?: EmailAttachment[];
}): Promise<EmailResult> {
  const t = getTransporter();
  const to = process.env.NOTIFICATION_EMAIL;
  if (!t || !to) {
    return { status: "skipped", error: "SMTP_HOST/USER/PASS or NOTIFICATION_EMAIL not set" };
  }

  try {
    await t.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: `New Application — ${input.applicantName} — ${input.referenceNumber}`,
      html: `
        <h2>New Mortgage Application — ${escapeHtml(input.referenceNumber)}</h2>
        ${renderSections(input.sections)}
        <p style="margin-top:24px"><em>The full SSN is never stored or emailed. Only the
        last four digits appear above.</em></p>
      `,
      attachments: input.attachments,
    });
    return { status: "sent" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Email send error:", err);
    return { status: "failed", error: msg };
  }
}

/**
 * Confirm receipt to the applicant and tell them which documents to send.
 *
 * Goes to the applicant, not the loan officer. Tells them what documents we
 * need and sends them to the portal to upload them: encrypted at rest, never
 * sitting in an inbox. Replying with attachments still works as a fallback
 * (`replyTo` is the company inbox), but the email no longer suggests it.
 *
 * Failure is never fatal to a submission. The application is already stored by
 * the time this runs, and the caller records the result rather than acting on
 * it.
 */
export async function sendApplicantDocumentRequest(input: {
  to: string;
  firstName: string;
  referenceNumber: string;
  checklist: ChecklistGroup[];
  /** Absolute URL of the borrower portal sign-in page. */
  portalUrl: string;
}): Promise<EmailResult> {
  const t = getTransporter();
  if (!t) {
    return { status: "skipped", error: "SMTP_HOST/USER/PASS not set" };
  }

  const ref = escapeHtml(input.referenceNumber);
  const name = escapeHtml(input.firstName);
  const sendTo = COMPANY.email;

  const groupsHtml = input.checklist
    .map(
      (group) =>
        `<h3 style="margin:20px 0 6px;font-size:16px">${escapeHtml(group.title)}</h3>` +
        `<ul style="margin:0;padding-left:20px">` +
        group.items.map((item) => `<li style="margin:4px 0">${escapeHtml(item)}</li>`).join("") +
        `</ul>`
    )
    .join("");

  try {
    await t.sendMail({
      from: process.env.SMTP_USER,
      to: input.to,
      replyTo: sendTo,
      subject: `Documents needed for your application — Ref ${input.referenceNumber}`,
      text:
        `Hi ${input.firstName},\n\n` +
        `We received your mortgage application. Your reference number is ${input.referenceNumber} — ` +
        `please keep it, and include it whenever you contact us.\n\n` +
        `A loan specialist will call you within one business day. To keep things moving, ` +
        `send us the documents below.\n\n` +
        `HOW TO SEND THEM\n` +
        `  Upload them securely at ${input.portalUrl}\n` +
        `  Sign in with this email address; we will send you a one-time code. No password needed.\n` +
        `  PDF, JPG or PNG. Clear phone photos are fine as long as the whole page is visible.\n` +
        `  Upload what you have now; you can come back for the rest.\n\n` +
        `${checklistToText(input.checklist)}\n\n` +
        `A NOTE ON SECURITY\n` +
        `  Please do not put your full Social Security number in an email — we already have ` +
        `what we need. If a document shows it, that is fine; just don't type it into the message.\n\n` +
        `Questions? Call us at ${COMPANY.phone}.\n\n` +
        `${COMPANY.name} — NMLS #${COMPANY.nmlsId}\n`,
      html: `
        <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:600px;color:#1f2937;line-height:1.5">
          <h2 style="color:#003087;margin-bottom:4px">We received your application</h2>
          <p style="margin-top:0">Hi ${name}, thanks for applying with ${escapeHtml(COMPANY.name)}.</p>

          <p style="background:#f0f4f8;border-left:4px solid #003087;padding:12px 16px;margin:20px 0">
            Your reference number is <strong style="font-family:monospace;font-size:16px">${ref}</strong><br />
            <span style="font-size:14px;color:#4b5563">Please keep it and include it whenever you contact us.</span>
          </p>

          <p>A loan specialist will call you within one business day. To keep things moving,
          send us the documents below.</p>

          <p style="margin:24px 0 8px">
            <a href="${escapeHtml(input.portalUrl)}" style="display:inline-block;background:#003087;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:6px">Upload your documents securely</a>
          </p>
          <ul style="margin:0;padding-left:20px;font-size:14px;color:#4b5563">
            <li style="margin:4px 0">Sign in with this email address — we send you a one-time code. No password needed.</li>
            <li style="margin:4px 0">PDF, JPG or PNG. Clear phone photos are fine, as long as the whole page is visible.</li>
            <li style="margin:4px 0">Upload what you have now; you can come back for the rest.</li>
            <li style="margin:4px 0">Your files are encrypted when stored and visible only to you and your loan specialist.</li>
          </ul>

          <h2 style="color:#003087;margin:28px 0 0;font-size:18px">What we need</h2>
          ${groupsHtml}

          <p style="background:#fdf9f1;border-left:4px solid #C89B3C;padding:12px 16px;margin:24px 0;font-size:14px">
            <strong>A note on security.</strong> Please don't type your full Social Security number
            into an email — we already have what we need. If a document shows it, that's fine.
          </p>

          <p style="font-size:14px;color:#4b5563;margin-top:28px">
            Questions? Call us at <a href="tel:${escapeHtml(COMPANY.phone)}">${escapeHtml(COMPANY.phone)}</a>.<br />
            ${escapeHtml(COMPANY.name)} — NMLS #${escapeHtml(COMPANY.nmlsId)}
          </p>
        </div>
      `,
    });
    return { status: "sent" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Applicant document request send error:", err);
    return { status: "failed", error: msg };
  }
}

/**
 * Send one abandonment reminder. The copy is decided by drafts/reminders.ts;
 * this only puts it on the wire. Never called unless the draft has been
 * claimed for this stage first, so a send failure cannot cause a duplicate.
 */
export async function sendDraftReminder(input: {
  to: string;
  message: ReminderMessage;
}): Promise<EmailResult> {
  const t = getTransporter();
  if (!t) {
    return { status: "skipped", error: "SMTP_HOST/USER/PASS not set" };
  }

  try {
    await t.sendMail({
      from: process.env.SMTP_USER,
      to: input.to,
      replyTo: COMPANY.email,
      subject: input.message.subject,
      text: input.message.text,
      html: input.message.html,
    });
    return { status: "sent" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Draft reminder send error:", err);
    return { status: "failed", error: msg };
  }
}

/**
 * The portal sign-in code. Short-lived, single use, six digits. The email
 * says so, and says what to do if they did not ask for it.
 */
export async function sendPortalLoginCode(input: {
  to: string;
  firstName: string | null;
  code: string;
  portalUrl: string;
}): Promise<EmailResult> {
  const t = getTransporter();
  if (!t) {
    return { status: "skipped", error: "SMTP_HOST/USER/PASS not set" };
  }

  const greeting = input.firstName ? `Hi ${input.firstName},` : "Hello,";
  const code = escapeHtml(input.code);

  try {
    await t.sendMail({
      from: process.env.SMTP_USER,
      to: input.to,
      replyTo: COMPANY.email,
      subject: `${input.code} is your ${COMPANY.name} sign-in code`,
      text:
        `${greeting}\n\n` +
        `Your sign-in code is: ${input.code}\n\n` +
        `Enter it at ${input.portalUrl} to open your application. ` +
        `It expires in 10 minutes and works once.\n\n` +
        `If you did not request this, you can ignore this email. Nobody can ` +
        `sign in without the code.\n\n` +
        `${COMPANY.name} — NMLS #${COMPANY.nmlsId}\n`,
      html: `
        <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;color:#1f2937;line-height:1.5">
          <h2 style="color:#003087;margin-bottom:4px">Your sign-in code</h2>
          <p style="margin-top:0">${escapeHtml(greeting)}</p>
          <p style="font-family:monospace;font-size:32px;letter-spacing:8px;background:#f0f4f8;border-left:4px solid #003087;padding:16px 20px;margin:20px 0">${code}</p>
          <p>Enter it at <a href="${escapeHtml(input.portalUrl)}">${escapeHtml(input.portalUrl)}</a> to open your application.
          It expires in 10 minutes and works once.</p>
          <p style="font-size:14px;color:#4b5563">If you did not request this, you can ignore this email. Nobody can sign in without the code.</p>
          <p style="font-size:14px;color:#4b5563;margin-top:28px">${escapeHtml(COMPANY.name)} — NMLS #${escapeHtml(COMPANY.nmlsId)}</p>
        </div>
      `,
    });
    return { status: "sent" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Portal login code send error:", err);
    return { status: "failed", error: msg };
  }
}
