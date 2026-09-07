import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

export interface EmailResult {
  status: "sent" | "failed" | "skipped";
  error?: string;
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
                `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">${k}</td><td style="padding:8px;border:1px solid #ddd">${typeof v === "object" ? JSON.stringify(v) : v}</td></tr>`
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

export async function sendApplicationNotification(
  application: Record<string, unknown>,
  referenceNumber: string
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
      subject: `New Application — ${application.firstName} ${application.lastName} — ${referenceNumber}`,
      html: `
        <h2>New Mortgage Application — ${referenceNumber}</h2>
        <table style="border-collapse:collapse;width:100%">
          ${Object.entries(application)
            .filter(([k, v]) => v !== undefined && v !== null && v !== "" && k !== "ssn")
            .map(
              ([k, v]) =>
                `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">${k}</td><td style="padding:8px;border:1px solid #ddd">${typeof v === "object" ? JSON.stringify(v) : v}</td></tr>`
            )
            .join("")}
        </table>
        <p><em>SSN is redacted from email notifications for security.</em></p>
      `,
    });
    return { status: "sent" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Email send error:", err);
    return { status: "failed", error: msg };
  }
}
