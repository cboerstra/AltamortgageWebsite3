// Forwards website leads + applications to the Alta Mortgage CRM.
//
// The CRM (altamortgagecrm.net) exposes POST /api/website-lead, which creates
// the lead, logs an activity note, notifies the owner, and texts the admins.
// It does NOT send the applicant a confirmation email — nothing in this system
// does. Do not tell an applicant to expect one.
//
// This forward is BEST EFFORT and is skipped entirely when unconfigured, so it
// is not a system of record. /api/applications persists to disk and MySQL
// before calling here, and decides success on that basis.
//
// Required env vars (set in the cPanel Node.js app environment):
//   CRM_API_URL  = https://altamortgagecrm.net/api/website-lead
//   CRM_API_KEY  = (must match WEBSITE_API_KEY on the CRM server)

export interface WebsiteLead {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  /** e.g. "contact_form", "apply_form", "quote_form" */
  source?: string;
  /** Freeform note shown in the CRM activity log */
  message?: string;
  smsConsent?: boolean;
  /** e.g. "Purchase", "Refinance", "Home Equity" */
  loanType?: string;
}

export interface CRMResult {
  status: "sent" | "failed" | "skipped";
  response?: string;
  leadId?: number;
}

/**
 * Split a single "full name" string into first + last name.
 * The CRM requires a non-empty lastName, so we fall back to "—".
 */
export function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Unknown", lastName: "—" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "—" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export async function forwardToCRM(lead: WebsiteLead): Promise<CRMResult> {
  const url = process.env.CRM_API_URL;
  const key = process.env.CRM_API_KEY;

  if (!url || !key) {
    console.warn("CRM not configured — skipping forward (set CRM_API_URL and CRM_API_KEY)");
    return { status: "skipped", response: "CRM_API_URL or CRM_API_KEY not set" };
  }

  const payload = {
    apiKey: key,
    firstName: lead.firstName,
    lastName: lead.lastName || "—",
    email: lead.email,
    phone: lead.phone,
    source: lead.source ?? "website_form",
    message: lead.message,
    smsConsent: Boolean(lead.smsConsent),
    loanType: lead.loanType,
  };

  const maxRetries = 3;
  let lastError = "Unknown error";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { leadId?: number };
        return { status: "sent", response: `HTTP ${res.status}`, leadId: data.leadId };
      }
      lastError = `HTTP ${res.status}`;
      console.error(`CRM attempt ${attempt} failed: ${res.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`CRM attempt ${attempt} error:`, err);
    }
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }

  return { status: "failed", response: lastError };
}

/** Human-readable loan type labels for the CRM campaign tag. */
export const LOAN_TYPE_LABELS: Record<string, string> = {
  purchase: "Purchase",
  refinance: "Refinance",
  "home-equity": "Home Equity",
  "cash-out": "Cash-Out Refinance",
};
