import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildMismoXml } from "./build";
import { mapToDeal } from "./map";
import {
  completeApplication,
  FIXTURE_OPTIONS,
  refinanceApplication,
} from "./__fixtures__/application";

function build(app = completeApplication) {
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

  it("declares the v3.4 reference model and the MISMO namespace", () => {
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('xmlns="http://www.mismo.org/residential/2009/schemas"');
    expect(xml).toContain('MISMOReferenceModelIdentifier="3.4.0322"');
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

  it("links the borrower to the subject loan with an xlink arc", () => {
    expect(xml).toContain('<PARTY xlink:label="Party1"');
    expect(xml).toContain('LoanRoleType="SubjectLoan"');
    expect(xml).toContain('xlink:from="Party1"');
    expect(xml).toContain('xlink:to="Loan1"');
  });

  it("carries the reference number as the lender loan identifier", () => {
    expect(xml).toContain("<LoanIdentifier>ALT-K7M2Q</LoanIdentifier>");
    expect(xml).toContain("<LoanIdentifierType>LenderLoan</LoanIdentifierType>");
  });
});

describe("buildMismoXml — privacy", () => {
  it("never emits the full SSN", () => {
    const xml = build();
    expect(xml).not.toContain("123-45-6789");
    expect(xml).not.toContain("123456789");
    expect(xml).toContain("<TaxpayerIdentifierValue>XXX-XX-6789</TaxpayerIdentifierValue>");
  });

  it("omits the taxpayer identifier block when no SSN was collected", () => {
    expect(build(refinanceApplication)).not.toContain("TAXPAYER_IDENTIFIER");
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
  it("emits a related loan for the balance being refinanced", () => {
    const xml = build(refinanceApplication);
    expect(xml).toContain('LoanRoleType="RelatedLoan"');
    expect(xml).toContain("<NoteAmount>412000.00</NoteAmount>");
    expect(xml).toContain('xlink:to="Loan2"');
  });

  it("omits the related loan when there is no existing balance", () => {
    const xml = build();
    expect(xml).not.toContain("RelatedLoan");
    expect(xml).not.toContain('xlink:to="Loan2"');
  });

  it("omits LIABILITIES entirely when the applicant reported no debts", () => {
    expect(build(refinanceApplication)).not.toContain("<LIABILITIES>");
  });

  it("omits EMPLOYERS for a retired applicant", () => {
    const retired = { ...completeApplication, employmentStatus: "retired" as const };
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
