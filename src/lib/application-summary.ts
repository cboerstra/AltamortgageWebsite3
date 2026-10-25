// One curated view of a submitted application, used by BOTH the CRM activity
// note and the loan officer email.
//
// Built as an explicit list rather than by iterating the payload. The previous
// email did `Object.entries(application)`, which meant any field added to the
// schema would auto-leak into email — including, eventually, one that should
// not be there. Adding a field here is a deliberate act.

import type { ApplicationFormData, CoBorrowerData } from "@/lib/schemas";
import { CO_BORROWER_RELATIONSHIP_LABEL } from "@/lib/mismo/map";
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

function fullName(app: Pick<ApplicationFormData, "firstName" | "middleName" | "lastName" | "suffix">): string {
  return [app.firstName, app.middleName, app.lastName, app.suffix]
    .filter((part) => part && part.trim() !== "")
    .join(" ");
}

/** Unanswered is not "No": older applications were never asked. */
function answered(value: boolean | undefined): string {
  return typeof value === "boolean" ? yesNo(value) : "—";
}

function addressText(a: { street: string; city: string; state: string; zip: string } | undefined): string {
  if (!a || a.street.trim() === "") return "—";
  return `${a.street}, ${a.city}, ${a.state} ${a.zip}`;
}

const LOAN_PROGRAM_LABEL: Record<NonNullable<ApplicationFormData["loanProgram"]>, string> = {
  conventional: "Conventional",
  fha: "FHA",
  va: "VA",
  usda: "USDA",
  "not-sure": "Not sure",
};

const ETHNICITY_LABEL = { hispanic: "Hispanic or Latino", "not-hispanic": "Not Hispanic or Latino", decline: "Declined to provide" };
const ORIGIN_LABEL = { mexican: "Mexican", "puerto-rican": "Puerto Rican", cuban: "Cuban", "other-hispanic": "Other Hispanic or Latino" };
const RACE_LABEL = {
  "american-indian": "American Indian or Alaska Native",
  asian: "Asian",
  black: "Black or African American",
  "pacific-islander": "Native Hawaiian or Other Pacific Islander",
  white: "White",
  decline: "Declined to provide",
};
const SEX_LABEL = { female: "Female", male: "Male", decline: "Declined to provide" };

function demographicRows(d: ApplicationFormData["demographics"]): SummaryRow[] {
  if (!d) return [{ label: "Demographic information", value: "—" }];
  const origins = d.ethnicity === "hispanic" ? (d.ethnicityOrigins ?? []).map((o) => ORIGIN_LABEL[o]) : [];
  return [
    { label: "Ethnicity", value: [ETHNICITY_LABEL[d.ethnicity], ...origins].join(" — ") },
    { label: "Race", value: d.races.map((r) => RACE_LABEL[r]).join(", ") },
    { label: "Sex", value: SEX_LABEL[d.sex] },
  ];
}

type UrlaAnswers = Pick<
  ApplicationFormData,
  | "sellerRelationship"
  | "undisclosedMortgageApplication"
  | "undisclosedCreditApplication"
  | "cleanEnergyLien"
  | "coSignerOnUndisclosedDebt"
  | "delinquentFederalDebt"
  | "partyToLawsuit"
  | "deedInLieu"
  | "shortSale"
>;

function urlaDeclarationRows(d: UrlaAnswers, isPurchase: boolean): SummaryRow[] {
  return [
    ...(isPurchase ? [{ label: "Relationship with the seller", value: answered(d.sellerRelationship) }] : []),
    { label: "Other mortgage applications not disclosed", value: answered(d.undisclosedMortgageApplication) },
    { label: "New credit not disclosed", value: answered(d.undisclosedCreditApplication) },
    { label: "Clean energy (PACE) lien", value: answered(d.cleanEnergyLien) },
    { label: "Co-signer on undisclosed debt", value: answered(d.coSignerOnUndisclosedDebt) },
    { label: "Delinquent on federal debt", value: answered(d.delinquentFederalDebt) },
    { label: "Party to a lawsuit", value: answered(d.partyToLawsuit) },
    { label: "Deed in lieu (past 7 years)", value: answered(d.deedInLieu) },
    { label: "Short sale (past 7 years)", value: answered(d.shortSale) },
  ];
}

function coBorrowerSection(cb: CoBorrowerData, isPurchase: boolean): SummarySection {
  const address = cb.sameAddress || !cb.currentAddress
    ? "Same as borrower"
    : `${cb.currentAddress.street}, ${cb.currentAddress.city}, ${cb.currentAddress.state} ${cb.currentAddress.zip}`;
  const rows: SummaryRow[] = [
    { label: "Name", value: fullName(cb) },
    { label: "Relationship to borrower", value: CO_BORROWER_RELATIONSHIP_LABEL[cb.relationship] },
    { label: "Date of birth", value: text(cb.dateOfBirth) },
    { label: "Marital status", value: MARITAL_STATUS_LABEL[cb.maritalStatus] },
    { label: "Phone", value: text(cb.phone) },
    { label: "Email", value: text(cb.email) },
    { label: "Address", value: address },
  ];
  if (!cb.sameAddress && cb.currentAddress) {
    rows.push(
      { label: "Years at address", value: years(cb.yearsAtAddress) },
      { label: "Housing status", value: cb.housingStatus ? HOUSING_STATUS_LABEL[cb.housingStatus] : "—" }
    );
  }
  rows.push(
    { label: "Employment status", value: EMPLOYMENT_STATUS_LABEL[cb.employmentStatus] },
    { label: "Employer", value: text(cb.employerName) },
    { label: "Employer phone", value: text(cb.employerPhone) },
    { label: "Job title", value: text(cb.jobTitle) },
    { label: "Start date", value: text(cb.employmentStartDate) },
    { label: "Years at job", value: years(cb.yearsAtJob) },
    { label: "Years in line of work", value: years(cb.yearsInLineOfWork) },
    { label: "Employed by a party to the transaction", value: answered(cb.employedByPartyToTransaction) },
    { label: "Monthly income", value: money(cb.monthlyIncome) },
    { label: "Citizenship", value: CITIZENSHIP_LABEL[cb.usCitizen] },
    { label: "Bankruptcy (past 7 years)", value: yesNo(cb.bankruptcy) },
    { label: "Foreclosure (past 7 years)", value: yesNo(cb.foreclosure) },
    { label: "Outstanding judgments", value: yesNo(cb.outstandingJudgments) },
    { label: "Veteran", value: yesNo(cb.veteran) },
    { label: "Will occupy as primary residence", value: answered(cb.primaryResidence) },
    { label: "Owned a home in past 3 years", value: answered(cb.ownedHomePastThreeYears) },
    { label: "Borrowing undisclosed funds", value: answered(cb.downPaymentBorrowed) },
    ...urlaDeclarationRows(cb, isPurchase),
    ...demographicRows(cb.demographics),
    { label: "Electronic signature", value: text(cb.eSignatureName) }
  );
  return { title: "Co-borrower", rows };
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
        { label: "Loan program", value: app.loanProgram ? LOAN_PROGRAM_LABEL[app.loanProgram] : "—" },
        { label: "Term", value: app.loanTermYears ? `${app.loanTermYears} years` : "—" },
        {
          label: "Rate type",
          value: app.amortizationType ? (app.amortizationType === "fixed" ? "Fixed" : "Adjustable (ARM)") : "—",
        },
        ...(app.loanPurpose === "refinance" ? [{ label: "Cash out", value: answered(app.cashOut) }] : []),
        {
          label: "Property address",
          value:
            addressText(app.propertyAddress) +
            (app.propertyAddress?.county?.trim() ? ` (${app.propertyAddress.county.trim()})` : ""),
        },
      ],
    },
    {
      title: "Borrower",
      rows: [
        { label: "Name", value: fullName(app) },
        { label: "Date of birth", value: text(app.dateOfBirth) },
        { label: "Marital status", value: MARITAL_STATUS_LABEL[app.maritalStatus] },
        { label: "Phone", value: text(app.phone) },
        { label: "Email", value: text(app.email) },
        {
          label: "Dependents",
          value:
            typeof app.dependentCount === "number"
              ? `${app.dependentCount}${app.dependentAges?.trim() ? ` (ages ${app.dependentAges.trim()})` : ""}`
              : "—",
        },
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
        { label: "Previous address", value: addressText(app.previousAddress) },
      ],
    },
    {
      title: "Employment & income",
      rows: [
        { label: "Employment status", value: EMPLOYMENT_STATUS_LABEL[app.employmentStatus] },
        { label: "Employer", value: text(app.employerName) },
        { label: "Employer phone", value: text(app.employerPhone) },
        { label: "Job title", value: text(app.jobTitle) },
        { label: "Start date", value: text(app.employmentStartDate) },
        { label: "Years at job", value: years(app.yearsAtJob) },
        { label: "Years in line of work", value: years(app.yearsInLineOfWork) },
        { label: "Employed by a party to the transaction", value: answered(app.employedByPartyToTransaction) },
        { label: "Monthly income", value: money(app.monthlyIncome) },
      ],
    },
    ...(app.coBorrower ? [coBorrowerSection(app.coBorrower, app.loanPurpose === "purchase")] : []),
    { title: "Monthly debts", rows: debts },
    {
      title: "Declarations",
      rows: [
        { label: "Citizenship", value: CITIZENSHIP_LABEL[app.usCitizen] },
        { label: "Bankruptcy (past 7 years)", value: yesNo(app.bankruptcy) },
        { label: "Foreclosure (past 7 years)", value: yesNo(app.foreclosure) },
        { label: "Outstanding judgments", value: yesNo(app.outstandingJudgments) },
        { label: "Borrowing undisclosed funds", value: yesNo(app.downPaymentBorrowed) },
        { label: "Will occupy as primary residence", value: yesNo(app.primaryResidence) },
        { label: "Veteran", value: yesNo(app.veteran) },
        { label: "First-time buyer", value: yesNo(app.firstTimeBuyer) },
        ...urlaDeclarationRows(app, app.loanPurpose === "purchase"),
      ],
    },
    { title: "Demographic information", rows: demographicRows(app.demographics) },
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
