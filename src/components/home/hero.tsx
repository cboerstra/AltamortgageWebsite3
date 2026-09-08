import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeroIllustration } from "@/components/graphics/hero-illustration";

export function Hero() {
  return (
    <section className="bg-gradient-to-b from-surface-warm via-surface-warm to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <span className="inline-block rounded-full bg-gold/15 text-gold px-4 py-1.5 text-sm font-semibold tracking-wide">
              Serving Weber &amp; Davis Counties
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-tight">
              Your Trusted Utah Mortgage Partner
            </h1>
            <p className="mt-6 text-lg text-text-muted max-w-xl">
              Helping families in Weber &amp; Davis counties find the right home loan.
              Expert guidance, competitive rates, and a commitment to your homeownership goals.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/contact" className={cn(buttonVariants({ size: "lg" }), "bg-emerald hover:bg-emerald-light text-white text-base px-8 py-6 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300")}>
                Get Pre-Approved
              </Link>
              <Link href="/mortgage-calculator" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-2 border-navy text-navy hover:bg-navy hover:text-white text-base px-8 py-6 transition-all duration-300")}>
                Calculate Your Payment
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex justify-center animate-fade-up-delay" aria-hidden="true">
            <HeroIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}
