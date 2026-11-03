import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { LinkedText } from "@/components/layout/linked-text";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COMPANY } from "@/lib/constants";
import { generateFAQSchema } from "@/lib/seo";
import { Icons } from "@/lib/icons";

export const metadata: Metadata = {
  title: "First-Time Homebuyer Guide",
  description:
    "Buying your first home in Utah? Alta Mortgage Group walks you through every step — programs with low or no down payment, what to expect at closing, and how to qualify in Weber, Davis, Box Elder and Morgan counties.",
  keywords: [
    "first time home buyer Utah",
    "first time homebuyer programs Utah",
    "no down payment loans Utah",
    "FHA loans first time buyer",
    "Utah Housing Corporation",
  ],
};

const steps = [
  {
    icon: Icons.budget,
    title: "1. Know Your Budget",
    body:
      "Start with the basics: monthly income, existing debts, and how much you have saved. A healthy rule of thumb is keeping your total housing payment under 28% of your gross monthly income. Use our mortgage calculator to estimate what you can afford.",
  },
  {
    icon: Icons.preApproval,
    title: "2. Get Pre-Approved",
    body:
      "A pre-approval is a letter stating how much you're likely to qualify to borrow, based on a review of your credit, income and assets. It isn't a final loan approval. It signals to sellers that you're a serious buyer and gives you a clear price range to shop in. With Alta Mortgage Group, getting started is a free, low-pressure conversation.",
  },
  {
    icon: Icons.shopping,
    title: "3. Shop For Your Home",
    body:
      "Work with a local Realtor who knows Weber, Davis, Box Elder and Morgan counties. They'll help you find homes in your price range, schedule showings, and negotiate offers. Most first-time buyers look at 8–12 homes before finding the right one.",
  },
  {
    icon: Icons.offer,
    title: "4. Make an Offer & Underwrite",
    body:
      "Once your offer is accepted, we lock your rate with the lender, and the lender's underwriter begins the formal review of your finances. We'll order an appraisal and title work. Most loans close 30–45 days after your offer is accepted.",
  },
  {
    icon: Icons.closing,
    title: "5. Close & Move In",
    body:
      "At closing you'll sign the paperwork, pay your down payment and closing costs, and receive the keys. Most closings happen at a title company office and take about an hour.",
  },
];

const programs = [
  {
    icon: Icons.fha,
    name: "FHA Loan",
    summary: "Backed by the Federal Housing Administration.",
    perks: [
      "Down payments as low as 3.5%",
      "Credit scores as low as 580",
      "Gift funds allowed for the down payment",
    ],
  },
  {
    icon: Icons.va,
    name: "VA Loan",
    summary: "For eligible veterans, active-duty service members and surviving spouses.",
    perks: [
      "0% down payment",
      "No private mortgage insurance",
      "Funding fee can be rolled into the loan",
    ],
  },
  {
    icon: Icons.usda,
    name: "USDA Loan",
    summary: "For homes in eligible rural and suburban Utah areas.",
    perks: [
      "0% down payment",
      "Low mortgage insurance rates",
      "Many parts of Box Elder and Morgan counties, and some areas of Weber and Davis, qualify (eligibility is by address)",
    ],
  },
  {
    icon: Icons.utahHousing,
    name: "Utah Housing Corporation",
    summary: "State-run down payment assistance for qualifying buyers.",
    perks: [
      "Up to 6% in down payment / closing cost help",
      "FirstHome and HomeAgain programs available",
      "Income-based eligibility",
    ],
  },
];

const faqs = [
  {
    question: "How much money do I need to buy a house in Utah?",
    answer:
      "Less than you might think. With FHA you can buy with 3.5% down. With VA or USDA, you can buy with 0% down. Plan to also have closing costs of about 2–5% of the loan amount, though some of that can be rolled into the loan or paid by the seller (seller concessions).",
  },
  {
    question: "What credit score do I need as a first-time buyer?",
    answer:
      "FHA loans accept scores as low as 580. Conventional loans typically want 620+. VA and USDA are flexible. If your score is below 580, talk to us anyway — there are often quick ways to improve it before you apply.",
  },
  {
    question: "Is renting cheaper than buying right now?",
    answer:
      "It depends on your timeframe. If you plan to stay 5+ years, buying is often worth considering because each payment builds equity. If you might move in 1–2 years, renting may make more sense. We're happy to run the numbers with you.",
  },
  {
    question: "How long does the homebuying process take?",
    answer:
      "We'll contact you within one business day, and once we have your documents, pre-approval is often same-day. Finding the right home is the variable: it can take weeks or months. Most loans close 30–45 days after your offer is accepted.",
  },
  {
    question: "What does Alta Mortgage Group charge first-time buyers?",
    answer:
      "Our pre-approval is free with no obligation. We walk you through every fee and closing cost up front, in writing, in your Loan Estimate.",
  },
];

export default function FirstTimeHomebuyerPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "First-Time Homebuyer" }]} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateFAQSchema(faqs)),
        }}
      />

      {/* Hero */}
      <section className="mt-6 max-w-3xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-navy">
          Your First Home, Made Simple
        </h1>
        <p className="mt-4 text-lg text-text-muted leading-relaxed">
          Buying your first home in Utah can feel overwhelming — but it
          shouldn&apos;t. {COMPANY.name} walks you through every step, from
          understanding programs designed for first-time buyers to getting your
          keys. We work with buyers across Weber, Davis, Box Elder and Morgan counties every week.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className={cn(buttonVariants(), "bg-emerald hover:bg-emerald-light text-white")}
          >
            Get Pre-Approved
          </Link>
          <Link
            href="/mortgage-calculator"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Try the Calculator
          </Link>
        </div>
      </section>

      {/* The 5-step path */}
      <section className="mt-16">
        <h2 className="text-3xl font-bold text-text">
          The 5-Step Path to Homeownership
        </h2>
        <p className="mt-2 text-text-muted">
          Here&apos;s the journey, start to finish. We handle the financing
          steps so you can focus on finding the right home.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.title}>
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-navy/10 text-navy flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-text">{step.title}</h3>
                  <p className="mt-2 text-sm text-text-muted leading-relaxed">
                    <LinkedText text={step.body} />
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Programs */}
      <section className="mt-16 bg-surface rounded-2xl p-8 lg:p-12">
        <h2 className="text-3xl font-bold text-text">
          Programs Built for First-Time Buyers
        </h2>
        <p className="mt-2 text-text-muted max-w-2xl">
          You may qualify for one of these — even with a small down payment or
          average credit. We&apos;ll help you compare and pick the best fit.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {programs.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.name}
                className="bg-white p-6 rounded-xl border border-border-brand"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald/10 text-emerald flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-text">{p.name}</h3>
                </div>
                <p className="mt-3 text-sm text-text-muted">{p.summary}</p>
                <ul className="mt-3 space-y-1 text-sm text-text-muted">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex gap-2">
                      <span className="text-emerald font-bold">✓</span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-sm text-text-muted">
          Not sure which is right for you?{" "}
          <Link href="/loan-options" className="text-navy font-medium hover:underline">
            Compare all loan options →
          </Link>
        </p>
      </section>

      {/* FAQ */}
      <section className="mt-16">
        <h2 className="text-3xl font-bold text-text">First-Time Buyer FAQ</h2>
        <div className="mt-8 space-y-6">
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="border-b border-border-brand pb-6 last:border-0"
            >
              <h3 className="text-lg font-semibold text-text">{faq.question}</h3>
              <p className="mt-2 text-text-muted leading-relaxed"><LinkedText text={faq.answer} /></p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mt-16 bg-navy text-white rounded-2xl p-8 lg:p-12 text-center">
        <h2 className="text-3xl font-bold">Ready to start?</h2>
        <p className="mt-3 text-white/80 max-w-xl mx-auto">
          Free pre-approval, no obligation. We&apos;ll go over
          which programs you qualify for and what your monthly payment would
          look like.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link
            href="/contact"
            className={cn(buttonVariants(), "bg-emerald hover:bg-emerald-light text-white")}
          >
            Get Pre-Approved
          </Link>
          <Link
            href="/apply"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white"
            )}
          >
            Start Full Application
          </Link>
        </div>
      </section>
    </div>
  );
}
