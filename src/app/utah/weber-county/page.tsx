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
  title: "Weber County Mortgage Lender",
  description:
    "Alta Mortgage Group serves Ogden, Roy, North Ogden, and all Weber County communities. Local mortgage expertise for home purchase, refinance, and equity loans.",
  keywords: [
    "Weber County mortgage",
    "Ogden home loans",
    "mortgage lender Ogden Utah",
    "Weber County real estate financing",
  ],
};

const county = SERVICE_AREAS.counties[0];

const faqs = [
  {
    question: "What are current mortgage rates in Weber County?",
    answer:
      "Mortgage rates change daily based on market conditions and your personal financial profile. Factors like credit score, down payment, and loan type all affect your rate. Visit our rates page for the latest information or contact us for a personalized rate quote.",
  },
  {
    question: "Can I buy a home in Ogden with no down payment?",
    answer:
      "Yes. VA loans are available to veterans and active-duty military with zero down payment required. USDA loans also offer 100% financing for eligible properties in designated rural areas of Weber County. Contact us to see which zero-down options fit your situation.",
  },
  {
    question: "How long does it take to close on a home in Weber County?",
    answer:
      "Most home purchases in Weber County close within 30 to 45 days from the time an offer is accepted. The timeline depends on factors like loan type, appraisal scheduling, and title processing. As a local lender, our relationships with Weber County service providers often help streamline the process.",
  },
  {
    question: "What is the median home price in Weber County?",
    answer:
      "Median home prices in Weber County vary by city and neighborhood. Ogden tends to offer more affordable options compared to foothill communities like Huntsville or Pleasant View. Contact us for current market data and to discuss what you can afford.",
  },
  {
    question: "Does Alta Mortgage Group serve all of Weber County?",
    answer:
      "Yes. We serve all 13 cities and communities in Weber County, including Ogden, Roy, North Ogden, South Ogden, Riverdale, Pleasant View, Harrisville, Farr West, West Haven, Plain City, Washington Terrace, Hooper, and Huntsville.",
  },
];

export default function WeberCountyPage() {
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
          { label: "Weber County" },
        ]}
      />

      <div className="mt-6 max-w-3xl">
        <h1 className="text-4xl font-bold text-navy">
          Weber County Mortgage Lender
        </h1>
        <p className="mt-4 text-text-muted text-lg leading-relaxed">
          {COMPANY.name} is headquartered in Ogden, the county seat of Weber
          County, and has been helping local families finance their homes for
          years. Weber County&apos;s housing market continues to grow, offering
          everything from historic Ogden bungalows to new construction in
          communities like Farr West and West Haven. Whether you&apos;re a
          first-time buyer or looking to refinance, our team knows this market
          inside and out.
        </p>
      </div>

      {/* Cities We Serve */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-navy">
          Cities We Serve in Weber County
        </h2>
        <p className="mt-2 text-text-muted">
          We provide mortgage lending services across all {county.cities.length}{" "}
          cities and communities in Weber County.
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

      {/* Weber County Housing Market */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-navy">
          Weber County Housing Market
        </h2>
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <Card className="bg-white border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-text">
                Affordable Homeownership
              </h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                Weber County remains one of the more affordable markets along
                the Wasatch Front, making it an attractive destination for
                first-time homebuyers and growing families. Cities like Ogden
                and Roy offer strong value compared to markets further south.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-text">
                Growing Communities
              </h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                New development in West Haven, Farr West, and Plain City is
                expanding housing options. Meanwhile, established neighborhoods
                in North Ogden, Pleasant View, and Riverdale continue to see
                steady appreciation and demand.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-text">
                First-Time Buyer Friendly
              </h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                Weber County&apos;s price points make it easier for first-time
                buyers to qualify for loans with lower down payments. FHA and
                USDA programs are especially popular in this area, and Utah
                Housing Corporation assistance is available for eligible buyers.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-text">
                Outdoor Lifestyle
              </h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                From Snowbasin and Powder Mountain to Pineview Reservoir and the
                Ogden River Parkway, Weber County attracts buyers who value
                recreation. Communities like Huntsville and Eden offer a
                mountain-town feel within reach of urban amenities.
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
          Ready to Buy in Weber County?
        </h2>
        <p className="mt-3 text-text-muted max-w-xl mx-auto">
          Our Ogden-based team is ready to help you find the right mortgage for
          your Weber County home purchase or refinance.
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
