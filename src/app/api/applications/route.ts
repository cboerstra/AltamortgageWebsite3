import { NextRequest, NextResponse } from "next/server";
import { applicationSchema } from "@/lib/schemas";
import { forwardToCRM, LOAN_TYPE_LABELS } from "@/lib/crm";
import { generateRefNumber } from "@/lib/utils";

function money(n: number | undefined): string {
  if (typeof n !== "number") return "—";
  return `$${n.toLocaleString("en-US")}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = applicationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const app = result.data;
    const referenceNumber = generateRefNumber();

    // Summarize the application for the CRM activity log.
    // NOTE: SSN is intentionally NEVER sent to the CRM endpoint.
    const messageLines: string[] = [
      `FULL MORTGAGE APPLICATION — Ref ${referenceNumber}`,
      ``,
      `Loan purpose: ${app.loanPurpose}`,
      `Property type: ${app.propertyType}`,
      `Property use: ${app.propertyUse}`,
      `Purchase price: ${money(app.purchasePrice)}`,
      `Loan amount: ${money(app.loanAmount)}`,
    ];
    if (typeof app.downPayment === "number") messageLines.push(`Down payment: ${money(app.downPayment)}`);
    if (typeof app.currentBalance === "number") messageLines.push(`Current balance: ${money(app.currentBalance)}`);
    if (app.currentAddress) {
      messageLines.push(
        `Address: ${app.currentAddress.street}, ${app.currentAddress.city}, ${app.currentAddress.state} ${app.currentAddress.zip}`
      );
    }
    messageLines.push(`Employment: ${app.employmentStatus}`);
    if (app.employerName) messageLines.push(`Employer: ${app.employerName}`);
    messageLines.push(`Monthly income: ${money(app.monthlyIncome)}`);
    messageLines.push(`Credit range: ${app.creditScoreRange}`);
    if (app.veteran) messageLines.push(`Veteran: yes`);
    if (app.firstTimeBuyer) messageLines.push(`First-time buyer: yes`);

    const crmResult = await forwardToCRM({
      firstName: app.firstName,
      lastName: app.lastName,
      email: app.email,
      phone: app.phone,
      source: "apply_form",
      message: messageLines.join("\n"),
      smsConsent: false,
      loanType: LOAN_TYPE_LABELS[app.loanPurpose] || app.loanPurpose,
    });

    return NextResponse.json({
      success: true,
      referenceNumber,
      forwarded: crmResult.status === "sent",
    });
  } catch (err) {
    console.error("/api/applications error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
