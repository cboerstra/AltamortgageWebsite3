import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Refinance Your Mortgage",
  description:
    "Lower your monthly payment, shorten your loan term, or access cash from your home equity. Refinance options from Alta Mortgage Group in Utah.",
};

const benefits = [
  "Lower your monthly mortgage payment",
  "Reduce your interest rate",
  "Shorten your loan term to pay off faster",
  "Switch from an adjustable to a fixed rate",
  "Cash-out refinance for home improvements or debt consolidation",
  "Streamline refinance options for FHA and VA loans",
];

export default function RefinancePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Refinance" }]} />
      <div className="mt-6 grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <div className="w-14 h-14 rounded-xl bg-navy/10 flex items-center justify-center mb-6">
            <Icons.refinance className="w-7 h-7 text-navy" />
          </div>
          <h1 className="text-4xl font-bold text-navy">
            Refinance Your Utah Mortgage
          </h1>
          <p className="mt-4 text-text-muted text-lg leading-relaxed">
            Refinancing could save you hundreds per month or help you reach your
            financial goals faster. Alta Mortgage Group makes the process simple
            with competitive rates and fast closings.
          </p>
          <ul className="mt-8 space-y-3">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-text">
                <Icons.check className="w-5 h-5 text-emerald mt-0.5 shrink-0" />
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
              Start Your Refinance
            </Link>
            <Link
              href="/mortgage-calculator"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-navy text-navy hover:bg-navy hover:text-white",
              )}
            >
              Calculate Savings
            </Link>
          </div>
        </div>
        <div className="bg-surface-warm rounded-2xl p-8 lg:p-10">
          <h2 className="text-2xl font-bold text-navy">
            When Should You Refinance?
          </h2>
          <div className="mt-6 space-y-4">
            {[
              {
                title: "Rates Have Dropped",
                desc: "If current rates are lower than your existing rate, refinancing could save you significantly over the life of the loan.",
              },
              {
                title: "Your Credit Has Improved",
                desc: "A higher credit score since your original loan could qualify you for better terms and lower rates.",
              },
              {
                title: "You Want to Access Equity",
                desc: "A cash-out refinance lets you tap your home's equity for renovations, education, or debt consolidation.",
              },
              {
                title: "You Want Payment Stability",
                desc: "Switching from an adjustable-rate to a fixed-rate mortgage locks in predictable payments.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-lg p-4 border border-border"
              >
                <h3 className="font-semibold text-text">{item.title}</h3>
                <p className="text-sm text-text-muted mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
