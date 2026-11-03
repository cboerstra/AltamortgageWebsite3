// Daily national mortgage rate averages, from the Optimal Blue Mortgage
// Market Indices published on FRED (Federal Reserve Bank of St. Louis).
//
// These are averages of rates actually locked through the Optimal Blue
// pricing engine each business day — market figures, not Alta's pricing —
// so the site shows them without an APR and labels them as averages. FRED
// requires citing Optimal Blue as the source.
//
// Refresh: the pages that show rates revalidate every few hours. If FRED is
// unreachable during a background refresh the error is thrown, and Next.js
// keeps serving the last good page. Only during a build, when there is no
// previous page to keep, do we fall back to the dated snapshot below.

import { PHASE_PRODUCTION_BUILD } from "next/constants";

export interface MarketRate {
  /** FRED series id */
  seriesId: string;
  loanType: string;
  /** Average rate, percent */
  rate: number;
  /** The previous business day's average, for the daily change */
  previousRate?: number;
  /** ISO date of the observation */
  date: string;
}

export interface MarketRates {
  rates: MarketRate[];
  /** The most recent observation date across the series */
  asOf: string;
}

export const RATES_REVALIDATE_SECONDS = 6 * 60 * 60;

export const RATES_SOURCE = {
  name: "Optimal Blue Mortgage Market Indices",
  via: "FRED, Federal Reserve Bank of St. Louis",
  url: "https://fred.stlouisfed.org/release?rid=480",
};

const SERIES: { seriesId: string; loanType: string }[] = [
  { seriesId: "OBMMIC30YF", loanType: "30-Year Fixed" },
  { seriesId: "OBMMIC15YF", loanType: "15-Year Fixed" },
  { seriesId: "OBMMIFHA30YF", loanType: "FHA 30-Year" },
  { seriesId: "OBMMIVA30YF", loanType: "VA 30-Year" },
  { seriesId: "OBMMIUSDA30YF", loanType: "USDA 30-Year" },
  { seriesId: "OBMMIJUMBO30YF", loanType: "Jumbo 30-Year" },
];

/** Used only when a build cannot reach FRED. Shown with its own date, never as today's. */
export const FALLBACK_RATES: MarketRates = {
  asOf: "2026-10-30",
  rates: [
    { seriesId: "OBMMIC30YF", loanType: "30-Year Fixed", rate: 7.147, previousRate: 7.147, date: "2026-10-30" },
    { seriesId: "OBMMIC15YF", loanType: "15-Year Fixed", rate: 6.468, previousRate: 6.523, date: "2026-10-30" },
    { seriesId: "OBMMIFHA30YF", loanType: "FHA 30-Year", rate: 6.997, previousRate: 7.039, date: "2026-10-30" },
    { seriesId: "OBMMIVA30YF", loanType: "VA 30-Year", rate: 6.758, previousRate: 6.789, date: "2026-10-30" },
    { seriesId: "OBMMIUSDA30YF", loanType: "USDA 30-Year", rate: 6.874, previousRate: 6.98, date: "2026-10-30" },
    { seriesId: "OBMMIJUMBO30YF", loanType: "Jumbo 30-Year", rate: 7.355, previousRate: 7.156, date: "2026-10-30" },
  ],
};

/** How far back to ask for, so a long weekend or holiday still leaves two observations. */
const LOOKBACK_DAYS = 21;

export function fredCsvUrl(now: Date): string {
  const start = new Date(now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const ids = SERIES.map((s) => s.seriesId).join(",");
  return `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${ids}&cosd=${start}`;
}

/**
 * Parse FRED's multi-series CSV: a date column, then one column per series.
 * Missing observations are "." or empty. Each series takes its own latest
 * value (and the one before it), so one series lagging a day does not hide
 * the others. Throws when the file is not what we asked for.
 */
export function parseFredCsv(csv: string): MarketRates {
  const lines = csv.trim().split(/\r?\n/);
  const header = lines[0]?.split(",").map((h) => h.trim()) ?? [];
  if (header.length < 2 || !/date/i.test(header[0])) throw new Error("FRED response is not a series CSV");

  const rows = lines.slice(1).map((line) => line.split(",").map((c) => c.trim()));
  const rates: MarketRate[] = [];

  for (const { seriesId, loanType } of SERIES) {
    const col = header.indexOf(seriesId);
    if (col === -1) continue;
    const observations = rows
      .map((r) => ({ date: r[0], value: Number(r[col]) }))
      .filter((o) => /^\d{4}-\d{2}-\d{2}$/.test(o.date) && plausibleRate(o.value))
      .sort((a, b) => a.date.localeCompare(b.date));
    const latest = observations.at(-1);
    if (!latest) continue;
    rates.push({ seriesId, loanType, rate: latest.value, previousRate: observations.at(-2)?.value, date: latest.date });
  }

  if (rates.length === 0) throw new Error("FRED response held no rate observations");
  const asOf = rates.map((r) => r.date).sort().at(-1)!;
  return { rates, asOf };
}

/** A plausible mortgage rate: rejects ".", blanks and anything nonsensical. */
function plausibleRate(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value < 25;
}

export async function getMarketRates(): Promise<MarketRates> {
  try {
    const res = await fetch(fredCsvUrl(new Date()), {
      next: { revalidate: RATES_REVALIDATE_SECONDS },
      headers: { "User-Agent": "altamortgagegroup.net rates (contact: info@altamortgagegroup.net)" },
    });
    if (!res.ok) throw new Error(`FRED answered ${res.status}`);
    return parseFredCsv(await res.text());
  } catch (err) {
    // During a build there is no earlier page to fall back on, and failing
    // the deploy over a rate table would be worse than a dated snapshot.
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
      console.warn("Market rates unavailable during build; using the dated snapshot:", err);
      return FALLBACK_RATES;
    }
    // At runtime, throwing keeps the last successfully generated page.
    throw err;
  }
}

/** "October 30, 2026" — the observation date, in words, without a timezone shift. */
export function formatRateDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
