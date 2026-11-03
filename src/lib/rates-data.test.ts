// The daily rate table reads FRED's CSV. A malformed or partial file must
// either parse into honest numbers or throw — throwing is what keeps the last
// good page on the site.

import { describe, expect, it } from "vitest";
import { FALLBACK_RATES, formatRateDate, fredCsvUrl, parseFredCsv } from "./rates-data";

const CSV = [
  "observation_date,OBMMIC30YF,OBMMIC15YF,OBMMIFHA30YF,OBMMIVA30YF,OBMMIUSDA30YF,OBMMIJUMBO30YF",
  "2026-10-28,7.180,6.540,7.050,6.800,6.990,7.200",
  "2026-10-29,7.147,6.523,7.039,6.789,6.980,7.156",
  "2026-10-30,7.147,6.468,6.997,6.758,6.874,.",
].join("\n");

describe("parseFredCsv", () => {
  it("takes each series' latest observation and the one before it", () => {
    const { rates } = parseFredCsv(CSV);
    const fifteen = rates.find((r) => r.seriesId === "OBMMIC15YF")!;
    expect(fifteen).toEqual({
      seriesId: "OBMMIC15YF",
      loanType: "15-Year Fixed",
      rate: 6.468,
      previousRate: 6.523,
      date: "2026-10-30",
    });
  });

  it("lets a series that lags a day keep its own latest value and date", () => {
    const { rates, asOf } = parseFredCsv(CSV);
    const jumbo = rates.find((r) => r.seriesId === "OBMMIJUMBO30YF")!;
    expect(jumbo.rate).toBe(7.156);
    expect(jumbo.date).toBe("2026-10-29");
    expect(asOf).toBe("2026-10-30");
  });

  it("keeps the table in a fixed order", () => {
    expect(parseFredCsv(CSV).rates.map((r) => r.loanType)).toEqual([
      "30-Year Fixed",
      "15-Year Fixed",
      "FHA 30-Year",
      "VA 30-Year",
      "USDA 30-Year",
      "Jumbo 30-Year",
    ]);
  });

  it("handles Windows line endings and a single observation", () => {
    const csv = "observation_date,OBMMIC30YF\r\n2026-10-30,7.147\r\n";
    const { rates } = parseFredCsv(csv);
    expect(rates).toEqual([
      { seriesId: "OBMMIC30YF", loanType: "30-Year Fixed", rate: 7.147, previousRate: undefined, date: "2026-10-30" },
    ]);
  });

  it("ignores blanks and implausible values rather than showing them", () => {
    const csv = "observation_date,OBMMIC30YF\n2026-10-29,7.1\n2026-10-30,\n2026-10-31,999\n";
    expect(parseFredCsv(csv).rates[0].rate).toBe(7.1);
  });

  it("throws on an error page or an empty result, so the last good page stays up", () => {
    expect(() => parseFredCsv("<html>Service unavailable</html>")).toThrow();
    expect(() => parseFredCsv("observation_date,OBMMIC30YF\n2026-10-30,.\n")).toThrow();
  });
});

describe("fredCsvUrl", () => {
  it("asks for every series in one request, three weeks back", () => {
    const url = fredCsvUrl(new Date("2026-11-02T12:00:00Z"));
    expect(url).toContain("id=OBMMIC30YF,OBMMIC15YF,OBMMIFHA30YF,OBMMIVA30YF,OBMMIUSDA30YF,OBMMIJUMBO30YF");
    expect(url).toContain("cosd=2026-10-12");
  });
});

describe("formatRateDate", () => {
  it("writes the observation date out without shifting it across a timezone", () => {
    expect(formatRateDate("2026-10-30")).toBe("October 30, 2026");
    expect(formatRateDate("2026-01-01")).toBe("January 1, 2026");
  });
});

describe("FALLBACK_RATES", () => {
  it("covers every loan type the table shows", () => {
    expect(FALLBACK_RATES.rates).toHaveLength(6);
  });
});
