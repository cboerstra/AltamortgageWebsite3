export const COMPANY = {
  name: "Alta Mortgage Group",
  legalName: "Clarke and Associates",
  shortName: "Alta",
  domain: "altamortgagegroup.net",
  title: "Broker/Manager",
  phone: "(801) 628-9400",
  email: "info@altamortgagegroup.net",
  // Company (entity) NMLS ID. The broker's individual ID is under `broker`.
  nmlsId: "565137",
  stateLicenseId: "5452345-NMLM",
  broker: { name: "Scott Boerstra", title: "Broker/Manager", nmlsId: "258624" },
  foundedYear: 1997,
  address: { street: "4824 S 6150 W", city: "Hooper", state: "UT", zip: "84315" },
  hours: { weekdays: "9:00 AM - 6:00 PM", saturday: "10:00 AM - 2:00 PM", sunday: "Closed" },
  social: {
    facebook: "https://www.facebook.com/AltaMortgageGroupUtah/",
    instagram: "https://www.instagram.com/alta_mortgage_group/",
  },
} as const;

/** Whole years since the company opened; pages recompute it when they rebuild. */
export function yearsInBusiness(now = new Date()): number {
  return now.getFullYear() - COMPANY.foundedYear;
}

export const SERVICE_AREAS = {
  state: "Utah",
  /** For running copy: "…families in Weber, Davis, Box Elder and Morgan counties". */
  countiesText: "Weber, Davis, Box Elder and Morgan counties",
  /** Short form for headings and badges. */
  region: "Northern Utah",
  counties: [
    {
      name: "Weber County", slug: "weber-county",
      cities: ["Ogden", "Roy", "North Ogden", "South Ogden", "Riverdale", "Pleasant View", "Harrisville", "Farr West", "West Haven", "Plain City", "Washington Terrace", "Hooper", "Huntsville"],
    },
    {
      name: "Davis County", slug: "davis-county",
      cities: ["Layton", "Bountiful", "Kaysville", "Clearfield", "Syracuse", "Farmington", "Centerville", "Woods Cross", "West Point", "Clinton", "North Salt Lake", "South Weber", "Fruit Heights", "Sunset", "West Bountiful"],
    },
    {
      name: "Box Elder County", slug: "box-elder-county",
      cities: ["Brigham City", "Tremonton", "Perry", "Willard", "Garland", "Corinne", "Honeyville", "Mantua", "Bear River City", "Elwood", "Deweyville", "Fielding", "Plymouth"],
    },
    {
      name: "Morgan County", slug: "morgan-county",
      cities: ["Morgan", "Mountain Green", "Peterson", "Croydon", "Milton", "Porterville", "Richville"],
    },
  ],
} as const;

export const LOAN_TYPES = [
  { id: "conventional", name: "Conventional", shortDescription: "Not government-backed. Competitive rates from multiple lenders for borrowers with solid credit.", icon: "conventional", features: ["Down payments as low as 3%", "No upfront mortgage insurance fee", "Available for primary, secondary, and investment properties", "Fixed and adjustable rate options"] },
  { id: "fha", name: "FHA", shortDescription: "Insured by the Federal Housing Administration, with flexible credit requirements and low down payments.", icon: "fha", features: ["Down payments as low as 3.5%", "Credit scores as low as 580", "Gift funds allowed for down payment", "Available to first-time and repeat buyers"] },
  { id: "va", name: "VA", shortDescription: "Guaranteed by the U.S. Department of Veterans Affairs for eligible veterans, active-duty service members and surviving spouses.", icon: "va", features: ["No down payment required", "No private mortgage insurance", "Funding fee can be rolled into the loan", "Limited closing costs"] },
  { id: "usda", name: "USDA", shortDescription: "Backed by the U.S. Department of Agriculture: zero-down loans for eligible rural and suburban homebuyers.", icon: "usda", features: ["No down payment required", "Low mortgage insurance costs", "Eligibility based on property address and household income", "Available in eligible rural areas of Utah"] },
  { id: "jumbo", name: "Jumbo", shortDescription: "For loan amounts above the conforming loan limit, the most Fannie Mae and Freddie Mac will buy.", icon: "jumbo", features: ["Loan amounts above the conforming limit", "For higher-priced homes", "Fixed and adjustable rate options", "Typically needs a larger down payment and cash reserves"] },
  { id: "arm", name: "Adjustable Rate (ARM)", shortDescription: "The rate is fixed for the first 5, 7 or 10 years, then can adjust once a year, within set limits.", icon: "arm", features: ["Lower initial monthly payments", "5/1, 7/1 and 10/1 options (a 5/1 is fixed for 5 years, then adjusts yearly)", "Rate caps limit how much the rate can rise", "Ideal for shorter-term homeownership"] },
  { id: "fixed", name: "Fixed Rate", shortDescription: "Principal and interest stay the same for the life of the loan.", icon: "fixed", features: ["Rate stays the same for the entire term", "15, 20, and 30-year terms available", "Predictable principal and interest payment", "Protection from rising interest rates"] },
] as const;

export const NAV_LINKS = [
  { label: "Purchase", href: "/purchase" },
  { label: "Refinance", href: "/refinance" },
  { label: "Home Equity", href: "/home-equity" },
  { label: "Loan Options", href: "/loan-options" },
  { label: "Rates", href: "/rates" },
  { label: "Calculator", href: "/mortgage-calculator" },
  { label: "About", href: "/about" },
] as const;
