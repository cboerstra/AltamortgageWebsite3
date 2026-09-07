export interface RateRow {
  loanType: string;
  rate: number;
  apr: number;
  points: number;
}

export const currentRates: RateRow[] = [
  { loanType: "30-Year Fixed", rate: 6.625, apr: 6.782, points: 0.5 },
  { loanType: "20-Year Fixed", rate: 6.375, apr: 6.541, points: 0.5 },
  { loanType: "15-Year Fixed", rate: 5.875, apr: 6.098, points: 0.5 },
  { loanType: "7/1 ARM", rate: 6.250, apr: 7.102, points: 0.0 },
  { loanType: "5/1 ARM", rate: 6.000, apr: 7.204, points: 0.0 },
  { loanType: "FHA 30-Year", rate: 6.125, apr: 7.258, points: 0.0 },
  { loanType: "VA 30-Year", rate: 6.000, apr: 6.324, points: 0.0 },
  { loanType: "Jumbo 30-Year", rate: 6.875, apr: 6.945, points: 0.25 },
];

export const ratesLastUpdated = "2026-05-28";
