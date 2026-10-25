// Normalized deal -> MISMO v3.4 (ULAD/URLA) XML.
//
// Pure. Consumes the object from map.ts and emits a string.
//
// The layout follows the DU-wrapper 3.4 document ARIVE itself exports (its
// "MISMO 3.4" download): the same namespaces and reference model, DEAL-level
// assets and liabilities tied to borrower roles by labeled RELATIONSHIPs,
// rent under LANDLORD, the newer declarations and HMDA ethnicity/sex in their
// ULAD extensions, and loan originator parties. MISMO containers and data
// points are xsd:sequences in alphabetical order; a validating importer drops
// an element that is out of order, so the order below is deliberate.
//
// Scope note: this is a lead-quality application, not a fundable one. There
// is no REO schedule and no taxpayer identifier (the site does not collect
// the SSN), and everything the loan officer prices — rate, fees, housing
// expenses — is left for the LOS.

import { el, leaf, render, required, type XmlElement } from "./xml";
import { constructionMethod, isCommunityPropertyState } from "./enums";
import type { MismoAddress, MismoBorrower, MismoDeal } from "./map";

const MISMO_NS = "http://www.mismo.org/residential/2009/schemas";
const DU_NS = "http://www.datamodelextension.org/Schema/DU";
const ULAD_NS = "http://www.datamodelextension.org/Schema/ULAD";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const XSI_NS = "http://www.w3.org/2001/XMLSchema-instance";
const SCHEMA_LOCATION = `${MISMO_NS} DU_Wrapper_3.4.0_B324.xsd`;
const ALTA_NS = "http://altamortgagegroup.net/schemas/application/1.0";
const REFERENCE_MODEL = "3.4.032420160128";

const SUBJECT_LOAN_LABEL = "LOAN_1";
const ULAD_ARC = "urn:fdc:mismo.org:2009:residential";

/** MISMO amounts are unformatted decimals — no separators, no currency sign. */
function amount(value: number | undefined): string | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value.toFixed(2);
}

const roleLabel = (index: number) => `BORROWER_${index + 1}`;

/**
 * Labels are document-wide, so a co-borrower's employer and income items are
 * numbered after the primary borrower's.
 */
interface BorrowerLabels {
  role: string;
  employer?: string;
  incomeItems: string[];
}

function assignLabels(deal: MismoDeal): BorrowerLabels[] {
  let employers = 0;
  let incomeItems = 0;
  return deal.borrowers.map((b, i) => ({
    role: roleLabel(i),
    employer: b.employer ? `EMPLOYER_${++employers}` : undefined,
    incomeItems: Array.from({ length: 1 + b.otherIncome.length }, () => `CURRENT_INCOME_ITEM_${++incomeItems}`),
  }));
}

function address(a: MismoAddress, opts: { type?: string; country?: boolean; county?: boolean } = {}): XmlElement | null {
  return el("ADDRESS", undefined, [
    leaf("AddressLineText", a.street),
    leaf("AddressType", opts.type),
    leaf("CityName", a.city),
    leaf("CountryCode", "US"),
    opts.country ? leaf("CountryName", "United States") : null,
    opts.county ? leaf("CountyName", a.county) : null,
    leaf("PostalCode", a.zip),
    leaf("StateCode", a.state),
  ]);
}

function telephone(seq: number, value: string | undefined, role: string): XmlElement | null {
  if (!value) return null;
  return el("CONTACT_POINT", { SequenceNumber: seq }, [
    el("CONTACT_POINT_TELEPHONE", undefined, [leaf("ContactPointTelephoneValue", value)]),
    el("CONTACT_POINT_DETAIL", undefined, [leaf("ContactPointRoleType", role)]),
  ]);
}

// ---- DEAL-level containers -------------------------------------------------

// Assets and liabilities are DEAL-level in ULAD, tied to the borrower role by
// labeled relationships. Importers (DU, Arive) read them there, not inside
// BORROWER.
function assets(deal: MismoDeal): XmlElement | null {
  if (deal.assets.length === 0) return null;
  return el(
    "ASSETS",
    undefined,
    deal.assets.map((a, index) =>
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

function subjectProperty(deal: MismoDeal): XmlElement | null {
  const { profile, address: subject } = deal.property;
  return el("COLLATERALS", undefined, [
    el("COLLATERAL", undefined, [
      el("SUBJECT_PROPERTY", { SequenceNumber: 1 }, [
        subject ? address(subject, { country: true, county: true }) : null,
        profile.projectType
          ? el("PROJECT", undefined, [
              el("PROJECT_DETAIL", undefined, [leaf("ProjectType", profile.projectType)]),
            ])
          : null,
        el("PROPERTY_DETAIL", undefined, [
          leaf("AttachmentType", profile.attachmentType),
          leaf("CommunityPropertyStateIndicator", subject ? isCommunityPropertyState(subject.state) : undefined),
          leaf("ConstructionMethodType", constructionMethod(profile)),
          leaf("FinancedUnitCount", profile.financedUnitCount),
          leaf("PropertyEstimatedValueAmount", amount(deal.property.valueAmount)),
          // Known to be in a project only for a condominium; otherwise unknown.
          leaf("PropertyInProjectIndicator", profile.projectType ? true : undefined),
          leaf("PropertyUsageType", deal.property.usageType),
        ]),
        el("PROPERTY_VALUATIONS", undefined, [
          el("PROPERTY_VALUATION", undefined, [
            el("PROPERTY_VALUATION_DETAIL", undefined, [
              leaf("PropertyValuationAmount", amount(deal.property.valueAmount)),
              // No valuation was performed — this figure is what the applicant
              // typed into the wizard. "None" is the honest method here.
              leaf("PropertyValuationMethodType", "None"),
            ]),
          ]),
        ]),
        deal.property.salesContractAmount
          ? el("SALES_CONTRACTS", undefined, [
              el("SALES_CONTRACT", undefined, [
                el("SALES_CONTRACT_DETAIL", undefined, [
                  leaf("SalesContractAmount", amount(deal.property.salesContractAmount)),
                ]),
              ]),
            ])
          : null,
      ]),
    ]),
  ]);
}

function liabilities(deal: MismoDeal): XmlElement | null {
  if (deal.liabilities.length === 0) return null;
  return el(
    "LIABILITIES",
    undefined,
    deal.liabilities.map((l, index) =>
      el("LIABILITY", { SequenceNumber: index + 1, "xlink:label": `LIABILITY_${index + 1}` }, [
        el("LIABILITY_DETAIL", undefined, [
          leaf("LiabilityDescription", l.description),
          leaf("LiabilityExclusionIndicator", false),
          leaf("LiabilityMonthlyPaymentAmount", amount(l.monthlyPayment)),
          leaf("LiabilityPaymentIncludesTaxesInsuranceIndicator", l.excludesTaxesAndInsurance ? false : undefined),
          leaf("LiabilityPayoffStatusIndicator", l.payoff),
          leaf("LiabilityType", l.type),
          leaf("LiabilityUnpaidBalanceAmount", amount(l.unpaidBalance)),
        ]),
        el("LIABILITY_HOLDER", undefined, [el("NAME", undefined, [leaf("FullName", l.description)])]),
      ])
    )
  );
}

function subjectLoan(deal: MismoDeal): XmlElement {
  const { loan } = deal;
  return required("LOAN", { LoanRoleType: "SubjectLoan", "xlink:label": SUBJECT_LOAN_LABEL, SequenceNumber: 1 }, [
    el("AMORTIZATION", undefined, [
      el("AMORTIZATION_RULE", undefined, [
        leaf("AmortizationType", loan.amortizationType),
        leaf("LoanAmortizationMaximumTermMonthsCount", loan.termMonths),
        leaf("LoanAmortizationPeriodCount", loan.termMonths),
        leaf("LoanAmortizationPeriodType", loan.termMonths ? "Month" : undefined),
      ]),
    ]),
    el("DOCUMENT_SPECIFIC_DATA_SETS", undefined, [
      el("DOCUMENT_SPECIFIC_DATA_SET", { SequenceNumber: 1 }, [
        el("URLA", undefined, [
          el("URLA_DETAIL", undefined, [leaf("ApplicationTakenMethodType", "Internet")]),
        ]),
      ]),
    ]),
    loan.downPayment
      ? el("DOWN_PAYMENTS", undefined, [
          el("DOWN_PAYMENT", undefined, [leaf("DownPaymentAmount", amount(loan.downPayment))]),
        ])
      : null,
    el("LOAN_DETAIL", undefined, [leaf("ApplicationReceivedDate", deal.submittedAt.slice(0, 10))]),
    el("LOAN_IDENTIFIERS", undefined, [
      el("LOAN_IDENTIFIER", { SequenceNumber: 1 }, [
        leaf("LoanIdentifier", deal.referenceNumber),
        leaf("LoanIdentifierType", "LenderLoan"),
      ]),
    ]),
    loan.cashOutType
      ? el("REFINANCE", undefined, [leaf("RefinanceCashOutDeterminationType", loan.cashOutType)])
      : null,
    el("TERMS_OF_LOAN", undefined, [
      leaf("BaseLoanAmount", amount(loan.baseLoanAmount)),
      leaf("LienPriorityType", loan.lienPriorityType),
      leaf("LoanPurposeType", loan.purposeType),
      leaf("LoanPurposeTypeOtherDescription", loan.purposeOtherDescription),
      leaf("MortgageType", loan.mortgageType),
      leaf("NoteAmount", amount(loan.baseLoanAmount)),
    ]),
  ]);
}

// ---- Borrower ---------------------------------------------------------------

function currentIncome(b: MismoBorrower, labels: BorrowerLabels): XmlElement | null {
  const items: (XmlElement | null)[] = [
    el("CURRENT_INCOME_ITEM", { SequenceNumber: 1, "xlink:label": labels.incomeItems[0] }, [
      el("CURRENT_INCOME_ITEM_DETAIL", undefined, [
        leaf("CurrentIncomeMonthlyTotalAmount", amount(b.monthlyIncome)),
        leaf("EmploymentIncomeIndicator", Boolean(b.employer)),
        leaf("IncomeType", b.incomeType),
      ]),
    ]),
  ];
  b.otherIncome.forEach((o, i) => {
    items.push(
      el("CURRENT_INCOME_ITEM", { SequenceNumber: i + 2, "xlink:label": labels.incomeItems[i + 1] }, [
        el("CURRENT_INCOME_ITEM_DETAIL", undefined, [
          leaf("CurrentIncomeMonthlyTotalAmount", amount(o.monthlyAmount)),
          leaf("EmploymentIncomeIndicator", false),
          leaf("IncomeType", "Other"),
          leaf("IncomeTypeOtherDescription", o.description),
        ]),
      ])
    );
  });
  return el("CURRENT_INCOME", undefined, [el("CURRENT_INCOME_ITEMS", undefined, items)]);
}

function declarations(b: MismoBorrower): XmlElement | null {
  const d = b.declarations;
  return el("DECLARATION", undefined, [
    el("DECLARATION_DETAIL", undefined, [
      leaf("BankruptcyIndicator", d.bankruptcy),
      leaf("CitizenshipResidencyType", b.citizenshipType),
      leaf("HomeownerPastThreeYearsType", d.homeownerPastThreeYears),
      leaf("IntentToOccupyType", d.intentToOccupy ? "Yes" : "No"),
      leaf("OutstandingJudgmentsIndicator", d.outstandingJudgments),
      leaf("PartyToLawsuitIndicator", d.partyToLawsuit),
      leaf("PresentlyDelinquentIndicator", d.presentlyDelinquent),
      leaf("PriorPropertyDeedInLieuConveyedIndicator", d.deedInLieu),
      leaf("PriorPropertyForeclosureCompletedIndicator", d.priorForeclosure),
      leaf("PriorPropertyShortSaleCompletedIndicator", d.shortSale),
      leaf("PropertyProposedCleanEnergyLienIndicator", d.cleanEnergyLien),
      leaf("UndisclosedBorrowedFundsIndicator", d.undisclosedBorrowedFunds),
      leaf("UndisclosedComakerOfNoteIndicator", d.undisclosedComaker),
      leaf("UndisclosedCreditApplicationIndicator", d.undisclosedCreditApplication),
      leaf("UndisclosedMortgageApplicationIndicator", d.undisclosedMortgageApplication),
      el("EXTENSION", undefined, [
        el("OTHER", undefined, [
          el("ULAD:DECLARATION_DETAIL_EXTENSION", undefined, [
            leaf("ULAD:SpecialBorrowerSellerRelationshipIndicator", d.sellerRelationship),
          ]),
        ]),
      ]),
    ]),
  ]);
}

function dependents(b: MismoBorrower): XmlElement | null {
  return el(
    "DEPENDENTS",
    undefined,
    b.dependentAges.map((age) => el("DEPENDENT", undefined, [leaf("DependentAgeYearsCount", age)]))
  );
}

function employers(b: MismoBorrower, labels: BorrowerLabels): XmlElement | null {
  const e = b.employer;
  if (!e || !labels.employer) return null;
  return el("EMPLOYERS", undefined, [
    el("EMPLOYER", { SequenceNumber: 1, "xlink:label": labels.employer }, [
      el("LEGAL_ENTITY", undefined, [
        el("CONTACTS", undefined, [
          el("CONTACT", undefined, [el("CONTACT_POINTS", undefined, [telephone(1, e.phone, "Work")])]),
        ]),
        el("LEGAL_ENTITY_DETAIL", undefined, [leaf("FullName", e.name)]),
      ]),
      el("EMPLOYMENT", undefined, [
        leaf("EmploymentBorrowerSelfEmployedIndicator", e.selfEmployed),
        leaf("EmploymentClassificationType", "Primary"),
        leaf("EmploymentPositionDescription", e.jobTitle),
        leaf("EmploymentStartDate", e.startDate),
        leaf("EmploymentStatusType", "Current"),
        leaf("EmploymentTimeInLineOfWorkMonthsCount", e.lineOfWorkMonths),
        leaf("SpecialBorrowerEmployerRelationshipIndicator", e.specialRelationship),
      ]),
    ]),
  ]);
}

/**
 * HMDA demographic information. The application is taken online, so nothing
 * was collected by visual observation. Sex and ethnicity live in ULAD
 * extensions in this version of the model, as in ARIVE's own export.
 */
function governmentMonitoring(b: MismoBorrower): XmlElement | null {
  const d = b.demographics;
  if (!d) return null;
  return el("GOVERNMENT_MONITORING", undefined, [
    el("GOVERNMENT_MONITORING_DETAIL", undefined, [
      leaf("HMDAEthnicityCollectedBasedOnVisualObservationOrSurnameIndicator", false),
      leaf("HMDAEthnicityRefusalIndicator", d.ethnicityRefused),
      leaf("HMDAGenderCollectedBasedOnVisualObservationOrNameIndicator", false),
      leaf("HMDAGenderRefusalIndicator", d.genderRefused),
      leaf("HMDARaceCollectedBasedOnVisualObservationOrSurnameIndicator", false),
      leaf("HMDARaceRefusalIndicator", d.raceRefused),
      el("EXTENSION", undefined, [
        el("OTHER", undefined, [
          el("ULAD:GOVERNMENT_MONITORING_DETAIL_EXTENSION", undefined, [
            leaf("ULAD:ApplicationTakenMethodType", "Internet"),
            leaf("ULAD:HMDAGenderType", d.genderType),
          ]),
        ]),
      ]),
    ]),
    el(
      "HMDA_ETHNICITY_ORIGINS",
      undefined,
      d.ethnicityOrigins.map((o, i) =>
        el("HMDA_ETHNICITY_ORIGIN", { SequenceNumber: i + 1 }, [leaf("HMDAEthnicityOriginType", o)])
      )
    ),
    el(
      "HMDA_RACES",
      undefined,
      d.races.map((r, i) =>
        el("HMDA_RACE", { SequenceNumber: i + 1 }, [el("HMDA_RACE_DETAIL", undefined, [leaf("HMDARaceType", r)])])
      )
    ),
    d.ethnicityType
      ? el("EXTENSION", undefined, [
          el("OTHER", undefined, [
            el("ULAD:GOVERNMENT_MONITORING_EXTENSION", undefined, [
              el("ULAD:HMDA_ETHNICITIES", undefined, [
                el("ULAD:HMDA_ETHNICITY", undefined, [leaf("ULAD:HMDAEthnicityType", d.ethnicityType)]),
              ]),
            ]),
          ]),
        ])
      : null,
  ]);
}

function residences(b: MismoBorrower): XmlElement | null {
  const r = b.residence;
  return el("RESIDENCES", undefined, [
    el("RESIDENCE", { SequenceNumber: 1 }, [
      address(r.address),
      // ULAD carries rent on the landlord, not on the residence.
      r.monthlyRentAmount
        ? el("LANDLORD", undefined, [
            el("LANDLORD_DETAIL", undefined, [leaf("MonthlyRentAmount", amount(r.monthlyRentAmount))]),
          ])
        : null,
      el("RESIDENCE_DETAIL", undefined, [
        leaf("BorrowerResidencyBasisType", r.residencyBasisType),
        leaf("BorrowerResidencyDurationMonthsCount", r.durationMonths || undefined),
        leaf("BorrowerResidencyType", "Current"),
      ]),
    ]),
    b.priorResidence
      ? el("RESIDENCE", { SequenceNumber: 2 }, [
          address(b.priorResidence),
          el("RESIDENCE_DETAIL", undefined, [leaf("BorrowerResidencyType", "Prior")]),
        ])
      : null,
  ]);
}

function borrowerParty(b: MismoBorrower, index: number, labels: BorrowerLabels): XmlElement {
  return required("PARTY", { SequenceNumber: index + 1 }, [
    // Schema sequence: CONTACT_POINTS precedes NAME. A validating importer
    // drops the whole INDIVIDUAL — and with it the borrower — if reversed.
    el("INDIVIDUAL", undefined, [
      // The main applicant always has an email; a co-borrower may not.
      el("CONTACT_POINTS", undefined, [
        b.email
          ? el("CONTACT_POINT", { SequenceNumber: 1 }, [
              el("CONTACT_POINT_EMAIL", undefined, [leaf("ContactPointEmailValue", b.email)]),
            ])
          : null,
        telephone(b.email ? 2 : 1, b.phone, "Mobile"),
      ]),
      el("NAME", undefined, [
        leaf("FirstName", b.firstName),
        leaf("FullName", [b.firstName, b.middleName, b.lastName, b.suffixName].filter(Boolean).join(" ")),
        leaf("LastName", b.lastName),
        leaf("MiddleName", b.middleName),
        leaf("SuffixName", b.suffixName),
      ]),
    ]),
    el("ADDRESSES", undefined, [address(b.mailingAddress, { type: "Mailing" })]),
    el("ROLES", undefined, [
      el("ROLE", { SequenceNumber: 1, "xlink:label": labels.role }, [
        el("BORROWER", undefined, [
          el("BORROWER_DETAIL", undefined, [
            leaf("BorrowerBirthDate", b.birthDate),
            // Importers (Arive, Encompass) locate the primary borrower by this.
            leaf("BorrowerClassificationType", b.classification),
            leaf("CommunityPropertyStateResidentIndicator", isCommunityPropertyState(b.residence.address.state)),
            leaf("DependentCount", b.dependentCount),
            leaf("MaritalStatusType", b.maritalStatusType),
            leaf("SelfDeclaredMilitaryServiceIndicator", b.militaryService),
          ]),
          currentIncome(b, labels),
          declarations(b),
          dependents(b),
          employers(b, labels),
          governmentMonitoring(b),
          residences(b),
        ]),
        el("ROLE_DETAIL", undefined, [leaf("PartyRoleType", "Borrower")]),
      ]),
    ]),
    // No TAXPAYER_IDENTIFIERS: the site does not collect the SSN, and a
    // masked value is not a valid TaxpayerIdentifierValue.
  ]);
}

// ---- Originator ---------------------------------------------------------------

function originatorParties(deal: MismoDeal, firstSequence: number): XmlElement[] {
  const o = deal.originator;
  const company = required("PARTY", { SequenceNumber: firstSequence }, [
    el("LEGAL_ENTITY", undefined, [el("LEGAL_ENTITY_DETAIL", undefined, [leaf("FullName", o.companyName)])]),
    el("ADDRESSES", undefined, [address(o.companyAddress, { type: "Mailing" })]),
    el("ROLES", undefined, [
      el("ROLE", { SequenceNumber: 1, "xlink:label": "LOAN_ORIGINATION_COMPANY_1" }, [
        el("LICENSES", undefined, [
          el("LICENSE", { SequenceNumber: 1 }, [
            el("LICENSE_DETAIL", undefined, [
              leaf("LicenseAuthorityLevelType", "Private"),
              leaf("LicenseIdentifier", o.companyNmlsId),
            ]),
          ]),
          el("LICENSE", { SequenceNumber: 2 }, [
            el("LICENSE_DETAIL", undefined, [
              leaf("LicenseAuthorityLevelType", "PublicState"),
              leaf("LicenseIdentifier", o.companyStateLicenseId),
              leaf("LicenseIssuingAuthorityStateCode", o.companyAddress.state),
            ]),
          ]),
        ]),
        el("ROLE_DETAIL", undefined, [leaf("PartyRoleType", "LoanOriginationCompany")]),
      ]),
    ]),
  ]);

  const individual = required("PARTY", { SequenceNumber: firstSequence + 1 }, [
    el("INDIVIDUAL", undefined, [
      el("CONTACT_POINTS", undefined, [
        telephone(1, o.phone, "Work"),
        el("CONTACT_POINT", { SequenceNumber: 2 }, [
          el("CONTACT_POINT_EMAIL", undefined, [leaf("ContactPointEmailValue", o.email)]),
        ]),
      ]),
      el("NAME", undefined, [
        leaf("FirstName", o.firstName),
        leaf("FullName", `${o.firstName} ${o.lastName}`),
        leaf("IndividualTitleDescription", o.title),
        leaf("LastName", o.lastName),
      ]),
    ]),
    el("ROLES", undefined, [
      el("ROLE", { SequenceNumber: 1, "xlink:label": "LOAN_ORIGINATOR_1" }, [
        el("LOAN_ORIGINATOR", undefined, [leaf("LoanOriginatorType", "Broker")]),
        el("LICENSES", undefined, [
          el("LICENSE", { SequenceNumber: 1 }, [
            el("LICENSE_DETAIL", undefined, [
              leaf("LicenseAuthorityLevelType", "Private"),
              leaf("LicenseIdentifier", o.nmlsId),
            ]),
          ]),
        ]),
        el("ROLE_DETAIL", undefined, [leaf("PartyRoleType", "LoanOriginator")]),
      ]),
    ]),
  ]);

  return [company, individual];
}

// ---- Relationships --------------------------------------------------------------

function relationships(deal: MismoDeal, labels: BorrowerLabels[]): XmlElement | null {
  const arcs: { from: string; to: string; arcrole: string }[] = [];
  const primary = labels[0].role;
  deal.assets.forEach((_, i) =>
    arcs.push({ from: `ASSET_${i + 1}`, to: primary, arcrole: `${ULAD_ARC}/ASSET_IsAssociatedWith_ROLE` })
  );
  deal.liabilities.forEach((_, i) =>
    arcs.push({ from: `LIABILITY_${i + 1}`, to: primary, arcrole: `${ULAD_ARC}/LIABILITY_IsAssociatedWith_ROLE` })
  );
  for (const l of labels) {
    if (l.employer) {
      arcs.push({ from: l.incomeItems[0], to: l.employer, arcrole: `${ULAD_ARC}/CURRENT_INCOME_ITEM_IsAssociatedWith_EMPLOYER` });
    }
  }
  // Borrowers on one URLA share a credit report; this is how ULAD says they
  // are on the same application rather than two separate ones.
  for (const l of labels.slice(1)) {
    arcs.push({ from: l.role, to: primary, arcrole: `${ULAD_ARC}/ROLE_SharesJointCreditReportWith_ROLE` });
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
        leaf("alta:MonthlyOwnerHousingPayment", amount(x.monthlyOwnerHousingPayment)),
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
  const labels = assignLabels(deal);
  const root = required(
    "MESSAGE",
    {
      MISMOReferenceModelIdentifier: REFERENCE_MODEL,
      xmlns: MISMO_NS,
      "xmlns:DU": DU_NS,
      "xmlns:ULAD": ULAD_NS,
      "xmlns:xlink": XLINK_NS,
      "xmlns:xsi": XSI_NS,
      "xsi:schemaLocation": SCHEMA_LOCATION,
    },
    [
      el("ABOUT_VERSIONS", undefined, [
        el("ABOUT_VERSION", undefined, [leaf("CreatedDatetime", deal.submittedAt)]),
      ]),
      required("DEAL_SETS", undefined, [
        required("DEAL_SET", undefined, [
          required("DEALS", undefined, [
            required("DEAL", undefined, [
              assets(deal),
              subjectProperty(deal),
              liabilities(deal),
              required("LOANS", undefined, [subjectLoan(deal)]),
              required("PARTIES", undefined, [
                ...deal.borrowers.map((b, i) => borrowerParty(b, i, labels[i])),
                ...originatorParties(deal, deal.borrowers.length + 1),
              ]),
              relationships(deal, labels),
            ]),
          ]),
        ]),
      ]),
      extension(deal),
    ]
  );

  return render(root);
}
