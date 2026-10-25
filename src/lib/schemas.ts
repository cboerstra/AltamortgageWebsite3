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
 * "required" message instead of a cryptic type error. A saved draft turns
 * NaN into null (JSON has no NaN), so null is blank too.
 */
const emptyToUndef = (v: unknown) =>
  v === null || (typeof v === "number" && Number.isNaN(v)) ? undefined : v;

const requiredAmount = (msg: string) =>
  z.preprocess(emptyToUndef, z.number({ error: msg }).min(1, msg));

const requiredNonNegative = (msg: string) =>
  z.preprocess(emptyToUndef, z.number({ error: msg }).min(0, msg));

const optionalNonNegative = () =>
  z.preprocess(emptyToUndef, z.number().min(0).optional());

const debtAmount = () =>
  z.preprocess(emptyToUndef, z.number().min(0).default(0));

const answer = (msg = "Please answer this question") => z.boolean({ error: msg });

export const ETHNICITIES = ["hispanic", "not-hispanic", "decline"] as const;
export const ETHNICITY_ORIGINS = ["mexican", "puerto-rican", "cuban", "other-hispanic"] as const;
export const RACES = ["american-indian", "asian", "black", "pacific-islander", "white", "decline"] as const;
export const SEXES = ["female", "male", "decline"] as const;

/**
 * URLA Section 8, demographic information. Lenders must ask; the applicant
 * may decline each part, so "decline" is an answer, not a blank.
 */
const demographicsSchema = z.object({
  ethnicity: z.enum(ETHNICITIES, { error: "Choose one, or that you do not wish to provide it" }),
  ethnicityOrigins: z.array(z.enum(ETHNICITY_ORIGINS)).optional(),
  races: z.array(z.enum(RACES)).min(1, "Choose at least one, or that you do not wish to provide it"),
  sex: z.enum(SEXES, { error: "Choose one, or that you do not wish to provide it" }),
});

/**
 * The URLA Section 5 questions the original wizard did not ask. Each borrower
 * answers them for themselves.
 */
const urlaDeclarations = {
  /** 5a.B — family or business relationship with the seller (purchases only). */
  sellerRelationship: z.boolean().optional(),
  /** 5a.D1 — applied for a mortgage on another property not shown here. */
  undisclosedMortgageApplication: answer(),
  /** 5a.D2 — applied for new credit not shown here. */
  undisclosedCreditApplication: answer(),
  /** 5a.E — PACE / clean energy lien that will take priority over the mortgage. */
  cleanEnergyLien: answer(),
  /** 5b.F — co-signer or guarantor on a debt not shown here. */
  coSignerOnUndisclosedDebt: answer(),
  /** 5b.H — delinquent or in default on a federal debt. */
  delinquentFederalDebt: answer(),
  /** 5b.I — party to a lawsuit with possible financial liability. */
  partyToLawsuit: answer(),
  /** 5b.J — conveyed title in lieu of foreclosure in the past 7 years. */
  deedInLieu: answer(),
  /** 5b.K — pre-foreclosure or short sale in the past 7 years. */
  shortSale: answer(),
};

/** Optional versions, for payloads stored before a question was asked. */
function optional<T extends Record<string, z.ZodType>>(shape: T): { [K in keyof T]: z.ZodOptional<T[K]> } {
  return Object.fromEntries(Object.entries(shape).map(([key, schema]) => [key, schema.optional()])) as {
    [K in keyof T]: z.ZodOptional<T[K]>;
  };
}

/** The co-borrower questions added after co-borrowers were first stored. */
const coBorrowerAdditions = {
  employerPhone: z.string().optional(),
  employmentStartDate: z.string().optional(),
  yearsInLineOfWork: optionalNonNegative(),
  employedByPartyToTransaction: z.boolean().optional(),
  primaryResidence: answer("Answer for the co-borrower"),
  ownedHomePastThreeYears: answer("Answer for the co-borrower"),
  downPaymentBorrowed: answer("Answer for the co-borrower"),
  ...urlaDeclarations,
  demographics: demographicsSchema,
};

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
  // Added later, so optional on a stored co-borrower; a new submission
  // requires them (coBorrowerSubmissionSchema).
  ...optional(coBorrowerAdditions),
};

const ADDRESS_PARTS = ["street", "city", "state", "zip"] as const;
const ADDRESS_MIN: Record<(typeof ADDRESS_PARTS)[number], number> = { street: 1, city: 1, state: 2, zip: 5 };

function requireOwnAddress(
  cb: { sameAddress: boolean; currentAddress?: Record<(typeof ADDRESS_PARTS)[number], string>; housingStatus?: string },
  ctx: z.RefinementCtx
) {
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
}

// The co-borrower is answered across several steps. By default the address
// check would wait until every field is valid, so a missing address would only
// surface at submit, on a step the applicant can no longer see. Run it
// whenever there is an object to look at; it reads nothing it does not guard.
const whenObject = { when: (payload: { value: unknown }) => typeof payload.value === "object" && payload.value !== null };

export const coBorrowerSchema = z.object(coBorrowerFields).superRefine(requireOwnAddress, whenObject);

const coBorrowerSubmissionSchema = z
  .object({ ...coBorrowerFields, ...coBorrowerAdditions })
  .superRefine(requireOwnAddress, whenObject);

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
  loanProgram: z.enum(["conventional", "fha", "va", "usda", "not-sure"]).optional(),
  loanTermYears: z.enum(["30", "25", "20", "15", "10"]).optional(),
  amortizationType: z.enum(["fixed", "arm"]).optional(),
  /** Refinance only: is the borrower taking cash out? */
  cashOut: z.boolean().optional(),
  /** The property being financed, when it is not (or not yet) the current address. */
  propertyAddress: z
    .object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      county: z.string().optional(),
    })
    .optional(),
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
  dependentCount: optionalNonNegative(),
  /** Free text, e.g. "3, 7". Parsed into whole years for the MISMO document. */
  dependentAges: z.string().optional(),
  // Step 3: Employment
  employmentStatus: z.enum(["employed", "self-employed", "retired", "other"]),
  employerName: z.string().optional(),
  jobTitle: z.string().optional(),
  employerPhone: z.string().optional(),
  employmentStartDate: z.string().optional(),
  yearsAtJob: optionalNonNegative(),
  yearsInLineOfWork: optionalNonNegative(),
  /** Employed by a family member, the seller, the agent, or another party to the deal. */
  employedByPartyToTransaction: z.boolean().optional(),
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
  usCitizen: z.enum(["yes", "permanent-resident", "other"], { error: "Select a citizenship status" }),
  bankruptcy: answer(),
  foreclosure: answer(),
  outstandingJudgments: answer(),
  downPaymentBorrowed: answer(),
  primaryResidence: answer(),
  veteran: answer(),
  firstTimeBuyer: answer(),
  ...optional(urlaDeclarations),
  demographics: demographicsSchema.optional(),
  // Optional second applicant, answered across steps 2, 3, 5 and 6.
  coBorrower: coBorrowerSchema.optional(),
  // Step 6: Consent
  consentAuthorization: answer("You must authorize to continue").refine(
    (v) => v === true,
    "You must authorize to continue"
  ),
  eSignatureName: z.string().min(1, "Signature is required"),
  eSignatureDate: z.string().min(1),
});

// applicationSchema is what stored payloads are validated against, so fields
// added after applications were first stored are optional there and an older
// row still parses (and its MISMO document can be regenerated). The wizard and
// the submission endpoint use this, which requires them.
export type ApplicationFormData = z.infer<typeof applicationSchema>;

export const applicationSubmissionSchema = applicationSchema.extend({
  dependentCount: requiredNonNegative("Enter the number of dependents (0 if none)"),
  ...urlaDeclarations,
  demographics: demographicsSchema,
  coBorrower: coBorrowerSubmissionSchema.optional(),
});
