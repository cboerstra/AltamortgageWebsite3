import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COMPANY } from "@/lib/constants";
import { Icons } from "@/lib/icons";
import { TESTIMONIALS } from "@/lib/testimonials";

export const metadata: Metadata = {
  title: "Client Reviews",
  description: `What clients say about working with ${COMPANY.broker.name} and ${COMPANY.name} on their Utah home purchase or refinance.`,
};

export default function TestimonialsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Client Reviews" }]} />

      <div className="mt-6 max-w-3xl">
        <h1 className="text-4xl text-navy">What Our Clients Say</h1>
        <p className="mt-4 text-text-muted text-lg leading-relaxed">
          Nothing pleases us more than helping a family into an affordable home. These are the words of
          clients who have worked with {COMPANY.broker.name} on a purchase or refinance.
        </p>
      </div>

      <div className="mt-12 columns-1 md:columns-2 gap-6 [&>*]:break-inside-avoid">
        {TESTIMONIALS.map((t) => (
          <figure key={t.author} className="mb-6 rounded-[20px] bg-white border border-navy/10 p-6 lg:p-8">
            <Icons.quote className="w-7 h-7 text-gold mb-3" aria-hidden="true" />
            <blockquote className="text-text leading-relaxed">{t.body}</blockquote>
            <figcaption className="mt-4 pt-4 border-t border-border font-semibold text-navy">{t.author}</figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-12 bg-mesh rounded-[20px] p-8 lg:p-12 text-center">
        <h2 className="text-3xl text-navy">Ready to Work With Us?</h2>
        <p className="mt-3 text-text-muted max-w-xl mx-auto">
          Whether you&apos;re buying, refinancing, or tapping into your equity, we&apos;re here to help.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/contact" className={cn(buttonVariants({ size: "lg" }), "rounded-full bg-emerald hover:bg-emerald-light text-white font-semibold px-8")}>
            Get Pre-Approved
          </Link>
          <Link href="/apply" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full border-2 border-emerald text-emerald hover:bg-emerald hover:text-white font-semibold px-8")}>
            Apply Now
          </Link>
        </div>
      </div>
    </div>
  );
}
