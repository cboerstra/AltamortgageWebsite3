// Purchase price = loan amount + down payment. When the borrower types two of
// the three, the form fills in the third. The price is the anchor: once the
// borrower has typed it, editing the loan or down payment moves the other one
// rather than the price.

export type AmountField = "purchasePrice" | "loanAmount" | "downPayment";
export type AmountValues = Partial<Record<AmountField, number | undefined>>;

export interface AmountEditState {
  /** The field currently holding a calculated (not typed) value, if any. */
  calculated: AmountField | null;
  /** Fields the borrower has typed in, oldest first. */
  typed: AmountField[];
}

export interface AmountUpdate {
  field: AmountField;
  /** undefined clears the field: the inputs no longer produce a valid amount. */
  value: number | undefined;
}

const hasValue = (n: number | undefined): n is number =>
  typeof n === "number" && Number.isFinite(n);

function pickTarget(
  edited: AmountField,
  values: AmountValues,
  state: AmountEditState,
): AmountField | null {
  const typedValue = (f: AmountField) => hasValue(values[f]) && f !== state.calculated;

  if (edited === "purchasePrice") {
    const loanTyped = typedValue("loanAmount");
    const downTyped = typedValue("downPayment");
    if (loanTyped && downTyped) {
      // Both typed earlier: keep the more recent one, recalculate the other.
      return state.typed.lastIndexOf("loanAmount") > state.typed.lastIndexOf("downPayment")
        ? "downPayment"
        : "loanAmount";
    }
    if (downTyped) return "loanAmount";
    if (loanTyped) return "downPayment";
    return state.calculated;
  }

  const other: AmountField = edited === "loanAmount" ? "downPayment" : "loanAmount";
  if (typedValue("purchasePrice")) return other;
  if (hasValue(values[other]) || state.calculated === "purchasePrice") return "purchasePrice";
  return null;
}

function solve(target: AmountField, v: AmountValues): number | undefined {
  const { purchasePrice: price, loanAmount: loan, downPayment: down } = v;
  let result: number | undefined;
  if (target === "purchasePrice" && hasValue(loan) && hasValue(down)) result = loan + down;
  if (target === "loanAmount" && hasValue(price) && hasValue(down)) result = price - down;
  if (target === "downPayment" && hasValue(price) && hasValue(loan)) result = price - loan;
  if (result === undefined || result < 0) return undefined;
  return Math.round(result * 100) / 100;
}

/**
 * Work out what to fill in after the borrower edits `edited`. Returns the
 * update to apply (or null for none) and the edit state to keep for next time.
 */
export function applyAmountEdit(
  edited: AmountField,
  values: AmountValues,
  state: AmountEditState,
): { update: AmountUpdate | null; state: AmountEditState } {
  const typed = [...state.typed.filter((f) => f !== edited), edited];
  const calculated = state.calculated === edited ? null : state.calculated;
  const next = { calculated, typed };

  const target = pickTarget(edited, values, next);
  if (!target) return { update: null, state: next };

  const value = solve(target, values);
  if (value === undefined && target !== calculated) {
    // Not enough to calculate, and the target holds the borrower's own number: leave it.
    return { update: null, state: next };
  }
  return {
    update: { field: target, value },
    state: { calculated: value === undefined ? null : target, typed: typed.filter((f) => f !== target) },
  };
}
