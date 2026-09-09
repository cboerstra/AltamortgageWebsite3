import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Home Purchase Loans",
  description:
    "Buy your dream home in Utah with competitive mortgage rates. First-time buyer programs, FHA, VA, Conventional, and more from Alta Mortgage Group.",
};

const benefits = [
  "Competitive rates on all loan types",
  "Down payments as low as 0% for eligible buyers",
  "First-time homebuyer programs and grants",
  "Local expertise in Weber and Davis county markets",
  "Fast pre-approvals — often same day",
  "Personalized guidance from application to closing",
];

export default function PurchasePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Home Purchase" }]} />
      <div className="mt-6 grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <div className="w-14 h-14 rounded-xl bg-navy/10 flex items-center justify-center mb-6">
            <Icons.purchase className="w-7 h-7 text-navy" />
          </div>
          <h1 className="text-4xl font-bold text-navy">
            Buy a Home in Utah
          </h1>
          <p className="mt-4 text-text-muted text-lg leading-relaxed">
            Whether you&apos;re buying your first home in Ogden or upgrading in
            Kaysville, Alta Mortgage Group will guide you through every step. We
            offer a full range of purchase loan programs with competitive rates
            and personalized service.
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
              Get Pre-Approved
            </Link>
            <Link
              href="/loan-options"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-navy text-navy hover:bg-navy hover:text-white",
              )}
            >
              View Loan Options
            </Link>
          </div>
        </div>
        <div className="bg-surface-warm rounded-2xl p-8 lg:p-10">
          <h2 className="text-2xl font-bold text-navy">How It Works</h2>
          <ol className="mt-6 space-y-6">
            {[
              {
                step: "1",
                title: "Get Pre-Approved",
                desc: "Tell us about your finances and goals. We'll determine how much you can afford and provide a pre-approval letter.",
              },
              {
                step: "2",
                title: "Find Your Home",
                desc: "Shop with confidence knowing your budget and loan options. We partner with local Utah real estate agents.",
              },
              {
                step: "3",
                title: "Close Your Loan",
                desc: "We handle the paperwork, coordinate with all parties, and guide you to a smooth closing day.",
              },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-text">{item.title}</h3>
                  <p className="text-sm text-text-muted mt-1">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
