import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SERVICE_AREAS, COMPANY } from "@/lib/constants";
import {
  generateLocalBusinessSchema,
  generateFAQSchema,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Davis County Mortgage Lender",
  description:
    "Alta Mortgage Group serves Layton, Bountiful, Kaysville, and all Davis County communities. Expert mortgage lending for home purchase, refinance, and equity loans.",
  keywords: [
    "Davis County mortgage",
    "Layton home loans",
    "mortgage lender Bountiful Utah",
    "Davis County real estate financing",
  ],
};

const county = SERVICE_AREAS.counties[1];

const faqs = [
  {
    question: "What are current mortgage rates in Davis County?",
    answer:
      "Mortgage rates fluctuate daily based on market conditions, your credit profile, and the type of loan you choose. Visit our rates page for the latest information or contact us for a personalized quote tailored to your situation.",
  },
  {
    question: "Is Farmington a good area for first-time homebuyers?",
    answer:
      "Farmington offers excellent amenities including Station Park shopping, FrontRunner commuter rail access, and highly rated schools. While prices tend to be higher than some neighboring cities, first-time buyer programs like FHA loans and Utah Housing Corporation assistance can make homeownership in Farmington more accessible.",
  },
  {
    question: "How long does it take to close on a home in Davis County?",
    answer:
      "Most home purchases in Davis County close within 30 to 45 days from accepted offer. As a local lender with strong relationships with Davis County title companies and appraisers, we work to keep the process on track and moving efficiently.",
  },
  {
    question: "What types of home loans are available in Davis County?",
    answer:
      "Davis County homebuyers have access to Conventional, FHA, VA, and USDA loan programs. Some areas of the county qualify for USDA rural financing with zero down payment. We also offer jumbo loans for higher-priced properties and adjustable-rate mortgages for buyers who want lower initial payments.",
  },
  {
    question: "Does Alta Mortgage Group serve all of Davis County?",
    answer:
      "Yes. We serve all 15 cities and communities in Davis County, including Layton, Bountiful, Kaysville, Clearfield, Syracuse, Farmington, Centerville, Woods Cross, West Point, Clinton, North Salt Lake, South Weber, Fruit Heights, Sunset, and West Bountiful.",
  },
];

export default function DavisCountyPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateLocalBusinessSchema()),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateFAQSchema(faqs)),
        }}
      />
      <Breadcrumbs
        items={[
          { label: "Utah", href: "/utah" },
          { label: "Davis County" },
        ]}
      />

      <div className="mt-6 max-w-3xl">
        <h1 className="text-4xl font-bold text-navy">
          Davis County Mortgage Lender
        </h1>
        <p className="mt-4 text-text-muted text-lg leading-relaxed">
          Davis County sits between Salt Lake City and Ogden along the Wasatch
          Front, making it one of Utah&apos;s most desirable places to live.
          With family-friendly communities like Layton, Bountiful, and
          Kaysville, excellent schools, and easy access to both major employment
          centers, Davis County continues to attract homebuyers of all types.{" "}
          {COMPANY.name} brings local expertise and personalized service to every
          Davis County borrower.
        </p>
      </div>

      {/* Cities We Serve */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-navy">
          Cities We Serve in Davis County
        </h2>
        <p className="mt-2 text-text-muted">
          We provide mortgage lending services across all {county.cities.length}{" "}
          cities and communities in Davis County.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {county.cities.map((city) => (
            <span
              key={city}
              className="inline-flex items-center rounded-full bg-navy/10 px-4 py-2 text-sm font-medium text-navy"
            >
              {city}
            </span>
          ))}
        </div>
      </div>

      {/* Davis County Housing Market */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-navy">
          Davis County Housing Market
        </h2>
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <Card className="bg-white border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-text">
                Prime Location
              </h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                Davis County&apos;s central position along the Wasatch Front
                gives residents easy commuting access to Salt Lake City, Hill
                Air Force Base, and Ogden. FrontRunner commuter rail stops in
                Farmington, Layton, and Clearfield make car-free commuting a
                real option.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-text">
                Family-Friendly Communities
              </h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                Davis County is consistently ranked among Utah&apos;s best
                places to raise a family. Cities like Kaysville, Bountiful, and
                Farmington offer top-rated school districts, safe neighborhoods,
                and abundant parks and recreation.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-text">
                Diverse Housing Options
              </h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                From established homes in Bountiful and Centerville to newer
                developments in Syracuse, West Point, and Clinton, Davis County
                offers a range of housing styles and price points to fit
                different budgets and lifestyles.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-text">
                Strong Market Demand
              </h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                Steady population growth and a strong local economy continue to
                drive demand for housing in Davis County. Properties in
                desirable neighborhoods tend to hold their value well, making
                homeownership here a solid long-term investment.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQs */}
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

      {/* CTA Section */}
      <div className="mt-16 bg-surface-warm rounded-2xl p-8 lg:p-12 text-center">
        <h2 className="text-3xl font-bold text-navy">
          Ready to Buy in Davis County?
        </h2>
        <p className="mt-3 text-text-muted max-w-xl mx-auto">
          From Layton to Bountiful and everywhere in between, our team is ready
          to help you secure the right mortgage for your Davis County home.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/contact"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-emerald hover:bg-emerald-light text-white",
            )}
          >
            Get Pre-Approved
          </Link>
          <Link
            href="/apply"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-navy text-navy",
            )}
          >
            Start Your Application
          </Link>
        </div>
      </div>
    </div>
  );
}
