// A co-borrower reaches five places: the form's validation, saved drafts, the
// MISMO document Arive imports, the summary in the loan officer's email and
// the CRM, and the applicant's document checklist. Each is pinned here, along
// with the guarantee that an application WITHOUT one is unchanged.

import { describe, expect, it } from "vitest";
import { applicationSchema, coBorrowerSchema } from "@/lib/schemas";
import { buildApplicationSummary } from "@/lib/application-summary";
import { buildDocumentChecklist } from "@/lib/document-checklist";
import { sanitizeDraft } from "@/lib/drafts/partial";
import { buildMismoXml } from "@/lib/mismo/build";
import { mapToDeal } from "@/lib/mismo/map";
import {
  completeApplication,
  FIXTURE_OPTIONS,
  jointApplication,
  refinanceApplication,
} from "@/lib/mismo/__fixtures__/application";

const xml = (app = jointApplication) => buildMismoXml(mapToDeal(app, FIXTURE_OPTIONS));
const cb = jointApplication.coBorrower!;

describe("co-borrower — validation", () => {
  it("accepts a complete joint application", () => {
    expect(applicationSchema.safeParse(jointApplication).success).toBe(true);
  });

  it("is optional", () => {
    expect(applicationSchema.safeParse(completeApplication).success).toBe(true);
  });

  it("requires their own address only when they live elsewhere", () => {
    const sameAddress = { ...cb, sameAddress: true, currentAddress: undefined, housingStatus: undefined };
    expect(coBorrowerSchema.safeParse(sameAddress).success).toBe(true);

    const missing = { ...cb, currentAddress: { street: "", city: "", state: "", zip: "" }, housingStatus: undefined };
    const paths = coBorrowerSchema.safeParse(missing).error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(
      expect.arrayContaining(["currentAddress.street", "currentAddress.zip", "housingStatus"])
    );
  });

  it("reports a missing address while later steps are still blank", () => {
    // The address is asked on step 2; employment and declarations come later.
    // Its error must show on step 2, not wait for the rest to be filled in.
    const paths = coBorrowerSchema
      .safeParse({ firstName: "R", sameAddress: false })
      .error!.issues.map((i) => i.path.join("."));
    expect(paths).toContain("currentAddress.street");
  });

  it("requires the co-borrower's signature", () => {
    const unsigned = { ...jointApplication, coBorrower: { ...cb, eSignatureName: "" } };
    expect(applicationSchema.safeParse(unsigned).success).toBe(false);
  });
});

describe("co-borrower — drafts", () => {
  it("keeps a half-finished co-borrower instead of dropping it", () => {
    const out = sanitizeDraft({ ...completeApplication, coBorrower: { firstName: "Robin", sameAddress: true } })!;
    expect(out.coBorrower).toEqual({ firstName: "Robin", sameAddress: true });
  });

  it("drops an invalid co-borrower field without losing the rest", () => {
    const out = sanitizeDraft({ coBorrower: { firstName: "Robin", maritalStatus: "eloped" } })!;
    expect(out.coBorrower?.firstName).toBe("Robin");
    expect(out.coBorrower?.maritalStatus).toBeUndefined();
  });
});

describe("co-borrower — MISMO", () => {
  it("adds a second borrower party, classified Secondary, tied to the loan", () => {
    const doc = xml();
    expect(doc).toContain('<PARTY xlink:label="Party2" SequenceNumber="2">');
    expect(doc).toContain("<BorrowerClassificationType>Secondary</BorrowerClassificationType>");
    expect(doc).toContain('xlink:label="BORROWER_2"');
    expect(doc).toMatch(/xlink:from="Party2"[^>]*xlink:to="Loan1"/);
  });

  it("carries their name, employer, income and declarations", () => {
    const doc = xml();
    expect(doc).toContain("<FullName>Robin O'Brien</FullName>");
    expect(doc).toContain('xlink:label="EMPLOYER_2"');
    expect(doc).toContain("<FullName>Robin Designs LLC</FullName>");
    expect(doc).toContain("<CurrentIncomeMonthlyTotalAmount>5200.00</CurrentIncomeMonthlyTotalAmount>");
    expect(doc).toMatch(/xlink:from="CO_BORROWER_INCOME_ITEM_1"[^>]*xlink:to="EMPLOYER_2"/);
    expect(doc).toContain("<PriorPropertyForeclosureCompletedIndicator>true</PriorPropertyForeclosureCompletedIndicator>");
    expect(doc).toContain("<CitizenshipResidencyType>PermanentResidentAlien</CitizenshipResidencyType>");
  });

  it("uses their own address when they live elsewhere, and the applicant's otherwise", () => {
    expect(xml()).toContain("<AddressLineText>22 E 400 N</AddressLineText>");
    const shared = mapToDeal(
      { ...jointApplication, coBorrower: { ...cb, sameAddress: true } },
      FIXTURE_OPTIONS
    );
    expect(shared.coBorrower!.residence.address).toEqual(completeApplication.currentAddress);
  });

  it("omits the email contact point when the co-borrower gave none", () => {
    const party2 = xml().split('<PARTY xlink:label="Party2"')[1].split("</PARTY>")[0];
    expect(party2).not.toContain("CONTACT_POINT_EMAIL");
    expect(party2).toContain('<CONTACT_POINT SequenceNumber="1">');
    expect(party2).toContain("<ContactPointTelephoneValue>8015550199</ContactPointTelephoneValue>");
  });

  it("records the relationship and signature in the extension", () => {
    const doc = xml();
    expect(doc).toContain("<alta:RelationshipToBorrowerLabel>Spouse</alta:RelationshipToBorrowerLabel>");
    expect(doc).toContain("<alta:CoBorrowerElectronicSignatureName>Robin O'Brien</alta:CoBorrowerElectronicSignatureName>");
  });

  it("links a refinance's existing loan to both borrowers", () => {
    const doc = xml({ ...refinanceApplication, coBorrower: { ...cb, sameAddress: true } });
    expect(doc).toMatch(/xlink:from="Party2"[^>]*xlink:to="Loan2"/);
  });

  it("changes nothing for a single applicant", () => {
    const doc = xml(completeApplication);
    expect(doc).not.toContain("Party2");
    expect(doc).not.toContain("Secondary");
    expect(doc).not.toContain("CO_BORROWER");
  });
});

describe("co-borrower — summary and checklist", () => {
  it("adds a Co-borrower section to the loan officer's summary", () => {
    const sections = buildApplicationSummary(jointApplication, { referenceNumber: "ALT-K7M2Q", submittedAt: "x" });
    const section = sections.find((s) => s.title === "Co-borrower")!;
    const rows = Object.fromEntries(section.rows.map((r) => [r.label, r.value]));
    expect(rows["Name"]).toBe("Robin O'Brien");
    expect(rows["Relationship to borrower"]).toBe("Spouse");
    expect(rows["Address"]).toBe("22 E 400 N, Ogden, UT 84401");
    expect(rows["Monthly income"]).toBe("$5,200");
    expect(rows["Electronic signature"]).toBe("Robin O'Brien");

    const single = buildApplicationSummary(completeApplication, { referenceNumber: "ALT-K7M2Q", submittedAt: "x" });
    expect(single.map((s) => s.title)).not.toContain("Co-borrower");
  });

  it("asks for the co-borrower's ID and income documents, by how they earn", () => {
    const groups = buildDocumentChecklist(jointApplication);
    const theirs = groups.find((g) => g.title === "From Robin")!;
    expect(theirs.items.join("\n")).toContain("Photo ID");
    expect(theirs.items.join("\n")).toContain("1099 forms"); // self-employed
    expect(buildDocumentChecklist(completeApplication).map((g) => g.title)).not.toContain("From Robin");
  });

  it("asks for a Certificate of Eligibility when only the co-borrower is a veteran", () => {
    const app = { ...refinanceApplication, coBorrower: { ...cb, veteran: true } };
    expect(buildDocumentChecklist(app).map((g) => g.title)).toContain("VA loan eligibility");
  });
});
