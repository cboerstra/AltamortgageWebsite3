import { describe, expect, it } from "vitest";
import type { ApplicationFormData } from "@/lib/schemas";
import {
  completeApplication,
  FIXTURE_OPTIONS,
  refinanceApplication,
} from "./__fixtures__/application";
import { mapToDeal, ssnLast4 } from "./map";

function map(app: ApplicationFormData) {
  return mapToDeal(app, FIXTURE_OPTIONS);
}

describe("ssnLast4", () => {
  it("takes the last four digits regardless of punctuation", () => {
    expect(ssnLast4("123-45-6789")).toBe("6789");
    expect(ssnLast4("123456789")).toBe("6789");
    expect(ssnLast4("  123 45 6789 ")).toBe("6789");
  });

  it("returns undefined when absent or too short to be meaningful", () => {
    expect(ssnLast4(undefined)).toBeUndefined();
    expect(ssnLast4("")).toBeUndefined();
    expect(ssnLast4("12")).toBeUndefined();
  });
});

describe("mapToDeal — taxpayer identifier", () => {
  it("masks all but the last four digits", () => {
    expect(map(completeApplication).borrower.ssnMasked).toBe("XXX-XX-6789");
  });

  it("omits the identifier entirely when no SSN was given", () => {
    expect(map(refinanceApplication).borrower.ssnMasked).toBeUndefined();
  });
});

describe("mapToDeal — subject property", () => {
  it("leaves the subject address absent on a purchase", () => {
    // The wizard collects the applicant's CURRENT address. On a purchase that
    // is not the property being bought, so it must not be presented as such.
    expect(map(completeApplication).property.address).toBeNull();
  });

  it("uses the current address as the subject property on a refinance", () => {
    expect(map(refinanceApplication).property.address).toEqual(
      refinanceApplication.currentAddress
    );
  });

  it("carries the project type for a condominium", () => {
    expect(map(completeApplication).property.profile.projectType).toBe("Condominium");
  });

  it("flags a manufactured home", () => {
    const deal = map({ ...completeApplication, propertyType: "manufactured" });
    expect(deal.property.profile.manufacturedHome).toBe(true);
  });
});

describe("mapToDeal — loan", () => {
  it("maps home equity onto Other with a description, since MISMO has no enum", () => {
    const deal = map({ ...completeApplication, loanPurpose: "home-equity" });
    expect(deal.loan.purposeType).toBe("Other");
    expect(deal.loan.purposeOtherDescription).toBe("HomeEquity");
  });

  it("treats anything but a purchase as a refinance", () => {
    expect(map(completeApplication).loan.isRefinance).toBe(false);
    expect(map(refinanceApplication).loan.isRefinance).toBe(true);
  });

  it("drops a zero down payment rather than asserting one of zero", () => {
    const deal = map({ ...completeApplication, downPayment: 0 });
    expect(deal.loan.downPayment).toBeUndefined();
  });
});

describe("mapToDeal — borrower", () => {
  it("collapses divorced to Unmarried but keeps the real answer as a label", () => {
    const deal = map(refinanceApplication);
    expect(deal.borrower.maritalStatusType).toBe("Unmarried");
    expect(deal.extension.maritalStatusLabel).toBe("Divorced");
  });

  it("converts years at address into whole months", () => {
    expect(map(completeApplication).borrower.residence.durationMonths).toBe(42);
  });

  it("records rent as MonthlyRentAmount and ownership separately", () => {
    const renter = map(completeApplication).borrower.residence;
    expect(renter.monthlyRentAmount).toBe(1850);
    expect(renter.monthlyOwnerPayment).toBeUndefined();

    const owner = map(refinanceApplication).borrower.residence;
    expect(owner.monthlyRentAmount).toBeUndefined();
    expect(owner.monthlyOwnerPayment).toBe(2400);
  });

  it("emits an employer for employed and self-employed applicants only", () => {
    expect(map(completeApplication).borrower.employer?.selfEmployed).toBe(false);
    expect(map(refinanceApplication).borrower.employer?.selfEmployed).toBe(true);
    expect(map({ ...completeApplication, employmentStatus: "retired" }).borrower.employer)
      .toBeUndefined();
  });

  it("classifies income by employment status", () => {
    expect(map(completeApplication).borrower.incomeType).toBe("Base");
    expect(map({ ...completeApplication, employmentStatus: "retired" }).borrower.incomeType)
      .toBe("Pension");
    expect(map({ ...completeApplication, employmentStatus: "other" }).borrower.incomeType)
      .toBe("Other");
  });
});

describe("mapToDeal — liabilities", () => {
  it("emits only the debts the applicant actually reported", () => {
    const liabilities = map(completeApplication).borrower.liabilities;
    expect(liabilities.map((l) => l.description)).toEqual([
      "Auto loan",
      "Student loan",
      "Credit cards",
    ]);
  });

  it("emits nothing when every debt is zero", () => {
    expect(map(refinanceApplication).borrower.liabilities).toEqual([]);
  });

  it("uses Revolving for credit cards and ChildSupport for support payments", () => {
    const deal = map({ ...completeApplication, monthlyChildSupport: 300 });
    const byDescription = Object.fromEntries(
      deal.borrower.liabilities.map((l) => [l.description, l.type])
    );
    expect(byDescription["Credit cards"]).toBe("Revolving");
    expect(byDescription["Child support"]).toBe("ChildSupport");
  });
});

describe("mapToDeal — declarations", () => {
  it("inverts first-time buyer into the ULAD three-year homeowner question", () => {
    expect(map(completeApplication).borrower.declarations.homeownerPastThreeYears).toBe("Yes");
    const firstTimer = map({ ...completeApplication, firstTimeBuyer: true });
    expect(firstTimer.borrower.declarations.homeownerPastThreeYears).toBe("No");
  });

  it("carries every declaration through", () => {
    expect(map(refinanceApplication).borrower.declarations).toEqual({
      bankruptcy: true,
      priorForeclosure: false,
      outstandingJudgments: true,
      borrowedDownPayment: false,
      intentToOccupy: false,
      homeownerPastThreeYears: "Yes",
    });
  });
});

describe("mapToDeal — extension", () => {
  it("retains the consent and signature that make this a signed submission", () => {
    const x = map(completeApplication).extension;
    expect(x.consentGiven).toBe(true);
    expect(x.eSignatureName).toBe("Dana Lee O'Brien");
    expect(x.eSignatureDate).toBe("2026-09-08");
  });

  it("keeps the self-reported credit bucket out of the MISMO body", () => {
    expect(map(completeApplication).extension.creditScoreRangeLabel).toBe("Excellent (740+)");
  });
});

describe("mapToDeal — dates", () => {
  it("drops a birth date that is not an ISO calendar date rather than guessing", () => {
    const deal = map({ ...completeApplication, dateOfBirth: "04/17/1985" });
    expect(deal.borrower.birthDate).toBeUndefined();
  });
});

describe("mapToDeal — purity", () => {
  it("produces identical output for identical input", () => {
    expect(map(completeApplication)).toEqual(map(completeApplication));
  });
});
