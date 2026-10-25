// ApplicationFormData -> a normalized deal object.
//
// Pure: no I/O, no clock, no randomness. Everything time- or identity-derived
// (reference number, submission timestamp) is passed in, so the same input
// always maps to the same output and the golden-file test can assert bytes.
//
// Answers the applicant did not give stay undefined and are omitted from the
// document. Applications stored before a question existed must not acquire an
// answer to it here.

import { COMPANY } from "@/lib/constants";
import type { ApplicationFormData, CoBorrowerData } from "@/lib/schemas";
import {
  CITIZENSHIP,
  CITIZENSHIP_LABEL,
  CREDIT_SCORE_RANGE_LABEL,
  EMPLOYMENT_STATUS_LABEL,
  HMDA_ETHNICITY_ORIGIN,
  HMDA_RACE,
  HOUSING_STATUS_LABEL,
  INCOME_TYPE,
  LOAN_PURPOSE,
  LOAN_PURPOSE_LABEL,
  MARITAL_STATUS,
  MARITAL_STATUS_LABEL,
  MORTGAGE_TYPE,
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
  county?: string;
}

export interface MismoLiability {
  /** MISMO LiabilityType */
  type: string;
  description: string;
  monthlyPayment?: number;
  unpaidBalance?: number;
  /** Known to exclude taxes and insurance — true of every consumer debt. */
  excludesTaxesAndInsurance: boolean;
  /** Paid off by this transaction. */
  payoff: boolean;
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
  phone?: string;
  startDate?: string;
  lineOfWorkMonths?: number;
  selfEmployed: boolean;
  specialRelationship?: boolean;
}

export interface MismoDeclarations {
  bankruptcy: boolean;
  priorForeclosure: boolean;
  outstandingJudgments: boolean;
  /** URLA 5a.C: borrowing, or receiving from another party, money not disclosed. */
  undisclosedBorrowedFunds: boolean;
  intentToOccupy: boolean;
  /**
   * ULAD asks whether the borrower owned a home in the past three years. A
   * co-borrower stored before the question was asked leaves it unanswered.
   */
  homeownerPastThreeYears?: "Yes" | "No";
  sellerRelationship?: boolean;
  undisclosedMortgageApplication?: boolean;
  undisclosedCreditApplication?: boolean;
  cleanEnergyLien?: boolean;
  undisclosedComaker?: boolean;
  presentlyDelinquent?: boolean;
  partyToLawsuit?: boolean;
  deedInLieu?: boolean;
  shortSale?: boolean;
}

export interface MismoDemographics {
  ethnicityRefused: boolean;
  /** ULAD HMDAEthnicityType */
  ethnicityType?: string;
  /** MISMO HMDAEthnicityOriginType */
  ethnicityOrigins: string[];
  raceRefused: boolean;
  /** MISMO HMDARaceType */
  races: string[];
  genderRefused: boolean;
  /** ULAD HMDAGenderType */
  genderType?: string;
}

export interface MismoBorrower {
  classification: "Primary" | "Secondary";
  firstName: string;
  middleName?: string;
  lastName: string;
  suffixName?: string;
  birthDate?: string;
  maritalStatusType: string;
  citizenshipType: string;
  /** Always present for the primary borrower; optional for a co-borrower. */
  email?: string;
  phone?: string;
  militaryService: boolean;
  dependentCount?: number;
  dependentAges: number[];
  mailingAddress: MismoAddress;
  residence: {
    address: MismoAddress;
    residencyBasisType?: string;
    durationMonths: number;
    monthlyRentAmount?: number;
    monthlyOwnerPayment?: number;
  };
  priorResidence?: MismoAddress;
  employer?: MismoEmployer;
  incomeType: string;
  monthlyIncome: number;
  otherIncome: MismoOtherIncome[];
  declarations: MismoDeclarations;
  demographics?: MismoDemographics;
}

export interface MismoDeal {
  referenceNumber: string;
  submittedAt: string;
  loan: {
    purposeType: string;
    purposeOtherDescription?: string;
    baseLoanAmount: number;
    downPayment?: number;
    isRefinance: boolean;
    lienPriorityType: "FirstLien" | "SecondLien";
    /** MISMO RefinanceCashOutDeterminationType, when the applicant said. */
    cashOutType?: string;
    /** MISMO MortgageType, when the applicant chose a program. */
    mortgageType?: string;
    /** MISMO AmortizationType */
    amortizationType?: string;
    termMonths?: number;
  };
  property: {
    address: MismoAddress | null;
    usageType: string;
    profile: PropertyProfile;
    valueAmount: number;
    salesContractAmount?: number;
  };
  /** Index 0 is the primary borrower. */
  borrowers: MismoBorrower[];
  /** Assets and debts as entered on step 4; they belong to the primary borrower. */
  assets: MismoAsset[];
  liabilities: MismoLiability[];
  originator: {
    companyName: string;
    companyNmlsId: string;
    companyStateLicenseId: string;
    companyAddress: MismoAddress;
    firstName: string;
    lastName: string;
    title: string;
    nmlsId: string;
    phone: string;
    email: string;
  };
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
    monthlyOwnerHousingPayment?: number;
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

const RELATIONSHIP_LABEL: Record<CoBorrowerData["relationship"], string> = {
  spouse: "Spouse",
  "domestic-partner": "Domestic partner",
  family: "Family member",
  other: "Other",
};

export { RELATIONSHIP_LABEL as CO_BORROWER_RELATIONSHIP_LABEL };

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

function monthsFromYears(years: number | undefined): number {
  if (typeof years !== "number" || !Number.isFinite(years) || years < 0) return 0;
  return Math.round(years * 12);
}

function positive(value: number | undefined): number | undefined {
  return typeof value === "number" && value > 0 ? value : undefined;
}

function nonNegative(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

/** Telephone values are digits only in MISMO. */
function phoneDigits(value: string | undefined): string | undefined {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length >= 10 ? digits.slice(-10) : undefined;
}

/** "3, 7 and 12" -> [3, 7, 12]. Anything that is not a whole number is ignored. */
export function parseDependentAges(value: string | undefined): number[] {
  if (!value) return [];
  return (value.match(/\d+/g) ?? []).map(Number).filter((n) => n >= 0 && n < 100);
}

/** A typed address with nothing in it is no address. */
function presentAddress(a: ApplicationFormData["propertyAddress"]): MismoAddress | null {
  if (!a || a.street.trim() === "") return null;
  return {
    street: a.street.trim(),
    city: a.city.trim(),
    state: a.state.trim().toUpperCase(),
    zip: a.zip.trim(),
    county: a.county?.trim() || undefined,
  };
}

/** Form account types -> MISMO AssetType. */
const ASSET_TYPE: Record<string, string> = {
  checking: "CheckingAccount",
  savings: "SavingsAccount",
  investment: "Stock",
};

function buildLiabilities(app: ApplicationFormData, subjectIsResidence: boolean): MismoLiability[] {
  const consumer = (type: string, description: string, monthlyPayment: number): MismoLiability => ({
    type,
    description,
    monthlyPayment,
    excludesTaxesAndInsurance: true,
    payoff: false,
  });
  const candidates: MismoLiability[] = [
    consumer("Installment", "Auto loan", app.monthlyAutoLoan),
    consumer("Installment", "Student loan", app.monthlyStudentLoan),
    consumer("Revolving", "Credit cards", app.monthlyCreditCards),
    consumer("ChildSupport", "Child support", app.monthlyChildSupport),
    consumer("Other", "Other monthly debt", app.monthlyOtherDebt),
  ].filter((l) => typeof l.monthlyPayment === "number" && l.monthlyPayment > 0);

  // The mortgage on the property being refinanced or borrowed against is a
  // liability in ULAD, not a separate loan. A refinance pays it off; a home
  // equity loan sits behind it. Its payment is known only when the property is
  // the home the applicant owns and lives in — that is the housing payment
  // they gave us.
  const balance = positive(app.currentBalance);
  if (balance && app.loanPurpose !== "purchase") {
    candidates.push({
      type: "MortgageLoan",
      description: "Current mortgage",
      unpaidBalance: balance,
      monthlyPayment:
        subjectIsResidence && app.housingStatus === "own" ? positive(app.monthlyHousingPayment) : undefined,
      excludesTaxesAndInsurance: false,
      payoff: app.loanPurpose === "refinance",
    });
  }
  return candidates;
}

function mapDemographics(d: ApplicationFormData["demographics"]): MismoDemographics | undefined {
  if (!d) return undefined;
  const ethnicityRefused = d.ethnicity === "decline";
  const raceRefused = d.races.includes("decline");
  const genderRefused = d.sex === "decline";
  return {
    ethnicityRefused,
    ethnicityType: ethnicityRefused
      ? undefined
      : d.ethnicity === "hispanic"
        ? "HispanicOrLatino"
        : "NotHispanicOrLatino",
    ethnicityOrigins:
      d.ethnicity === "hispanic" ? (d.ethnicityOrigins ?? []).map((o) => HMDA_ETHNICITY_ORIGIN[o]) : [],
    raceRefused,
    races: raceRefused ? [] : d.races.filter((r) => r !== "decline").map((r) => HMDA_RACE[r]),
    genderRefused,
    genderType: genderRefused ? undefined : d.sex === "female" ? "Female" : "Male",
  };
}

interface DeclarationAnswers {
  bankruptcy: boolean;
  foreclosure: boolean;
  outstandingJudgments: boolean;
  downPaymentBorrowed: boolean;
  primaryResidence: boolean;
  sellerRelationship?: boolean;
  undisclosedMortgageApplication?: boolean;
  undisclosedCreditApplication?: boolean;
  cleanEnergyLien?: boolean;
  coSignerOnUndisclosedDebt?: boolean;
  delinquentFederalDebt?: boolean;
  partyToLawsuit?: boolean;
  deedInLieu?: boolean;
  shortSale?: boolean;
}

function mapDeclarations(
  d: DeclarationAnswers,
  ownedHomePastThreeYears: boolean,
  isPurchase: boolean
): MismoDeclarations {
  return {
    bankruptcy: d.bankruptcy,
    priorForeclosure: d.foreclosure,
    outstandingJudgments: d.outstandingJudgments,
    undisclosedBorrowedFunds: d.downPaymentBorrowed,
    intentToOccupy: d.primaryResidence,
    homeownerPastThreeYears: ownedHomePastThreeYears ? "Yes" : "No",
    // Only asked on a purchase; there is no seller otherwise.
    sellerRelationship: isPurchase ? d.sellerRelationship : undefined,
    undisclosedMortgageApplication: d.undisclosedMortgageApplication,
    undisclosedCreditApplication: d.undisclosedCreditApplication,
    cleanEnergyLien: d.cleanEnergyLien,
    undisclosedComaker: d.coSignerOnUndisclosedDebt,
    presentlyDelinquent: d.delinquentFederalDebt,
    partyToLawsuit: d.partyToLawsuit,
    deedInLieu: d.deedInLieu,
    shortSale: d.shortSale,
  };
}

function mapEmployer(e: {
  employmentStatus: ApplicationFormData["employmentStatus"];
  employerName?: string;
  jobTitle?: string;
  employerPhone?: string;
  employmentStartDate?: string;
  yearsAtJob?: number;
  yearsInLineOfWork?: number;
  employedByPartyToTransaction?: boolean;
}): MismoEmployer | undefined {
  if (!hasEmployer(e.employmentStatus)) return undefined;
  // Time in the line of work is at least the time in this job; fall back to
  // the latter when the applicant did not give the former.
  const lineOfWorkYears = e.yearsInLineOfWork ?? e.yearsAtJob;
  return {
    name: e.employerName,
    jobTitle: e.jobTitle,
    phone: phoneDigits(e.employerPhone),
    startDate: isoDate(e.employmentStartDate),
    lineOfWorkMonths: typeof lineOfWorkYears === "number" ? monthsFromYears(lineOfWorkYears) : undefined,
    selfEmployed: isSelfEmployed(e.employmentStatus),
    specialRelationship: e.employedByPartyToTransaction,
  };
}

function primaryBorrower(app: ApplicationFormData, isPurchase: boolean): MismoBorrower {
  const owns = app.housingStatus === "own";
  const previous = presentAddress(app.previousAddress);
  return {
    classification: "Primary",
    firstName: app.firstName,
    middleName: app.middleName,
    lastName: app.lastName,
    suffixName: app.suffix,
    birthDate: isoDate(app.dateOfBirth),
    maritalStatusType: MARITAL_STATUS[app.maritalStatus],
    citizenshipType: CITIZENSHIP[app.usCitizen],
    email: app.email,
    phone: phoneDigits(app.phone) ?? app.phone,
    militaryService: app.veteran,
    dependentCount: nonNegative(app.dependentCount),
    dependentAges: parseDependentAges(app.dependentAges),
    mailingAddress: app.currentAddress,
    residence: {
      address: app.currentAddress,
      residencyBasisType: RESIDENCY_BASIS[app.housingStatus],
      durationMonths: monthsFromYears(app.yearsAtAddress),
      monthlyRentAmount: owns ? undefined : positive(app.monthlyHousingPayment),
      monthlyOwnerPayment: owns ? positive(app.monthlyHousingPayment) : undefined,
    },
    priorResidence: previous ?? undefined,
    employer: mapEmployer(app),
    incomeType: INCOME_TYPE[app.employmentStatus],
    monthlyIncome: app.monthlyIncome,
    otherIncome: (app.otherIncome ?? [])
      .filter((o) => o.type.trim() !== "" && o.amount > 0)
      .map((o) => ({ description: o.type.trim(), monthlyAmount: o.amount })),
    declarations: mapDeclarations(app, !app.firstTimeBuyer, isPurchase),
    demographics: mapDemographics(app.demographics),
  };
}

function secondaryBorrower(app: ApplicationFormData, c: CoBorrowerData, isPurchase: boolean): MismoBorrower {
  // Sharing the main applicant's home means sharing its tenure, length of stay
  // and rent. Living elsewhere, their payment was not asked.
  const shared = c.sameAddress !== false || !c.currentAddress;
  const address = shared ? app.currentAddress : c.currentAddress!;
  const housingStatus = shared ? app.housingStatus : c.housingStatus;
  const payment = shared ? app.monthlyHousingPayment : undefined;
  const owns = housingStatus === "own";
  return {
    classification: "Secondary",
    firstName: c.firstName,
    middleName: c.middleName,
    lastName: c.lastName,
    suffixName: c.suffix,
    birthDate: isoDate(c.dateOfBirth),
    maritalStatusType: MARITAL_STATUS[c.maritalStatus],
    citizenshipType: CITIZENSHIP[c.usCitizen],
    email: c.email?.trim() || undefined,
    phone: phoneDigits(c.phone) ?? (c.phone?.trim() || undefined),
    militaryService: c.veteran,
    // The wizard asks the primary borrower about dependents. A co-borrower in
    // the same household shares them, as on a joint URLA; one living elsewhere
    // was not asked, so nothing is claimed.
    dependentCount: shared ? nonNegative(app.dependentCount) : undefined,
    dependentAges: shared ? parseDependentAges(app.dependentAges) : [],
    mailingAddress: address,
    residence: {
      address,
      residencyBasisType: housingStatus ? RESIDENCY_BASIS[housingStatus] : undefined,
      durationMonths: monthsFromYears(shared ? app.yearsAtAddress : c.yearsAtAddress),
      monthlyRentAmount: owns ? undefined : positive(payment),
      monthlyOwnerPayment: owns ? positive(payment) : undefined,
    },
    employer: mapEmployer(c),
    incomeType: INCOME_TYPE[c.employmentStatus],
    monthlyIncome: c.monthlyIncome,
    otherIncome: [],
    declarations: {
      ...mapDeclarations(
        {
          ...c,
          // A co-borrower stored before these were asked of them takes the
          // main applicant's answers, as the earlier export did: both are
          // about the loan as much as the person.
          downPaymentBorrowed: c.downPaymentBorrowed ?? app.downPaymentBorrowed,
          primaryResidence: c.primaryResidence ?? app.primaryResidence,
        },
        c.ownedHomePastThreeYears ?? false,
        isPurchase
      ),
      homeownerPastThreeYears:
        typeof c.ownedHomePastThreeYears === "boolean" ? (c.ownedHomePastThreeYears ? "Yes" : "No") : undefined,
    },
    demographics: mapDemographics(c.demographics),
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
  const isPurchase = app.loanPurpose === "purchase";
  const statedProperty = presentAddress(app.propertyAddress);

  // On a purchase the current address is where the borrower lives today, not
  // the property being bought, so without a stated property address the
  // subject address is left absent rather than filled with the wrong one. On a
  // refinance or home equity loan with no stated address, the current
  // residence IS the subject property.
  const subjectAddress = statedProperty ?? (isPurchase ? null : app.currentAddress);
  const subjectIsResidence = !isPurchase && statedProperty === null;
  const termMonths = app.loanTermYears ? Number(app.loanTermYears) * 12 : undefined;

  const borrowers = [primaryBorrower(app, isPurchase)];
  if (app.coBorrower) borrowers.push(secondaryBorrower(app, app.coBorrower, isPurchase));

  return {
    referenceNumber: options.referenceNumber,
    submittedAt: options.submittedAt,

    loan: {
      purposeType: purpose.type,
      purposeOtherDescription: purpose.otherDescription,
      baseLoanAmount: app.loanAmount,
      downPayment: isPurchase ? positive(app.downPayment) : undefined,
      isRefinance: !isPurchase,
      // A home equity loan behind an existing mortgage is a second lien.
      lienPriorityType:
        app.loanPurpose === "home-equity" && positive(app.currentBalance) ? "SecondLien" : "FirstLien",
      cashOutType:
        app.loanPurpose === "refinance" && typeof app.cashOut === "boolean"
          ? app.cashOut
            ? "CashOut"
            : "NoCashOut"
          : undefined,
      mortgageType: app.loanProgram ? MORTGAGE_TYPE[app.loanProgram] : undefined,
      amortizationType: app.amortizationType
        ? app.amortizationType === "fixed"
          ? "Fixed"
          : "AdjustableRate"
        : undefined,
      termMonths,
    },

    property: {
      address: subjectAddress,
      usageType: PROPERTY_USAGE[app.propertyUse],
      profile,
      valueAmount: app.purchasePrice,
      salesContractAmount: isPurchase ? app.purchasePrice : undefined,
    },

    borrowers,
    assets: (app.bankAccounts ?? [])
      .filter((a) => a.balance > 0)
      .map((a) => ({
        type: ASSET_TYPE[a.type] ?? "Other",
        holderName: a.institution.trim() || "Unknown institution",
        amount: a.balance,
      })),
    liabilities: buildLiabilities(app, subjectIsResidence),

    originator: {
      companyName: COMPANY.legalName,
      companyNmlsId: COMPANY.nmlsId,
      companyStateLicenseId: COMPANY.stateLicenseId,
      companyAddress: COMPANY.address,
      firstName: COMPANY.broker.name.split(" ")[0],
      lastName: COMPANY.broker.name.split(" ").slice(1).join(" "),
      title: COMPANY.broker.title,
      nmlsId: COMPANY.broker.nmlsId,
      phone: phoneDigits(COMPANY.phone) ?? COMPANY.phone,
      email: COMPANY.email,
    },

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
      monthlyOwnerHousingPayment:
        app.housingStatus === "own" ? positive(app.monthlyHousingPayment) : undefined,
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
