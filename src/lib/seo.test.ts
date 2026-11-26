import { describe, expect, it } from "vitest";
import { COMPANY } from "./constants";
import { generateLocalBusinessSchema } from "./seo";

// Office hours confirmed by Scott Boerstra on 2026-11-24:
// Monday to Friday 9 AM to 8 PM, closed Saturday and Sunday.
describe("business hours", () => {
  it("shows weekday hours of 9 AM to 8 PM", () => {
    expect(COMPANY.hours.weekdays).toBe("9:00 AM - 8:00 PM");
  });

  it("shows the office closed on weekends", () => {
    expect(COMPANY.hours.saturday).toBe("Closed");
    expect(COMPANY.hours.sunday).toBe("Closed");
  });

  it("gives search engines the same hours, with no weekend opening", () => {
    expect(generateLocalBusinessSchema().openingHoursSpecification).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "20:00",
      },
    ]);
  });
});
