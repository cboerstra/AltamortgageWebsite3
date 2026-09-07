export const COMPANY = {
  name: "Alta Mortgage Group",
  shortName: "Alta",
  domain: "altamortgagegroup.net",
  title: "Broker/Manager",
  phone: "(801) 628-9400",
  email: "info@altamortgagegroup.net",
  nmlsId: "258624",
  stateLicenseId: "5452345-NMLM",
  address: { street: "4824 S 6150 W", city: "Hooper", state: "UT", zip: "84315" },
  hours: { weekdays: "9:00 AM - 6:00 PM", saturday: "10:00 AM - 2:00 PM", sunday: "Closed" },
  social: {
    facebook: "https://facebook.com/altamortgagegroup",
    instagram: "https://instagram.com/altamortgagegroup",
    linkedin: "https://linkedin.com/company/altamortgagegroup",
  },
} as const;

export const SERVICE_AREAS = {
  state: "Utah",
  counties: [
    {
      name: "Weber County", slug: "weber-county",
      cities: ["Ogden", "Roy", "North Ogden", "South Ogden", "Riverdale", "Pleasant View", "Harrisville", "Farr West", "West Haven", "Plain City", "Washington Terrace", "Hooper", "Huntsville"],
    },
    {
      name: "Davis County", slug: "davis-county",
      cities: ["Layton", "Bountiful", "Kaysville", "Clearfield", "Syracuse", "Farmington", "Centerville", "Woods Cross", "West Point", "Clinton", "North Salt Lake", "South Weber", "Fruit Heights", "Sunset", "West Bountiful"],
    },
  ],
} as const;

export const LOAN_TYPES = [
  { id: "conventional", name: "Conventional", shortDescription: "Traditional mortgage with competitive rates for qualified borrowers.", icon: "Home", features: ["Down payments as low as 3%", "No upfront mortgage insurance fee", "Available for primary, secondary, and investment properties", "Fixed and adjustable rate options"] },
  { id: "fha", name: "FHA", shortDescription: "Government-backed loans with flexible credit requirements and low down payments.", icon: "Shield", features: ["Down payments as low as 3.5%", "Credit scores as low as 580", "Gift funds allowed for down payment", "Competitive interest rates"] },
  { id: "va", name: "VA", shortDescription: "Exclusive benefits for veterans, active military, and eligible surviving spouses.", icon: "Award", features: ["No down payment required", "No private mortgage insurance", "Competitive interest rates", "Limited closing costs"] },
  { id: "usda", name: "USDA", shortDescription: "Zero-down-payment loans for eligible rural and suburban homebuyers.", icon: "MapPin", features: ["No down payment required", "Low mortgage insurance rates", "Below-market interest rates", "Available in eligible rural areas of Utah"] },
  { id: "jumbo", name: "Jumbo", shortDescription: "Financing for homes that exceed conventional loan limits.", icon: "TrendingUp", features: ["Loan amounts above conforming limits", "Competitive rates for high-value properties", "Fixed and adjustable rate options", "Flexible terms"] },
  { id: "arm", name: "Adjustable Rate (ARM)", shortDescription: "Lower initial rates that adjust after a fixed period.", icon: "BarChart3", features: ["Lower initial monthly payments", "5/1, 7/1, and 10/1 ARM options", "Rate caps limit payment increases", "Ideal for shorter-term homeownership"] },
  { id: "fixed", name: "Fixed Rate", shortDescription: "Predictable payments that never change over the life of your loan.", icon: "Lock", features: ["Rate stays the same for the entire term", "15, 20, and 30-year terms available", "Predictable monthly payments", "Protection from rising interest rates"] },
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
