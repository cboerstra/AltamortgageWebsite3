import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SERVICE_AREAS, COMPANY } from "@/lib/constants";
import { generateLocalBusinessSchema, generateFAQSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Box Elder County Mortgage Lender",
  description:
    "Alta Mortgage Group serves Brigham City, Tremonton, Perry, Willard and all Box Elder County communities. Local mortgage expertise for home purchase, refinance, USDA and equity loans.",
  keywords: [
    "Box Elder County mortgage",
    "Brigham City home loans",
    "mortgage lender Tremonton Utah",
    "USDA loans Box Elder County",
  ],
};

const county = SERVICE_AREAS.counties.find((c) => c.slug === "box-elder-county")!;

const faqs = [
  {
    question: "Do homes in Box Elder County qualify for USDA loans?",
    answer:
      "Many do. USDA rural development loans offer 100% financing on eligible properties, and much of Box Elder County outside the Brigham City core meets the USDA's rural definition. Eligibility is set by address, so send us the property and we'll check it before you write an offer.",
  },
  {
    question: "What are current mortgage rates in Box Elder County?",
    answer:
      "Rates change daily with the market and depend on your credit, down payment and loan type. As an independent broker we shop your loan across multiple lenders rather than quoting one bank's rate sheet. Contact us for a quote on your specific situation.",
  },
  {
    question: "How long does it take to close on a home in Box Elder County?",
    answer:
      "Most purchases close within 30 to 45 days of an accepted offer. Rural properties can add a few days for the appraisal, so we order it early. We work with the title companies and appraisers who cover Brigham City and Tremonton regularly.",
  },
  {
    question: "Can I buy a home with acreage or a manufactured home in Box Elder County?",
    answer:
      "Yes, with the right program. Conventional and FHA loans allow manufactured homes on a permanent foundation, and several programs accept larger lots common in the county's farming communities. Tell us about the property up front and we'll match it to a lender that finances it.",
  },
  {
    question: "Does Alta Mortgage Group serve all of Box Elder County?",
    answer:
      "Yes. We serve Brigham City, Tremonton, Perry, Willard, Garland, Corinne, Honeyville, Mantua, Bear River City, Elwood, Deweyville, Fielding, Plymouth and the unincorporated areas between them.",
  },
];

export default function BoxElderCountyPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateLocalBusinessSchema()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQSchema(faqs)) }} />
      <Breadcrumbs items={[{ label: "Utah", href: "/utah" }, { label: "Box Elder County" }]} />

      <div className="mt-6 max-w-3xl">
        <h1 className="text-4xl font-bold text-navy">Box Elder County Mortgage Lender</h1>
        <p className="mt-4 text-text-muted text-lg leading-relaxed">
          {COMPANY.name} is based just south of the county line in Hooper, and Box Elder County
          buyers have been part of our business since 1997. From Brigham City and Perry along the
          Wasatch foothills to Tremonton and the Bear River Valley, the county offers some of the
          most affordable homeownership in northern Utah, and many of its properties qualify for
          zero-down USDA financing.
        </p>
      </div>

      <div className="mt-16">
        <h2 className="text-3xl font-bold text-navy">Cities We Serve in Box Elder County</h2>
        <p className="mt-2 text-text-muted">
          We provide mortgage lending across {county.cities.length} cities and communities in Box Elder County.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {county.cities.map((city) => (
            <span key={city} className="inline-flex items-center rounded-full bg-navy/10 px-4 py-2 text-sm font-medium text-navy">
              {city}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-3xl font-bold text-navy">Box Elder County Housing Market</h2>
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <Card className="bg-white border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-text">Room to Breathe</h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                Larger lots and lower prices than Weber and Davis counties draw buyers who want space
                without leaving the Wasatch Front. Brigham City and Perry keep a short drive to Ogden;
                Tremonton and Garland sit at the I-15/I-84 junction for commutes north and east.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-text">USDA Country</h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                Much of the county is USDA-eligible, which means 100% financing for qualified buyers.
                Combined with FHA and Utah Housing Corporation assistance, it is one of the easiest
                places on the Wasatch Front to buy with little money down.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-text">Growing Along the Corridor</h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                New subdivisions in Perry, Willard and west Brigham City are adding homes for families
                priced out further south, while Tremonton&apos;s growth follows the employers along
                I-15. Established neighborhoods in Brigham City hold their value well.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-text">Farms, Acreage and Unusual Properties</h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                Hobby farms, homes on acreage and manufactured homes are common here and not every
                lender finances them. Shopping your loan across several lenders is exactly what an
                independent broker is for.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-3xl font-bold text-navy">Frequently Asked Questions</h2>
        <div className="mt-6 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="bg-surface rounded-xl p-6">
              <h3 className="font-semibold text-text">{faq.question}</h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 bg-surface-warm rounded-2xl p-8 lg:p-12 text-center">
        <h2 className="text-3xl font-bold text-navy">Ready to Buy in Box Elder County?</h2>
        <p className="mt-3 text-text-muted max-w-xl mx-auto">
          Tell us about the property and we&apos;ll tell you which programs it qualifies for.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact" className={cn(buttonVariants({ size: "lg" }), "bg-emerald hover:bg-emerald-light text-white")}>
            Get Pre-Approved
          </Link>
          <Link href="/apply" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-navy text-navy")}>
            Start Your Application
          </Link>
        </div>
      </div>
    </div>
  );
}
