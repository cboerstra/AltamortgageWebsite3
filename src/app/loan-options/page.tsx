import type { Metadata } from "next";
import Link from "next/link";
import {
  Home,
  Shield,
  Award,
  MapPin,
  TrendingUp,
  BarChart3,
  Lock,
} from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LOAN_TYPES } from "@/lib/constants";
import { generateFAQSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Mortgage Loan Options",
  description:
    "Compare mortgage loan programs: Conventional, FHA, VA, USDA, Jumbo, ARM, and Fixed Rate. Find the right Utah home loan for your situation with Alta Mortgage Group.",
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Shield,
  Award,
  MapPin,
  TrendingUp,
  BarChart3,
  Lock,
};

const faqs = [
  {
    question: "What credit score do I need to buy a home in Utah?",
    answer:
      "Credit requirements vary by loan type. FHA loans accept scores as low as 580. Conventional loans typically require 620+. VA and USDA loans have flexible credit requirements. Contact us for a free consultation to discuss your options.",
  },
  {
    question: "How much down payment do I need?",
    answer:
      "Down payments range from 0% (VA and USDA loans) to 3% (Conventional) to 3.5% (FHA). The right amount depends on your loan type, financial situation, and goals. Higher down payments can mean lower rates and no mortgage insurance.",
  },
  {
    question: "What is the difference between rate and APR?",
    answer:
      "The interest rate is the cost of borrowing the principal loan amount. The APR (Annual Percentage Rate) includes the interest rate plus other costs like mortgage insurance, closing costs, and points, giving you a more complete picture of the total cost.",
  },
  {
    question: "Can I buy a home in Utah with no down payment?",
    answer:
      "Yes! VA loans (for veterans and active military) and USDA loans (for eligible rural areas) offer 100% financing with no down payment required. Utah has several areas that qualify for USDA loans.",
  },
];

export default function LoanOptionsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateFAQSchema(faqs)),
        }}
      />
      <Breadcrumbs items={[{ label: "Loan Options" }]} />
      <h1 className="mt-6 text-4xl font-bold text-navy">
        Mortgage Loan Options
      </h1>
      <p className="mt-2 text-text-muted text-lg max-w-3xl">
        Every homebuyer&apos;s situation is different. Explore our loan programs
        to find the right fit for your goals, budget, and timeline.
      </p>

      <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LOAN_TYPES.map((loan) => {
          const IconComponent = iconMap[loan.icon];
          return (
            <Card
              key={loan.id}
              className="bg-white border-border hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center mb-4">
                  {IconComponent && (
                    <IconComponent className="w-6 h-6 text-navy" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-text">{loan.name}</h2>
                <p className="mt-2 text-sm text-text-muted">
                  {loan.shortDescription}
                </p>
                <ul className="mt-4 space-y-2">
                  {loan.features.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-text"
                    >
                      <span className="text-emerald mt-0.5">&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className={cn(
                    buttonVariants(),
                    "mt-6 w-full bg-navy hover:bg-navy-light text-white",
                  )}
                >
                  Apply Now
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-16">
        <h2 className="text-3xl font-bold text-navy">
          Frequently Asked Questions
        </h2>
        <div className="mt-6 space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-surface rounded-xl p-6">
              <h3 className="font-semibold text-text">{faq.question}</h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 bg-surface-warm rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-navy">
          Not Sure Which Loan Is Right for You?
        </h2>
        <p className="mt-2 text-text-muted">
          Our Utah mortgage experts will help you find the best program for your
          situation.
        </p>
        <Link
          href="/contact"
          className={cn(
            buttonVariants(),
            "mt-4 bg-emerald hover:bg-emerald-light text-white px-8",
          )}
        >
          Talk to an Expert
        </Link>
      </div>
    </div>
  );
}
