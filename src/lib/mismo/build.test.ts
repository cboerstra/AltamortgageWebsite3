import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildMismoXml } from "./build";
import { mapToDeal } from "./map";
import {
  completeApplication,
  FIXTURE_OPTIONS,
  fullJointApplication,
  refinanceApplication,
} from "./__fixtures__/application";

// The golden file and the default document are the fullest case: a joint
// application where both borrowers answered everything.
function build(app = fullJointApplication) {
  return buildMismoXml(mapToDeal(app, FIXTURE_OPTIONS));
}

const GOLDEN_PATH = path.join(__dirname, "__fixtures__", "complete.golden.xml");

describe("buildMismoXml — golden file", () => {
  it("matches the reviewed document byte for byte", () => {
    // Regenerate deliberately, then read the diff, when a mapping changes:
    //   npx vitest run -u  is NOT wired up for this — update the file by hand
    //   or with scripts/, and review it. A silently blessed golden file is
    //   worse than no golden file.
    const expected = readFileSync(GOLDEN_PATH, "utf8").replace(/\r\n/g, "\n");
    expect(build()).toBe(expected);
  });

  it("is deterministic", () => {
    expect(build()).toBe(build());
  });
});

describe("buildMismoXml — document shape", () => {
  const xml = build();

  it("declares the reference model and namespaces ARIVE's own export uses", () => {
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('xmlns="http://www.mismo.org/residential/2009/schemas"');
    expect(xml).toContain('MISMOReferenceModelIdentifier="3.4.032420160128"');
    expect(xml).toContain('xmlns:ULAD="http://www.datamodelextension.org/Schema/ULAD"');
    expect(xml).toContain('xmlns:DU="http://www.datamodelextension.org/Schema/DU"');
  });

  it("nests the deal under the standard container chain", () => {
    const order = [
      "<MESSAGE",
      "<DEAL_SETS>",
      "<DEAL_SET",
      "<DEALS>",
      "<DEAL",
      "<PARTIES>",
      "<PARTY",
    ];
    let cursor = -1;
    for (const token of order) {
      const next = xml.indexOf(token, cursor + 1);
      expect(next, `${token} should follow the previous container`).toBeGreaterThan(cursor);
      cursor = next;
    }
  });

  it("labels the subject loan the way ARIVE does, with no non-ULAD arcs", () => {
    expect(xml).toContain('<LOAN LoanRoleType="SubjectLoan" xlink:label="LOAN_1" SequenceNumber="1">');
    expect(xml).not.toContain("PartyToLoan");
  });

  it("orders the subject loan's containers alphabetically, as the schema requires", () => {
    const order = [
      "<AMORTIZATION>",
      "<DOCUMENT_SPECIFIC_DATA_SETS>",
      "<DOWN_PAYMENTS>",
      "<LOAN_DETAIL>",
      "<LOAN_IDENTIFIERS>",
      "<TERMS_OF_LOAN>",
    ];
    const positions = order.map((token) => xml.indexOf(token));
    expect(positions.every((p) => p > 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("records an online application", () => {
    expect(xml).toContain("<ApplicationTakenMethodType>Internet</ApplicationTakenMethodType>");
    expect(xml).toContain("<ULAD:ApplicationTakenMethodType>Internet</ULAD:ApplicationTakenMethodType>");
  });

  it("names the loan originator and company so the LOS can assign the file", () => {
    expect(xml).toContain("<PartyRoleType>LoanOriginationCompany</PartyRoleType>");
    expect(xml).toContain("<PartyRoleType>LoanOriginator</PartyRoleType>");
    expect(xml).toContain("<LicenseIdentifier>258624</LicenseIdentifier>");
  });

  it("carries the reference number as the lender loan identifier", () => {
    expect(xml).toContain("<LoanIdentifier>ALT-K7M2Q</LoanIdentifier>");
    expect(xml).toContain("<LoanIdentifierType>LenderLoan</LoanIdentifierType>");
  });
});

describe("buildMismoXml — privacy", () => {
  it("never emits the SSN in any form as a taxpayer identifier", () => {
    const xml = build();
    expect(xml).not.toContain("123-45-6789");
    expect(xml).not.toContain("123456789");
    expect(xml).not.toContain("TAXPAYER_IDENTIFIER");
    expect(build(refinanceApplication)).not.toContain("TAXPAYER_IDENTIFIER");
  });

  it("marks the borrower as the primary borrower so importers can find them", () => {
    expect(build()).toContain("<BorrowerClassificationType>Primary</BorrowerClassificationType>");
  });
});

describe("buildMismoXml — co-borrower", () => {
  const xml = build();

  it("emits the co-borrower as a second, Secondary borrower party", () => {
    expect(xml).toContain('<PARTY SequenceNumber="2">');
    expect(xml).toContain('xlink:label="BORROWER_2"');
    expect(xml).toContain("<BorrowerClassificationType>Secondary</BorrowerClassificationType>");
    expect(xml).toContain("<FullName>Carlos Omar Resto</FullName>");
  });

  it("puts both borrowers on one application with a joint credit arc", () => {
    expect(xml).toContain(
      'xlink:from="BORROWER_2" xlink:to="BORROWER_1" xlink:arcrole="urn:fdc:mismo.org:2009:residential/ROLE_SharesJointCreditReportWith_ROLE"'
    );
  });

  it("numbers the co-borrower's employer and income after the primary borrower's", () => {
    expect(xml).toContain('xlink:from="CURRENT_INCOME_ITEM_2" xlink:to="EMPLOYER_2"');
  });

  it("records a declined demographic answer as a refusal, not a blank", () => {
    const coBorrower = xml.slice(xml.indexOf('xlink:label="BORROWER_2"'));
    expect(coBorrower).toContain("<HMDAEthnicityRefusalIndicator>true</HMDAEthnicityRefusalIndicator>");
    expect(coBorrower).toContain("<HMDARaceRefusalIndicator>true</HMDARaceRefusalIndicator>");
  });

  it("emits a single borrower when there is no co-borrower", () => {
    const solo = build({ ...completeApplication, coBorrower: undefined });
    expect(solo).not.toContain("BORROWER_2");
    expect(solo).not.toContain("SharesJointCreditReport");
  });
});

describe("buildMismoXml — stored applications", () => {
  it("leaves out answers to questions an older application was never asked", () => {
    const xml = build(refinanceApplication);
    expect(xml).not.toContain("GOVERNMENT_MONITORING");
    expect(xml).not.toContain("PartyToLawsuitIndicator");
    expect(xml).not.toContain("<DEPENDENTS>");
    expect(xml).not.toContain("MortgageType");
    expect(xml).not.toContain("<REFINANCE>");
  });
});

describe("buildMismoXml — ULAD layout", () => {
  it("puts liabilities at DEAL level, labeled and tied to the borrower role", () => {
    const xml = build();
    const dealOpen = xml.indexOf("<DEAL ");
    const partiesOpen = xml.indexOf("<PARTIES>");
    const liabOpen = xml.indexOf("<LIABILITIES>");
    expect(liabOpen).toBeGreaterThan(dealOpen);
    expect(liabOpen).toBeLessThan(partiesOpen);
    expect(xml).toContain('xlink:from="LIABILITY_1" xlink:to="BORROWER_1" xlink:arcrole="urn:fdc:mismo.org:2009:residential/LIABILITY_IsAssociatedWith_ROLE"');
  });

  it("emits bank accounts as DEAL-level assets tied to the borrower role", () => {
    const xml = build({
      ...completeApplication,
      bankAccounts: [
        { institution: "America First CU", type: "checking", balance: 12500 },
        { institution: "Fidelity", type: "investment", balance: 40000 },
        { institution: "Empty", type: "savings", balance: 0 },
      ],
    });
    expect(xml.indexOf("<ASSETS>")).toBeLessThan(xml.indexOf("<COLLATERALS>"));
    expect(xml).toContain("<AssetType>CheckingAccount</AssetType>");
    expect(xml).toContain("<AssetType>Stock</AssetType>");
    expect(xml).toContain("<FullName>America First CU</FullName>");
    expect(xml).not.toContain("Empty");
    expect(xml).toContain('xlink:from="ASSET_2" xlink:to="BORROWER_1" xlink:arcrole="urn:fdc:mismo.org:2009:residential/ASSET_IsAssociatedWith_ROLE"');
  });

  it("links the base income item to the employer and lists other income as further items", () => {
    const xml = build({ ...completeApplication, otherIncome: [{ type: "Rental income", amount: 900 }] });
    expect(xml).toContain('xlink:from="CURRENT_INCOME_ITEM_1" xlink:to="EMPLOYER_1"');
    expect(xml).toContain("<IncomeTypeOtherDescription>Rental income</IncomeTypeOtherDescription>");
    expect(xml).toContain("<CurrentIncomeMonthlyTotalAmount>900.00</CurrentIncomeMonthlyTotalAmount>");
  });
});

describe("buildMismoXml — escaping", () => {
  it("escapes applicant text that would otherwise break the document", () => {
    const xml = build();
    expect(xml).toContain("O'Brien &amp; Sons");
    expect(xml).toContain("1490 S &lt;Main&gt; St Apt 4");
    expect(xml).not.toContain("<Main>");
  });

  it("leaves apostrophes alone in text position, where they are legal", () => {
    expect(build()).not.toContain("&apos;Brien");
  });
});

describe("buildMismoXml — conditional blocks", () => {
  it("carries the mortgage being refinanced as a liability paid off at closing", () => {
    const xml = build(refinanceApplication);
    expect(xml).not.toContain("RelatedLoan");
    expect(xml).toContain("<LiabilityType>MortgageLoan</LiabilityType>");
    expect(xml).toContain("<LiabilityUnpaidBalanceAmount>412000.00</LiabilityUnpaidBalanceAmount>");
    expect(xml).toContain("<LiabilityPayoffStatusIndicator>true</LiabilityPayoffStatusIndicator>");
  });

  it("omits the mortgage liability when there is no existing balance", () => {
    expect(build()).not.toContain("MortgageLoan");
  });

  it("puts rent on the LANDLORD, where ULAD reads it", () => {
    const xml = build();
    expect(xml).toMatch(/<LANDLORD>\s*<LANDLORD_DETAIL>\s*<MonthlyRentAmount>1850.00<\/MonthlyRentAmount>/);
  });

  it("emits the previous residence when the applicant gave one", () => {
    const xml = build({
      ...completeApplication,
      previousAddress: { street: "12 Old Rd", city: "Roy", state: "UT", zip: "84067" },
    });
    expect(xml).toContain("<AddressLineText>12 Old Rd</AddressLineText>");
    expect(xml).toContain("<BorrowerResidencyType>Prior</BorrowerResidencyType>");
  });

  it("omits LIABILITIES entirely when the applicant reported no debts", () => {
    expect(build({ ...refinanceApplication, currentBalance: undefined })).not.toContain("<LIABILITIES>");
  });

  it("omits EMPLOYERS for a retired applicant", () => {
    const retired = { ...completeApplication, employmentStatus: "retired" as const, coBorrower: undefined };
    expect(build(retired)).not.toContain("<EMPLOYERS>");
  });
});

describe("buildMismoXml — amounts", () => {
  it("formats amounts as plain decimals with no separators", () => {
    const xml = build();
    expect(xml).toContain("<BaseLoanAmount>436000.00</BaseLoanAmount>");
    expect(xml).not.toContain("436,000");
    expect(xml).not.toContain("$436000");
  });
});

describe("buildMismoXml — extension", () => {
  it("carries consent and e-signature, which v3.4 has no home for", () => {
    const xml = build();
    expect(xml).toContain("<alta:AuthorizationGivenIndicator>true</alta:AuthorizationGivenIndicator>");
    expect(xml).toContain("<alta:ElectronicSignatureName>Dana Lee O'Brien</alta:ElectronicSignatureName>");
    expect(xml).toContain("<alta:ElectronicSignatureDate>2026-09-08</alta:ElectronicSignatureDate>");
  });

  it("declares its own namespace so it cannot be mistaken for MISMO", () => {
    expect(build()).toContain(
      'xmlns:alta="http://altamortgagegroup.net/schemas/application/1.0"'
    );
  });

  it("records the owner housing payment that has no MISMO home", () => {
    expect(build(refinanceApplication)).toContain(
      "<alta:MonthlyOwnerHousingPayment>2400.00</alta:MonthlyOwnerHousingPayment>"
    );
  });
});
