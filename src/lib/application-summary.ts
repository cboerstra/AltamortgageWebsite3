// One curated view of a submitted application, used by BOTH the CRM activity
// note and the loan officer email.
//
// Built as an explicit list rather than by iterating the payload. The previous
// email did `Object.entries(application)`, which meant any field added to the
// schema would auto-leak into email — including, eventually, one that should
// not be there. Adding a field here is a deliberate act.

import type { ApplicationFormData } from "@/lib/schemas";
import {
  CITIZENSHIP_LABEL,
  CREDIT_SCORE_RANGE_LABEL,
  EMPLOYMENT_STATUS_LABEL,
  HOUSING_STATUS_LABEL,
  LOAN_PURPOSE_LABEL,
  MARITAL_STATUS_LABEL,
  PROPERTY_PROFILE,
  PROPERTY_USE_LABEL,
} from "@/lib/mismo/enums";
import { ssnLast4 } from "@/lib/mismo/map";

export interface SummaryRow {
  label: string;
  value: string;
}

export interface SummarySection {
  title: string;
  rows: SummaryRow[];
}

export function money(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `$${value.toLocaleString("en-US")}`;
}

function yesNo(value: boolean | undefined): string {
  return value ? "Yes" : "No";
}

function text(value: string | undefined): string {
  const trimmed = value?.trim();
  return trimmed && trimmed !== "" ? trimmed : "—";
}

function years(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value === 1 ? "1 year" : `${value} years`;
}

function fullName(app: ApplicationFormData): string {
  return [app.firstName, app.middleName, app.lastName, app.suffix]
    .filter((part) => part && part.trim() !== "")
    .join(" ");
}

export interface SummaryContext {
  referenceNumber: string;
  submittedAt: string;
  sourcePage?: string;
  /** Filename of the generated MISMO document, when one was written. */
  mismoFilename?: string;
}

export function buildApplicationSummary(
  app: ApplicationFormData,
  context: SummaryContext
): SummarySection[] {
  const debts: SummaryRow[] = [
    { label: "Auto loans", value: money(app.monthlyAutoLoan) },
    { label: "Student loans", value: money(app.monthlyStudentLoan) },
    { label: "Credit cards", value: money(app.monthlyCreditCards) },
    { label: "Child support", value: money(app.monthlyChildSupport) },
    { label: "Other monthly debt", value: money(app.monthlyOtherDebt) },
    { label: "Credit score range", value: CREDIT_SCORE_RANGE_LABEL[app.creditScoreRange] },
  ];

  return [
    {
      title: "Submission",
      rows: [
        { label: "Reference number", value: context.referenceNumber },
        { label: "Submitted", value: context.submittedAt },
        { label: "Source page", value: text(context.sourcePage) },
        { label: "MISMO document", value: text(context.mismoFilename) },
      ],
    },
    {
      title: "Loan",
      rows: [
        { label: "Loan purpose", value: LOAN_PURPOSE_LABEL[app.loanPurpose] },
        { label: "Property type", value: PROPERTY_PROFILE[app.propertyType].description },
        { label: "Property use", value: PROPERTY_USE_LABEL[app.propertyUse] },
        { label: "Purchase price / value", value: money(app.purchasePrice) },
        { label: "Loan amount", value: money(app.loanAmount) },
        { label: "Down payment", value: money(app.downPayment) },
        { label: "Current balance", value: money(app.currentBalance) },
      ],
    },
    {
      title: "Borrower",
      rows: [
        { label: "Name", value: fullName(app) },
        { label: "Date of birth", value: text(app.dateOfBirth) },
        { label: "SSN (last 4)", value: text(ssnLast4(app.ssn)) },
        { label: "Marital status", value: MARITAL_STATUS_LABEL[app.maritalStatus] },
        { label: "Phone", value: text(app.phone) },
        { label: "Email", value: text(app.email) },
      ],
    },
    {
      title: "Residence",
      rows: [
        {
          label: "Address",
          value: `${app.currentAddress.street}, ${app.currentAddress.city}, ${app.currentAddress.state} ${app.currentAddress.zip}`,
        },
        { label: "Years at address", value: years(app.yearsAtAddress) },
        { label: "Housing status", value: HOUSING_STATUS_LABEL[app.housingStatus] },
        { label: "Monthly housing payment", value: money(app.monthlyHousingPayment) },
      ],
    },
    {
      title: "Employment & income",
      rows: [
        { label: "Employment status", value: EMPLOYMENT_STATUS_LABEL[app.employmentStatus] },
        { label: "Employer", value: text(app.employerName) },
        { label: "Job title", value: text(app.jobTitle) },
        { label: "Years at job", value: years(app.yearsAtJob) },
        { label: "Monthly income", value: money(app.monthlyIncome) },
      ],
    },
    { title: "Monthly debts", rows: debts },
    {
      title: "Declarations",
      rows: [
        { label: "Citizenship", value: CITIZENSHIP_LABEL[app.usCitizen] },
        { label: "Bankruptcy (past 7 years)", value: yesNo(app.bankruptcy) },
        { label: "Foreclosure (past 7 years)", value: yesNo(app.foreclosure) },
        { label: "Outstanding judgments", value: yesNo(app.outstandingJudgments) },
        { label: "Down payment borrowed", value: yesNo(app.downPaymentBorrowed) },
        { label: "Will occupy as primary residence", value: yesNo(app.primaryResidence) },
        { label: "Veteran", value: yesNo(app.veteran) },
        { label: "First-time buyer", value: yesNo(app.firstTimeBuyer) },
      ],
    },
    {
      title: "Consent & signature",
      rows: [
        { label: "Authorization given", value: yesNo(app.consentAuthorization) },
        { label: "Electronic signature", value: text(app.eSignatureName) },
        { label: "Signature date", value: text(app.eSignatureDate) },
      ],
    },
  ];
}

/** Flatten the summary into the plain text the CRM activity log stores. */
export function summaryToText(sections: SummarySection[], heading: string): string {
  const lines: string[] = [heading, ""];
  for (const section of sections) {
    lines.push(`${section.title.toUpperCase()}`);
    for (const row of section.rows) {
      lines.push(`  ${row.label}: ${row.value}`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}
