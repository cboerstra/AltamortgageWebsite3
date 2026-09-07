import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  loanPurpose: z.enum(["purchase", "refinance", "home-equity", "cash-out"]),
  estimatedAmount: z.string().optional(),
  preferredContact: z.enum(["phone", "email", "text"]).optional(),
  bestTimeToCall: z.string().optional(),
  source: z.string().optional(),
  utm: z.record(z.string(), z.string()).optional(),
  timestamp: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

export const preApprovalSchema = z.object({
  // Step 1: Personal
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  // Step 2: Loan Details
  loanPurpose: z.enum(["purchase", "refinance", "home-equity"]),
  estimatedAmount: z.string().min(1, "Estimated amount is required"),
  timeline: z.enum(["asap", "1-3months", "3-6months", "6-12months", "justLooking"]),
  // Step 3: Property
  propertyType: z.enum(["single-family", "condo", "townhome", "multi-family", "manufactured"]),
  propertyZip: z.string().min(5, "Valid zip code is required"),
  firstTimeBuyer: z.enum(["yes", "no"]),
});

export type PreApprovalFormData = z.infer<typeof preApprovalSchema>;

/**
 * Empty <input type="number"> fields registered with valueAsNumber produce
 * NaN, which fails z.number() even on optional fields. Coerce NaN -> undefined
 * so optional fields can be left blank and required fields show a friendly
 * "required" message instead of a cryptic type error.
 */
const emptyToUndef = (v: unknown) =>
  typeof v === "number" && Number.isNaN(v) ? undefined : v;

const requiredAmount = (msg: string) =>
  z.preprocess(emptyToUndef, z.number({ error: msg }).min(1, msg));

const requiredNonNegative = (msg: string) =>
  z.preprocess(emptyToUndef, z.number({ error: msg }).min(0, msg));

const optionalNonNegative = () =>
  z.preprocess(emptyToUndef, z.number().min(0).optional());

const debtAmount = () =>
  z.preprocess(emptyToUndef, z.number().min(0).default(0));

export const applicationSchema = z.object({
  // Step 1: Loan Info
  loanPurpose: z.enum(["purchase", "refinance", "home-equity"]),
  propertyType: z.enum(["single-family", "condo", "townhome", "multi-family", "manufactured"]),
  propertyUse: z.enum(["primary", "secondary", "investment"]),
  purchasePrice: requiredAmount("Enter the purchase price or estimated property value"),
  loanAmount: requiredAmount("Enter the loan amount"),
  downPayment: optionalNonNegative(),
  currentBalance: optionalNonNegative(),
  // Step 2: Personal
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  suffix: z.string().optional(),
  dateOfBirth: z.string().min(1),
  ssn: z.string().optional(),
  maritalStatus: z.enum(["single", "married", "separated", "divorced", "widowed"]),
  phone: z.string().min(10),
  email: z.string().email(),
  currentAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(2),
    zip: z.string().min(5),
  }),
  yearsAtAddress: requiredNonNegative("Enter years at this address"),
  previousAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
  }).optional(),
  housingStatus: z.enum(["own", "rent", "other"]),
  monthlyHousingPayment: requiredNonNegative("Enter your monthly housing payment"),
  // Step 3: Employment
  employmentStatus: z.enum(["employed", "self-employed", "retired", "other"]),
  employerName: z.string().optional(),
  jobTitle: z.string().optional(),
  yearsAtJob: optionalNonNegative(),
  monthlyIncome: requiredNonNegative("Enter your monthly income"),
  previousEmployer: z.string().optional(),
  otherIncome: z.array(z.object({ type: z.string(), amount: z.number() })).optional(),
  // Step 4: Assets
  bankAccounts: z.array(z.object({ institution: z.string(), type: z.string(), balance: z.number() })).optional(),
  monthlyAutoLoan: debtAmount(),
  monthlyStudentLoan: debtAmount(),
  monthlyCreditCards: debtAmount(),
  monthlyChildSupport: debtAmount(),
  monthlyOtherDebt: debtAmount(),
  creditScoreRange: z.enum(["excellent", "good", "fair", "below-fair", "not-sure"]),
  // Step 5: Declarations
  usCitizen: z.enum(["yes", "permanent-resident", "other"]),
  bankruptcy: z.boolean(),
  foreclosure: z.boolean(),
  outstandingJudgments: z.boolean(),
  downPaymentBorrowed: z.boolean(),
  primaryResidence: z.boolean(),
  veteran: z.boolean(),
  firstTimeBuyer: z.boolean(),
  // Step 6: Consent
  consentAuthorization: z.boolean().refine((v) => v === true, "You must authorize to continue"),
  eSignatureName: z.string().min(1, "Signature is required"),
  eSignatureDate: z.string().min(1),
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;
