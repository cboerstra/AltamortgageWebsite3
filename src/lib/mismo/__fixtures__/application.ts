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
  loanProgram: "conventional",
  loanTermYears: "30",
  amortizationType: "fixed",
  propertyAddress: {
    street: "706 Cook Street",
    city: "Ogden",
    state: "ut",
    zip: "84404",
    county: "Weber County",
  },

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
  dependentCount: 2,
  dependentAges: "1, 3",

  employmentStatus: "employed",
  employerName: "Wasatch Analytics",
  jobTitle: "Senior Analyst",
  employerPhone: "(801) 555-0100",
  employmentStartDate: "2020-12-20",
  yearsAtJob: 6,
  yearsInLineOfWork: 10,
  employedByPartyToTransaction: false,
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
  sellerRelationship: true,
  undisclosedMortgageApplication: false,
  undisclosedCreditApplication: false,
  cleanEnergyLien: false,
  coSignerOnUndisclosedDebt: false,
  delinquentFederalDebt: false,
  partyToLawsuit: false,
  deedInLieu: false,
  shortSale: false,
  demographics: {
    ethnicity: "hispanic",
    ethnicityOrigins: ["puerto-rican"],
    races: ["white"],
    sex: "female",
  },

  consentAuthorization: true,
  eSignatureName: "Dana Lee O'Brien",
  eSignatureDate: "2026-09-08",
};

/**
 * A refinance by a self-employed applicant who owns, with minimal optionals.
 * Shaped like an application stored before the URLA questions, dependents
 * and demographics were added, so it also guards backward compatibility.
 */
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

/**
 * The complete purchase, applied for jointly with a spouse who lives elsewhere.
 * The co-borrower is shaped as one stored before their URLA questions,
 * employment details and demographics were asked.
 */
export const jointApplication: ApplicationFormData = {
  ...completeApplication,
  coBorrower: {
    relationship: "spouse",
    firstName: "Robin",
    lastName: "O'Brien",
    dateOfBirth: "1987-02-03",
    maritalStatus: "married",
    phone: "8015550199",
    email: "",
    sameAddress: false,
    currentAddress: { street: "22 E 400 N", city: "Ogden", state: "UT", zip: "84401" },
    yearsAtAddress: 1,
    housingStatus: "rent",
    employmentStatus: "self-employed",
    employerName: "Robin Designs LLC",
    jobTitle: "Owner",
    yearsAtJob: 4,
    monthlyIncome: 5200,
    usCitizen: "permanent-resident",
    bankruptcy: false,
    foreclosure: true,
    outstandingJudgments: false,
    veteran: false,
    eSignatureName: "Robin O'Brien",
  },
};

/** A joint purchase where the co-borrower, living with the applicant, answered everything. */
export const fullJointApplication: ApplicationFormData = {
  ...completeApplication,
  coBorrower: {
    relationship: "spouse",
    firstName: "Carlos",
    middleName: "Omar",
    lastName: "Resto",
    dateOfBirth: "1989-08-24",
    maritalStatus: "married",
    phone: "801-555-0199",
    email: "carlos.resto@example.com",
    sameAddress: true,
    employmentStatus: "employed",
    employerName: "The Front Climbing Club",
    jobTitle: "Shift Lead",
    employerPhone: "8015550142",
    employmentStartDate: "2023-01-01",
    yearsAtJob: 3,
    monthlyIncome: 3813.33,
    usCitizen: "yes",
    bankruptcy: false,
    foreclosure: false,
    outstandingJudgments: false,
    veteran: false,
    primaryResidence: true,
    ownedHomePastThreeYears: false,
    downPaymentBorrowed: false,
    sellerRelationship: false,
    undisclosedMortgageApplication: false,
    undisclosedCreditApplication: false,
    cleanEnergyLien: false,
    coSignerOnUndisclosedDebt: false,
    delinquentFederalDebt: false,
    partyToLawsuit: false,
    deedInLieu: false,
    shortSale: false,
    demographics: { ethnicity: "decline", races: ["decline"], sex: "male" },
    eSignatureName: "Carlos Omar Resto",
  },
};

export const FIXTURE_OPTIONS = {
  referenceNumber: "ALT-K7M2Q",
  submittedAt: "2026-09-08T14:30:12.000Z",
  sourcePage: "/apply",
};
