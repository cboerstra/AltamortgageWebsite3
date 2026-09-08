import type { ApplicationFormData } from "@/lib/schemas";

/**
 * A complete purchase application with every optional field populated, so the
 * golden file exercises the widest path through the builder.
 */
export const completeApplication: ApplicationFormData = {
  loanPurpose: "purchase",
  propertyType: "condo",
  propertyUse: "primary",
  purchasePrice: 545000,
  loanAmount: 436000,
  downPayment: 109000,
  currentBalance: undefined,

  firstName: "Dana",
  middleName: "Lee",
  lastName: "O'Brien & Sons",
  suffix: "Jr.",
  dateOfBirth: "1985-04-17",
  ssn: "123-45-6789",
  maritalStatus: "married",
  phone: "8015550147",
  email: "dana.obrien@example.com",
  currentAddress: {
    street: "1490 S <Main> St Apt 4",
    city: "Salt Lake City",
    state: "UT",
    zip: "84115",
  },
  yearsAtAddress: 3.5,
  housingStatus: "rent",
  monthlyHousingPayment: 1850,

  employmentStatus: "employed",
  employerName: "Wasatch Analytics",
  jobTitle: "Senior Analyst",
  yearsAtJob: 6,
  monthlyIncome: 9400,

  monthlyAutoLoan: 415,
  monthlyStudentLoan: 260,
  monthlyCreditCards: 130,
  monthlyChildSupport: 0,
  monthlyOtherDebt: 0,
  creditScoreRange: "excellent",

  usCitizen: "yes",
  bankruptcy: false,
  foreclosure: false,
  outstandingJudgments: false,
  downPaymentBorrowed: false,
  primaryResidence: true,
  veteran: true,
  firstTimeBuyer: false,

  consentAuthorization: true,
  eSignatureName: "Dana Lee O'Brien",
  eSignatureDate: "2026-09-08",
};

/** A refinance by a self-employed applicant who owns, with minimal optionals. */
export const refinanceApplication: ApplicationFormData = {
  loanPurpose: "refinance",
  propertyType: "single-family",
  propertyUse: "investment",
  purchasePrice: 720000,
  loanAmount: 500000,
  currentBalance: 412000,

  firstName: "Sam",
  lastName: "Ortiz",
  dateOfBirth: "1972-11-02",
  maritalStatus: "divorced",
  phone: "8015550188",
  email: "sam.ortiz@example.com",
  currentAddress: {
    street: "88 Canyon Rd",
    city: "Provo",
    state: "UT",
    zip: "84604",
  },
  yearsAtAddress: 12,
  housingStatus: "own",
  monthlyHousingPayment: 2400,

  employmentStatus: "self-employed",
  monthlyIncome: 15200,

  monthlyAutoLoan: 0,
  monthlyStudentLoan: 0,
  monthlyCreditCards: 0,
  monthlyChildSupport: 0,
  monthlyOtherDebt: 0,
  creditScoreRange: "good",

  usCitizen: "permanent-resident",
  bankruptcy: true,
  foreclosure: false,
  outstandingJudgments: true,
  downPaymentBorrowed: false,
  primaryResidence: false,
  veteran: false,
  firstTimeBuyer: false,

  consentAuthorization: true,
  eSignatureName: "Sam Ortiz",
  eSignatureDate: "2026-09-08",
};

export const FIXTURE_OPTIONS = {
  referenceNumber: "ALT-K7M2Q",
  submittedAt: "2026-09-08T14:30:12.000Z",
  sourcePage: "/apply",
};
