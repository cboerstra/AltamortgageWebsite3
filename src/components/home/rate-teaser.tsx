import Link from "next/link";
import { Icons } from "@/lib/icons";

export function RateTeaser() {
  return (
    <section className="bg-navy text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icons.rateDrop className="w-6 h-6 text-emerald-light" />
            <span className="font-semibold text-lg">Today&apos;s Rates</span>
          </div>
          <div className="flex items-center gap-6 sm:gap-10">
            <div className="text-center">
              <div className="text-2xl font-bold font-display">6.625%</div>
              <div className="text-xs text-white/60">30-Year Fixed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-display">5.875%</div>
              <div className="text-xs text-white/60">15-Year Fixed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-display">6.125%</div>
              <div className="text-xs text-white/60">FHA 30-Year</div>
            </div>
          </div>
          <Link href="/rates" className="text-sm font-medium text-emerald-light hover:text-white transition-colors underline underline-offset-4">
            See All Rates &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
