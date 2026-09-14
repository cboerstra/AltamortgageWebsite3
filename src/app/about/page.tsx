import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COMPANY } from "@/lib/constants";
import { Icons } from "@/lib/icons";

export const metadata: Metadata = {
  title: "About Us",
  description: `Learn about ${COMPANY.name}, a trusted Utah mortgage lender serving Weber, Davis, Box Elder and Morgan counties. Our mission, values, and team.`,
};

const values = [
  { icon: Icons.community, title: "Community First", description: "We live and work in northern Utah — Weber, Davis, Box Elder and Morgan counties. Your community is our community, and we're invested in helping our neighbors achieve homeownership." },
  { icon: Icons.expertise, title: "Expert Guidance", description: "Navigating mortgage options can be complex. We simplify the process with clear, honest advice tailored to your unique financial situation." },
  { icon: Icons.personalService, title: "Personal Service", description: "You're not a number to us. Every client gets a dedicated loan specialist who's available when you need them — by phone, email, or in person." },
  { icon: Icons.transparency, title: "Trust & Transparency", description: "No hidden fees, no surprises. We believe in full transparency throughout the lending process so you can make confident decisions." },
];

const broker = {
  name: COMPANY.broker.name,
  title: COMPANY.broker.title,
  nmls: COMPANY.broker.nmlsId,
  photo: "/images/scott-boerstra.jpg",
  bio: [
    "Scott Boerstra is the Broker/Manager of Alta Mortgage Group, which opened its doors in Sandy, Utah in 1997 — 29 years ago and counting. The company moved to Hooper in Weber County in 2002 and today serves families up and down the Wasatch Front.",
    "Scott graduated from the University of Utah in 1993 with a degree in Marketing. Along the way he has bought, renovated and sold homes himself, which gives him a working sense of what a property is really worth and what it takes to get to closing. He is a licensed mortgage broker and also a licensed real estate agent with Equity Real Estate, so clients get one person who understands both sides of the transaction.",
    "His focus is helping new families get into affordable homes: finding the right program, the right lender and the right payment, and staying with each file personally from application through closing.",
  ],
};

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "About Us" }]} />

      <div className="mt-6 max-w-3xl">
        <h1 className="text-4xl font-bold text-navy">About Alta Mortgage Group</h1>
        <p className="mt-4 text-text-muted text-lg leading-relaxed">
          Alta Mortgage Group is a Utah-based mortgage lender dedicated to helping families across Weber, Davis, Box Elder and Morgan counties achieve their homeownership dreams. Founded on the principles of trust, transparency, and personalized service, we provide expert mortgage guidance for home purchases, refinancing, and home equity loans.
        </p>
        <p className="mt-4 text-text-muted text-lg leading-relaxed">
          Our name, &quot;Alta,&quot; means &quot;high&quot; or &quot;elevated&quot; — and that&apos;s exactly the standard of service we hold ourselves to. We believe every family deserves a lender who listens, educates, and advocates on their behalf.
        </p>
      </div>

      <div className="mt-16">
        <h2 className="text-3xl font-bold text-navy">Our Values</h2>
        <div className="mt-8 grid sm:grid-cols-2 gap-6">
          {values.map((v) => (
            <div key={v.title} className="bg-surface rounded-xl p-6 flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center shrink-0">
                <v.icon className="w-5 h-5 text-navy" />
              </div>
              <div>
                <h3 className="font-semibold text-text">{v.title}</h3>
                <p className="text-sm text-text-muted mt-1 leading-relaxed">{v.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-3xl font-bold text-navy">Meet Your Broker</h2>
        <div className="mt-8 bg-white border border-border rounded-xl p-6 lg:p-8 grid md:grid-cols-[260px_1fr] gap-8 items-start">
          <Image
            src={broker.photo}
            alt={`${broker.name}, ${broker.title} at ${COMPANY.name}`}
            width={800}
            height={1000}
            sizes="(min-width: 768px) 260px, 100vw"
            className="w-full max-w-[260px] mx-auto md:mx-0 rounded-xl object-cover"
            priority={false}
          />
          <div>
            <h3 className="text-2xl font-bold text-text">{broker.name}</h3>
            <p className="text-emerald font-medium">{broker.title}</p>
            <p className="text-sm text-text-muted mt-1">NMLS# {broker.nmls}</p>
            <div className="mt-5 space-y-4">
              {broker.bio.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="text-text-muted leading-relaxed">{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 bg-surface-warm rounded-2xl p-8 lg:p-12 text-center">
        <h2 className="text-3xl font-bold text-navy">Ready to Work With Us?</h2>
        <p className="mt-3 text-text-muted max-w-xl mx-auto">
          Whether you&apos;re buying, refinancing, or tapping into your equity, our team is here to help.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact" className={cn(buttonVariants({ size: "lg" }), "bg-emerald hover:bg-emerald-light text-white")}>
            Get Pre-Approved
          </Link>
          <a href={`tel:${COMPANY.phone.replace(/\D/g, "")}`} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-navy text-navy")}>
            Call {COMPANY.phone}
          </a>
        </div>
      </div>
    </div>
  );
}
