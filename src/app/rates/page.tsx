import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRateDate, getMarketRates, RATES_SOURCE } from "@/lib/rates-data";

// Re-checked every six hours (RATES_REVALIDATE_SECONDS). Route segment config
// must be a literal, so the number is repeated here.
export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Today's Mortgage Rates",
  description:
    "Today's average mortgage rates for 30-year fixed, 15-year fixed, FHA, VA, USDA and jumbo loans, updated every business day. Get your personalized Utah rate from Alta Mortgage Group.",
};

function change(rate: number, previous: number | undefined) {
  if (previous === undefined) return { text: "—", className: "text-text-muted" };
  const diff = Math.round((rate - previous) * 1000) / 1000;
  if (diff === 0) return { text: "unchanged", className: "text-text-muted" };
  return diff > 0
    ? { text: `▲ ${diff.toFixed(3)}`, className: "text-error" }
    : { text: `▼ ${Math.abs(diff).toFixed(3)}`, className: "text-emerald" };
}

export default async function RatesPage() {
  const { rates, asOf } = await getMarketRates();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Rates" }]} />
      <h1 className="mt-6 text-4xl font-bold text-navy">
        Today&apos;s Mortgage Rates
      </h1>
      <p className="mt-2 text-text-muted">
        National average rates as of {formatRateDate(asOf)}, updated every business day.
        Your rate depends on your credit, down payment, loan amount and property —{" "}
        <Link href="/contact" className="text-navy underline underline-offset-2">
          ask us for your personalized quote
        </Link>
        .
      </p>

      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface">
              <th className="text-left p-4 font-semibold text-text">Loan Type</th>
              <th className="text-right p-4 font-semibold text-text">Average Rate</th>
              <th className="text-right p-4 font-semibold text-text">Change From Prior Day</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((row) => {
              const delta = change(row.rate, row.previousRate);
              return (
                <tr
                  key={row.seriesId}
                  className="border-t border-border hover:bg-surface/50 transition-colors"
                >
                  <td className="p-4 font-medium text-text">{row.loanType}</td>
                  <td className="p-4 text-right font-display font-bold text-navy text-lg">
                    {row.rate.toFixed(3)}%
                  </td>
                  <td className={cn("p-4 text-right", delta.className)}>{delta.text}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-text-muted leading-relaxed">
        These are national averages of interest rates locked by borrowers on the date shown, not
        rates offered by Alta Mortgage Group, and they are not an advertisement or commitment to
        lend. They do not include points, fees or an annual percentage rate (APR). Actual rates and
        terms depend on credit score, loan amount, down payment, property type, occupancy and
        market conditions at the time you lock. Source:{" "}
        <a href={RATES_SOURCE.url} className="underline underline-offset-2" rel="noopener" target="_blank">
          {RATES_SOURCE.name}
        </a>{" "}
        via {RATES_SOURCE.via}.
      </p>

      <div className="mt-8 bg-surface-warm rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-navy">
          Get Your Personalized Rate
        </h2>
        <p className="mt-2 text-text-muted">
          Talk to a Utah mortgage expert and find the best rate for your
          situation. Estimate a payment with our{" "}
          <Link href="/mortgage-calculator" className="text-navy underline underline-offset-2">
            mortgage calculator
          </Link>
          .
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
