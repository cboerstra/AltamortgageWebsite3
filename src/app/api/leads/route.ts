import { NextRequest, NextResponse } from "next/server";
import { leadSchema } from "@/lib/schemas";
import { forwardToCRM, splitName, LOAN_TYPE_LABELS } from "@/lib/crm";

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

    // Build a readable note from the extra form fields for the CRM activity log.
    const messageParts: string[] = [];
    if (lead.estimatedAmount) messageParts.push(`Estimated amount: ${lead.estimatedAmount}`);
    if (typeof body.timeline === "string") messageParts.push(`Timeline: ${body.timeline}`);
    if (typeof body.propertyType === "string") messageParts.push(`Property type: ${body.propertyType}`);
    if (typeof body.propertyZip === "string") messageParts.push(`Property ZIP: ${body.propertyZip}`);
    if (typeof body.firstTimeBuyer === "string") messageParts.push(`First-time buyer: ${body.firstTimeBuyer}`);
    if (lead.preferredContact) messageParts.push(`Preferred contact: ${lead.preferredContact}`);
    if (lead.bestTimeToCall) messageParts.push(`Best time to call: ${lead.bestTimeToCall}`);
    if (lead.source) messageParts.push(`Page: ${lead.source}`);

    const crmResult = await forwardToCRM({
      firstName,
      lastName,
      email: lead.email,
      phone: lead.phone,
      source: "contact_form",
      message: messageParts.join("\n") || undefined,
      smsConsent: false,
      loanType: LOAN_TYPE_LABELS[lead.loanPurpose] || lead.loanPurpose,
    });

    return NextResponse.json({
      success: true,
      message: "Lead received successfully",
      forwarded: crmResult.status === "sent",
      crmStatus: crmResult.status,
      crmDetail: crmResult.response,
    });
  } catch (err) {
    console.error("/api/leads error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
