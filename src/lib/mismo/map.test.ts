import { describe, expect, it } from "vitest";
import type { ApplicationFormData } from "@/lib/schemas";
import {
  completeApplication,
  FIXTURE_OPTIONS,
  fullJointApplication,
  jointApplication,
  refinanceApplication,
} from "./__fixtures__/application";
import { mapToDeal, parseDependentAges, ssnLast4 } from "./map";

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
  it("keeps only the last four digits", () => {
    expect(map(completeApplication).extension.ssnLast4).toBe("6789");
  });

  it("omits the identifier entirely when no SSN was given", () => {
    expect(map(refinanceApplication).extension.ssnLast4).toBeUndefined();
  });
});

describe("mapToDeal — subject property", () => {
  it("leaves the subject address absent on a purchase with no property yet", () => {
    // The wizard collects the applicant's CURRENT address. On a purchase that
    // is not the property being bought, so it must not be presented as such.
    const deal = map({ ...completeApplication, propertyAddress: undefined });
    expect(deal.property.address).toBeNull();
  });

  it("uses the stated property address on a purchase, state upper-cased", () => {
    expect(map(completeApplication).property.address).toEqual({
      street: "706 Cook Street",
      city: "Ogden",
      state: "UT",
      zip: "84404",
      county: "Weber County",
    });
  });

  it("treats a blank property address as no address", () => {
    const deal = map({
      ...completeApplication,
      propertyAddress: { street: " ", city: "", state: "", zip: "" },
    });
    expect(deal.property.address).toBeNull();
  });

  it("uses the current address as the subject property on a refinance", () => {
    expect(map(refinanceApplication).property.address).toEqual(
      refinanceApplication.currentAddress
    );
  });

  it("records the sales contract only on a purchase", () => {
    expect(map(completeApplication).property.salesContractAmount).toBe(545000);
    expect(map(refinanceApplication).property.salesContractAmount).toBeUndefined();
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

  it("maps the program, rate type and term the applicant chose", () => {
    const { loan } = map(completeApplication);
    expect(loan.mortgageType).toBe("Conventional");
    expect(loan.amortizationType).toBe("Fixed");
    expect(loan.termMonths).toBe(360);
    expect(map({ ...completeApplication, loanProgram: "not-sure" }).loan.mortgageType).toBeUndefined();
    expect(map({ ...completeApplication, loanProgram: "usda" }).loan.mortgageType).toBe("USDARuralDevelopment");
  });

  it("states cash-out only when a refinancing applicant answered", () => {
    expect(map(refinanceApplication).loan.cashOutType).toBeUndefined();
    expect(map({ ...refinanceApplication, cashOut: true }).loan.cashOutType).toBe("CashOut");
    expect(map({ ...refinanceApplication, cashOut: false }).loan.cashOutType).toBe("NoCashOut");
  });

  it("makes a home equity loan behind an existing mortgage a second lien", () => {
    const heloc = map({ ...refinanceApplication, loanPurpose: "home-equity" });
    expect(heloc.loan.lienPriorityType).toBe("SecondLien");
    expect(heloc.liabilities.find((l) => l.type === "MortgageLoan")?.payoff).toBe(false);
    const freeAndClear = map({ ...refinanceApplication, loanPurpose: "home-equity", currentBalance: undefined });
    expect(freeAndClear.loan.lienPriorityType).toBe("FirstLien");
  });
});

describe("mapToDeal — borrower", () => {
  it("collapses divorced to Unmarried but keeps the real answer as a label", () => {
    const deal = map(refinanceApplication);
    expect(deal.borrowers[0].maritalStatusType).toBe("Unmarried");
    expect(deal.extension.maritalStatusLabel).toBe("Divorced");
  });

  it("converts years at address into whole months", () => {
    expect(map(completeApplication).borrowers[0].residence.durationMonths).toBe(42);
  });

  it("records rent as MonthlyRentAmount and ownership separately", () => {
    const renter = map(completeApplication).borrowers[0].residence;
    expect(renter.monthlyRentAmount).toBe(1850);
    expect(renter.monthlyOwnerPayment).toBeUndefined();

    const owner = map(refinanceApplication).borrowers[0].residence;
    expect(owner.monthlyRentAmount).toBeUndefined();
    expect(owner.monthlyOwnerPayment).toBe(2400);
  });

  it("emits an employer for employed and self-employed applicants only", () => {
    expect(map(completeApplication).borrowers[0].employer?.selfEmployed).toBe(false);
    expect(map(refinanceApplication).borrowers[0].employer?.selfEmployed).toBe(true);
    expect(map({ ...completeApplication, employmentStatus: "retired" }).borrowers[0].employer)
      .toBeUndefined();
  });

  it("prefers time in the line of work, falling back to time at the job", () => {
    expect(map(completeApplication).borrowers[0].employer?.lineOfWorkMonths).toBe(120);
    const noLine = map({ ...completeApplication, yearsInLineOfWork: undefined });
    expect(noLine.borrowers[0].employer?.lineOfWorkMonths).toBe(72);
  });

  it("classifies income by employment status", () => {
    expect(map(completeApplication).borrowers[0].incomeType).toBe("Base");
    expect(map({ ...completeApplication, employmentStatus: "retired" }).borrowers[0].incomeType)
      .toBe("Pension");
    expect(map({ ...completeApplication, employmentStatus: "other" }).borrowers[0].incomeType)
      .toBe("Other");
  });

  it("parses dependent ages from free text", () => {
    expect(parseDependentAges("1, 3")).toEqual([1, 3]);
    expect(parseDependentAges("ages 4 and 11")).toEqual([4, 11]);
    expect(parseDependentAges(undefined)).toEqual([]);
  });
});

describe("mapToDeal — co-borrower", () => {
  it("adds a Secondary borrower after the primary", () => {
    const deal = map(fullJointApplication);
    expect(deal.borrowers.map((b) => b.classification)).toEqual(["Primary", "Secondary"]);
    expect(deal.borrowers[1].firstName).toBe("Carlos");
  });

  it("shares the household's address, housing and dependents when they live together", () => {
    const co = map(fullJointApplication).borrowers[1];
    expect(co.residence.address).toEqual(completeApplication.currentAddress);
    expect(co.residence.monthlyRentAmount).toBe(1850);
    expect(co.dependentAges).toEqual([1, 3]);
  });

  it("uses the co-borrower's own address, and claims no payment or dependents, when they live elsewhere", () => {
    const co = map(jointApplication).borrowers[1];
    expect(co.residence.address.street).toBe("22 E 400 N");
    expect(co.residence.residencyBasisType).toBe("Rent");
    expect(co.residence.monthlyRentAmount).toBeUndefined();
    expect(co.residence.durationMonths).toBe(12);
    expect(co.dependentCount).toBeUndefined();
  });

  it("asks the co-borrower about home ownership directly", () => {
    const co = map(fullJointApplication).borrowers[1];
    expect(co.declarations.homeownerPastThreeYears).toBe("No");
    expect(co.declarations.partyToLawsuit).toBe(false);
  });

  it("gives a co-borrower stored before the newer questions the applicant's loan-level answers, and nothing more", () => {
    const co = map(jointApplication).borrowers[1];
    expect(co.declarations.intentToOccupy).toBe(completeApplication.primaryResidence);
    expect(co.declarations.undisclosedBorrowedFunds).toBe(completeApplication.downPaymentBorrowed);
    expect(co.declarations.homeownerPastThreeYears).toBeUndefined();
    expect(co.declarations.partyToLawsuit).toBeUndefined();
    expect(co.demographics).toBeUndefined();
  });

  it("keeps the relationship and the co-borrower's signature for the extension", () => {
    expect(map(jointApplication).extension.coBorrower).toMatchObject({
      relationshipLabel: "Spouse",
      eSignatureName: "Robin O'Brien",
    });
  });
});

describe("mapToDeal — demographics", () => {
  it("maps ethnicity, origin, race and sex to HMDA values", () => {
    expect(map(completeApplication).borrowers[0].demographics).toEqual({
      ethnicityRefused: false,
      ethnicityType: "HispanicOrLatino",
      ethnicityOrigins: ["PuertoRican"],
      raceRefused: false,
      races: ["White"],
      genderRefused: false,
      genderType: "Female",
    });
  });

  it("drops origins when the applicant is not Hispanic or Latino", () => {
    const deal = map({
      ...completeApplication,
      demographics: { ethnicity: "not-hispanic", ethnicityOrigins: ["cuban"], races: ["asian", "white"], sex: "male" },
    });
    expect(deal.borrowers[0].demographics?.ethnicityOrigins).toEqual([]);
    expect(deal.borrowers[0].demographics?.races).toEqual(["Asian", "White"]);
  });

  it("is absent on an application stored before it was asked", () => {
    expect(map(refinanceApplication).borrowers[0].demographics).toBeUndefined();
  });
});

describe("mapToDeal — liabilities", () => {
  it("emits only the debts the applicant actually reported", () => {
    const liabilities = map(completeApplication).liabilities;
    expect(liabilities.map((l) => l.description)).toEqual([
      "Auto loan",
      "Student loan",
      "Credit cards",
    ]);
  });

  it("emits only the mortgage being refinanced when every other debt is zero", () => {
    const liabilities = map(refinanceApplication).liabilities;
    expect(liabilities).toEqual([
      {
        type: "MortgageLoan",
        description: "Current mortgage",
        unpaidBalance: 412000,
        monthlyPayment: 2400,
        excludesTaxesAndInsurance: false,
        payoff: true,
      },
    ]);
  });

  it("does not guess the payment on a mortgage for a property the applicant does not live in", () => {
    const deal = map({
      ...refinanceApplication,
      propertyAddress: { street: "5 Rental Way", city: "Ogden", state: "UT", zip: "84401" },
    });
    expect(deal.liabilities[0].monthlyPayment).toBeUndefined();
  });

  it("uses Revolving for credit cards and ChildSupport for support payments", () => {
    const deal = map({ ...completeApplication, monthlyChildSupport: 300 });
    const byDescription = Object.fromEntries(
      deal.liabilities.map((l) => [l.description, l.type])
    );
    expect(byDescription["Credit cards"]).toBe("Revolving");
    expect(byDescription["Child support"]).toBe("ChildSupport");
  });
});

describe("mapToDeal — declarations", () => {
  it("inverts first-time buyer into the ULAD three-year homeowner question", () => {
    expect(map(completeApplication).borrowers[0].declarations.homeownerPastThreeYears).toBe("Yes");
    const firstTimer = map({ ...completeApplication, firstTimeBuyer: true });
    expect(firstTimer.borrowers[0].declarations.homeownerPastThreeYears).toBe("No");
  });

  it("carries the original declarations and leaves unasked ones undefined", () => {
    expect(map(refinanceApplication).borrowers[0].declarations).toEqual({
      bankruptcy: true,
      priorForeclosure: false,
      outstandingJudgments: true,
      undisclosedBorrowedFunds: false,
      intentToOccupy: false,
      homeownerPastThreeYears: "Yes",
      sellerRelationship: undefined,
      undisclosedMortgageApplication: undefined,
      undisclosedCreditApplication: undefined,
      cleanEnergyLien: undefined,
      undisclosedComaker: undefined,
      presentlyDelinquent: undefined,
      partyToLawsuit: undefined,
      deedInLieu: undefined,
      shortSale: undefined,
    });
  });

  it("asks about a relationship with the seller only on a purchase", () => {
    expect(map(completeApplication).borrowers[0].declarations.sellerRelationship).toBe(true);
    const refi = map({ ...completeApplication, loanPurpose: "refinance" });
    expect(refi.borrowers[0].declarations.sellerRelationship).toBeUndefined();
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
    expect(deal.borrowers[0].birthDate).toBeUndefined();
  });
});

describe("mapToDeal — purity", () => {
  it("produces identical output for identical input", () => {
    expect(map(completeApplication)).toEqual(map(completeApplication));
  });
});
