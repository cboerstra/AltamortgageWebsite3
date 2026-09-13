import { NextRequest, NextResponse } from "next/server";
import { leadSchema } from "@/lib/schemas";
import { forwardToCRM, splitName, LOAN_TYPE_LABELS } from "@/lib/crm";
import { sendLeadNotification } from "@/lib/email";

const LABELS: Record<string, string> = {
  "under-200k": "Under $200,000",
  "200k-400k": "$200,000 - $400,000",
  "400k-600k": "$400,000 - $600,000",
  "600k-800k": "$600,000 - $800,000",
  "over-800k": "Over $800,000",
  asap: "As soon as possible",
  "1-3months": "1-3 months",
  "3-6months": "3-6 months",
  "6-12months": "6-12 months",
  justLooking: "Just looking",
  "single-family": "Single family",
  condo: "Condo",
  townhome: "Townhome",
  "multi-family": "Multi-family",
  manufactured: "Manufactured",
  yes: "Yes",
  no: "No",
};

const label = (v: unknown) => (typeof v === "string" ? LABELS[v] ?? v : "");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = leadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const lead = result.data;
    const { firstName, lastName } = splitName(lead.name);
    const loanType = LOAN_TYPE_LABELS[lead.loanPurpose] || lead.loanPurpose;

    const rows: Array<[string, string]> = [
      ["Name", lead.name],
      ["Email", lead.email],
      ["Phone", lead.phone],
      ["Loan purpose", loanType],
      ["Estimated amount", label(lead.estimatedAmount)],
      ["Timeline", label(body.timeline)],
      ["Property type", label(body.propertyType)],
      ["Property ZIP", label(body.propertyZip)],
      ["First-time buyer", label(body.firstTimeBuyer)],
      ["Preferred contact", lead.preferredContact ?? ""],
      ["Best time to call", lead.bestTimeToCall ?? ""],
      ["Page", lead.source ?? ""],
    ];

    // Everything after the first four rows is context for the CRM activity note.
    const message = rows
      .slice(4)
      .filter(([, v]) => v !== "")
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const [crmResult, emailResult] = await Promise.all([
      forwardToCRM({
        firstName,
        lastName,
        email: lead.email,
        phone: lead.phone,
        source: "contact_form",
        message: message || undefined,
        smsConsent: false,
        loanType,
      }),
      sendLeadNotification({ name: lead.name, loanType, rows }),
    ]);

    const delivered = crmResult.status === "sent" || emailResult.status === "sent";
    if (!delivered) {
      console.error("/api/leads: lead reached nobody", { crm: crmResult, email: emailResult });
      return NextResponse.json(
        { error: "We couldn't record your request. Please call us." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      forwarded: crmResult.status === "sent",
      crmStatus: crmResult.status,
      emailStatus: emailResult.status,
    });
  } catch (err) {
    console.error("/api/leads error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
