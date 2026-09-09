// The checklist is the entire substance of the applicant's confirmation email,
// and it is tailored to what they told us. Asking a retiree for pay stubs, or
// a non-veteran for a Certificate of Eligibility, is the failure worth pinning
// down here.

import { describe, expect, it } from "vitest";
import type { ApplicationFormData } from "@/lib/schemas";
import {
  completeApplication,
  refinanceApplication,
} from "@/lib/mismo/__fixtures__/application";
import { buildDocumentChecklist, checklistToText } from "./document-checklist";

/** Flatten to one searchable string so assertions read as intent, not indices. */
function itemsOf(app: ApplicationFormData): string {
  return buildDocumentChecklist(app)
    .flatMap((group) => group.items)
    .join("\n");
}

function titlesOf(app: ApplicationFormData): string[] {
  return buildDocumentChecklist(app).map((group) => group.title);
}

describe("buildDocumentChecklist — always required", () => {
  it("asks every applicant for photo ID and bank statements", () => {
    for (const app of [completeApplication, refinanceApplication]) {
      expect(itemsOf(app)).toMatch(/Photo ID/);
      expect(itemsOf(app)).toMatch(/Bank statements/);
    }
  });

  it("leads with identification", () => {
    expect(titlesOf(completeApplication)[0]).toBe("Identification");
  });
});

describe("buildDocumentChecklist — income by employment status", () => {
  it("asks an employed applicant for pay stubs and W-2s, not tax returns", () => {
    const items = itemsOf(completeApplication);
    expect(items).toMatch(/Pay stubs/);
    expect(items).toMatch(/W-2/);
    expect(items).not.toMatch(/profit and loss/i);
  });

  it("asks a self-employed applicant for returns and a P&L, not pay stubs", () => {
    const items = itemsOf(refinanceApplication);
    expect(items).toMatch(/Federal tax returns/);
    expect(items).toMatch(/profit and loss/i);
    expect(items).not.toMatch(/Pay stubs/);
  });

  it("asks a retiree for award letters and 1099-Rs, not pay stubs", () => {
    const retired: ApplicationFormData = { ...completeApplication, employmentStatus: "retired" };
    const items = itemsOf(retired);
    expect(items).toMatch(/Award letter/);
    expect(items).toMatch(/1099-R/);
    expect(items).not.toMatch(/Pay stubs/);
  });

  it("falls back to tax returns for an unrecognised employment status", () => {
    const odd = { ...completeApplication, employmentStatus: "other" } as ApplicationFormData;
    expect(itemsOf(odd)).toMatch(/Federal tax returns/);
  });
});

describe("buildDocumentChecklist — by loan purpose", () => {
  it("asks a buyer for the purchase contract and proof of funds", () => {
    const items = itemsOf(completeApplication);
    expect(items).toMatch(/purchase contract/i);
    expect(items).toMatch(/Proof of funds/);
    expect(items).not.toMatch(/Current mortgage statement/);
  });

  it("asks a refinancer for the current mortgage statement, not a contract", () => {
    const items = itemsOf(refinanceApplication);
    expect(items).toMatch(/Current mortgage statement/);
    expect(items).toMatch(/Homeowners insurance/);
    expect(items).not.toMatch(/purchase contract/i);
  });

  it("treats a home-equity request like a refinance", () => {
    const equity: ApplicationFormData = { ...refinanceApplication, loanPurpose: "home-equity" };
    expect(itemsOf(equity)).toMatch(/Current mortgage statement/);
  });
});

describe("buildDocumentChecklist — VA eligibility", () => {
  it("asks a veteran for a Certificate of Eligibility", () => {
    expect(titlesOf(completeApplication)).toContain("VA loan eligibility");
    expect(itemsOf(completeApplication)).toMatch(/Certificate of Eligibility/);
  });

  it("does not mention the COE to a non-veteran", () => {
    expect(titlesOf(refinanceApplication)).not.toContain("VA loan eligibility");
    expect(itemsOf(refinanceApplication)).not.toMatch(/Certificate of Eligibility/);
  });
});

describe("checklistToText", () => {
  it("renders every group and item as a readable list", () => {
    const text = checklistToText(buildDocumentChecklist(completeApplication));
    expect(text).toContain("IDENTIFICATION");
    expect(text).toContain("  - Photo ID — driver's license or passport, front and back");
    expect(text).toContain("VA LOAN ELIGIBILITY");
  });
});
