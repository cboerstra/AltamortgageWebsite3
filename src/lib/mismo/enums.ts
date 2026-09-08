// Form value -> MISMO v3.4 enumeration lookups.
//
// Pure data plus a few tiny helpers. Where the form offers a choice MISMO has
// no enumeration for, the mapping degrades to the nearest legal value and the
// original answer is preserved verbatim in the Alta extension block, so nothing
// the applicant told us is silently rewritten.

import type { ApplicationFormData } from "@/lib/schemas";

type LoanPurpose = ApplicationFormData["loanPurpose"];
type PropertyType = ApplicationFormData["propertyType"];
type PropertyUse = ApplicationFormData["propertyUse"];
type MaritalStatus = ApplicationFormData["maritalStatus"];
type Citizenship = ApplicationFormData["usCitizen"];
type HousingStatus = ApplicationFormData["housingStatus"];
type EmploymentStatus = ApplicationFormData["employmentStatus"];
type CreditScoreRange = ApplicationFormData["creditScoreRange"];

/** MISMO LoanPurposeType. Home equity has no enumeration, so it rides on Other. */
export const LOAN_PURPOSE: Record<LoanPurpose, { type: string; otherDescription?: string }> = {
  purchase: { type: "Purchase" },
  refinance: { type: "Refinance" },
  "home-equity": { type: "Other", otherDescription: "HomeEquity" },
};

export interface PropertyProfile {
  /** MISMO AttachmentType */
  attachmentType?: string;
  /** MISMO ProjectType, when the property sits in a project */
  projectType?: string;
  financedUnitCount: number;
  manufacturedHome: boolean;
  description: string;
}

export const PROPERTY_PROFILE: Record<PropertyType, PropertyProfile> = {
  "single-family": {
    attachmentType: "Detached",
    financedUnitCount: 1,
    manufacturedHome: false,
    description: "Single Family",
  },
  condo: {
    attachmentType: "Attached",
    projectType: "Condominium",
    financedUnitCount: 1,
    manufacturedHome: false,
    description: "Condominium",
  },
  townhome: {
    attachmentType: "Attached",
    financedUnitCount: 1,
    manufacturedHome: false,
    description: "Townhouse",
  },
  "multi-family": {
    attachmentType: "Attached",
    financedUnitCount: 2,
    manufacturedHome: false,
    description: "Multi-Family (unit count to be confirmed)",
  },
  manufactured: {
    attachmentType: "Detached",
    financedUnitCount: 1,
    manufacturedHome: true,
    description: "Manufactured Home",
  },
};

/** MISMO PropertyUsageType. */
export const PROPERTY_USAGE: Record<PropertyUse, string> = {
  primary: "PrimaryResidence",
  secondary: "SecondHome",
  investment: "Investment",
};

/**
 * MISMO MaritalStatusType has exactly three values: Married, Separated,
 * Unmarried. Divorced and widowed both collapse to Unmarried; the specific
 * answer survives in the extension block.
 */
export const MARITAL_STATUS: Record<MaritalStatus, string> = {
  single: "Unmarried",
  married: "Married",
  separated: "Separated",
  divorced: "Unmarried",
  widowed: "Unmarried",
};

/** MISMO CitizenshipResidencyType. */
export const CITIZENSHIP: Record<Citizenship, string> = {
  yes: "USCitizen",
  "permanent-resident": "PermanentResidentAlien",
  other: "NonPermanentResidentAlien",
};

/** MISMO BorrowerResidencyBasisType. */
export const RESIDENCY_BASIS: Record<HousingStatus, string> = {
  own: "Own",
  rent: "Rent",
  other: "LivingRentFree",
};

/** MISMO IncomeType for the borrower's stated monthly income. */
export const INCOME_TYPE: Record<EmploymentStatus, string> = {
  employed: "Base",
  "self-employed": "Base",
  retired: "Pension",
  other: "Other",
};

/** Whether this employment status should produce an EMPLOYER block at all. */
export function hasEmployer(status: EmploymentStatus): boolean {
  return status === "employed" || status === "self-employed";
}

export function isSelfEmployed(status: EmploymentStatus): boolean {
  return status === "self-employed";
}

/**
 * Credit score range is a lead-qualification bucket, not a MISMO concept — it
 * carries a self-reported range rather than a pulled score, so it must not be
 * emitted as a CREDIT_SCORE. It goes to the extension block as a label.
 */
export const CREDIT_SCORE_RANGE_LABEL: Record<CreditScoreRange, string> = {
  excellent: "Excellent (740+)",
  good: "Good (700-739)",
  fair: "Fair (660-699)",
  "below-fair": "Below Fair (under 660)",
  "not-sure": "Not sure",
};

/** Human labels for the values that collapse in the mappings above. */
export const MARITAL_STATUS_LABEL: Record<MaritalStatus, string> = {
  single: "Single",
  married: "Married",
  separated: "Separated",
  divorced: "Divorced",
  widowed: "Widowed",
};

export const EMPLOYMENT_STATUS_LABEL: Record<EmploymentStatus, string> = {
  employed: "Employed",
  "self-employed": "Self-employed",
  retired: "Retired",
  other: "Other",
};

export const LOAN_PURPOSE_LABEL: Record<LoanPurpose, string> = {
  purchase: "Purchase",
  refinance: "Refinance",
  "home-equity": "Home Equity",
};

export const PROPERTY_USE_LABEL: Record<PropertyUse, string> = {
  primary: "Primary Residence",
  secondary: "Second Home",
  investment: "Investment",
};

export const CITIZENSHIP_LABEL: Record<Citizenship, string> = {
  yes: "U.S. Citizen",
  "permanent-resident": "Permanent Resident Alien",
  other: "Non-Permanent Resident Alien",
};

export const HOUSING_STATUS_LABEL: Record<HousingStatus, string> = {
  own: "Own",
  rent: "Rent",
  other: "Other",
};
