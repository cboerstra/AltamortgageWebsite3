import nodemailer from "nodemailer";
import type { SummarySection } from "@/lib/application-summary";

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

/**
 * Applicant-supplied values end up inside an HTML table, so they must be
 * escaped. Without this, a name containing markup breaks the layout of the
 * notification — or worse in a mail client that renders it.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
