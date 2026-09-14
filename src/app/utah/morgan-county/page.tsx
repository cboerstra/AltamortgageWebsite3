import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SERVICE_AREAS, COMPANY } from "@/lib/constants";
import { generateLocalBusinessSchema, generateFAQSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Morgan County Mortgage Lender",
  description:
    "Alta Mortgage Group serves Morgan, Mountain Green and all Morgan County communities. Local mortgage expertise for home purchase, refinance, construction and equity loans.",
  keywords: [
    "Morgan County mortgage",
    "Mountain Green home loans",
    "mortgage lender Morgan Utah",
    "Morgan County real estate financing",
  ],
};

const county = SERVICE_AREAS.counties.find((c) => c.slug === "morgan-county")!;

const faqs = [
  {
    question: "What are current mortgage rates in Morgan County?",
    answer:
      "Rates change daily with the market and depend on your credit, down payment and loan type. As an independent broker we shop your loan across multiple lenders rather than quoting one bank's rate sheet. Contact us for a quote on your specific situation.",
  },
  {
    question: "Do Morgan County homes qualify for USDA loans?",
    answer:
      "Most of the county does. USDA rural development loans offer 100% financing on eligible properties, and Morgan County's small-town and rural addresses generally qualify. Eligibility is by address, so we check the specific property before you make an offer.",
  },
  {
    question: "Can I get a jumbo loan for a Mountain Green home?",
    answer:
      "Yes. Mountain Green and the communities near Snowbasin include homes above the conventional loan limit, and we place jumbo loans with lenders that price them competitively. We also handle the larger down payments and reserves those loans typically require.",
  },
  {
    question: "How long does it take to close on a home in Morgan County?",
    answer:
      "Most purchases close within 30 to 45 days of an accepted offer. Appraisals in a smaller market can take a little longer to schedule, so we order them as soon as the contract is signed.",
  },
  {
    question: "Does Alta Mortgage Group serve all of Morgan County?",
    answer:
      "Yes. We serve Morgan, Mountain Green, Peterson, Croydon, Milton, Porterville, Richville and the surrounding unincorporated areas.",
  },
];

export default function MorganCountyPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateLocalBusinessSchema()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQSchema(faqs)) }} />
      <Breadcrumbs items={[{ label: "Utah", href: "/utah" }, { label: "Morgan County" }]} />

      <div className="mt-6 max-w-3xl">
        <h1 className="text-4xl font-bold text-navy">Morgan County Mortgage Lender</h1>
        <p className="mt-4 text-text-muted text-lg leading-relaxed">
          Morgan County sits just over the ridge from {COMPANY.name}&apos;s Weber County home, up
          Weber Canyon along I-84. It is one of Utah&apos;s smallest counties by population and one
          of its most sought-after: mountain views, room to build, Snowbasin and Pineview minutes
          away, and Ogden or Salt Lake within commuting distance.
        </p>
      </div>

      <div className="mt-16">
        <h2 className="text-3xl font-bold text-navy">Cities We Serve in Morgan County</h2>
        <p className="mt-2 text-text-muted">
          We provide mortgage lending across {county.cities.length} communities in Morgan County.
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
        <h2 className="text-3xl font-bold text-navy">Morgan County Housing Market</h2>
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <Card className="bg-white border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-text">Mountain Green&apos;s Growth</h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                Mountain Green has become the county&apos;s growth center, with new neighborhoods at
                the mouth of Weber Canyon that put Ogden twenty minutes away. Prices run higher than
                Weber County; jumbo and conventional loans do most of the work here.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-text">Morgan City and the Valley</h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                The county seat and the farming communities along the Weber River keep a small-town
                market with established homes, larger lots and USDA eligibility that makes zero-down
                purchases possible for qualified buyers.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-text">Building Your Own</h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                A large share of Morgan County buyers purchase land and build. We arrange lot and
                construction financing that converts to a permanent mortgage at completion, so there
                is one approval and one closing.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-text">Recreation at the Door</h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                Snowbasin, Pineview Reservoir, East Canyon and the Weber River draw buyers who want
                the outdoors without a long drive. Second homes and cabins are financed on their own
                programs, and we know which lenders offer them.
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
        <h2 className="text-3xl font-bold text-navy">Ready to Buy in Morgan County?</h2>
        <p className="mt-3 text-text-muted max-w-xl mx-auto">
          Whether it&apos;s a home in Mountain Green or a lot to build on, we&apos;ll find the
          program that fits.
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
