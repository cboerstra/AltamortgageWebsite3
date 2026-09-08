// Normalized deal -> MISMO v3.4 (ULAD/URLA) XML.
//
// Pure. Consumes the object from map.ts and emits a string.
//
// Scope note: this is a conformant SUBSET covering the fields the wizard
// actually collects. It is a lead-quality application, not a fundable one —
// there is a single borrower, no assets, no REO schedule, and the taxpayer
// identifier is masked by policy. Validate field-level placement against the
// target LOS or the licensed v3.4 XSD before wiring it into a live import.

import { el, leaf, render, required, type XmlElement } from "./xml";
import type { MismoDeal } from "./map";

const MISMO_NS = "http://www.mismo.org/residential/2009/schemas";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const ALTA_NS = "http://altamortgagegroup.net/schemas/application/1.0";
const REFERENCE_MODEL = "3.4.0322";

const PARTY_LABEL = "Party1";
const SUBJECT_LOAN_LABEL = "Loan1";
const RELATED_LOAN_LABEL = "Loan2";

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

function contactPoints(deal: MismoDeal): XmlElement | null {
  const b = deal.borrower;
  return el("CONTACT_POINTS", undefined, [
    el("CONTACT_POINT", { SequenceNumber: 1 }, [
      el("CONTACT_POINT_EMAIL", undefined, [leaf("ContactPointEmailValue", b.email)]),
      el("CONTACT_POINT_DETAIL", undefined, [leaf("ContactPointRoleType", "Home")]),
    ]),
    b.phone
      ? el("CONTACT_POINT", { SequenceNumber: 2 }, [
          el("CONTACT_POINT_TELEPHONE", undefined, [
            leaf("ContactPointTelephoneValue", b.phone),
          ]),
          el("CONTACT_POINT_DETAIL", undefined, [leaf("ContactPointRoleType", "Mobile")]),
        ])
      : null,
  ]);
}

function declarations(deal: MismoDeal): XmlElement | null {
  const d = deal.borrower.declarations;
  return el("DECLARATION", undefined, [
    el("DECLARATION_DETAIL", undefined, [
      leaf("BankruptcyIndicator", d.bankruptcy),
      leaf("BorrowedDownPaymentIndicator", d.borrowedDownPayment),
      leaf("HomeownerPastThreeYearsType", d.homeownerPastThreeYears),
      leaf("IntentToOccupySubjectPropertyIndicator", d.intentToOccupy),
      leaf("OutstandingJudgmentsIndicator", d.outstandingJudgments),
      leaf("PriorPropertyForeclosureCompletedIndicator", d.priorForeclosure),
    ]),
  ]);
}

function employers(deal: MismoDeal): XmlElement | null {
  const e = deal.borrower.employer;
  if (!e) return null;
  return el("EMPLOYERS", undefined, [
    el("EMPLOYER", { SequenceNumber: 1 }, [
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

function currentIncome(deal: MismoDeal): XmlElement | null {
  const b = deal.borrower;
  return el("CURRENT_INCOME", undefined, [
    el("CURRENT_INCOME_ITEMS", undefined, [
      el("CURRENT_INCOME_ITEM", { SequenceNumber: 1 }, [
        el("CURRENT_INCOME_ITEM_DETAIL", undefined, [
          leaf("CurrentIncomeMonthlyTotalAmount", amount(b.monthlyIncome)),
          leaf("IncomeType", b.incomeType),
        ]),
      ]),
    ]),
  ]);
}

function liabilities(deal: MismoDeal): XmlElement | null {
  const items = deal.borrower.liabilities;
  if (items.length === 0) return null;
  return el(
    "LIABILITIES",
    undefined,
    items.map((l, index) =>
      el("LIABILITY", { SequenceNumber: index + 1 }, [
        el("LIABILITY_DETAIL", undefined, [
          leaf("LiabilityDescription", l.description),
          leaf("LiabilityMonthlyPaymentAmount", amount(l.monthlyPayment)),
          leaf("LiabilityType", l.type),
        ]),
      ])
    )
  );
}

function residences(deal: MismoDeal): XmlElement | null {
  const r = deal.borrower.residence;
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

function party(deal: MismoDeal): XmlElement {
  const b = deal.borrower;
  return required("PARTY", { "xlink:label": PARTY_LABEL, SequenceNumber: 1 }, [
    el("INDIVIDUAL", undefined, [
      el("NAME", undefined, [
        leaf("FirstName", b.firstName),
        leaf("LastName", b.lastName),
        leaf("MiddleName", b.middleName),
        leaf("SuffixName", b.suffixName),
      ]),
      contactPoints(deal),
    ]),
    el("ROLES", undefined, [
      el("ROLE", { SequenceNumber: 1 }, [
        el("BORROWER", undefined, [
          el("BORROWER_DETAIL", undefined, [
            leaf("BorrowerBirthDate", b.birthDate),
            leaf("CitizenshipResidencyType", b.citizenshipType),
            leaf("MaritalStatusType", b.maritalStatusType),
            leaf("SelfDeclaredMilitaryServiceIndicator", b.militaryService),
          ]),
          currentIncome(deal),
          declarations(deal),
          employers(deal),
          liabilities(deal),
          residences(deal),
        ]),
        el("ROLE_DETAIL", undefined, [leaf("PartyRoleType", "Borrower")]),
      ]),
    ]),
    b.ssnMasked
      ? el("TAXPAYER_IDENTIFIERS", undefined, [
          el("TAXPAYER_IDENTIFIER", undefined, [
            leaf("TaxpayerIdentifierType", "SocialSecurityNumber"),
            leaf("TaxpayerIdentifierValue", b.ssnMasked),
          ]),
        ])
      : null,
  ]);
}

function relationships(deal: MismoDeal): XmlElement | null {
  const arcs: (XmlElement | null)[] = [
    el("RELATIONSHIP", {
      SequenceNumber: 1,
      "xlink:from": PARTY_LABEL,
      "xlink:to": SUBJECT_LOAN_LABEL,
      "xlink:arcrole": "urn:fdc:Meta:2009:arcrole:PartyToLoan",
    }),
  ];
  if (deal.loan.currentBalance) {
    arcs.push(
      el("RELATIONSHIP", {
        SequenceNumber: 2,
        "xlink:from": PARTY_LABEL,
        "xlink:to": RELATED_LOAN_LABEL,
        "xlink:arcrole": "urn:fdc:Meta:2009:arcrole:PartyToLoan",
      })
    );
  }
  return el("RELATIONSHIPS", undefined, arcs);
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
        ]),
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
              subjectProperty(deal),
              required("LOANS", undefined, [subjectLoan(deal), relatedLoan(deal)]),
              required("PARTIES", undefined, [party(deal)]),
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
