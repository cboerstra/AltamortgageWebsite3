// ApplicationFormData -> a normalized deal object.
//
// Pure: no I/O, no clock, no randomness. Everything time- or identity-derived
// (reference number, submission timestamp) is passed in, so the same input
// always maps to the same output and the golden-file test can assert bytes.

import type { ApplicationFormData, CoBorrowerData } from "@/lib/schemas";
import {
  CITIZENSHIP,
  CITIZENSHIP_LABEL,
  CREDIT_SCORE_RANGE_LABEL,
  EMPLOYMENT_STATUS_LABEL,
  HOUSING_STATUS_LABEL,
  INCOME_TYPE,
  LOAN_PURPOSE,
  LOAN_PURPOSE_LABEL,
  MARITAL_STATUS,
  MARITAL_STATUS_LABEL,
  PROPERTY_PROFILE,
  PROPERTY_USAGE,
  PROPERTY_USE_LABEL,
  RESIDENCY_BASIS,
  hasEmployer,
  isSelfEmployed,
  type PropertyProfile,
} from "./enums";

export interface MismoAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface MismoLiability {
  /** MISMO LiabilityType */
  type: string;
  description: string;
  monthlyPayment: number;
}

export interface MismoAsset {
  /** MISMO AssetType */
  type: string;
  holderName: string;
  amount: number;
}

export interface MismoOtherIncome {
  description: string;
  monthlyAmount: number;
}

export interface MismoEmployer {
  name?: string;
  jobTitle?: string;
  durationMonths?: number;
  selfEmployed: boolean;
}

export interface MismoDeclarations {
  bankruptcy: boolean;
  priorForeclosure: boolean;
  outstandingJudgments: boolean;
  borrowedDownPayment: boolean;
  intentToOccupy: boolean;
  /**
   * ULAD asks whether the borrower owned a home in the past three years. The
   * wizard derives it from "first-time buyer", which it asks only of the main
   * applicant, so a co-borrower leaves it unanswered.
   */
  homeownerPastThreeYears?: "Yes" | "No";
}

export interface MismoBorrower {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffixName?: string;
  birthDate?: string;
  maritalStatusType: string;
  citizenshipType: string;
  email?: string;
  phone?: string;
  ssnMasked?: string;
  militaryService: boolean;
  residence: {
    address: MismoAddress;
    residencyBasisType: string;
    durationMonths: number;
    monthlyRentAmount?: number;
    monthlyOwnerPayment?: number;
  };
  employer?: MismoEmployer;
  incomeType: string;
  monthlyIncome: number;
  otherIncome: MismoOtherIncome[];
  declarations: MismoDeclarations;
}

export interface MismoDeal {
  referenceNumber: string;
  submittedAt: string;
  loan: {
    purposeType: string;
    purposeOtherDescription?: string;
    baseLoanAmount: number;
    downPayment?: number;
    currentBalance?: number;
    isRefinance: boolean;
  };
  property: {
    address: MismoAddress | null;
    usageType: string;
    profile: PropertyProfile;
    valueAmount: number;
  };
  /** Assets and debts are household-wide and sit with the main applicant. */
  borrower: MismoBorrower & {
    email: string;
    liabilities: MismoLiability[];
    assets: MismoAsset[];
  };
  coBorrower?: MismoBorrower;
  extension: {
    loanPurposeLabel: string;
    propertyTypeLabel: string;
    propertyUseLabel: string;
    maritalStatusLabel: string;
    citizenshipLabel: string;
    employmentStatusLabel: string;
    housingStatusLabel: string;
    creditScoreRangeLabel: string;
    firstTimeHomebuyer: boolean;
    veteran: boolean;
    ssnLast4?: string;
    employerName?: string;
    consentGiven: boolean;
    eSignatureName: string;
    eSignatureDate: string;
    sourcePage?: string;
    coBorrower?: {
      relationshipLabel: string;
      maritalStatusLabel: string;
      citizenshipLabel: string;
      employmentStatusLabel: string;
      employerName?: string;
      veteran: boolean;
      eSignatureName: string;
    };
  };
}

/** MISMO dates are ISO calendar dates. Anything else is dropped, not guessed. */
function isoDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : undefined;
}

/** Last four SSN digits, or undefined when the applicant left it blank. */
export function ssnLast4(ssn: string | undefined): string | undefined {
  if (!ssn) return undefined;
  const digits = ssn.replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : undefined;
}

function maskSsn(ssn: string | undefined): string | undefined {
  const last4 = ssnLast4(ssn);
  return last4 ? `XXX-XX-${last4}` : undefined;
}

function monthsFromYears(years: number | undefined): number {
  if (typeof years !== "number" || !Number.isFinite(years) || years < 0) return 0;
  return Math.round(years * 12);
}

function positive(value: number | undefined): number | undefined {
  return typeof value === "number" && value > 0 ? value : undefined;
}

/** Form account types -> MISMO AssetType. */
const ASSET_TYPE: Record<string, string> = {
  checking: "CheckingAccount",
  savings: "SavingsAccount",
  investment: "Stock",
};

function buildLiabilities(app: ApplicationFormData): MismoLiability[] {
  const candidates: MismoLiability[] = [
    { type: "Installment", description: "Auto loan", monthlyPayment: app.monthlyAutoLoan },
    { type: "Installment", description: "Student loan", monthlyPayment: app.monthlyStudentLoan },
    { type: "Revolving", description: "Credit cards", monthlyPayment: app.monthlyCreditCards },
    { type: "ChildSupport", description: "Child support", monthlyPayment: app.monthlyChildSupport },
    { type: "Other", description: "Other monthly debt", monthlyPayment: app.monthlyOtherDebt },
  ];
  return candidates.filter((l) => typeof l.monthlyPayment === "number" && l.monthlyPayment > 0);
}

const RELATIONSHIP_LABEL: Record<CoBorrowerData["relationship"], string> = {
  spouse: "Spouse",
  "domestic-partner": "Domestic partner",
  family: "Family member",
  other: "Other",
};

export { RELATIONSHIP_LABEL as CO_BORROWER_RELATIONSHIP_LABEL };

function mapCoBorrower(app: ApplicationFormData, cb: CoBorrowerData): MismoBorrower {
  // Sharing the main applicant's home means sharing its tenure and length of
  // stay. The housing payment is not repeated: it is the household's, counted
  // once on the main applicant.
  const residence = cb.sameAddress || !cb.currentAddress
    ? {
        address: app.currentAddress,
        residencyBasisType: RESIDENCY_BASIS[app.housingStatus],
        durationMonths: monthsFromYears(app.yearsAtAddress),
      }
    : {
        address: cb.currentAddress,
        residencyBasisType: RESIDENCY_BASIS[cb.housingStatus ?? "other"],
        durationMonths: monthsFromYears(cb.yearsAtAddress),
      };

  return {
    firstName: cb.firstName,
    middleName: cb.middleName,
    lastName: cb.lastName,
    suffixName: cb.suffix,
    birthDate: isoDate(cb.dateOfBirth),
    maritalStatusType: MARITAL_STATUS[cb.maritalStatus],
    citizenshipType: CITIZENSHIP[cb.usCitizen],
    email: cb.email?.trim() || undefined,
    phone: cb.phone?.trim() || undefined,
    militaryService: cb.veteran,
    residence,
    employer: hasEmployer(cb.employmentStatus)
      ? {
          name: cb.employerName,
          jobTitle: cb.jobTitle,
          durationMonths: cb.yearsAtJob ? monthsFromYears(cb.yearsAtJob) : undefined,
          selfEmployed: isSelfEmployed(cb.employmentStatus),
        }
      : undefined,
    incomeType: INCOME_TYPE[cb.employmentStatus],
    monthlyIncome: cb.monthlyIncome,
    otherIncome: [],
    declarations: {
      bankruptcy: cb.bankruptcy,
      priorForeclosure: cb.foreclosure,
      outstandingJudgments: cb.outstandingJudgments,
      // These two are about the loan, not the person, so they hold for both.
      borrowedDownPayment: app.downPaymentBorrowed,
      intentToOccupy: app.primaryResidence,
    },
  };
}

export interface MapOptions {
  referenceNumber: string;
  /** ISO 8601 instant the application was received. */
  submittedAt: string;
  sourcePage?: string;
}

export function mapToDeal(app: ApplicationFormData, options: MapOptions): MismoDeal {
  const purpose = LOAN_PURPOSE[app.loanPurpose];
  const profile = PROPERTY_PROFILE[app.propertyType];
  const owns = app.housingStatus === "own";

  return {
    referenceNumber: options.referenceNumber,
    submittedAt: options.submittedAt,

    loan: {
      purposeType: purpose.type,
      purposeOtherDescription: purpose.otherDescription,
      baseLoanAmount: app.loanAmount,
      downPayment: positive(app.downPayment),
      currentBalance: positive(app.currentBalance),
      isRefinance: app.loanPurpose !== "purchase",
    },

    // The wizard collects one address. On a purchase it is where the borrower
    // lives today, not the subject property, so the subject address is left
    // absent rather than filled with the wrong one. On a refinance or home
    // equity loan the current residence IS the subject property.
    property: {
      address: app.loanPurpose === "purchase" ? null : app.currentAddress,
      usageType: PROPERTY_USAGE[app.propertyUse],
      profile,
      valueAmount: app.purchasePrice,
    },

    borrower: {
      firstName: app.firstName,
      middleName: app.middleName,
      lastName: app.lastName,
      suffixName: app.suffix,
      birthDate: isoDate(app.dateOfBirth),
      maritalStatusType: MARITAL_STATUS[app.maritalStatus],
      citizenshipType: CITIZENSHIP[app.usCitizen],
      email: app.email,
      phone: app.phone,
      ssnMasked: maskSsn(app.ssn),
      militaryService: app.veteran,

      residence: {
        address: app.currentAddress,
        residencyBasisType: RESIDENCY_BASIS[app.housingStatus],
        durationMonths: monthsFromYears(app.yearsAtAddress),
        monthlyRentAmount: owns ? undefined : positive(app.monthlyHousingPayment),
        monthlyOwnerPayment: owns ? positive(app.monthlyHousingPayment) : undefined,
      },

      employer: hasEmployer(app.employmentStatus)
        ? {
            name: app.employerName,
            jobTitle: app.jobTitle,
            durationMonths: app.yearsAtJob ? monthsFromYears(app.yearsAtJob) : undefined,
            selfEmployed: isSelfEmployed(app.employmentStatus),
          }
        : undefined,
      incomeType: INCOME_TYPE[app.employmentStatus],
      monthlyIncome: app.monthlyIncome,
      otherIncome: (app.otherIncome ?? [])
        .filter((o) => o.type.trim() !== "" && o.amount > 0)
        .map((o) => ({ description: o.type.trim(), monthlyAmount: o.amount })),
      assets: (app.bankAccounts ?? [])
        .filter((a) => a.balance > 0)
        .map((a) => ({
          type: ASSET_TYPE[a.type] ?? "Other",
          holderName: a.institution.trim() || "Unknown institution",
          amount: a.balance,
        })),
      liabilities: buildLiabilities(app),

      declarations: {
        bankruptcy: app.bankruptcy,
        priorForeclosure: app.foreclosure,
        outstandingJudgments: app.outstandingJudgments,
        borrowedDownPayment: app.downPaymentBorrowed,
        intentToOccupy: app.primaryResidence,
        homeownerPastThreeYears: app.firstTimeBuyer ? "No" : "Yes",
      },
    },

    coBorrower: app.coBorrower ? mapCoBorrower(app, app.coBorrower) : undefined,

    extension: {
      loanPurposeLabel: LOAN_PURPOSE_LABEL[app.loanPurpose],
      propertyTypeLabel: profile.description,
      propertyUseLabel: PROPERTY_USE_LABEL[app.propertyUse],
      maritalStatusLabel: MARITAL_STATUS_LABEL[app.maritalStatus],
      citizenshipLabel: CITIZENSHIP_LABEL[app.usCitizen],
      employmentStatusLabel: EMPLOYMENT_STATUS_LABEL[app.employmentStatus],
      housingStatusLabel: HOUSING_STATUS_LABEL[app.housingStatus],
      creditScoreRangeLabel: CREDIT_SCORE_RANGE_LABEL[app.creditScoreRange],
      firstTimeHomebuyer: app.firstTimeBuyer,
      veteran: app.veteran,
      ssnLast4: ssnLast4(app.ssn),
      employerName: app.employerName,
      consentGiven: app.consentAuthorization,
      eSignatureName: app.eSignatureName,
      eSignatureDate: app.eSignatureDate,
      sourcePage: options.sourcePage,
      coBorrower: app.coBorrower
        ? {
            relationshipLabel: RELATIONSHIP_LABEL[app.coBorrower.relationship],
            maritalStatusLabel: MARITAL_STATUS_LABEL[app.coBorrower.maritalStatus],
            citizenshipLabel: CITIZENSHIP_LABEL[app.coBorrower.usCitizen],
            employmentStatusLabel: EMPLOYMENT_STATUS_LABEL[app.coBorrower.employmentStatus],
            employerName: app.coBorrower.employerName,
            veteran: app.coBorrower.veteran,
            eSignatureName: app.coBorrower.eSignatureName,
          }
        : undefined,
    },
  };
}
