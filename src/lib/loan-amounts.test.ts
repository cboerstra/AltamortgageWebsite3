import { describe, expect, it } from "vitest";
import {
  applyAmountEdit,
  type AmountEditState,
  type AmountField,
  type AmountValues,
} from "./loan-amounts";

/** Replays a borrower typing into the fields in order, applying each fill-in. */
function typeInto(steps: [AmountField, number | undefined][]) {
  let values: AmountValues = {};
  let state: AmountEditState = { calculated: null, typed: [] };
  for (const [field, value] of steps) {
    values = { ...values, [field]: value };
    const result = applyAmountEdit(field, values, state);
    state = result.state;
    if (result.update) values = { ...values, [result.update.field]: result.update.value };
  }
  return { values, calculated: state.calculated };
}

describe("applyAmountEdit — filling in the third amount", () => {
  it("price and down payment give the loan amount", () => {
    const r = typeInto([["purchasePrice", 400000], ["downPayment", 40000]]);
    expect(r.values.loanAmount).toBe(360000);
    expect(r.calculated).toBe("loanAmount");
  });

  it("price and loan amount give the down payment", () => {
    const r = typeInto([["purchasePrice", 400000], ["loanAmount", 380000]]);
    expect(r.values.downPayment).toBe(20000);
    expect(r.calculated).toBe("downPayment");
  });

  it("loan amount and down payment give the price", () => {
    const r = typeInto([["loanAmount", 300000], ["downPayment", 50000]]);
    expect(r.values.purchasePrice).toBe(350000);
    expect(r.calculated).toBe("purchasePrice");
  });

  it("does nothing with only one amount", () => {
    const r = typeInto([["purchasePrice", 400000]]);
    expect(r.values).toEqual({ purchasePrice: 400000 });
    expect(r.calculated).toBeNull();
  });
});

describe("applyAmountEdit — changing an amount afterwards", () => {
  it("keeps a typed price fixed: a new loan amount moves the down payment", () => {
    const r = typeInto([
      ["purchasePrice", 400000],
      ["downPayment", 40000],
      ["loanAmount", 350000],
    ]);
    expect(r.values).toEqual({ purchasePrice: 400000, downPayment: 50000, loanAmount: 350000 });
    expect(r.calculated).toBe("downPayment");
  });

  it("a new price recalculates the field that was filled in, not the typed one", () => {
    const r = typeInto([
      ["purchasePrice", 400000],
      ["downPayment", 40000],
      ["purchasePrice", 450000],
    ]);
    expect(r.values).toEqual({ purchasePrice: 450000, downPayment: 40000, loanAmount: 410000 });
  });

  it("a calculated price keeps following the other two", () => {
    const r = typeInto([
      ["loanAmount", 300000],
      ["downPayment", 50000],
      ["downPayment", 60000],
    ]);
    expect(r.values.purchasePrice).toBe(360000);
  });

  it("typing over a calculated field makes it the borrower's own", () => {
    const r = typeInto([
      ["purchasePrice", 400000],
      ["downPayment", 40000], // loan calculated: 360000
      ["loanAmount", 370000], // borrower overrides the loan
    ]);
    expect(r.values.downPayment).toBe(30000);
    expect(r.calculated).toBe("downPayment");
  });

  it("with all three typed, a new price keeps the more recently typed amount", () => {
    const r = typeInto([
      ["purchasePrice", 400000],
      ["downPayment", 40000], // loan calculated
      ["loanAmount", 370000], // down recalculated: 30000
      ["downPayment", 35000], // loan recalculated: 365000
      ["purchasePrice", 500000],
    ]);
    expect(r.values.downPayment).toBe(35000);
    expect(r.values.loanAmount).toBe(465000);
  });
});

describe("applyAmountEdit — amounts that don't add up", () => {
  it("clears a calculated field rather than showing a negative amount", () => {
    const r = typeInto([
      ["purchasePrice", 400000],
      ["downPayment", 40000],
      ["downPayment", 450000],
    ]);
    expect(r.values.loanAmount).toBeUndefined();
    expect(r.calculated).toBeNull();
  });

  it("clears a calculated field when one of its inputs is emptied", () => {
    const r = typeInto([
      ["purchasePrice", 400000],
      ["downPayment", 40000],
      ["downPayment", undefined],
    ]);
    expect(r.values.loanAmount).toBeUndefined();
  });

  it("never clears an amount the borrower typed", () => {
    const r = typeInto([
      ["purchasePrice", 400000],
      ["loanAmount", 380000],
      ["purchasePrice", undefined],
    ]);
    expect(r.values.loanAmount).toBe(380000);
  });

  it("treats a blank number field (NaN) as empty", () => {
    const r = typeInto([["purchasePrice", 400000], ["downPayment", NaN]]);
    expect(r.values.loanAmount).toBeUndefined();
  });

  it("rounds to cents", () => {
    const r = typeInto([["purchasePrice", 300000.1], ["downPayment", 0.2]]);
    expect(r.values.loanAmount).toBe(299999.9);
  });
});
