// What an applicant has to send us after the wizard is submitted.
//
// The site has no document upload, so the confirmation email asks the
// applicant to send these by email. The list is tailored to what they actually
// told us -- a retiree should not be asked for pay stubs, and only a veteran
// needs a Certificate of Eligibility -- because a checklist full of
// irrelevant items is one people skim and then ignore.

import type { ApplicationFormData } from "@/lib/schemas";

export interface ChecklistGroup {
  title: string;
  items: string[];
}

/** Needed regardless of how the applicant earns or what they are financing. */
const IDENTITY: ChecklistGroup = {
  title: "Identification",
  items: [
    "Photo ID — driver's license or passport, front and back",
    "Bank statements — the last two months, every page, including the blank ones",
  ],
};

const INCOME_BY_EMPLOYMENT: Record<ApplicationFormData["employmentStatus"], string[]> = {
  employed: [
    "Pay stubs — covering the last 30 days",
    "W-2 forms — the last two years",
  ],
  "self-employed": [
    "Federal tax returns — the last two years, all pages and schedules",
    "1099 forms — the last two years",
    "Year-to-date profit and loss statement",
  ],
  retired: [
    "Award letter — Social Security, pension, or annuity",
    "1099-R forms — the last two years",
    "Retirement account statements — the last two months",
  ],
  other: [
    "Federal tax returns — the last two years, all pages and schedules",
    "Documentation of your income source",
  ],
};

const PURPOSE_ITEMS: Record<ApplicationFormData["loanPurpose"], string[]> = {
  purchase: [
    "Signed purchase contract — as soon as you have one",
    "Proof of funds for your down payment and closing costs",
  ],
  refinance: [
    "Current mortgage statement",
    "Homeowners insurance declaration page",
    "Most recent property tax bill",
  ],
  "home-equity": [
    "Current mortgage statement",
    "Homeowners insurance declaration page",
    "Most recent property tax bill",
  ],
};

/**
 * Build the checklist for one application.
 *
 * Groups are returned in the order they should be read: who you are, how you
 * are paid, then what you are financing.
 */
export function buildDocumentChecklist(app: ApplicationFormData): ChecklistGroup[] {
  const groups: ChecklistGroup[] = [IDENTITY];

  groups.push({
    title: "Income and employment",
    items: INCOME_BY_EMPLOYMENT[app.employmentStatus] ?? INCOME_BY_EMPLOYMENT.other,
  });

  const purposeItems = PURPOSE_ITEMS[app.loanPurpose];
  if (purposeItems) {
    groups.push({ title: "Your property and loan", items: purposeItems });
  }

  if (app.veteran) {
    groups.push({
      title: "VA loan eligibility",
      items: [
        "Certificate of Eligibility (COE) — or your DD-214 if you do not have the COE yet",
      ],
    });
  }

  return groups;
}

/** Flat plain-text rendering, for the text alternative of the email. */
export function checklistToText(groups: ChecklistGroup[]): string {
  return groups
    .map((g) => `${g.title.toUpperCase()}\n${g.items.map((i) => `  - ${i}`).join("\n")}`)
    .join("\n\n");
}
