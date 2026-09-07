import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { currentRates, ratesLastUpdated } from "@/lib/rates-data";
import { calculateMonthlyPayment } from "@/lib/calculator-utils";

export const metadata: Metadata = {
  title: "Current Mortgage Rates",
  description:
    "See today's mortgage rates for Utah home loans. Compare rates for 30-year fixed, 15-year fixed, FHA, VA, and more from Alta Mortgage Group.",
};

export default function RatesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Rates" }]} />
      <h1 className="mt-6 text-4xl font-bold text-navy">
        Current Mortgage Rates
      </h1>
      <p className="mt-2 text-text-muted">
        Rates as of {ratesLastUpdated}. Rates are illustrative and subject to
        change. Contact us for a personalized quote.
      </p>

      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface">
              <th className="text-left p-4 font-semibold text-text">
                Loan Type
              </th>
              <th className="text-right p-4 font-semibold text-text">Rate</th>
              <th className="text-right p-4 font-semibold text-text">APR</th>
              <th className="text-right p-4 font-semibold text-text">Points</th>
              <th className="text-right p-4 font-semibold text-text">
                Mo. Payment / $100K
              </th>
            </tr>
          </thead>
          <tbody>
            {currentRates.map((row) => {
              const termYears = row.loanType.includes("15")
                ? 15
                : row.loanType.includes("20")
                  ? 20
                  : 30;
              const monthlyPer100k = calculateMonthlyPayment(
                100000,
                row.rate,
                termYears,
              );
              return (
                <tr
                  key={row.loanType}
                  className="border-t border-border hover:bg-surface/50 transition-colors"
                >
                  <td className="p-4 font-medium text-text">{row.loanType}</td>
                  <td className="p-4 text-right font-display font-bold text-navy text-lg">
                    {row.rate.toFixed(3)}%
                  </td>
                  <td className="p-4 text-right text-text-muted">
                    {row.apr.toFixed(3)}%
                  </td>
                  <td className="p-4 text-right text-text-muted">
                    {row.points.toFixed(1)}
                  </td>
                  <td className="p-4 text-right text-text">
                    {formatCurrency(Math.round(monthlyPer100k))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-text-muted">
        Rates shown are for illustrative purposes and may not reflect current
        market conditions. Actual rates depend on credit score, loan amount,
        property type, and other factors. Contact Alta Mortgage Group for a
        personalized rate quote.
      </p>

      <div className="mt-8 bg-surface-warm rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-navy">
          Get Your Personalized Rate
        </h2>
        <p className="mt-2 text-text-muted">
          Talk to a Utah mortgage expert and find the best rate for your
          situation.
        </p>
        <Link
          href="/contact"
          className={cn(
            buttonVariants(),
            "mt-4 bg-emerald hover:bg-emerald-light text-white px-8",
          )}
        >
          Get Pre-Approved
        </Link>
      </div>
    </div>
  );
}
