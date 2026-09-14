import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IMAGES } from "@/lib/images";
import { Icons } from "@/lib/icons";

export function Hero() {
  return (
    <section className="bg-mesh">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-gold">
              Serving Weber &amp; Davis Counties
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl text-navy leading-[1.08]">
              Your Trusted Utah Mortgage Partner
            </h1>
            <div className="mt-6 h-1 w-16 rounded-full bg-gold" />
            <p className="mt-6 text-lg text-text-muted max-w-xl">
              Helping families in Weber &amp; Davis counties find the right home loan.
              Expert guidance, competitive rates, and a commitment to your homeownership goals.
            </p>
            <div className="mt-8 flex flex-col items-stretch sm:items-start gap-3">
              <Link href="/contact" className={cn(buttonVariants({ size: "lg" }), "rounded-full bg-emerald hover:bg-emerald-light text-white text-base font-semibold px-8 py-6 sm:min-w-[260px] shadow-md hover:shadow-lg transition-all duration-300")}>
                Get Pre-Approved
              </Link>
              <Link href="/apply" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full border-2 border-emerald bg-transparent text-emerald hover:bg-emerald hover:text-white text-base font-semibold px-8 py-6 sm:min-w-[260px] transition-all duration-300")}>
                Apply Now
              </Link>
              <Link href="/mortgage-calculator" className="mt-2 inline-flex items-center gap-1.5 text-emerald font-semibold hover:text-navy transition-colors">
                Calculate your payment <Icons.next className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="hidden lg:block animate-fade-up-delay">
            <Image
              src={IMAGES.heroFamily}
              alt="A family receiving the keys to their new home, with the Wasatch mountains behind them"
              width={1400}
              height={788}
              priority
              sizes="(min-width: 1024px) 600px, 0px"
              className="w-full rounded-[20px] shadow-[0_24px_48px_rgba(0,75,27,0.14)] object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
