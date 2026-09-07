import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Users, Clock, Award } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SERVICE_AREAS, COMPANY } from "@/lib/constants";
import { generateLocalBusinessSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Utah Mortgage Lender",
  description:
    "Alta Mortgage Group is a trusted Utah mortgage lender serving Weber and Davis counties. Purchase, refinance, and home equity loans with competitive rates.",
  keywords: [
    "Utah mortgage lender",
    "home loans Utah",
    "mortgage broker Utah",
    "Utah home financing",
  ],
};

const benefits = [
  {
    icon: MapPin,
    title: "Local Market Knowledge",
    description:
      "We know Utah neighborhoods, school districts, and property values. Our deep familiarity with Weber and Davis counties means better guidance on what you can afford and where.",
  },
  {
    icon: Users,
    title: "Face-to-Face Service",
    description:
      "Meet with a real person at our Ogden office. We believe in building relationships, not just processing paperwork. Your questions deserve real answers from someone who cares.",
  },
  {
    icon: Clock,
    title: "Faster Closings",
    description:
      "Local lenders close faster. Our relationships with Utah title companies, appraisers, and real estate agents help streamline the process so you can move in sooner.",
  },
  {
    icon: Award,
    title: "Utah-Specific Programs",
    description:
      "We specialize in programs designed for Utah buyers, including Utah Housing Corporation down payment assistance, USDA loans for rural areas, and first-time buyer grants.",
  },
];

export default function UtahPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateLocalBusinessSchema()),
        }}
      />
      <Breadcrumbs items={[{ label: "Utah" }]} />

      <div className="mt-6 max-w-3xl">
        <h1 className="text-4xl font-bold text-navy">Utah Mortgage Lender</h1>
        <p className="mt-4 text-text-muted text-lg leading-relaxed">
          {COMPANY.name} is a trusted mortgage lender based in{" "}
          {COMPANY.address.city}, Utah, serving homebuyers and homeowners across
          Weber and Davis counties. Whether you&apos;re purchasing your first
          home, refinancing for a better rate, or tapping into your home equity,
          our local expertise and personalized service make the process
          straightforward and stress-free.
        </p>
      </div>

      {/* Why Choose a Local Utah Lender */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-navy">
          Why Choose a Local Utah Lender
        </h2>
        <p className="mt-2 text-text-muted">
          Working with a local lender means more than just competitive rates. It
          means partnering with someone who understands your market.
        </p>
        <div className="mt-8 grid sm:grid-cols-2 gap-6">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="bg-surface rounded-xl p-6 flex gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center shrink-0">
                <benefit.icon className="w-5 h-5 text-navy" />
              </div>
              <div>
                <h3 className="font-semibold text-text">{benefit.title}</h3>
                <p className="text-sm text-text-muted mt-1 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Areas We Serve */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-navy">Areas We Serve</h2>
        <p className="mt-2 text-text-muted">
          We proudly serve homebuyers and homeowners across two of Utah&apos;s
          most vibrant counties.
        </p>
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {SERVICE_AREAS.counties.map((county) => (
            <Card
              key={county.slug}
              className="bg-white border-border hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-text">{county.name}</h3>
                <p className="mt-3 text-sm text-text-muted leading-relaxed">
                  {county.cities.join(", ")}
                </p>
                <Link
                  href={`/utah/${county.slug}`}
                  className={cn(
                    buttonVariants(),
                    "mt-4 bg-navy hover:bg-navy-light text-white",
                  )}
                >
                  Explore {county.name}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Utah Home Loan Programs */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-navy">
          Utah Home Loan Programs
        </h2>
        <p className="mt-2 text-text-muted max-w-3xl">
          Utah homebuyers have access to a variety of mortgage programs designed
          to make homeownership more accessible and affordable.
        </p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-surface rounded-xl p-6">
            <h3 className="font-semibold text-text">USDA Rural Loans</h3>
            <p className="text-sm text-text-muted mt-2 leading-relaxed">
              Many areas in Weber and Davis counties qualify for USDA financing,
              offering zero-down-payment mortgages for eligible buyers in
              designated rural communities.
            </p>
          </div>
          <div className="bg-surface rounded-xl p-6">
            <h3 className="font-semibold text-text">
              Utah Housing Corporation
            </h3>
            <p className="text-sm text-text-muted mt-2 leading-relaxed">
              Utah Housing Corp offers down payment assistance and competitive
              rate programs for first-time and repeat buyers who meet income and
              purchase price limits.
            </p>
          </div>
          <div className="bg-surface rounded-xl p-6">
            <h3 className="font-semibold text-text">FHA &amp; VA Loans</h3>
            <p className="text-sm text-text-muted mt-2 leading-relaxed">
              FHA loans provide flexible credit requirements with down payments
              as low as 3.5%. VA loans offer zero-down financing for veterans
              and active-duty military members stationed in or near Utah.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <Link
            href="/loan-options"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "border-navy text-navy",
            )}
          >
            View All Loan Options
          </Link>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-16 bg-surface-warm rounded-2xl p-8 lg:p-12 text-center">
        <h2 className="text-3xl font-bold text-navy">
          Ready to Get Started?
        </h2>
        <p className="mt-3 text-text-muted max-w-xl mx-auto">
          Whether you&apos;re buying your first home or refinancing your current
          mortgage, our Utah lending experts are here to help every step of the
          way.
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
