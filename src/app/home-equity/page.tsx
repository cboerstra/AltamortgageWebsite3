import type { Metadata } from "next";
import Link from "next/link";
import { Wallet, CheckCircle } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Home Equity Loans & HELOC",
  description:
    "Access your home's equity with a home equity loan or HELOC from Alta Mortgage Group. Competitive rates for Utah homeowners in Weber and Davis counties.",
};

const benefits = [
  "Borrow against your home's equity at competitive rates",
  "Fixed-rate home equity loans for predictable payments",
  "HELOC for flexible, revolving access to funds",
  "Use funds for renovations, debt consolidation, education, or more",
  "Potential tax deductibility on interest (consult your tax advisor)",
  "Fast approvals for Utah homeowners",
];

export default function HomeEquityPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Home Equity" }]} />
      <div className="mt-6 grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <div className="w-14 h-14 rounded-xl bg-navy/10 flex items-center justify-center mb-6">
            <Wallet className="w-7 h-7 text-navy" />
          </div>
          <h1 className="text-4xl font-bold text-navy">
            Home Equity Loans &amp; HELOC
          </h1>
          <p className="mt-4 text-text-muted text-lg leading-relaxed">
            Your home is likely your biggest asset. A home equity loan or HELOC
            lets you put that value to work — whether for home improvements,
            consolidating debt, or covering major expenses.
          </p>
          <ul className="mt-8 space-y-3">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-text">
                <CheckCircle className="w-5 h-5 text-emerald mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/contact"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-emerald hover:bg-emerald-light text-white",
              )}
            >
              Get Started
            </Link>
            <Link
              href="/mortgage-calculator"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-navy text-navy hover:bg-navy hover:text-white",
              )}
            >
              Calculate Equity
            </Link>
          </div>
        </div>
        <div className="bg-surface-warm rounded-2xl p-8 lg:p-10">
          <h2 className="text-2xl font-bold text-navy">
            Home Equity Loan vs. HELOC
          </h2>
          <div className="mt-6 space-y-6">
            <div className="bg-white rounded-lg p-5 border border-border">
              <h3 className="font-semibold text-navy">Home Equity Loan</h3>
              <p className="text-sm text-text-muted mt-2">
                Lump-sum disbursement with a fixed interest rate and predictable
                monthly payments. Best for one-time expenses like a major
                renovation or debt payoff.
              </p>
            </div>
            <div className="bg-white rounded-lg p-5 border border-border">
              <h3 className="font-semibold text-emerald">
                HELOC (Home Equity Line of Credit)
              </h3>
              <p className="text-sm text-text-muted mt-2">
                Revolving credit line you can draw from as needed, similar to a
                credit card. Variable rate, pay interest only on what you use.
                Best for ongoing expenses or projects.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
