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

/**
 * A second applicant on the same loan. Answered inside the existing steps
 * (personal, employment, declarations, signature) rather than as a step of its
 * own, so step numbers saved in drafts and resume links keep their meaning.
 * Assets and debts stay household-wide on the main applicant; the co-borrower
 * signs the same authorization.
 */
export const coBorrowerFields = {
  relationship: z.enum(["spouse", "domestic-partner", "family", "other"], {
    error: "Choose how the co-borrower is related to you",
  }),
  firstName: z.string().min(1, "Enter the co-borrower's first name"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Enter the co-borrower's last name"),
  suffix: z.string().optional(),
  dateOfBirth: z.string().min(1, "Enter the co-borrower's date of birth"),
  maritalStatus: z.enum(["single", "married", "separated", "divorced", "widowed"], {
    error: "Choose the co-borrower's marital status",
  }),
  phone: z.string().optional(),
  email: z.union([z.literal(""), z.string().email("Enter a valid email")]).optional(),
  sameAddress: z.boolean(),
  currentAddress: z
    .object({ street: z.string(), city: z.string(), state: z.string(), zip: z.string() })
    .optional(),
  yearsAtAddress: optionalNonNegative(),
  housingStatus: z.enum(["own", "rent", "other"]).optional(),
  // Employment & income
  employmentStatus: z.enum(["employed", "self-employed", "retired", "other"], {
    error: "Choose the co-borrower's employment status",
  }),
  employerName: z.string().optional(),
  jobTitle: z.string().optional(),
  yearsAtJob: optionalNonNegative(),
  monthlyIncome: requiredNonNegative("Enter the co-borrower's monthly income"),
  // Declarations
  usCitizen: z.enum(["yes", "permanent-resident", "other"], {
    error: "Choose the co-borrower's citizenship status",
  }),
  bankruptcy: z.boolean({ error: "Answer for the co-borrower" }),
  foreclosure: z.boolean({ error: "Answer for the co-borrower" }),
  outstandingJudgments: z.boolean({ error: "Answer for the co-borrower" }),
  veteran: z.boolean({ error: "Answer for the co-borrower" }),
  // Signature
  eSignatureName: z.string({ error: "The co-borrower must sign" }).min(1, "The co-borrower must sign"),
};

const ADDRESS_PARTS = ["street", "city", "state", "zip"] as const;
const ADDRESS_MIN: Record<(typeof ADDRESS_PARTS)[number], number> = { street: 1, city: 1, state: 2, zip: 5 };

export const coBorrowerSchema = z.object(coBorrowerFields).superRefine(
  (cb, ctx) => {
    // Living elsewhere: the address the main applicant gave is not theirs, so
    // require their own.
    if (cb.sameAddress !== false) return;
    for (const part of ADDRESS_PARTS) {
      if ((cb.currentAddress?.[part]?.trim().length ?? 0) < ADDRESS_MIN[part]) {
        ctx.addIssue({ code: "custom", path: ["currentAddress", part], message: "Required" });
      }
    }
    if (!cb.housingStatus) {
      ctx.addIssue({ code: "custom", path: ["housingStatus"], message: "Choose a housing status" });
    }
  },
  // The co-borrower is answered across several steps. By default this check
  // would wait until every field is valid, so a missing address would only
  // surface at submit, on a step the applicant can no longer see. Run it
  // whenever there is an object to look at; it reads nothing it does not guard.
  { when: (payload) => typeof payload.value === "object" && payload.value !== null }
);

export type CoBorrowerData = z.infer<typeof coBorrowerSchema>;

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
  // Optional second applicant, answered across steps 2, 3, 5 and 6.
  coBorrower: coBorrowerSchema.optional(),
  // Step 6: Consent
  consentAuthorization: z.boolean().refine((v) => v === true, "You must authorize to continue"),
  eSignatureName: z.string().min(1, "Signature is required"),
  eSignatureDate: z.string().min(1),
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;
