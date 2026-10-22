// Normalized deal -> MISMO v3.4 (ULAD/URLA) XML.
//
// Pure. Consumes the object from map.ts and emits a string.
//
// Scope note: this is a conformant SUBSET covering the fields the wizard
// actually collects. It is a lead-quality application, not a fundable one —
// at most one co-borrower, assets and debts tied to the main applicant only,
// no REO schedule, and the taxpayer identifier is masked by policy. Validate field-level placement against the
// target LOS or the licensed v3.4 XSD before wiring it into a live import.

import { el, leaf, render, required, type XmlElement } from "./xml";
import type { MismoBorrower, MismoDeal } from "./map";

const MISMO_NS = "http://www.mismo.org/residential/2009/schemas";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const ALTA_NS = "http://altamortgagegroup.net/schemas/application/1.0";
const REFERENCE_MODEL = "3.4.0322";

/** The xlink labels and classification that tell two borrowers apart. */
interface BorrowerLabels {
  sequence: number;
  party: string;
  role: string;
  employer: string;
  /** Prefix for CURRENT_INCOME_ITEM labels; the item number is appended. */
  incomeItem: string;
  classification: "Primary" | "Secondary";
}

const PRIMARY: BorrowerLabels = {
  sequence: 1,
  party: "Party1",
  role: "BORROWER_1",
  employer: "EMPLOYER_1",
  incomeItem: "CURRENT_INCOME_ITEM_",
  classification: "Primary",
};

const SECONDARY: BorrowerLabels = {
  sequence: 2,
  party: "Party2",
  role: "BORROWER_2",
  employer: "EMPLOYER_2",
  incomeItem: "CO_BORROWER_INCOME_ITEM_",
  classification: "Secondary",
};

const BORROWER_ROLE_LABEL = PRIMARY.role;
const SUBJECT_LOAN_LABEL = "Loan1";
const RELATED_LOAN_LABEL = "Loan2";
const ULAD_ARC = "urn:fdc:mismo.org:2009:residential";

/** MISMO amounts are unformatted decimals — no separators, no currency sign. */
function amount(value: number | undefined): string | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value.toFixed(2);
}

function address(a: { street: string; city: string; state: string; zip: string }): XmlElement | null {
  return el("ADDRESS", undefined, [
    leaf("AddressLineText", a.street),
    leaf("CityName", a.city),
    leaf("CountryCode", "US"),
    leaf("PostalCode", a.zip),
    leaf("StateCode", a.state),
  ]);
}

function subjectProperty(deal: MismoDeal): XmlElement | null {
  const { profile } = deal.property;
  return el("COLLATERALS", undefined, [
    el("COLLATERAL", { SequenceNumber: 1 }, [
      el("SUBJECT_PROPERTY", undefined, [
        deal.property.address ? address(deal.property.address) : null,
        el("PROPERTY_DETAIL", undefined, [
          leaf("AttachmentType", profile.attachmentType),
          leaf("FinancedUnitCount", profile.financedUnitCount),
          leaf("ManufacturedHomeIndicator", profile.manufacturedHome),
          leaf("PropertyUsageType", deal.property.usageType),
        ]),
        profile.projectType
          ? el("PROJECT", undefined, [
              el("PROJECT_DETAIL", undefined, [leaf("ProjectType", profile.projectType)]),
            ])
          : null,
        el("PROPERTY_VALUATIONS", undefined, [
          el("PROPERTY_VALUATION", undefined, [
            el("PROPERTY_VALUATION_DETAIL", undefined, [
              leaf("PropertyValuationAmount", amount(deal.property.valueAmount)),
              // No valuation was performed — this figure is what the applicant
              // typed into the wizard. "None" is the honest method here; the
              // extension block records that it is applicant-stated.
              leaf("PropertyValuationMethodType", "None"),
            ]),
          ]),
        ]),
      ]),
    ]),
  ]);
}

function subjectLoan(deal: MismoDeal): XmlElement {
  const { loan } = deal;
  return required("LOAN", { "xlink:label": SUBJECT_LOAN_LABEL, LoanRoleType: "SubjectLoan" }, [
    el("LOAN_DETAIL", undefined, [leaf("ApplicationReceivedDate", deal.submittedAt.slice(0, 10))]),
    el("LOAN_IDENTIFIERS", undefined, [
      el("LOAN_IDENTIFIER", undefined, [
        leaf("LoanIdentifier", deal.referenceNumber),
        leaf("LoanIdentifierType", "LenderLoan"),
      ]),
    ]),
    el("TERMS_OF_LOAN", undefined, [
      leaf("BaseLoanAmount", amount(loan.baseLoanAmount)),
      leaf("LienPriorityType", "FirstLien"),
      leaf("LoanPurposeType", loan.purposeType),
      leaf("LoanPurposeTypeOtherDescription", loan.purposeOtherDescription),
    ]),
    loan.downPayment
      ? el("DOWN_PAYMENTS", undefined, [
          el("DOWN_PAYMENT", undefined, [
            leaf("DownPaymentAmount", amount(loan.downPayment)),
          ]),
        ])
      : null,
    loan.isRefinance ? el("REFINANCE", undefined, [leaf("RefinanceCashOutDeterminationType", "NoCashOut")]) : null,
  ]);
}

/**
 * The balance being refinanced is a separate loan in MISMO, not a field on the
 * subject loan. Emitted only when the applicant gave one.
 */
function relatedLoan(deal: MismoDeal): XmlElement | null {
  if (!deal.loan.currentBalance) return null;
  return el("LOAN", { "xlink:label": RELATED_LOAN_LABEL, LoanRoleType: "RelatedLoan" }, [
    el("TERMS_OF_LOAN", undefined, [
      leaf("NoteAmount", amount(deal.loan.currentBalance)),
      leaf("LienPriorityType", "FirstLien"),
    ]),
  ]);
}

function contactPoints(b: MismoBorrower): XmlElement | null {
  // The main applicant always has an email; a co-borrower may not.
  const phoneSequence = b.email ? 2 : 1;
  return el("CONTACT_POINTS", undefined, [
    b.email
      ? el("CONTACT_POINT", { SequenceNumber: 1 }, [
          el("CONTACT_POINT_EMAIL", undefined, [leaf("ContactPointEmailValue", b.email)]),
          el("CONTACT_POINT_DETAIL", undefined, [leaf("ContactPointRoleType", "Home")]),
        ])
      : null,
    b.phone
      ? el("CONTACT_POINT", { SequenceNumber: phoneSequence }, [
          el("CONTACT_POINT_TELEPHONE", undefined, [
            leaf("ContactPointTelephoneValue", b.phone),
          ]),
          el("CONTACT_POINT_DETAIL", undefined, [leaf("ContactPointRoleType", "Mobile")]),
        ])
      : null,
  ]);
}

function declarations(b: MismoBorrower): XmlElement | null {
  const d = b.declarations;
  return el("DECLARATION", undefined, [
    el("DECLARATION_DETAIL", undefined, [
      leaf("BankruptcyIndicator", d.bankruptcy),
      leaf("BorrowedDownPaymentIndicator", d.borrowedDownPayment),
      leaf("CitizenshipResidencyType", b.citizenshipType),
      leaf("HomeownerPastThreeYearsType", d.homeownerPastThreeYears),
      leaf("IntentToOccupyType", d.intentToOccupy ? "Yes" : "No"),
      leaf("OutstandingJudgmentsIndicator", d.outstandingJudgments),
      leaf("PriorPropertyForeclosureCompletedIndicator", d.priorForeclosure),
    ]),
  ]);
}

function employers(b: MismoBorrower, labels: BorrowerLabels): XmlElement | null {
  const e = b.employer;
  if (!e) return null;
  return el("EMPLOYERS", undefined, [
    el("EMPLOYER", { SequenceNumber: 1, "xlink:label": labels.employer }, [
      el("LEGAL_ENTITY", undefined, [
        el("LEGAL_ENTITY_DETAIL", undefined, [leaf("FullName", e.name)]),
      ]),
      el("EMPLOYMENT", undefined, [
        leaf("EmploymentBorrowerSelfEmployedIndicator", e.selfEmployed),
        leaf("EmploymentClassificationType", "Primary"),
        leaf("EmploymentPositionDescription", e.jobTitle),
        leaf("EmploymentStatusType", "Current"),
        leaf("EmploymentTimeInLineOfWorkMonthsCount", e.durationMonths),
      ]),
    ]),
  ]);
}

function currentIncome(b: MismoBorrower, labels: BorrowerLabels): XmlElement | null {
  const items: XmlElement[] = [
    el("CURRENT_INCOME_ITEM", { SequenceNumber: 1, "xlink:label": `${labels.incomeItem}1` }, [
      el("CURRENT_INCOME_ITEM_DETAIL", undefined, [
        leaf("CurrentIncomeMonthlyTotalAmount", amount(b.monthlyIncome)),
        leaf("EmploymentIncomeIndicator", Boolean(b.employer)),
        leaf("IncomeType", b.incomeType),
      ]),
    ]) as XmlElement,
  ];
  b.otherIncome.forEach((o, i) => {
    items.push(
      el("CURRENT_INCOME_ITEM", { SequenceNumber: i + 2, "xlink:label": `${labels.incomeItem}${i + 2}` }, [
        el("CURRENT_INCOME_ITEM_DETAIL", undefined, [
          leaf("CurrentIncomeMonthlyTotalAmount", amount(o.monthlyAmount)),
          leaf("EmploymentIncomeIndicator", false),
          leaf("IncomeType", "Other"),
          leaf("IncomeTypeOtherDescription", o.description),
        ]),
      ]) as XmlElement
    );
  });
  return el("CURRENT_INCOME", undefined, [el("CURRENT_INCOME_ITEMS", undefined, items)]);
}

// Assets and liabilities are DEAL-level in ULAD, tied to the borrower role by
// labeled relationships. Importers (DU, Arive) read them there, not inside
// BORROWER.
function assets(deal: MismoDeal): XmlElement | null {
  const items = deal.borrower.assets;
  if (items.length === 0) return null;
  return el(
    "ASSETS",
    undefined,
    items.map((a, index) =>
      el("ASSET", { SequenceNumber: index + 1, "xlink:label": `ASSET_${index + 1}` }, [
        el("ASSET_DETAIL", undefined, [
          leaf("AssetCashOrMarketValueAmount", amount(a.amount)),
          leaf("AssetType", a.type),
        ]),
        el("ASSET_HOLDER", undefined, [el("NAME", undefined, [leaf("FullName", a.holderName)])]),
      ])
    )
  );
}

function liabilities(deal: MismoDeal): XmlElement | null {
  const items = deal.borrower.liabilities;
  if (items.length === 0) return null;
  return el(
    "LIABILITIES",
    undefined,
    items.map((l, index) =>
      el("LIABILITY", { SequenceNumber: index + 1, "xlink:label": `LIABILITY_${index + 1}` }, [
        el("LIABILITY_DETAIL", undefined, [
          leaf("LiabilityDescription", l.description),
          leaf("LiabilityExclusionIndicator", false),
          leaf("LiabilityMonthlyPaymentAmount", amount(l.monthlyPayment)),
          leaf("LiabilityPayoffStatusIndicator", false),
          leaf("LiabilityType", l.type),
        ]),
        el("LIABILITY_HOLDER", undefined, [el("NAME", undefined, [leaf("FullName", l.description)])]),
      ])
    )
  );
}

function residences(b: MismoBorrower): XmlElement | null {
  const r = b.residence;
  return el("RESIDENCES", undefined, [
    el("RESIDENCE", { SequenceNumber: 1 }, [
      address(r.address),
      el("RESIDENCE_DETAIL", undefined, [
        leaf("BorrowerResidencyBasisType", r.residencyBasisType),
        leaf("BorrowerResidencyDurationMonthsCount", r.durationMonths || undefined),
        leaf("BorrowerResidencyType", "Current"),
        leaf("MonthlyRentAmount", amount(r.monthlyRentAmount)),
      ]),
    ]),
  ]);
}

function party(b: MismoBorrower, labels: BorrowerLabels): XmlElement {
  return required("PARTY", { "xlink:label": labels.party, SequenceNumber: labels.sequence }, [
    // Schema sequence: CONTACT_POINTS precedes NAME. A validating importer
    // drops the whole INDIVIDUAL — and with it the borrower — if reversed.
    el("INDIVIDUAL", undefined, [
      contactPoints(b),
      el("NAME", undefined, [
        leaf("FirstName", b.firstName),
        leaf("FullName", [b.firstName, b.middleName, b.lastName, b.suffixName].filter(Boolean).join(" ")),
        leaf("LastName", b.lastName),
        leaf("MiddleName", b.middleName),
        leaf("SuffixName", b.suffixName),
      ]),
    ]),
    el("ROLES", undefined, [
      el("ROLE", { SequenceNumber: 1, "xlink:label": labels.role }, [
        el("BORROWER", undefined, [
          el("BORROWER_DETAIL", undefined, [
            leaf("BorrowerBirthDate", b.birthDate),
            // Importers (Arive, Encompass) locate the primary borrower by this.
            leaf("BorrowerClassificationType", labels.classification),
            leaf("MaritalStatusType", b.maritalStatusType),
            leaf("SelfDeclaredMilitaryServiceIndicator", b.militaryService),
          ]),
          currentIncome(b, labels),
          declarations(b),
          employers(b, labels),
          residences(b),
        ]),
        el("ROLE_DETAIL", undefined, [leaf("PartyRoleType", "Borrower")]),
      ]),
    ]),
    // No TAXPAYER_IDENTIFIERS: the site does not collect the SSN, and a
    // masked value is not a valid TaxpayerIdentifierValue.
  ]);
}

function relationships(deal: MismoDeal): XmlElement | null {
  const arcs: { from: string; to: string; arcrole: string }[] = [];
  const b = deal.borrower;
  b.assets.forEach((_, i) =>
    arcs.push({ from: `ASSET_${i + 1}`, to: BORROWER_ROLE_LABEL, arcrole: `${ULAD_ARC}/ASSET_IsAssociatedWith_ROLE` })
  );
  b.liabilities.forEach((_, i) =>
    arcs.push({ from: `LIABILITY_${i + 1}`, to: BORROWER_ROLE_LABEL, arcrole: `${ULAD_ARC}/LIABILITY_IsAssociatedWith_ROLE` })
  );
  const borrowers: [MismoBorrower, BorrowerLabels][] = [[b, PRIMARY]];
  if (deal.coBorrower) borrowers.push([deal.coBorrower, SECONDARY]);
  for (const [borrower, labels] of borrowers) {
    if (borrower.employer) {
      arcs.push({ from: `${labels.incomeItem}1`, to: labels.employer, arcrole: `${ULAD_ARC}/CURRENT_INCOME_ITEM_IsAssociatedWith_EMPLOYER` });
    }
  }
  for (const [, labels] of borrowers) {
    arcs.push({ from: labels.party, to: SUBJECT_LOAN_LABEL, arcrole: "urn:fdc:Meta:2009:arcrole:PartyToLoan" });
    if (deal.loan.currentBalance) {
      arcs.push({ from: labels.party, to: RELATED_LOAN_LABEL, arcrole: "urn:fdc:Meta:2009:arcrole:PartyToLoan" });
    }
  }
  return el(
    "RELATIONSHIPS",
    undefined,
    arcs.map((a, i) =>
      el("RELATIONSHIP", { SequenceNumber: i + 1, "xlink:from": a.from, "xlink:to": a.to, "xlink:arcrole": a.arcrole })
    )
  );
}

/**
 * Everything the wizard captures that v3.4 has no home for: the applicant's
 * own words for collapsed enumerations, the self-reported credit bucket, and
 * the consent and e-signature that make this a signed submission.
 */
function extension(deal: MismoDeal): XmlElement | null {
  const x = deal.extension;
  return el("EXTENSION", undefined, [
    el("OTHER", undefined, [
      el("alta:APPLICATION_METADATA", { "xmlns:alta": ALTA_NS }, [
        leaf("alta:ReferenceNumber", deal.referenceNumber),
        leaf("alta:SubmittedDatetime", deal.submittedAt),
        leaf("alta:SourcePage", x.sourcePage),
        leaf("alta:LoanPurposeLabel", x.loanPurposeLabel),
        leaf("alta:PropertyTypeLabel", x.propertyTypeLabel),
        leaf("alta:PropertyUseLabel", x.propertyUseLabel),
        leaf("alta:MaritalStatusLabel", x.maritalStatusLabel),
        leaf("alta:CitizenshipLabel", x.citizenshipLabel),
        leaf("alta:EmploymentStatusLabel", x.employmentStatusLabel),
        leaf("alta:EmployerName", x.employerName),
        leaf("alta:HousingStatusLabel", x.housingStatusLabel),
        leaf("alta:MonthlyOwnerHousingPayment", amount(deal.borrower.residence.monthlyOwnerPayment)),
        leaf("alta:SelfReportedCreditScoreRange", x.creditScoreRangeLabel),
        leaf("alta:FirstTimeHomebuyerIndicator", x.firstTimeHomebuyer),
        leaf("alta:VeteranIndicator", x.veteran),
        leaf("alta:TaxpayerIdentifierLastFour", x.ssnLast4),
        el("alta:CONSENT", undefined, [
          leaf("alta:AuthorizationGivenIndicator", x.consentGiven),
          leaf("alta:ElectronicSignatureName", x.eSignatureName),
          leaf("alta:ElectronicSignatureDate", x.eSignatureDate),
          leaf("alta:CoBorrowerElectronicSignatureName", x.coBorrower?.eSignatureName),
        ]),
        x.coBorrower
          ? el("alta:CO_BORROWER", undefined, [
              leaf("alta:RelationshipToBorrowerLabel", x.coBorrower.relationshipLabel),
              leaf("alta:MaritalStatusLabel", x.coBorrower.maritalStatusLabel),
              leaf("alta:CitizenshipLabel", x.coBorrower.citizenshipLabel),
              leaf("alta:EmploymentStatusLabel", x.coBorrower.employmentStatusLabel),
              leaf("alta:EmployerName", x.coBorrower.employerName),
              leaf("alta:VeteranIndicator", x.coBorrower.veteran),
            ])
          : null,
      ]),
    ]),
  ]);
}

export function buildMismoXml(deal: MismoDeal): string {
  const root = required(
    "MESSAGE",
    {
      xmlns: MISMO_NS,
      "xmlns:xlink": XLINK_NS,
      MISMOReferenceModelIdentifier: REFERENCE_MODEL,
    },
    [
      el("ABOUT_VERSIONS", undefined, [
        el("ABOUT_VERSION", undefined, [
          leaf("AboutVersionIdentifier", REFERENCE_MODEL),
          leaf("CreatedDatetime", deal.submittedAt),
        ]),
      ]),
      required("DEAL_SETS", undefined, [
        required("DEAL_SET", { SequenceNumber: 1 }, [
          required("DEALS", undefined, [
            required("DEAL", { SequenceNumber: 1 }, [
              assets(deal),
              subjectProperty(deal),
              liabilities(deal),
              required("LOANS", undefined, [subjectLoan(deal), relatedLoan(deal)]),
              required("PARTIES", undefined, [
                party(deal.borrower, PRIMARY),
                deal.coBorrower ? party(deal.coBorrower, SECONDARY) : null,
              ]),
              relationships(deal),
            ]),
          ]),
        ]),
      ]),
      extension(deal),
    ]
  );

  return render(root);
}
