import Link from "next/link";
import { Icons } from "@/lib/icons";
import { formatRateDate, getMarketRates } from "@/lib/rates-data";

const SHOWN = ["OBMMIC30YF", "OBMMIC15YF", "OBMMIFHA30YF"];

export async function RateTeaser() {
  const { rates, asOf } = await getMarketRates();
  const shown = SHOWN.map((id) => rates.find((r) => r.seriesId === id)).filter((r) => r !== undefined);

  return (
    <section className="bg-navy text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icons.rateDrop className="w-6 h-6 text-gold-light" />
            <div>
              <div className="font-semibold text-lg">Today&apos;s Rate Averages</div>
              <div className="text-xs text-white/60">National averages, {formatRateDate(asOf)}</div>
            </div>
          </div>
          <div className="flex items-center gap-6 sm:gap-10">
            {shown.map((r) => (
              <div key={r.seriesId} className="text-center">
                <div className="text-2xl font-bold font-display">{r.rate.toFixed(3)}%</div>
                <div className="text-xs text-white/60">{r.loanType}</div>
              </div>
            ))}
          </div>
          <Link href="/rates" className="text-sm font-semibold text-gold-light hover:text-white transition-colors underline underline-offset-4">
            See All Rates &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
