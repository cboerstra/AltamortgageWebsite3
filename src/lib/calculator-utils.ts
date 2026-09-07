export interface PaymentBreakdown {
  monthlyPrincipalInterest: number;
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  totalMonthly: number;
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterest: number;
}

export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  if (annualRate === 0) return principal / (termYears * 12);
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
}

export function calculatePaymentBreakdown(
  homePrice: number,
  downPayment: number,
  annualRate: number,
  termYears: number,
  annualTax: number,
  annualInsurance: number,
  monthlyHOA: number
): PaymentBreakdown {
  const principal = homePrice - downPayment;
  const monthlyPrincipalInterest = calculateMonthlyPayment(principal, annualRate, termYears);
  const monthlyTax = annualTax / 12;
  const monthlyInsurance = annualInsurance / 12;

  return {
    monthlyPrincipalInterest,
    monthlyTax,
    monthlyInsurance,
    monthlyHOA,
    totalMonthly: monthlyPrincipalInterest + monthlyTax + monthlyInsurance + monthlyHOA,
  };
}

export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termYears: number
): AmortizationRow[] {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);
  const schedule: AmortizationRow[] = [];
  let balance = principal;
  let totalInterest = 0;

  for (let month = 1; month <= numPayments; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance = Math.max(0, balance - principalPayment);
    totalInterest += interestPayment;

    schedule.push({
      month,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance,
      totalInterest,
    });
  }

  return schedule;
}

export function calculateAffordability(
  annualIncome: number,
  monthlyDebts: number,
  downPayment: number,
  annualRate: number,
  termYears: number,
  maxDTI: number = 0.43
): { maxHomePrice: number; maxMonthlyPayment: number; dti: number } {
  const monthlyIncome = annualIncome / 12;
  const maxMonthlyPayment = monthlyIncome * maxDTI - monthlyDebts;

  if (maxMonthlyPayment <= 0) {
    return { maxHomePrice: 0, maxMonthlyPayment: 0, dti: (monthlyDebts / monthlyIncome) * 100 };
  }

  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  let maxLoan: number;

  if (annualRate === 0) {
    maxLoan = maxMonthlyPayment * numPayments;
  } else {
    maxLoan =
      (maxMonthlyPayment * (Math.pow(1 + monthlyRate, numPayments) - 1)) /
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments));
  }

  const maxHomePrice = maxLoan + downPayment;
  const dti = ((monthlyDebts + maxMonthlyPayment) / monthlyIncome) * 100;

  return { maxHomePrice, maxMonthlyPayment, dti };
}

export function calculateRefinanceSavings(
  currentBalance: number,
  currentRate: number,
  currentMonthlyPayment: number,
  newRate: number,
  newTermYears: number,
  closingCosts: number
): {
  newMonthlyPayment: number;
  monthlySavings: number;
  totalSavings: number;
  breakEvenMonths: number;
} {
  const newMonthlyPayment = calculateMonthlyPayment(currentBalance, newRate, newTermYears);
  const monthlySavings = currentMonthlyPayment - newMonthlyPayment;
  const totalSavings = monthlySavings * newTermYears * 12 - closingCosts;
  const breakEvenMonths = monthlySavings > 0 ? Math.ceil(closingCosts / monthlySavings) : Infinity;

  return { newMonthlyPayment, monthlySavings, totalSavings, breakEvenMonths };
}
