import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COMPANY } from "@/lib/constants";
import { Icons } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Mortgage Learning Center",
  description:
    "Learn about mortgages, interest rates, refinancing, and home equity. Free guides and resources from Alta Mortgage Group, your local Utah mortgage expert.",
  keywords: [
    "mortgage learning center",
    "how mortgages work",
    "Utah mortgage education",
    "refinance guide",
    "mortgage rates explained",
  ],
};

const topics = [
  {
    icon: Icons.firstHomeGuide,
    title: "Buying Your First Home",
    summary:
      "Step-by-step guide for first-time homebuyers in Utah — programs, credit requirements, and what to expect.",
    href: "/first-time-homebuyer",
    cta: "Read the first-time buyer guide",
  },
  {
    icon: Icons.loanGuide,
    title: "Compare Loan Types",
    summary:
      "Conventional, FHA, VA, USDA, Jumbo, Fixed, ARM — see which mortgage type fits your situation.",
    href: "/loan-options",
    cta: "Compare loan options",
  },
  {
    icon: Icons.calculator,
    title: "Mortgage Calculators",
    summary:
      "Estimate your monthly payment, see what you can afford, or check how much you'd save by refinancing.",
    href: "/mortgage-calculator",
    cta: "Open the calculator",
  },
  {
    icon: Icons.rates,
    title: "Today's Rates",
    summary:
      "Current interest rates for 30-year fixed, 15-year fixed, FHA, VA, and more. Updated regularly.",
    href: "/rates",
    cta: "See current rates",
  },
  {
    icon: Icons.refinanceGuide,
    title: "Refinancing 101",
    summary:
      "When refinancing makes sense, what it costs, and how much you could save on your monthly payment.",
    href: "/refinance",
    cta: "Learn about refinancing",
  },
  {
    icon: Icons.equityGuide,
    title: "Home Equity Loans",
    summary:
      "Tap into your home's equity for renovations, debt consolidation, or other big expenses.",
    href: "/home-equity",
    cta: "Explore home equity",
  },
];

const glossary = [
  {
    term: "APR (Annual Percentage Rate)",
    def: "The total yearly cost of a mortgage, including interest plus fees. APR is usually slightly higher than the interest rate and gives you a more accurate comparison between loans.",
  },
  {
    term: "Closing Costs",
    def: "Fees paid at the close of a real estate transaction — typically 2–5% of the loan amount. Includes appraisal, title insurance, lender fees, and prepaid taxes/insurance.",
  },
  {
    term: "Down Payment",
    def: "The portion of the home price you pay upfront in cash. Varies from 0% (VA/USDA) to 20%+ (conventional, to avoid PMI).",
  },
  {
    term: "Equity",
    def: "The portion of your home you actually own — your home's current value minus what you still owe on your mortgage.",
  },
  {
    term: "Escrow",
    def: "An account managed by your lender to pay property taxes and homeowners insurance. Part of your monthly payment goes into escrow to cover these annual costs.",
  },
  {
    term: "PMI (Private Mortgage Insurance)",
    def: "Insurance you pay monthly if your down payment is under 20% on a conventional loan. It protects the lender if you default. Can be canceled once you reach 20% equity.",
  },
  {
    term: "Pre-Approval",
    def: "A lender's written statement of how much you qualify to borrow, based on a review of your finances. Stronger than pre-qualification and signals to sellers you're serious.",
  },
  {
    term: "Principal & Interest",
    def: "The two main components of your mortgage payment. Principal pays down the loan balance. Interest is the cost of borrowing the money. Early payments are mostly interest; later payments are mostly principal.",
  },
];

const tips = [
  {
    icon: Icons.tip,
    title: "Lock your rate when you're ready",
    body:
      "Interest rates change daily. Once you have an accepted offer, locking your rate protects you from rate increases while your loan is being processed.",
  },
  {
    icon: Icons.tip,
    title: "Don't open new credit before closing",
    body:
      "New credit cards, car loans, or even big credit inquiries during underwriting can derail your loan. Wait until after closing for any new credit.",
  },
  {
    icon: Icons.tip,
    title: "Keep employment steady",
    body:
      "Lenders verify employment right before closing. Switching jobs (especially to self-employment) during the loan process can complicate things.",
  },
  {
    icon: Icons.tip,
    title: "Document any large deposits",
    body:
      "Underwriters scrutinize bank statements for unexplained deposits. Keep records of gift funds, bonuses, or asset sales so you can explain them quickly.",
  },
];

export default function LearningCenterPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Learning Center" }]} />

      {/* Hero */}
      <section className="mt-6 max-w-3xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-navy">
          Mortgage Learning Center
        </h1>
        <p className="mt-4 text-lg text-text-muted leading-relaxed">
          Buying a home is one of the biggest financial decisions you&apos;ll
          make. {COMPANY.name} put this hub together to help you understand the
          process, the terminology, and the programs available to Utah
          homebuyers — no jargon, no pressure.
        </p>
      </section>

      {/* Topic cards */}
      <section className="mt-12">
        <h2 className="text-3xl font-bold text-text">Browse by Topic</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => {
            const Icon = topic.icon;
            return (
              <Card key={topic.title}>
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-navy/10 text-navy flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-text">
                    {topic.title}
                  </h3>
                  <p className="mt-2 text-sm text-text-muted leading-relaxed">
                    {topic.summary}
                  </p>
                  <Link
                    href={topic.href}
                    className="mt-4 inline-block text-sm font-semibold text-navy hover:underline"
                  >
                    {topic.cta} →
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Tips */}
      <section className="mt-16 bg-surface rounded-2xl p-8 lg:p-12">
        <h2 className="text-3xl font-bold text-text">
          4 Tips Every Borrower Should Know
        </h2>
        <p className="mt-2 text-text-muted">
          Small choices during the loan process can have big consequences. Avoid
          these common pitfalls.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {tips.map((tip) => {
            const Icon = tip.icon;
            return (
              <div
                key={tip.title}
                className="flex gap-4 bg-white p-5 rounded-xl border border-border-brand"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-text">{tip.title}</h3>
                  <p className="mt-1 text-sm text-text-muted leading-relaxed">
                    {tip.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Glossary */}
      <section className="mt-16">
        <div className="flex items-center gap-3">
          <Icons.faq className="w-6 h-6 text-navy" />
          <h2 className="text-3xl font-bold text-text">Mortgage Glossary</h2>
        </div>
        <p className="mt-2 text-text-muted">
          Confused by the lingo? Here are the terms that come up most often.
        </p>
        <dl className="mt-8 grid gap-6 md:grid-cols-2">
          {glossary.map((entry) => (
            <div
              key={entry.term}
              className="border-l-4 border-emerald pl-4 py-1"
            >
              <dt className="font-semibold text-text">{entry.term}</dt>
              <dd className="mt-1 text-sm text-text-muted leading-relaxed">
                {entry.def}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <section className="mt-16 bg-navy text-white rounded-2xl p-8 lg:p-12 text-center">
        <h2 className="text-3xl font-bold">Still have questions?</h2>
        <p className="mt-3 text-white/80 max-w-xl mx-auto">
          We&apos;d rather you ask than guess. A 15-minute conversation with
          one of our loan specialists is the fastest way to see what makes
          sense for your situation — and it&apos;s free.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link
            href="/contact"
            className={cn(buttonVariants(), "bg-emerald hover:bg-emerald-light text-white")}
          >
            Talk to a Specialist
          </Link>
          <Link
            href="/mortgage-calculator"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white"
            )}
          >
            Try the Calculator
          </Link>
        </div>
      </section>
    </div>
  );
}
