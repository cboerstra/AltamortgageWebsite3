# Alta Mortgage Group — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready, SEO-optimized mortgage website for Alta Mortgage Group at G:/claudefolder/Loandepot-design, modeled after loanDepot.com's conversion architecture with a custom navy/emerald Utah-focused brand.

**Architecture:** Next.js 15 App Router with TypeScript. Pages are server-rendered by default, client components only where interactivity is needed (calculators, forms). Shared layout wraps all pages with header/footer. API routes handle lead/application submissions with CRM forwarding and email notifications.

**Tech Stack:** Next.js 15, TypeScript (strict), Tailwind CSS 4, shadcn/ui, Radix UI, Recharts, React Hook Form, Zod, Nodemailer, Lucide React, next/font (Inter + DM Sans)

**Spec:** `docs/superpowers/specs/2026-05-28-alta-mortgage-group-design.md`

---

## Task 1: Project Scaffolding & Design Tokens

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`
- Create: `src/styles/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx` (placeholder)
- Create: `src/lib/constants.ts`
- Create: `src/lib/utils.ts`
- Create: `components.json` (shadcn config)
- Create: `.env.example`

- [ ] **Step 1: Initialize Next.js 15 project**

```bash
cd "G:/claudefolder/Loandepot-design"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

If prompted about overwriting existing files, allow it. Select defaults for all prompts.

- [ ] **Step 2: Install dependencies**

```bash
cd "G:/claudefolder/Loandepot-design"
npm install recharts react-hook-form @hookform/resolvers zod lucide-react nodemailer class-variance-authority clsx tailwind-merge
npm install -D @types/nodemailer
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
cd "G:/claudefolder/Loandepot-design"
npx shadcn@latest init -d
```

Then install the components we need:

```bash
npx shadcn@latest add button card input label select tabs dialog sheet slider separator badge accordion table textarea checkbox radio-group progress
```

- [ ] **Step 4: Create .env.example**

```env
# CRM Integration
CRM_API_URL=https://altamortgagecrm.net/api/webhook
CRM_API_KEY=your-crm-api-key

# Email Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@altamortgagegroup.net
SMTP_PASS=your-smtp-password
NOTIFICATION_EMAIL=leads@altamortgagegroup.net

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX

# Site
NEXT_PUBLIC_SITE_URL=https://altamortgagegroup.net
```

- [ ] **Step 5: Create globals.css with design tokens**

Replace `src/styles/globals.css` (or `src/app/globals.css` depending on where create-next-app put it) with:

```css
@import "tailwindcss";

@theme inline {
  --color-navy: #003087;
  --color-navy-light: #1a4a9e;
  --color-navy-dark: #001f5c;
  --color-emerald: #00A86B;
  --color-emerald-light: #00c77b;
  --color-surface: #F7F8FA;
  --color-surface-warm: #F0F4F8;
  --color-text: #1A1A2E;
  --color-text-muted: #6B7280;
  --color-border: #E5E7EB;
  --color-warning: #F59E0B;
  --color-error: #EF4444;

  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "DM Sans", ui-sans-serif, system-ui, sans-serif;
}

@layer base {
  body {
    @apply bg-white text-text antialiased;
  }

  h1 {
    @apply text-5xl font-bold tracking-tight;
  }
  h2 {
    @apply text-4xl font-bold tracking-tight;
  }
  h3 {
    @apply text-3xl font-bold;
  }
  h4 {
    @apply text-xl font-semibold;
  }
}
```

Note: Tailwind CSS 4 uses `@theme` for custom tokens and `@import "tailwindcss"` instead of the v3 `@tailwind` directives. Check the actual version installed by create-next-app. If it installed Tailwind v3, use the v3 syntax with `@tailwind base; @tailwind components; @tailwind utilities;` and configure tokens in `tailwind.config.ts` under `theme.extend.colors` instead.

- [ ] **Step 6: Create lib/constants.ts**

```typescript
export const COMPANY = {
  name: "Alta Mortgage Group",
  shortName: "Alta",
  domain: "altamortgagegroup.net",
  phone: "(801) 555-0123",
  email: "info@altamortgagegroup.net",
  nmlsId: "XXXXXX",
  address: {
    street: "123 Main Street",
    city: "Ogden",
    state: "UT",
    zip: "84401",
  },
  hours: {
    weekdays: "9:00 AM - 6:00 PM",
    saturday: "10:00 AM - 2:00 PM",
    sunday: "Closed",
  },
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
      name: "Weber County",
      slug: "weber-county",
      cities: [
        "Ogden", "Roy", "North Ogden", "South Ogden", "Riverdale",
        "Pleasant View", "Harrisville", "Farr West", "West Haven",
        "Plain City", "Washington Terrace", "Hooper", "Huntsville",
      ],
    },
    {
      name: "Davis County",
      slug: "davis-county",
      cities: [
        "Layton", "Bountiful", "Kaysville", "Clearfield", "Syracuse",
        "Farmington", "Centerville", "Woods Cross", "West Point",
        "Clinton", "North Salt Lake", "South Weber", "Fruit Heights",
        "Sunset", "West Bountiful",
      ],
    },
  ],
} as const;

export const LOAN_TYPES = [
  {
    id: "conventional",
    name: "Conventional",
    shortDescription: "Traditional mortgage with competitive rates for qualified borrowers.",
    icon: "Home",
    features: [
      "Down payments as low as 3%",
      "No upfront mortgage insurance fee",
      "Available for primary, secondary, and investment properties",
      "Fixed and adjustable rate options",
    ],
  },
  {
    id: "fha",
    name: "FHA",
    shortDescription: "Government-backed loans with flexible credit requirements and low down payments.",
    icon: "Shield",
    features: [
      "Down payments as low as 3.5%",
      "Credit scores as low as 580",
      "Gift funds allowed for down payment",
      "Competitive interest rates",
    ],
  },
  {
    id: "va",
    name: "VA",
    shortDescription: "Exclusive benefits for veterans, active military, and eligible surviving spouses.",
    icon: "Award",
    features: [
      "No down payment required",
      "No private mortgage insurance",
      "Competitive interest rates",
      "Limited closing costs",
    ],
  },
  {
    id: "usda",
    name: "USDA",
    shortDescription: "Zero-down-payment loans for eligible rural and suburban homebuyers.",
    icon: "MapPin",
    features: [
      "No down payment required",
      "Low mortgage insurance rates",
      "Below-market interest rates",
      "Available in eligible rural areas of Utah",
    ],
  },
  {
    id: "jumbo",
    name: "Jumbo",
    shortDescription: "Financing for homes that exceed conventional loan limits.",
    icon: "TrendingUp",
    features: [
      "Loan amounts above conforming limits",
      "Competitive rates for high-value properties",
      "Fixed and adjustable rate options",
      "Flexible terms",
    ],
  },
  {
    id: "arm",
    name: "Adjustable Rate (ARM)",
    shortDescription: "Lower initial rates that adjust after a fixed period.",
    icon: "BarChart3",
    features: [
      "Lower initial monthly payments",
      "5/1, 7/1, and 10/1 ARM options",
      "Rate caps limit payment increases",
      "Ideal for shorter-term homeownership",
    ],
  },
  {
    id: "fixed",
    name: "Fixed Rate",
    shortDescription: "Predictable payments that never change over the life of your loan.",
    icon: "Lock",
    features: [
      "Rate stays the same for the entire term",
      "15, 20, and 30-year terms available",
      "Predictable monthly payments",
      "Protection from rising interest rates",
    ],
  },
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
```

- [ ] **Step 7: Create lib/utils.ts**

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(3)}%`;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function generateRefNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "ALT-";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
```

- [ ] **Step 8: Create root layout with fonts and metadata**

`src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { COMPANY } from "@/lib/constants";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://altamortgagegroup.net"),
  title: {
    default: "Alta Mortgage Group | Utah Mortgage Lender",
    template: "%s | Alta Mortgage Group | Utah Mortgage Lender",
  },
  description:
    "Alta Mortgage Group is a trusted Utah mortgage lender serving Weber and Davis counties. Purchase, refinance, and home equity loans in Ogden, Layton, Bountiful, and surrounding areas.",
  keywords: [
    "Utah mortgage lender",
    "home loans Utah",
    "mortgage rates Ogden",
    "refinance Weber County",
    "FHA loans Utah",
    "VA loans Utah",
    "first time home buyer Utah",
    "Davis County mortgage",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: COMPANY.name,
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable}`}>
      <head>
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');`,
            }}
          />
        )}
      </head>
      <body className="font-sans">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-navy focus:text-white focus:px-4 focus:py-2 focus:rounded-md">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 9: Create a placeholder homepage to verify the build**

`src/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-navy">Alta Mortgage Group</h1>
        <p className="mt-4 text-text-muted text-lg">
          Your Trusted Utah Mortgage Partner
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <button className="bg-emerald text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-light transition-colors">
            Get Pre-Approved
          </button>
          <button className="border-2 border-navy text-navy px-6 py-3 rounded-lg font-medium hover:bg-navy hover:text-white transition-colors">
            Calculate Payment
          </button>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 10: Verify build and dev server**

```bash
cd "G:/claudefolder/Loandepot-design"
npm run build
```

Expected: Build succeeds. If there are Tailwind v3/v4 incompatibilities, fix the globals.css to match the installed version.

Then:

```bash
npm run dev
```

Visit http://localhost:3000 — should show the placeholder homepage with navy heading, muted subtext, emerald button, and navy outline button. Verify fonts load (Inter should be applied).

- [ ] **Step 11: Commit**

```bash
cd "G:/claudefolder/Loandepot-design"
git add -A
git commit -m "feat: scaffold Next.js 15 project with design tokens and dependencies"
```

---

## Task 2: Logo SVG & Shared Layout Components (Header + Footer)

**Files:**
- Create: `src/components/layout/logo.tsx`
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/mobile-nav.tsx`
- Create: `src/components/layout/footer.tsx`
- Create: `src/components/layout/breadcrumbs.tsx`
- Modify: `src/app/layout.tsx` — wrap children with Header + Footer

- [ ] **Step 1: Create the Logo SVG component**

`src/components/layout/logo.tsx`:

```tsx
import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`} aria-label="Alta Mortgage Group Home">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M18 2L32 30H4L18 2Z" fill="#003087" opacity="0.2" />
        <path d="M18 8L28 28H8L18 8Z" fill="#003087" opacity="0.4" />
        <path d="M18 14L24 26H12L18 14Z" fill="#003087" />
        <path d="M18 2L20 6L18 8L16 6L18 2Z" fill="#00A86B" />
      </svg>
      <div className="flex flex-col leading-none">
        <span className="text-lg font-bold text-navy tracking-tight">Alta</span>
        <span className="text-xs font-normal text-navy-light tracking-wide">Mortgage Group</span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create Header with utility bar and navigation**

`src/components/layout/header.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, Clock, Menu } from "lucide-react";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { COMPANY, NAV_LINKS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Utility Bar */}
      <div className="bg-navy text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-10">
          <div className="flex items-center gap-4">
            <a href={`tel:${COMPANY.phone.replace(/\D/g, "")}`} className="flex items-center gap-1.5 hover:text-emerald-light transition-colors">
              <Phone className="w-3.5 h-3.5" />
              <span>{COMPANY.phone}</span>
            </a>
            <span className="hidden sm:flex items-center gap-1.5 text-white/70">
              <Clock className="w-3.5 h-3.5" />
              <span>Mon-Fri {COMPANY.hours.weekdays}</span>
            </span>
          </div>
          <Link href="/apply" className="font-medium hover:text-emerald-light transition-colors">
            Apply Now
          </Link>
        </div>
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Logo />

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-text-muted hover:text-navy transition-colors rounded-md hover:bg-surface"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild className="hidden sm:inline-flex bg-emerald hover:bg-emerald-light text-white">
              <Link href="/contact">Get Pre-Approved</Link>
            </Button>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 text-text-muted hover:text-navy"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
```

- [ ] **Step 3: Create MobileNav slide-out drawer**

`src/components/layout/mobile-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { X, Phone } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { COMPANY, NAV_LINKS } from "@/lib/constants";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Logo />
          <button onClick={onClose} aria-label="Close navigation menu" className="p-2 text-text-muted hover:text-navy">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-col p-4 gap-1" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="px-4 py-3 text-base font-medium text-text hover:bg-surface rounded-lg transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-border space-y-3">
          <Button asChild className="w-full bg-emerald hover:bg-emerald-light text-white">
            <Link href="/contact" onClick={onClose}>Get Pre-Approved</Link>
          </Button>
          <Button asChild variant="outline" className="w-full border-navy text-navy hover:bg-navy hover:text-white">
            <Link href="/apply" onClick={onClose}>Apply Now</Link>
          </Button>
          <a href={`tel:${COMPANY.phone.replace(/\D/g, "")}`} className="flex items-center justify-center gap-2 text-sm text-text-muted">
            <Phone className="w-4 h-4" />
            {COMPANY.phone}
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 4: Create Footer**

`src/components/layout/footer.tsx`:

```tsx
import Link from "next/link";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { Logo } from "./logo";
import { COMPANY } from "@/lib/constants";

const footerLinks = {
  products: {
    title: "Products",
    links: [
      { label: "Home Purchase", href: "/purchase" },
      { label: "Refinance", href: "/refinance" },
      { label: "Home Equity", href: "/home-equity" },
      { label: "Loan Options", href: "/loan-options" },
      { label: "Mortgage Rates", href: "/rates" },
      { label: "Mortgage Calculator", href: "/mortgage-calculator" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "First-Time Homebuyer", href: "/first-time-homebuyer" },
      { label: "Learning Center", href: "/learning-center" },
      { label: "Utah Mortgages", href: "/utah" },
      { label: "Weber County", href: "/utah/weber-county" },
      { label: "Davis County", href: "/utah/davis-county" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Apply Now", href: "/apply" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Licensing", href: "/licensing" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
};

export function Footer() {
  return (
    <footer className="bg-navy-dark text-white" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Link Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60 mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/80 hover:text-emerald-light transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Company Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Logo className="[&_span]:text-white [&_.text-navy-light]:text-white/70" />
              </div>
              <p className="text-xs text-white/50 max-w-md mt-3">
                {COMPANY.name} NMLS# {COMPANY.nmlsId}. Licensed by the Utah Division of Real Estate.
                Equal Housing Opportunity. All rights reserved.
              </p>
              <p className="text-xs text-white/50">
                {COMPANY.address.street}, {COMPANY.address.city}, {COMPANY.address.state} {COMPANY.address.zip} | {COMPANY.phone}
              </p>
            </div>

            {/* Social + Badges */}
            <div className="flex flex-col items-start md:items-end gap-4">
              <div className="flex items-center gap-4">
                <a href={COMPANY.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <Facebook className="w-5 h-5 text-white/60 hover:text-white transition-colors" />
                </a>
                <a href={COMPANY.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <Instagram className="w-5 h-5 text-white/60 hover:text-white transition-colors" />
                </a>
                <a href={COMPANY.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <Linkedin className="w-5 h-5 text-white/60 hover:text-white transition-colors" />
                </a>
              </div>
              {/* Equal Housing Opportunity placeholder */}
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span className="border border-white/20 px-2 py-1 rounded text-[10px]">EQUAL HOUSING OPPORTUNITY</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-center text-xs text-white/30 mt-8">
          &copy; {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 5: Create Breadcrumbs component with schema**

`src/components/layout/breadcrumbs.tsx`:

```tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const allItems = [{ label: "Home", href: "/" }, ...items];

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: allItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `https://altamortgagegroup.net${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-text-muted">
        <ol className="flex items-center gap-1 flex-wrap">
          {allItems.map((item, index) => (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-border" />}
              {item.href && index < allItems.length - 1 ? (
                <Link href={item.href} className="hover:text-navy transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-text" aria-current={index === allItems.length - 1 ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
```

- [ ] **Step 6: Update root layout to wrap pages with Header + Footer**

Modify `src/app/layout.tsx` — add imports and wrap `{children}`:

```tsx
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
```

Replace the `<body>` content:

```tsx
<body className="font-sans">
  <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-navy focus:text-white focus:px-4 focus:py-2 focus:rounded-md">
    Skip to main content
  </a>
  <Header />
  <main id="main-content">{children}</main>
  <Footer />
</body>
```

- [ ] **Step 7: Verify build**

```bash
cd "G:/claudefolder/Loandepot-design"
npm run build
```

Fix any TypeScript or import errors. Common issues: shadcn component path aliases, missing Sheet component export, Tailwind color token references.

- [ ] **Step 8: Verify dev server**

```bash
npm run dev
```

Visit http://localhost:3000. Verify:
- Navy utility bar at top with phone number and "Apply Now"
- Sticky white nav with logo, links (desktop), and green "Get Pre-Approved" button
- Placeholder content area
- Dark navy footer with 4-column link grid and company info
- On mobile viewport (< 1024px): nav links collapse, hamburger appears, drawer slides out

- [ ] **Step 9: Commit**

```bash
cd "G:/claudefolder/Loandepot-design"
git add -A
git commit -m "feat: add header, footer, mobile nav, breadcrumbs, and logo"
```

---

## Task 3: Homepage — All 11 Sections

**Files:**
- Create: `src/components/home/hero.tsx`
- Create: `src/components/home/product-cards.tsx`
- Create: `src/components/home/rate-teaser.tsx`
- Create: `src/components/home/local-expertise.tsx`
- Create: `src/components/home/tools-grid.tsx`
- Create: `src/components/home/testimonials.tsx`
- Create: `src/components/home/why-alta.tsx`
- Create: `src/components/home/cta-section.tsx`
- Create: `src/components/forms/mini-lead-form.tsx`
- Create: `src/lib/seo.ts`
- Modify: `src/app/page.tsx` — assemble all sections

- [ ] **Step 1: Create SEO helpers**

`src/lib/seo.ts`:

```typescript
import { COMPANY, SERVICE_AREAS } from "./constants";

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY.name,
    url: `https://${COMPANY.domain}`,
    logo: `https://${COMPANY.domain}/images/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: COMPANY.phone,
      contactType: "customer service",
      areaServed: "US",
      availableLanguage: "English",
    },
    sameAs: Object.values(COMPANY.social),
  };
}

export function generateLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "MortgageBroker",
    name: COMPANY.name,
    url: `https://${COMPANY.domain}`,
    telephone: COMPANY.phone,
    email: COMPANY.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.address.street,
      addressLocality: COMPANY.address.city,
      addressRegion: COMPANY.address.state,
      postalCode: COMPANY.address.zip,
      addressCountry: "US",
    },
    areaServed: SERVICE_AREAS.counties.map((county) => ({
      "@type": "AdministrativeArea",
      name: `${county.name}, ${SERVICE_AREAS.state}`,
    })),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "10:00",
        closes: "14:00",
      },
    ],
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateReviewSchema(reviews: { author: string; rating: number; body: string }[]) {
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: COMPANY.name,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avgRating.toFixed(1),
      reviewCount: reviews.length,
      bestRating: "5",
      worstRating: "1",
    },
    review: reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewRating: { "@type": "Rating", ratingValue: r.rating },
      reviewBody: r.body,
    })),
  };
}
```

- [ ] **Step 2: Create Hero section**

`src/components/home/hero.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="bg-gradient-to-b from-surface-warm to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-tight">
              Your Trusted Utah Mortgage Partner
            </h1>
            <p className="mt-6 text-lg text-text-muted max-w-xl">
              Helping families in Weber &amp; Davis counties find the right home loan.
              Expert guidance, competitive rates, and a commitment to your homeownership goals.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-emerald hover:bg-emerald-light text-white text-base px-8 py-6">
                <Link href="/contact">Get Pre-Approved</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-2 border-navy text-navy hover:bg-navy hover:text-white text-base px-8 py-6">
                <Link href="/mortgage-calculator">Calculate Your Payment</Link>
              </Button>
            </div>
          </div>

          {/* Mountain Illustration */}
          <div className="hidden lg:flex justify-center" aria-hidden="true">
            <svg width="500" height="350" viewBox="0 0 500 350" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Background mountains */}
              <path d="M0 350L80 180L140 220L200 120L260 200L320 100L400 180L460 140L500 190V350H0Z" fill="#E5E7EB" />
              {/* Foreground mountains */}
              <path d="M0 350L100 200L170 250L250 140L330 220L420 160L500 220V350H0Z" fill="#003087" opacity="0.15" />
              {/* Main peak */}
              <path d="M200 350L300 100L400 350H200Z" fill="#003087" opacity="0.25" />
              <path d="M230 350L300 150L370 350H230Z" fill="#003087" opacity="0.4" />
              {/* Snow cap */}
              <path d="M285 155L300 100L315 155L300 140L285 155Z" fill="white" />
              {/* Sun */}
              <circle cx="420" cy="80" r="30" fill="#00A86B" opacity="0.2" />
              <circle cx="420" cy="80" r="20" fill="#00A86B" opacity="0.3" />
              {/* House */}
              <rect x="140" y="290" width="40" height="30" fill="#003087" opacity="0.6" rx="2" />
              <path d="M135 290L160 265L185 290H135Z" fill="#003087" opacity="0.7" />
              <rect x="152" y="300" width="10" height="20" fill="#00A86B" opacity="0.5" rx="1" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create Product Cards section**

`src/components/home/product-cards.tsx`:

```tsx
import Link from "next/link";
import { Home, RefreshCw, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const products = [
  {
    icon: Home,
    title: "Buy a Home",
    description: "Whether you're a first-time buyer or looking to upgrade, we'll find the right mortgage for your dream home in Utah.",
    cta: "Get Started",
    href: "/purchase",
  },
  {
    icon: RefreshCw,
    title: "Refinance",
    description: "Lower your monthly payments, shorten your term, or tap into your equity with a refinance tailored to your goals.",
    cta: "Start Saving",
    href: "/refinance",
  },
  {
    icon: Wallet,
    title: "Access Your Equity",
    description: "Turn your home's equity into cash for renovations, debt consolidation, or whatever life throws your way.",
    cta: "Learn More",
    href: "/home-equity",
  },
];

export function ProductCards() {
  return (
    <section className="bg-surface py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {products.map((product) => (
            <Card key={product.title} className="bg-white border-border hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6 lg:p-8 flex flex-col items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center">
                  <product.icon className="w-6 h-6 text-navy" />
                </div>
                <h3 className="text-xl font-bold text-text">{product.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{product.description}</p>
                <Button asChild variant="outline" className="mt-auto border-navy text-navy hover:bg-navy hover:text-white">
                  <Link href={product.href}>{product.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create Rate Teaser banner**

`src/components/home/rate-teaser.tsx`:

```tsx
import Link from "next/link";
import { TrendingDown } from "lucide-react";

export function RateTeaser() {
  return (
    <section className="bg-navy text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-6 h-6 text-emerald-light" />
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
```

- [ ] **Step 5: Create Local Expertise section**

`src/components/home/local-expertise.tsx`:

```tsx
import { MapPin } from "lucide-react";
import { SERVICE_AREAS } from "@/lib/constants";

export function LocalExpertise() {
  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy">
              Proudly Serving Weber &amp; Davis Counties
            </h2>
            <p className="mt-4 text-text-muted text-lg leading-relaxed">
              We&apos;re not just another national lender — we live and work in northern Utah.
              Our deep knowledge of the local housing market means better guidance, faster closings,
              and a team that understands your community.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-6">
              {SERVICE_AREAS.counties.map((county) => (
                <div key={county.slug}>
                  <h3 className="font-semibold text-text flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-emerald" />
                    {county.name}
                  </h3>
                  <ul className="space-y-1">
                    {county.cities.map((city) => (
                      <li key={city} className="text-sm text-text-muted">{city}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Stylized Utah Map */}
          <div className="hidden lg:flex justify-center" aria-hidden="true">
            <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Utah state outline simplified */}
              <path d="M80 40H320V360H200V280H80V40Z" fill="#F0F4F8" stroke="#E5E7EB" strokeWidth="2" />
              {/* Weber County highlight */}
              <rect x="140" y="60" width="80" height="50" rx="4" fill="#003087" opacity="0.2" stroke="#003087" strokeWidth="2" />
              <text x="180" y="90" textAnchor="middle" className="text-xs font-semibold" fill="#003087">Weber</text>
              {/* Davis County highlight */}
              <rect x="140" y="110" width="80" height="50" rx="4" fill="#00A86B" opacity="0.2" stroke="#00A86B" strokeWidth="2" />
              <text x="180" y="140" textAnchor="middle" className="text-xs font-semibold" fill="#00A86B">Davis</text>
              {/* Pin markers */}
              <circle cx="160" cy="80" r="4" fill="#003087" />
              <circle cx="170" cy="130" r="4" fill="#00A86B" />
              <circle cx="190" cy="75" r="4" fill="#003087" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Create Tools Grid section**

`src/components/home/tools-grid.tsx`:

```tsx
import Link from "next/link";
import { Calculator, BookOpen, GraduationCap, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const tools = [
  {
    icon: Calculator,
    title: "Mortgage Calculator",
    description: "Estimate your monthly payment, see how much home you can afford, or compare refinance savings.",
    href: "/mortgage-calculator",
  },
  {
    icon: BookOpen,
    title: "Loan Options Guide",
    description: "Compare FHA, VA, Conventional, USDA, and Jumbo loans to find the right fit for you.",
    href: "/loan-options",
  },
  {
    icon: GraduationCap,
    title: "First-Time Buyer Resources",
    description: "Step-by-step guides, Utah-specific programs, and expert tips for first-time homebuyers.",
    href: "/first-time-homebuyer",
  },
  {
    icon: BarChart3,
    title: "Rate Comparison",
    description: "See today's mortgage rates for all loan types and find the best deal for your situation.",
    href: "/rates",
  },
];

export function ToolsGrid() {
  return (
    <section className="bg-surface py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-navy text-center">
          Tools for Your Homeownership Journey
        </h2>
        <p className="mt-4 text-text-muted text-center max-w-2xl mx-auto">
          Everything you need to make informed decisions about your mortgage.
        </p>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool) => (
            <Link key={tool.title} href={tool.href}>
              <Card className="h-full bg-white border-border hover:shadow-lg hover:border-navy/20 transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 flex flex-col items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald/10 flex items-center justify-center">
                    <tool.icon className="w-5 h-5 text-emerald" />
                  </div>
                  <h3 className="font-semibold text-text">{tool.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{tool.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Create Testimonials carousel with schema**

`src/components/home/testimonials.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { generateReviewSchema } from "@/lib/seo";

const testimonials = [
  {
    author: "Sarah M.",
    location: "Ogden, UT",
    rating: 5,
    body: "Alta Mortgage made our first home purchase so easy. They walked us through every step and found us an incredible rate. Highly recommend for anyone buying in Weber County!",
  },
  {
    author: "David & Lisa T.",
    location: "Layton, UT",
    rating: 5,
    body: "We refinanced through Alta and saved over $300 per month. The process was smooth, the team was responsive, and they closed in under three weeks.",
  },
  {
    author: "Michael R.",
    location: "Kaysville, UT",
    rating: 5,
    body: "As a veteran, finding a lender who really understood VA loans was important to me. Alta's team made it seamless — no down payment, great rate, and they handled everything.",
  },
  {
    author: "Jennifer P.",
    location: "Bountiful, UT",
    rating: 5,
    body: "We used Alta for a home equity loan to renovate our kitchen and bathrooms. Quick approval, competitive rate, and the funds were available in less than two weeks.",
  },
];

export function Testimonials() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const visibleCount = 3;
  const getVisibleTestimonials = () => {
    const visible = [];
    for (let i = 0; i < visibleCount; i++) {
      visible.push(testimonials[(current + i) % testimonials.length]);
    }
    return visible;
  };

  return (
    <section className="py-16 lg:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateReviewSchema(testimonials)) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-navy text-center">
          What Our Clients Say
        </h2>
        <p className="mt-4 text-text-muted text-center">
          Trusted by homeowners across Weber and Davis counties.
        </p>

        <div className="mt-12 relative">
          <div className="grid md:grid-cols-3 gap-6">
            {getVisibleTestimonials().map((t, i) => (
              <Card key={`${t.author}-${i}`} className="bg-white border-border">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-text text-sm leading-relaxed italic">&ldquo;{t.body}&rdquo;</p>
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="font-semibold text-text text-sm">{t.author}</p>
                    <p className="text-xs text-text-muted">{t.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center gap-3 mt-8">
            <button
              onClick={() => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
              className="p-2 rounded-full border border-border hover:bg-surface transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-4 h-4 text-text-muted" />
            </button>
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-navy" : "bg-border"}`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
            <button
              onClick={() => setCurrent((prev) => (prev + 1) % testimonials.length)}
              className="p-2 rounded-full border border-border hover:bg-surface transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-4 h-4 text-text-muted" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 8: Create Why Alta stats section**

`src/components/home/why-alta.tsx`:

```tsx
import { Shield, Award, MapPin, Star } from "lucide-react";

const stats = [
  { icon: Shield, value: "15+", label: "Years Experience" },
  { icon: Award, value: "2,500+", label: "Loans Closed" },
  { icon: MapPin, value: "25+", label: "Utah Cities Served" },
  { icon: Star, value: "4.9", label: "Star Reviews" },
];

export function WhyAlta() {
  return (
    <section className="bg-surface py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-navy text-center">
          Why Choose Alta Mortgage Group
        </h2>
        <p className="mt-4 text-text-muted text-center max-w-2xl mx-auto">
          Local expertise, personal service, and a track record of helping Utah families achieve their homeownership dreams.
        </p>

        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-border p-6 text-center">
              <stat.icon className="w-8 h-8 text-emerald mx-auto mb-3" />
              <div className="text-3xl font-bold font-display text-navy">{stat.value}</div>
              <div className="text-sm text-text-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-6 items-center text-sm text-text-muted">
          <span className="border border-border px-4 py-2 rounded-full">NMLS# XXXXXX</span>
          <span className="border border-border px-4 py-2 rounded-full">Equal Housing Opportunity</span>
          <span className="border border-border px-4 py-2 rounded-full">Utah Licensed</span>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 9: Create Mini Lead Form component**

`src/components/forms/mini-lead-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Loader2 } from "lucide-react";

const miniLeadSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Valid phone required"),
  loanPurpose: z.enum(["purchase", "refinance", "home-equity", "cash-out"]),
});

type MiniLeadData = z.infer<typeof miniLeadSchema>;

export function MiniLeadForm({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<MiniLeadData>({
    resolver: zodResolver(miniLeadSchema),
  });

  const onSubmit = async (data: MiniLeadData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          source: window.location.pathname,
          utm: Object.fromEntries(new URLSearchParams(window.location.search)),
          timestamp: new Date().toISOString(),
        }),
      });
      if (res.ok) setSubmitted(true);
    } catch {
      // Silently fail — form stays visible for retry
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-3 py-4">
        <CheckCircle className={`w-6 h-6 ${variant === "dark" ? "text-emerald-light" : "text-emerald"}`} />
        <p className={variant === "dark" ? "text-white" : "text-text"}>
          Thank you! A loan specialist will contact you within 24 hours.
        </p>
      </div>
    );
  }

  const inputClass = variant === "dark"
    ? "bg-white/10 border-white/20 text-white placeholder:text-white/50"
    : "bg-white border-border text-text";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <Input {...register("name")} placeholder="Full Name" className={inputClass} aria-label="Full Name" />
        {errors.name && <p className="text-xs text-error mt-1">{errors.name.message}</p>}
      </div>
      <div className="flex-1">
        <Input {...register("email")} type="email" placeholder="Email" className={inputClass} aria-label="Email" />
        {errors.email && <p className="text-xs text-error mt-1">{errors.email.message}</p>}
      </div>
      <div className="flex-1">
        <Input {...register("phone")} type="tel" placeholder="Phone" className={inputClass} aria-label="Phone" />
        {errors.phone && <p className="text-xs text-error mt-1">{errors.phone.message}</p>}
      </div>
      <div className="flex-1">
        <Select onValueChange={(val) => setValue("loanPurpose", val as MiniLeadData["loanPurpose"])}>
          <SelectTrigger className={inputClass} aria-label="Loan Purpose">
            <SelectValue placeholder="Loan Purpose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="purchase">Purchase</SelectItem>
            <SelectItem value="refinance">Refinance</SelectItem>
            <SelectItem value="home-equity">Home Equity</SelectItem>
            <SelectItem value="cash-out">Cash-Out Refi</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={submitting} className="bg-emerald hover:bg-emerald-light text-white px-8 whitespace-nowrap">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get Started"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 10: Create CTA Section**

`src/components/home/cta-section.tsx`:

```tsx
import { MiniLeadForm } from "@/components/forms/mini-lead-form";

export function CTASection() {
  return (
    <section className="bg-gradient-to-br from-navy to-navy-dark py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          Ready to Start Your Home Loan Journey?
        </h2>
        <p className="mt-4 text-white/70 max-w-2xl mx-auto">
          Get a free consultation with one of our Utah mortgage experts. No obligation, no pressure — just honest guidance.
        </p>
        <div className="mt-8 max-w-4xl mx-auto">
          <MiniLeadForm variant="dark" />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 11: Assemble Homepage**

Replace `src/app/page.tsx`:

```tsx
import { Hero } from "@/components/home/hero";
import { ProductCards } from "@/components/home/product-cards";
import { RateTeaser } from "@/components/home/rate-teaser";
import { LocalExpertise } from "@/components/home/local-expertise";
import { ToolsGrid } from "@/components/home/tools-grid";
import { Testimonials } from "@/components/home/testimonials";
import { WhyAlta } from "@/components/home/why-alta";
import { CTASection } from "@/components/home/cta-section";
import { generateOrganizationSchema, generateLocalBusinessSchema } from "@/lib/seo";

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateOrganizationSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateLocalBusinessSchema()) }}
      />
      <Hero />
      <ProductCards />
      <RateTeaser />
      <LocalExpertise />
      <ToolsGrid />
      <Testimonials />
      <WhyAlta />
      <CTASection />
    </>
  );
}
```

- [ ] **Step 12: Verify build and visual check**

```bash
cd "G:/claudefolder/Loandepot-design"
npm run build
npm run dev
```

Visit http://localhost:3000. Verify all 11 sections render (utility bar + nav and footer are from layout). Check mobile responsiveness at 375px width.

- [ ] **Step 13: Commit**

```bash
cd "G:/claudefolder/Loandepot-design"
git add -A
git commit -m "feat: build complete homepage with all sections, SEO schema, and mini lead form"
```

---

## Task 4: Mortgage Calculator (Math + UI)

**Files:**
- Create: `src/lib/calculator-utils.ts`
- Create: `src/components/calculator/payment-calculator.tsx`
- Create: `src/components/calculator/affordability-calculator.tsx`
- Create: `src/components/calculator/refinance-calculator.tsx`
- Create: `src/components/calculator/calculator-chart.tsx`
- Create: `src/components/calculator/amortization-table.tsx`
- Create: `src/app/mortgage-calculator/page.tsx`
- Create: `src/lib/__tests__/calculator-utils.test.ts` (if vitest configured)

- [ ] **Step 1: Create calculator math utilities**

`src/lib/calculator-utils.ts`:

```typescript
export interface PaymentBreakdown {
  monthlyPrincipalInterest: number;
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  totalMonthly: number;
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterest: number;
}

export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  if (annualRate === 0) return principal / (termYears * 12);
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
}

export function calculatePaymentBreakdown(
  homePrice: number,
  downPayment: number,
  annualRate: number,
  termYears: number,
  annualTax: number,
  annualInsurance: number,
  monthlyHOA: number
): PaymentBreakdown {
  const principal = homePrice - downPayment;
  const monthlyPrincipalInterest = calculateMonthlyPayment(principal, annualRate, termYears);
  const monthlyTax = annualTax / 12;
  const monthlyInsurance = annualInsurance / 12;

  return {
    monthlyPrincipalInterest,
    monthlyTax,
    monthlyInsurance,
    monthlyHOA,
    totalMonthly: monthlyPrincipalInterest + monthlyTax + monthlyInsurance + monthlyHOA,
  };
}

export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termYears: number
): AmortizationRow[] {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);
  const schedule: AmortizationRow[] = [];
  let balance = principal;
  let totalInterest = 0;

  for (let month = 1; month <= numPayments; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance = Math.max(0, balance - principalPayment);
    totalInterest += interestPayment;

    schedule.push({
      month,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance,
      totalInterest,
    });
  }

  return schedule;
}

export function calculateAffordability(
  annualIncome: number,
  monthlyDebts: number,
  downPayment: number,
  annualRate: number,
  termYears: number,
  maxDTI: number = 0.43
): { maxHomePrice: number; maxMonthlyPayment: number; dti: number } {
  const monthlyIncome = annualIncome / 12;
  const maxMonthlyPayment = monthlyIncome * maxDTI - monthlyDebts;

  if (maxMonthlyPayment <= 0) {
    return { maxHomePrice: 0, maxMonthlyPayment: 0, dti: (monthlyDebts / monthlyIncome) * 100 };
  }

  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  let maxLoan: number;

  if (annualRate === 0) {
    maxLoan = maxMonthlyPayment * numPayments;
  } else {
    maxLoan =
      (maxMonthlyPayment * (Math.pow(1 + monthlyRate, numPayments) - 1)) /
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments));
  }

  const maxHomePrice = maxLoan + downPayment;
  const dti = ((monthlyDebts + maxMonthlyPayment) / monthlyIncome) * 100;

  return { maxHomePrice, maxMonthlyPayment, dti };
}

export function calculateRefinanceSavings(
  currentBalance: number,
  currentRate: number,
  currentMonthlyPayment: number,
  newRate: number,
  newTermYears: number,
  closingCosts: number
): {
  newMonthlyPayment: number;
  monthlySavings: number;
  totalSavings: number;
  breakEvenMonths: number;
} {
  const newMonthlyPayment = calculateMonthlyPayment(currentBalance, newRate, newTermYears);
  const monthlySavings = currentMonthlyPayment - newMonthlyPayment;
  const totalSavings = monthlySavings * newTermYears * 12 - closingCosts;
  const breakEvenMonths = monthlySavings > 0 ? Math.ceil(closingCosts / monthlySavings) : Infinity;

  return { newMonthlyPayment, monthlySavings, totalSavings, breakEvenMonths };
}
```

- [ ] **Step 2: Create calculator chart component**

`src/components/calculator/calculator-chart.tsx`:

```tsx
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ChartData {
  name: string;
  value: number;
  color: string;
}

export function CalculatorPieChart({ data }: { data: ChartData[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-64 h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.filter((d) => d.value > 0)}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.filter((d) => d.value > 0).map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold font-display text-navy">{formatCurrency(total)}</div>
            <div className="text-xs text-text-muted">/month</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {data.filter((d) => d.value > 0).map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-text-muted">{d.name}:</span>
            <span className="font-medium text-text">{formatCurrency(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create amortization table component**

`src/components/calculator/amortization-table.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { AmortizationRow } from "@/lib/calculator-utils";

export function AmortizationTable({ schedule }: { schedule: AmortizationRow[] }) {
  const [expanded, setExpanded] = useState(false);
  const [showMonthly, setShowMonthly] = useState(false);

  const yearlyData = schedule.filter((_, i) => (i + 1) % 12 === 0 || i === schedule.length - 1);
  const displayData = showMonthly ? schedule : yearlyData;
  const visibleData = expanded ? displayData : displayData.slice(0, 5);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text">Amortization Schedule</h3>
        <div className="flex gap-2">
          <Button
            variant={showMonthly ? "outline" : "default"}
            size="sm"
            onClick={() => setShowMonthly(false)}
            className={!showMonthly ? "bg-navy text-white" : ""}
          >
            Yearly
          </Button>
          <Button
            variant={showMonthly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowMonthly(true)}
            className={showMonthly ? "bg-navy text-white" : ""}
          >
            Monthly
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface">
              <th className="text-left p-3 font-medium text-text-muted">{showMonthly ? "Month" : "Year"}</th>
              <th className="text-right p-3 font-medium text-text-muted">Payment</th>
              <th className="text-right p-3 font-medium text-text-muted">Principal</th>
              <th className="text-right p-3 font-medium text-text-muted">Interest</th>
              <th className="text-right p-3 font-medium text-text-muted">Balance</th>
            </tr>
          </thead>
          <tbody>
            {visibleData.map((row) => (
              <tr key={row.month} className="border-t border-border">
                <td className="p-3 text-text">{showMonthly ? row.month : Math.ceil(row.month / 12)}</td>
                <td className="p-3 text-right text-text">{formatCurrency(row.payment)}</td>
                <td className="p-3 text-right text-emerald">{formatCurrency(row.principal)}</td>
                <td className="p-3 text-right text-text-muted">{formatCurrency(row.interest)}</td>
                <td className="p-3 text-right text-text font-medium">{formatCurrency(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {displayData.length > 5 && (
        <Button
          variant="ghost"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 w-full text-text-muted"
        >
          {expanded ? (
            <>Show Less <ChevronUp className="w-4 h-4 ml-1" /></>
          ) : (
            <>Show Full Schedule <ChevronDown className="w-4 h-4 ml-1" /></>
          )}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create Payment Calculator tab**

`src/components/calculator/payment-calculator.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { CalculatorPieChart } from "./calculator-chart";
import { AmortizationTable } from "./amortization-table";
import { calculatePaymentBreakdown, generateAmortizationSchedule } from "@/lib/calculator-utils";
import { formatCurrency } from "@/lib/utils";

export function PaymentCalculator() {
  const [homePrice, setHomePrice] = useState(400000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [rate, setRate] = useState(6.625);
  const [term, setTerm] = useState(30);
  const [annualTax, setAnnualTax] = useState(3200);
  const [annualInsurance, setAnnualInsurance] = useState(1800);
  const [monthlyHOA, setMonthlyHOA] = useState(0);

  const downPayment = homePrice * (downPaymentPct / 100);
  const principal = homePrice - downPayment;

  const breakdown = calculatePaymentBreakdown(
    homePrice, downPayment, rate, term, annualTax, annualInsurance, monthlyHOA
  );

  const schedule = generateAmortizationSchedule(principal, rate, term);

  const chartData = [
    { name: "Principal & Interest", value: Math.round(breakdown.monthlyPrincipalInterest), color: "#003087" },
    { name: "Property Tax", value: Math.round(breakdown.monthlyTax), color: "#00A86B" },
    { name: "Insurance", value: Math.round(breakdown.monthlyInsurance), color: "#1a4a9e" },
    { name: "HOA", value: Math.round(breakdown.monthlyHOA), color: "#6B7280" },
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Inputs */}
      <div className="space-y-6">
        <div>
          <Label className="text-sm font-medium text-text">Home Price: {formatCurrency(homePrice)}</Label>
          <Slider
            value={[homePrice]}
            onValueChange={([v]) => setHomePrice(v)}
            min={50000} max={2000000} step={5000}
            className="mt-2"
          />
          <Input
            type="number"
            value={homePrice}
            onChange={(e) => setHomePrice(Number(e.target.value))}
            className="mt-2"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-text">Down Payment: {downPaymentPct}% ({formatCurrency(downPayment)})</Label>
          <Slider
            value={[downPaymentPct]}
            onValueChange={([v]) => setDownPaymentPct(v)}
            min={0} max={50} step={1}
            className="mt-2"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-text">Loan Term</Label>
          <div className="flex gap-2 mt-2">
            {[15, 20, 30].map((t) => (
              <button
                key={t}
                onClick={() => setTerm(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  term === t ? "bg-navy text-white" : "bg-surface text-text-muted hover:bg-border"
                }`}
              >
                {t} years
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-text">Interest Rate (%)</Label>
          <Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} step={0.125} className="mt-2" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-text-muted">Annual Tax</Label>
            <Input type="number" value={annualTax} onChange={(e) => setAnnualTax(Number(e.target.value))} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-text-muted">Annual Insurance</Label>
            <Input type="number" value={annualInsurance} onChange={(e) => setAnnualInsurance(Number(e.target.value))} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-text-muted">Monthly HOA</Label>
            <Input type="number" value={monthlyHOA} onChange={(e) => setMonthlyHOA(Number(e.target.value))} className="mt-1" />
          </div>
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="text-center mb-6">
          <p className="text-sm text-text-muted">Estimated Monthly Payment</p>
          <p className="text-5xl font-bold font-display text-navy mt-2">
            {formatCurrency(Math.round(breakdown.totalMonthly))}
          </p>
        </div>
        <CalculatorPieChart data={chartData} />
      </div>

      {/* Amortization */}
      <div className="lg:col-span-2">
        <AmortizationTable schedule={schedule} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create Affordability Calculator tab**

`src/components/calculator/affordability-calculator.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { calculateAffordability } from "@/lib/calculator-utils";
import { formatCurrency } from "@/lib/utils";

export function AffordabilityCalculator() {
  const [income, setIncome] = useState(85000);
  const [debts, setDebts] = useState(500);
  const [downPayment, setDownPayment] = useState(60000);
  const [rate, setRate] = useState(6.625);
  const [term, setTerm] = useState(30);

  const result = calculateAffordability(income, debts, downPayment, rate, term);

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-6">
        <div>
          <Label className="text-sm font-medium text-text">Annual Household Income: {formatCurrency(income)}</Label>
          <Slider value={[income]} onValueChange={([v]) => setIncome(v)} min={20000} max={500000} step={5000} className="mt-2" />
          <Input type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))} className="mt-2" />
        </div>
        <div>
          <Label className="text-sm font-medium text-text">Monthly Debt Payments: {formatCurrency(debts)}</Label>
          <Slider value={[debts]} onValueChange={([v]) => setDebts(v)} min={0} max={5000} step={50} className="mt-2" />
          <Input type="number" value={debts} onChange={(e) => setDebts(Number(e.target.value))} className="mt-2" />
        </div>
        <div>
          <Label className="text-sm font-medium text-text">Down Payment Available: {formatCurrency(downPayment)}</Label>
          <Slider value={[downPayment]} onValueChange={([v]) => setDownPayment(v)} min={0} max={500000} step={5000} className="mt-2" />
        </div>
        <div>
          <Label className="text-sm font-medium text-text">Interest Rate (%)</Label>
          <Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} step={0.125} className="mt-2" />
        </div>
        <div>
          <Label className="text-sm font-medium text-text">Loan Term</Label>
          <div className="flex gap-2 mt-2">
            {[15, 20, 30].map((t) => (
              <button key={t} onClick={() => setTerm(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${term === t ? "bg-navy text-white" : "bg-surface text-text-muted hover:bg-border"}`}>
                {t} years
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-surface-warm rounded-xl p-8 text-center">
          <p className="text-sm text-text-muted">You can afford a home up to</p>
          <p className="text-5xl font-bold font-display text-navy mt-2">{formatCurrency(Math.round(result.maxHomePrice))}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-text-muted">Max Monthly Payment</p>
            <p className="text-2xl font-bold font-display text-emerald mt-1">{formatCurrency(Math.round(result.maxMonthlyPayment))}</p>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-text-muted">Debt-to-Income Ratio</p>
            <p className="text-2xl font-bold font-display text-navy mt-1">{result.dti.toFixed(1)}%</p>
            <p className="text-xs text-text-muted mt-1">{result.dti <= 36 ? "Excellent" : result.dti <= 43 ? "Acceptable" : "High"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create Refinance Calculator tab**

`src/components/calculator/refinance-calculator.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateRefinanceSavings } from "@/lib/calculator-utils";
import { formatCurrency } from "@/lib/utils";

export function RefinanceCalculator() {
  const [balance, setBalance] = useState(300000);
  const [currentRate, setCurrentRate] = useState(7.5);
  const [currentPayment, setCurrentPayment] = useState(2098);
  const [newRate, setNewRate] = useState(6.625);
  const [newTerm, setNewTerm] = useState(30);
  const [closingCosts, setClosingCosts] = useState(6000);

  const result = calculateRefinanceSavings(balance, currentRate, currentPayment, newRate, newTerm, closingCosts);

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-6">
        <div>
          <Label className="text-sm font-medium text-text">Current Loan Balance</Label>
          <Input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} className="mt-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-text">Current Rate (%)</Label>
            <Input type="number" value={currentRate} onChange={(e) => setCurrentRate(Number(e.target.value))} step={0.125} className="mt-2" />
          </div>
          <div>
            <Label className="text-sm font-medium text-text">Current Payment</Label>
            <Input type="number" value={currentPayment} onChange={(e) => setCurrentPayment(Number(e.target.value))} className="mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-text">New Rate (%)</Label>
            <Input type="number" value={newRate} onChange={(e) => setNewRate(Number(e.target.value))} step={0.125} className="mt-2" />
          </div>
          <div>
            <Label className="text-sm font-medium text-text">New Term (years)</Label>
            <div className="flex gap-2 mt-2">
              {[15, 20, 30].map((t) => (
                <button key={t} onClick={() => setNewTerm(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${newTerm === t ? "bg-navy text-white" : "bg-surface text-text-muted hover:bg-border"}`}>
                  {t}yr
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-text">Estimated Closing Costs</Label>
          <Input type="number" value={closingCosts} onChange={(e) => setClosingCosts(Number(e.target.value))} className="mt-2" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-surface-warm rounded-xl p-6 text-center">
          <p className="text-sm text-text-muted">New Monthly Payment</p>
          <p className="text-4xl font-bold font-display text-navy mt-1">{formatCurrency(Math.round(result.newMonthlyPayment))}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-text-muted">Monthly Savings</p>
            <p className={`text-xl font-bold font-display mt-1 ${result.monthlySavings > 0 ? "text-emerald" : "text-error"}`}>
              {result.monthlySavings > 0 ? "+" : ""}{formatCurrency(Math.round(result.monthlySavings))}
            </p>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-text-muted">Total Savings</p>
            <p className={`text-xl font-bold font-display mt-1 ${result.totalSavings > 0 ? "text-emerald" : "text-error"}`}>
              {formatCurrency(Math.round(result.totalSavings))}
            </p>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-text-muted">Break Even</p>
            <p className="text-xl font-bold font-display text-navy mt-1">
              {result.breakEvenMonths === Infinity ? "N/A" : `${result.breakEvenMonths} mo`}
            </p>
          </div>
        </div>
        {result.monthlySavings > 0 && (
          <p className="text-sm text-text-muted text-center mt-4">
            You&apos;ll recoup closing costs in {result.breakEvenMonths} months and save {formatCurrency(Math.round(result.totalSavings))} over the life of the loan.
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create Calculator page with tabs**

`src/app/mortgage-calculator/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentCalculator } from "@/components/calculator/payment-calculator";
import { AffordabilityCalculator } from "@/components/calculator/affordability-calculator";
import { RefinanceCalculator } from "@/components/calculator/refinance-calculator";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const metadata: Metadata = {
  title: "Mortgage Calculator",
  description: "Calculate your monthly mortgage payment, see how much home you can afford, or estimate your refinance savings. Free mortgage calculators from Alta Mortgage Group.",
};

export default function MortgageCalculatorPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Mortgage Calculator" }]} />

      <div className="mt-6">
        <h1 className="text-4xl font-bold text-navy">Mortgage Calculator</h1>
        <p className="mt-2 text-text-muted text-lg">
          Use our free calculators to estimate payments, determine affordability, or evaluate refinancing options.
        </p>
      </div>

      <div className="mt-8">
        <Tabs defaultValue="payment" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="affordability">Affordability</TabsTrigger>
            <TabsTrigger value="refinance">Refinance</TabsTrigger>
          </TabsList>
          <div className="mt-8">
            <TabsContent value="payment"><PaymentCalculator /></TabsContent>
            <TabsContent value="affordability"><AffordabilityCalculator /></TabsContent>
            <TabsContent value="refinance"><RefinanceCalculator /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Verify build and test calculators**

```bash
cd "G:/claudefolder/Loandepot-design"
npm run build
npm run dev
```

Visit http://localhost:3000/mortgage-calculator. Verify:
- Three tabs work (Payment, Affordability, Refinance)
- Sliders and inputs update results in real-time
- Pie chart renders with correct colors
- Amortization table expands/collapses
- Responsive on mobile viewport

- [ ] **Step 9: Commit**

```bash
cd "G:/claudefolder/Loandepot-design"
git add -A
git commit -m "feat: add mortgage calculators (payment, affordability, refinance) with charts and amortization"
```

---

## Task 5: Rates Page + Loan Options Page + Product Pages

**Files:**
- Create: `src/lib/rates-data.ts`
- Create: `src/app/rates/page.tsx`
- Create: `src/app/loan-options/page.tsx`
- Create: `src/app/purchase/page.tsx`
- Create: `src/app/refinance/page.tsx`
- Create: `src/app/home-equity/page.tsx`

- [ ] **Step 1: Create rates data**

`src/lib/rates-data.ts`:

```typescript
export interface RateRow {
  loanType: string;
  rate: number;
  apr: number;
  points: number;
}

export const currentRates: RateRow[] = [
  { loanType: "30-Year Fixed", rate: 6.625, apr: 6.782, points: 0.5 },
  { loanType: "20-Year Fixed", rate: 6.375, apr: 6.541, points: 0.5 },
  { loanType: "15-Year Fixed", rate: 5.875, apr: 6.098, points: 0.5 },
  { loanType: "7/1 ARM", rate: 6.250, apr: 7.102, points: 0.0 },
  { loanType: "5/1 ARM", rate: 6.000, apr: 7.204, points: 0.0 },
  { loanType: "FHA 30-Year", rate: 6.125, apr: 7.258, points: 0.0 },
  { loanType: "VA 30-Year", rate: 6.000, apr: 6.324, points: 0.0 },
  { loanType: "Jumbo 30-Year", rate: 6.875, apr: 6.945, points: 0.25 },
];

export const ratesLastUpdated = "2026-05-28";
```

- [ ] **Step 2: Create Rates page**

`src/app/rates/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { currentRates, ratesLastUpdated } from "@/lib/rates-data";
import { calculateMonthlyPayment } from "@/lib/calculator-utils";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Current Mortgage Rates",
  description: "See today's mortgage rates for Utah home loans. Compare rates for 30-year fixed, 15-year fixed, FHA, VA, and more from Alta Mortgage Group.",
};

export default function RatesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Rates" }]} />
      <h1 className="mt-6 text-4xl font-bold text-navy">Current Mortgage Rates</h1>
      <p className="mt-2 text-text-muted">
        Rates as of {ratesLastUpdated}. Rates are illustrative and subject to change. Contact us for a personalized quote.
      </p>

      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface">
              <th className="text-left p-4 font-semibold text-text">Loan Type</th>
              <th className="text-right p-4 font-semibold text-text">Rate</th>
              <th className="text-right p-4 font-semibold text-text">APR</th>
              <th className="text-right p-4 font-semibold text-text">Points</th>
              <th className="text-right p-4 font-semibold text-text">Mo. Payment / $100K</th>
            </tr>
          </thead>
          <tbody>
            {currentRates.map((row) => {
              const termYears = row.loanType.includes("15") ? 15 : row.loanType.includes("20") ? 20 : 30;
              const monthlyPer100k = calculateMonthlyPayment(100000, row.rate, termYears);
              return (
                <tr key={row.loanType} className="border-t border-border hover:bg-surface/50 transition-colors">
                  <td className="p-4 font-medium text-text">{row.loanType}</td>
                  <td className="p-4 text-right font-display font-bold text-navy text-lg">{row.rate.toFixed(3)}%</td>
                  <td className="p-4 text-right text-text-muted">{row.apr.toFixed(3)}%</td>
                  <td className="p-4 text-right text-text-muted">{row.points.toFixed(1)}</td>
                  <td className="p-4 text-right text-text">{formatCurrency(Math.round(monthlyPer100k))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-text-muted">
        Rates shown are for illustrative purposes and may not reflect current market conditions.
        Actual rates depend on credit score, loan amount, property type, and other factors.
        Contact Alta Mortgage Group for a personalized rate quote.
      </p>

      <div className="mt-8 bg-surface-warm rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-navy">Get Your Personalized Rate</h2>
        <p className="mt-2 text-text-muted">Talk to a Utah mortgage expert and find the best rate for your situation.</p>
        <Button asChild className="mt-4 bg-emerald hover:bg-emerald-light text-white px-8">
          <Link href="/contact">Get Pre-Approved</Link>
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Loan Options page**

`src/app/loan-options/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import * as Icons from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LOAN_TYPES } from "@/lib/constants";
import { generateFAQSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Mortgage Loan Options",
  description: "Compare mortgage loan programs: Conventional, FHA, VA, USDA, Jumbo, ARM, and Fixed Rate. Find the right Utah home loan for your situation with Alta Mortgage Group.",
};

const faqs = [
  { question: "What credit score do I need to buy a home in Utah?", answer: "Credit requirements vary by loan type. FHA loans accept scores as low as 580. Conventional loans typically require 620+. VA and USDA loans have flexible credit requirements. Contact us for a free consultation to discuss your options." },
  { question: "How much down payment do I need?", answer: "Down payments range from 0% (VA and USDA loans) to 3% (Conventional) to 3.5% (FHA). The right amount depends on your loan type, financial situation, and goals. Higher down payments can mean lower rates and no mortgage insurance." },
  { question: "What is the difference between rate and APR?", answer: "The interest rate is the cost of borrowing the principal loan amount. The APR (Annual Percentage Rate) includes the interest rate plus other costs like mortgage insurance, closing costs, and points, giving you a more complete picture of the total cost." },
  { question: "Can I buy a home in Utah with no down payment?", answer: "Yes! VA loans (for veterans and active military) and USDA loans (for eligible rural areas) offer 100% financing with no down payment required. Utah has several areas that qualify for USDA loans." },
];

export default function LoanOptionsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQSchema(faqs)) }} />
      <Breadcrumbs items={[{ label: "Loan Options" }]} />
      <h1 className="mt-6 text-4xl font-bold text-navy">Mortgage Loan Options</h1>
      <p className="mt-2 text-text-muted text-lg max-w-3xl">
        Every homebuyer&apos;s situation is different. Explore our loan programs to find the right fit for your goals, budget, and timeline.
      </p>

      <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LOAN_TYPES.map((loan) => {
          const IconComponent = Icons[loan.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
          return (
            <Card key={loan.id} className="bg-white border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center mb-4">
                  {IconComponent && <IconComponent className="w-6 h-6 text-navy" />}
                </div>
                <h2 className="text-xl font-bold text-text">{loan.name}</h2>
                <p className="mt-2 text-sm text-text-muted">{loan.shortDescription}</p>
                <ul className="mt-4 space-y-2">
                  {loan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text">
                      <span className="text-emerald mt-0.5">&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full bg-navy hover:bg-navy-light text-white">
                  <Link href="/contact">Apply Now</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-navy">Frequently Asked Questions</h2>
        <div className="mt-6 space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-surface rounded-xl p-6">
              <h3 className="font-semibold text-text">{faq.question}</h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 bg-surface-warm rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-navy">Not Sure Which Loan Is Right for You?</h2>
        <p className="mt-2 text-text-muted">Our Utah mortgage experts will help you find the best program for your situation.</p>
        <Button asChild className="mt-4 bg-emerald hover:bg-emerald-light text-white px-8">
          <Link href="/contact">Talk to an Expert</Link>
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create Purchase, Refinance, and Home Equity overview pages**

These three pages follow the same pattern. Create each file:

`src/app/purchase/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Home, CheckCircle } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Home Purchase Loans",
  description: "Buy your dream home in Utah with competitive mortgage rates. First-time buyer programs, FHA, VA, Conventional, and more from Alta Mortgage Group.",
};

const benefits = [
  "Competitive rates on all loan types",
  "Down payments as low as 0% for eligible buyers",
  "First-time homebuyer programs and grants",
  "Local expertise in Weber and Davis county markets",
  "Fast pre-approvals — often same day",
  "Personalized guidance from application to closing",
];

export default function PurchasePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Home Purchase" }]} />
      <div className="mt-6 grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <div className="w-14 h-14 rounded-xl bg-navy/10 flex items-center justify-center mb-6">
            <Home className="w-7 h-7 text-navy" />
          </div>
          <h1 className="text-4xl font-bold text-navy">Buy a Home in Utah</h1>
          <p className="mt-4 text-text-muted text-lg leading-relaxed">
            Whether you&apos;re buying your first home in Ogden or upgrading in Kaysville, Alta Mortgage Group will guide you through every step. We offer a full range of purchase loan programs with competitive rates and personalized service.
          </p>
          <ul className="mt-8 space-y-3">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-text">
                <CheckCircle className="w-5 h-5 text-emerald mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="bg-emerald hover:bg-emerald-light text-white">
              <Link href="/contact">Get Pre-Approved</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white">
              <Link href="/loan-options">View Loan Options</Link>
            </Button>
          </div>
        </div>
        <div className="bg-surface-warm rounded-2xl p-8 lg:p-10">
          <h2 className="text-2xl font-bold text-navy">How It Works</h2>
          <ol className="mt-6 space-y-6">
            {[
              { step: "1", title: "Get Pre-Approved", desc: "Tell us about your finances and goals. We'll determine how much you can afford and provide a pre-approval letter." },
              { step: "2", title: "Find Your Home", desc: "Shop with confidence knowing your budget and loan options. We partner with local Utah real estate agents." },
              { step: "3", title: "Close Your Loan", desc: "We handle the paperwork, coordinate with all parties, and guide you to a smooth closing day." },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold shrink-0">{item.step}</div>
                <div>
                  <h3 className="font-semibold text-text">{item.title}</h3>
                  <p className="text-sm text-text-muted mt-1">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
```

`src/app/refinance/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { RefreshCw, CheckCircle } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Refinance Your Mortgage",
  description: "Lower your monthly payment, shorten your loan term, or access cash from your home equity. Refinance options from Alta Mortgage Group in Utah.",
};

const benefits = [
  "Lower your monthly mortgage payment",
  "Reduce your interest rate",
  "Shorten your loan term to pay off faster",
  "Switch from an adjustable to a fixed rate",
  "Cash-out refinance for home improvements or debt consolidation",
  "Streamline refinance options for FHA and VA loans",
];

export default function RefinancePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Refinance" }]} />
      <div className="mt-6 grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <div className="w-14 h-14 rounded-xl bg-navy/10 flex items-center justify-center mb-6">
            <RefreshCw className="w-7 h-7 text-navy" />
          </div>
          <h1 className="text-4xl font-bold text-navy">Refinance Your Utah Mortgage</h1>
          <p className="mt-4 text-text-muted text-lg leading-relaxed">
            Refinancing could save you hundreds per month or help you reach your financial goals faster. Alta Mortgage Group makes the process simple with competitive rates and fast closings.
          </p>
          <ul className="mt-8 space-y-3">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-text">
                <CheckCircle className="w-5 h-5 text-emerald mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="bg-emerald hover:bg-emerald-light text-white">
              <Link href="/contact">Start Your Refinance</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white">
              <Link href="/mortgage-calculator">Calculate Savings</Link>
            </Button>
          </div>
        </div>
        <div className="bg-surface-warm rounded-2xl p-8 lg:p-10">
          <h2 className="text-2xl font-bold text-navy">When Should You Refinance?</h2>
          <div className="mt-6 space-y-4">
            {[
              { title: "Rates Have Dropped", desc: "If current rates are lower than your existing rate, refinancing could save you significantly over the life of the loan." },
              { title: "Your Credit Has Improved", desc: "A higher credit score since your original loan could qualify you for better terms and lower rates." },
              { title: "You Want to Access Equity", desc: "A cash-out refinance lets you tap your home's equity for renovations, education, or debt consolidation." },
              { title: "You Want Payment Stability", desc: "Switching from an adjustable-rate to a fixed-rate mortgage locks in predictable payments." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-lg p-4 border border-border">
                <h3 className="font-semibold text-text">{item.title}</h3>
                <p className="text-sm text-text-muted mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

`src/app/home-equity/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Wallet, CheckCircle } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Home Equity Loans & HELOC",
  description: "Access your home's equity with a home equity loan or HELOC from Alta Mortgage Group. Competitive rates for Utah homeowners in Weber and Davis counties.",
};

const benefits = [
  "Borrow against your home's equity at competitive rates",
  "Fixed-rate home equity loans for predictable payments",
  "HELOC for flexible, revolving access to funds",
  "Use funds for renovations, debt consolidation, education, or more",
  "Potential tax deductibility on interest (consult your tax advisor)",
  "Fast approvals for Utah homeowners",
];

export default function HomeEquityPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Home Equity" }]} />
      <div className="mt-6 grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <div className="w-14 h-14 rounded-xl bg-navy/10 flex items-center justify-center mb-6">
            <Wallet className="w-7 h-7 text-navy" />
          </div>
          <h1 className="text-4xl font-bold text-navy">Home Equity Loans &amp; HELOC</h1>
          <p className="mt-4 text-text-muted text-lg leading-relaxed">
            Your home is likely your biggest asset. A home equity loan or HELOC lets you put that value to work — whether for home improvements, consolidating debt, or covering major expenses.
          </p>
          <ul className="mt-8 space-y-3">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-text">
                <CheckCircle className="w-5 h-5 text-emerald mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="bg-emerald hover:bg-emerald-light text-white">
              <Link href="/contact">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white">
              <Link href="/mortgage-calculator">Calculate Equity</Link>
            </Button>
          </div>
        </div>
        <div className="bg-surface-warm rounded-2xl p-8 lg:p-10">
          <h2 className="text-2xl font-bold text-navy">Home Equity Loan vs. HELOC</h2>
          <div className="mt-6 space-y-6">
            <div className="bg-white rounded-lg p-5 border border-border">
              <h3 className="font-semibold text-navy">Home Equity Loan</h3>
              <p className="text-sm text-text-muted mt-2">Lump-sum disbursement with a fixed interest rate and predictable monthly payments. Best for one-time expenses like a major renovation or debt payoff.</p>
            </div>
            <div className="bg-white rounded-lg p-5 border border-border">
              <h3 className="font-semibold text-emerald">HELOC (Home Equity Line of Credit)</h3>
              <p className="text-sm text-text-muted mt-2">Revolving credit line you can draw from as needed, similar to a credit card. Variable rate, pay interest only on what you use. Best for ongoing expenses or projects.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify build and check all pages**

```bash
cd "G:/claudefolder/Loandepot-design"
npm run build
npm run dev
```

Visit each page: `/rates`, `/loan-options`, `/purchase`, `/refinance`, `/home-equity`. Verify content renders, navigation works, breadcrumbs display correctly.

- [ ] **Step 6: Commit**

```bash
cd "G:/claudefolder/Loandepot-design"
git add -A
git commit -m "feat: add rates page, loan options, purchase, refinance, and home equity pages"
```

---

## Task 6: About Page + Contact/Pre-Approval Form

**Files:**
- Create: `src/app/about/page.tsx`
- Create: `src/components/forms/pre-approval-form.tsx`
- Create: `src/app/contact/page.tsx`
- Create: `src/lib/schemas.ts`

- [ ] **Step 1: Create Zod schemas for form validation**

`src/lib/schemas.ts`:

```typescript
import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  loanPurpose: z.enum(["purchase", "refinance", "home-equity", "cash-out"]),
  estimatedAmount: z.string().optional(),
  preferredContact: z.enum(["phone", "email", "text"]).optional(),
  bestTimeToCall: z.string().optional(),
  source: z.string().optional(),
  utm: z.record(z.string()).optional(),
  timestamp: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

export const preApprovalSchema = z.object({
  // Step 1: Personal
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  // Step 2: Loan Details
  loanPurpose: z.enum(["purchase", "refinance", "home-equity"]),
  estimatedAmount: z.string().min(1, "Estimated amount is required"),
  timeline: z.enum(["asap", "1-3months", "3-6months", "6-12months", "justLooking"]),
  // Step 3: Property
  propertyType: z.enum(["single-family", "condo", "townhome", "multi-family", "manufactured"]),
  propertyZip: z.string().min(5, "Valid zip code is required"),
  firstTimeBuyer: z.enum(["yes", "no"]),
});

export type PreApprovalFormData = z.infer<typeof preApprovalSchema>;

export const applicationSchema = z.object({
  // Step 1: Loan Info
  loanPurpose: z.enum(["purchase", "refinance", "home-equity"]),
  propertyType: z.enum(["single-family", "condo", "townhome", "multi-family", "manufactured"]),
  propertyUse: z.enum(["primary", "secondary", "investment"]),
  purchasePrice: z.number().min(1),
  loanAmount: z.number().min(1),
  downPayment: z.number().min(0).optional(),
  currentBalance: z.number().min(0).optional(),
  // Step 2: Personal
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  suffix: z.string().optional(),
  dateOfBirth: z.string().min(1),
  ssn: z.string().optional(),
  maritalStatus: z.enum(["single", "married", "separated", "divorced", "widowed"]),
  phone: z.string().min(10),
  email: z.string().email(),
  currentAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(2),
    zip: z.string().min(5),
  }),
  yearsAtAddress: z.number().min(0),
  previousAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
  }).optional(),
  housingStatus: z.enum(["own", "rent", "other"]),
  monthlyHousingPayment: z.number().min(0),
  // Step 3: Employment
  employmentStatus: z.enum(["employed", "self-employed", "retired", "other"]),
  employerName: z.string().optional(),
  jobTitle: z.string().optional(),
  yearsAtJob: z.number().min(0).optional(),
  monthlyIncome: z.number().min(0),
  previousEmployer: z.string().optional(),
  otherIncome: z.array(z.object({ type: z.string(), amount: z.number() })).optional(),
  // Step 4: Assets
  bankAccounts: z.array(z.object({ institution: z.string(), type: z.string(), balance: z.number() })).optional(),
  monthlyAutoLoan: z.number().min(0).default(0),
  monthlyStudentLoan: z.number().min(0).default(0),
  monthlyCreditCards: z.number().min(0).default(0),
  monthlyChildSupport: z.number().min(0).default(0),
  monthlyOtherDebt: z.number().min(0).default(0),
  creditScoreRange: z.enum(["excellent", "good", "fair", "below-fair", "not-sure"]),
  // Step 5: Declarations
  usCitizen: z.enum(["yes", "permanent-resident", "other"]),
  bankruptcy: z.boolean(),
  foreclosure: z.boolean(),
  outstandingJudgments: z.boolean(),
  downPaymentBorrowed: z.boolean(),
  primaryResidence: z.boolean(),
  veteran: z.boolean(),
  firstTimeBuyer: z.boolean(),
  // Step 6: Consent
  consentAuthorization: z.boolean().refine((v) => v === true, "You must authorize to continue"),
  eSignatureName: z.string().min(1, "Signature is required"),
  eSignatureDate: z.string().min(1),
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;
```

- [ ] **Step 2: Create About page**

`src/app/about/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Target, Users, Shield } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Us",
  description: `Learn about ${COMPANY.name}, a trusted Utah mortgage lender serving Weber and Davis counties. Our mission, values, and team.`,
};

const values = [
  { icon: Heart, title: "Community First", description: "We live and work in Weber and Davis counties. Your community is our community, and we're invested in helping our neighbors achieve homeownership." },
  { icon: Target, title: "Expert Guidance", description: "Navigating mortgage options can be complex. We simplify the process with clear, honest advice tailored to your unique financial situation." },
  { icon: Users, title: "Personal Service", description: "You're not a number to us. Every client gets a dedicated loan specialist who's available when you need them — by phone, email, or in person." },
  { icon: Shield, title: "Trust & Transparency", description: "No hidden fees, no surprises. We believe in full transparency throughout the lending process so you can make confident decisions." },
];

const team = [
  { name: "John Smith", title: "Branch Manager / Loan Officer", nmls: "123456", bio: "15+ years of mortgage lending experience in the Utah market. Specializes in first-time homebuyer programs and VA loans." },
  { name: "Jane Doe", title: "Senior Loan Officer", nmls: "234567", bio: "Expert in conventional and jumbo loans. Passionate about helping families in Davis County find their dream homes." },
  { name: "Mike Johnson", title: "Loan Officer", nmls: "345678", bio: "Former real estate agent turned loan officer. Deep knowledge of the Weber County housing market and FHA programs." },
];

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "About Us" }]} />

      <div className="mt-6 max-w-3xl">
        <h1 className="text-4xl font-bold text-navy">About Alta Mortgage Group</h1>
        <p className="mt-4 text-text-muted text-lg leading-relaxed">
          Alta Mortgage Group is a Utah-based mortgage lender dedicated to helping families in Weber and Davis counties achieve their homeownership dreams. Founded on the principles of trust, transparency, and personalized service, we provide expert mortgage guidance for home purchases, refinancing, and home equity loans.
        </p>
        <p className="mt-4 text-text-muted text-lg leading-relaxed">
          Our name, &quot;Alta,&quot; means &quot;high&quot; or &quot;elevated&quot; — and that&apos;s exactly the standard of service we hold ourselves to. We believe every family deserves a lender who listens, educates, and advocates on their behalf.
        </p>
      </div>

      {/* Values */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-navy">Our Values</h2>
        <div className="mt-8 grid sm:grid-cols-2 gap-6">
          {values.map((v) => (
            <div key={v.title} className="bg-surface rounded-xl p-6 flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center shrink-0">
                <v.icon className="w-5 h-5 text-navy" />
              </div>
              <div>
                <h3 className="font-semibold text-text">{v.title}</h3>
                <p className="text-sm text-text-muted mt-1 leading-relaxed">{v.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-navy">Our Team</h2>
        <p className="mt-2 text-text-muted">Meet the people who make it happen.</p>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {team.map((member) => (
            <div key={member.name} className="bg-white border border-border rounded-xl p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-surface mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-navy">
                {member.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <h3 className="font-semibold text-text">{member.name}</h3>
              <p className="text-sm text-emerald font-medium">{member.title}</p>
              <p className="text-xs text-text-muted mt-1">NMLS# {member.nmls}</p>
              <p className="text-sm text-text-muted mt-3 leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-16 bg-surface-warm rounded-2xl p-8 lg:p-12 text-center">
        <h2 className="text-3xl font-bold text-navy">Ready to Work With Us?</h2>
        <p className="mt-3 text-text-muted max-w-xl mx-auto">
          Whether you&apos;re buying, refinancing, or tapping into your equity, our team is here to help.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-emerald hover:bg-emerald-light text-white">
            <Link href="/contact">Get Pre-Approved</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-navy text-navy">
            <a href={`tel:${COMPANY.phone.replace(/\D/g, "")}`}>Call {COMPANY.phone}</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create multi-step Pre-Approval Form**

`src/components/forms/pre-approval-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { preApprovalSchema, type PreApprovalFormData } from "@/lib/schemas";

export function PreApprovalForm() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const totalSteps = 4;

  const form = useForm<PreApprovalFormData>({
    resolver: zodResolver(preApprovalSchema),
    mode: "onTouched",
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

  const onSubmit = async (data: PreApprovalFormData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          loanPurpose: data.loanPurpose,
          estimatedAmount: data.estimatedAmount,
          propertyType: data.propertyType,
          propertyZip: data.propertyZip,
          firstTimeBuyer: data.firstTimeBuyer,
          timeline: data.timeline,
          source: window.location.pathname,
          timestamp: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setStep(totalSteps);
      }
    } catch {
      // Stay on current step for retry
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-emerald mx-auto" />
        <h2 className="text-2xl font-bold text-navy mt-4">You&apos;re Pre-Approved!</h2>
        <p className="text-text-muted mt-2 max-w-md mx-auto">
          Thank you for your submission. A loan specialist will contact you within 24 hours to discuss your options and next steps.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Progress value={(step / totalSteps) * 100} className="mb-8" />
      <p className="text-sm text-text-muted mb-6">Step {step} of {totalSteps - 1}</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-text">Personal Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input {...register("firstName")} className="mt-1" />
                {errors.firstName && <p className="text-xs text-error mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <Label>Last Name</Label>
                <Input {...register("lastName")} className="mt-1" />
                {errors.lastName && <p className="text-xs text-error mt-1">{errors.lastName.message}</p>}
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input {...register("email")} type="email" className="mt-1" />
              {errors.email && <p className="text-xs text-error mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label>Phone</Label>
              <Input {...register("phone")} type="tel" className="mt-1" />
              {errors.phone && <p className="text-xs text-error mt-1">{errors.phone.message}</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-text">Loan Details</h2>
            <div>
              <Label>Loan Purpose</Label>
              <Select onValueChange={(v) => setValue("loanPurpose", v as PreApprovalFormData["loanPurpose"])}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select purpose" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Purchase a Home</SelectItem>
                  <SelectItem value="refinance">Refinance</SelectItem>
                  <SelectItem value="home-equity">Home Equity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estimated Loan Amount</Label>
              <Select onValueChange={(v) => setValue("estimatedAmount", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select range" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-200k">Under $200,000</SelectItem>
                  <SelectItem value="200k-400k">$200,000 - $400,000</SelectItem>
                  <SelectItem value="400k-600k">$400,000 - $600,000</SelectItem>
                  <SelectItem value="600k-800k">$600,000 - $800,000</SelectItem>
                  <SelectItem value="over-800k">Over $800,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Timeline</Label>
              <Select onValueChange={(v) => setValue("timeline", v as PreApprovalFormData["timeline"])}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="When do you need financing?" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="asap">As soon as possible</SelectItem>
                  <SelectItem value="1-3months">1-3 months</SelectItem>
                  <SelectItem value="3-6months">3-6 months</SelectItem>
                  <SelectItem value="6-12months">6-12 months</SelectItem>
                  <SelectItem value="justLooking">Just looking</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-text">Property Information</h2>
            <div>
              <Label>Property Type</Label>
              <Select onValueChange={(v) => setValue("propertyType", v as PreApprovalFormData["propertyType"])}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single-family">Single Family</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="townhome">Townhome</SelectItem>
                  <SelectItem value="multi-family">Multi-Family</SelectItem>
                  <SelectItem value="manufactured">Manufactured</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Property ZIP Code</Label>
              <Input {...register("propertyZip")} maxLength={5} className="mt-1" placeholder="84401" />
              {errors.propertyZip && <p className="text-xs text-error mt-1">{errors.propertyZip.message}</p>}
            </div>
            <div>
              <Label>First-Time Homebuyer?</Label>
              <RadioGroup onValueChange={(v) => setValue("firstTimeBuyer", v as "yes" | "no")} className="flex gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="yes" id="ftb-yes" />
                  <Label htmlFor="ftb-yes">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="no" id="ftb-no" />
                  <Label htmlFor="ftb-no">No</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          )}
          {step < 3 ? (
            <Button type="button" onClick={() => setStep(step + 1)} className="ml-auto bg-navy hover:bg-navy-light text-white">
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" disabled={submitting} className="ml-auto bg-emerald hover:bg-emerald-light text-white px-8">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Pre-Approval Request"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create Contact page**

`src/app/contact/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PreApprovalForm } from "@/components/forms/pre-approval-form";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Get Pre-Approved",
  description: "Get pre-approved for a mortgage in minutes. Contact Alta Mortgage Group for a free consultation on home purchase, refinance, or home equity loans in Utah.",
};

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Get Pre-Approved" }]} />

      <div className="mt-6 grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <h1 className="text-4xl font-bold text-navy">Get Pre-Approved</h1>
          <p className="mt-2 text-text-muted text-lg">
            Fill out the form below and a mortgage specialist will reach out within 24 hours.
          </p>
          <div className="mt-8 bg-white border border-border rounded-xl p-6 lg:p-8">
            <PreApprovalForm />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-xl p-6">
            <h2 className="font-semibold text-text mb-4">Contact Information</h2>
            <div className="space-y-4">
              <a href={`tel:${COMPANY.phone.replace(/\D/g, "")}`} className="flex items-center gap-3 text-sm text-text-muted hover:text-navy transition-colors">
                <Phone className="w-4 h-4 text-emerald" />
                {COMPANY.phone}
              </a>
              <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-3 text-sm text-text-muted hover:text-navy transition-colors">
                <Mail className="w-4 h-4 text-emerald" />
                {COMPANY.email}
              </a>
              <div className="flex items-start gap-3 text-sm text-text-muted">
                <MapPin className="w-4 h-4 text-emerald mt-0.5" />
                <span>{COMPANY.address.street}<br />{COMPANY.address.city}, {COMPANY.address.state} {COMPANY.address.zip}</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-text-muted">
                <Clock className="w-4 h-4 text-emerald mt-0.5" />
                <div>
                  <p>Mon-Fri: {COMPANY.hours.weekdays}</p>
                  <p>Saturday: {COMPANY.hours.saturday}</p>
                  <p>Sunday: {COMPANY.hours.sunday}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-navy rounded-xl p-6 text-white">
            <h2 className="font-semibold mb-2">What Happens Next?</h2>
            <ol className="space-y-3 text-sm text-white/80">
              <li className="flex gap-3"><span className="font-bold text-emerald-light">1.</span> We review your information</li>
              <li className="flex gap-3"><span className="font-bold text-emerald-light">2.</span> A specialist contacts you within 24 hours</li>
              <li className="flex gap-3"><span className="font-bold text-emerald-light">3.</span> We discuss options and next steps</li>
              <li className="flex gap-3"><span className="font-bold text-emerald-light">4.</span> You receive your pre-approval letter</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify build and test form**

```bash
cd "G:/claudefolder/Loandepot-design"
npm run build
npm run dev
```

Visit `/about` and `/contact`. Verify multi-step form navigates between steps. Form won't submit yet (API route not built) — that's expected.

- [ ] **Step 6: Commit**

```bash
cd "G:/claudefolder/Loandepot-design"
git add -A
git commit -m "feat: add about page and multi-step pre-approval contact form"
```

---

## Task 7: API Routes — Lead Capture + CRM + Email

**Files:**
- Create: `src/lib/crm.ts`
- Create: `src/lib/email.ts`
- Create: `src/app/api/leads/route.ts`
- Create: `src/app/api/applications/route.ts`

- [ ] **Step 1: Create CRM integration module**

`src/lib/crm.ts`:

```typescript
interface CRMPayload {
  type: "lead" | "application";
  data: Record<string, unknown>;
  timestamp: string;
}

export async function forwardToCRM(payload: CRMPayload): Promise<boolean> {
  const url = process.env.CRM_API_URL;
  const key = process.env.CRM_API_KEY;

  if (!url || !key) {
    console.warn("CRM not configured — skipping forward");
    return false;
  }

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) return true;
      console.error(`CRM attempt ${attempt} failed: ${res.status}`);
    } catch (err) {
      console.error(`CRM attempt ${attempt} error:`, err);
    }
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  return false;
}
```

- [ ] **Step 2: Create email notification module**

`src/lib/email.ts`:

```typescript
import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("SMTP not configured — skipping email");
    return null;
  }

  transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  return transporter;
}

export async function sendLeadNotification(lead: Record<string, unknown>): Promise<boolean> {
  const t = getTransporter();
  const to = process.env.NOTIFICATION_EMAIL;
  if (!t || !to) return false;

  try {
    await t.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: `New Lead — ${lead.name} — ${lead.loanPurpose}`,
      html: `
        <h2>New Lead Received</h2>
        <table style="border-collapse:collapse;width:100%">
          ${Object.entries(lead)
            .filter(([, v]) => v !== undefined && v !== null && v !== "")
            .map(([k, v]) => `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">${k}</td><td style="padding:8px;border:1px solid #ddd">${typeof v === "object" ? JSON.stringify(v) : v}</td></tr>`)
            .join("")}
        </table>
      `,
    });
    return true;
  } catch (err) {
    console.error("Email send error:", err);
    return false;
  }
}

export async function sendApplicationNotification(
  application: Record<string, unknown>,
  referenceNumber: string
): Promise<boolean> {
  const t = getTransporter();
  const to = process.env.NOTIFICATION_EMAIL;
  if (!t || !to) return false;

  try {
    await t.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: `New Application — ${application.firstName} ${application.lastName} — ${referenceNumber}`,
      html: `
        <h2>New Mortgage Application — ${referenceNumber}</h2>
        <table style="border-collapse:collapse;width:100%">
          ${Object.entries(application)
            .filter(([k, v]) => v !== undefined && v !== null && v !== "" && k !== "ssn")
            .map(([k, v]) => `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">${k}</td><td style="padding:8px;border:1px solid #ddd">${typeof v === "object" ? JSON.stringify(v) : v}</td></tr>`)
            .join("")}
        </table>
        <p><em>SSN is redacted from email notifications for security.</em></p>
      `,
    });
    return true;
  } catch (err) {
    console.error("Email send error:", err);
    return false;
  }
}
```

- [ ] **Step 3: Create leads API route**

`src/app/api/leads/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { leadSchema } from "@/lib/schemas";
import { forwardToCRM } from "@/lib/crm";
import { sendLeadNotification } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = leadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten() }, { status: 400 });
    }

    const lead = result.data;
    const timestamp = new Date().toISOString();

    // Forward to CRM (non-blocking for response)
    const crmPromise = forwardToCRM({ type: "lead", data: lead, timestamp });

    // Send email notification
    const emailPromise = sendLeadNotification({ ...lead, timestamp });

    await Promise.allSettled([crmPromise, emailPromise]);

    return NextResponse.json({ success: true, message: "Lead received successfully" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create applications API route**

`src/app/api/applications/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { applicationSchema } from "@/lib/schemas";
import { forwardToCRM } from "@/lib/crm";
import { sendApplicationNotification } from "@/lib/email";
import { generateRefNumber } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = applicationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten() }, { status: 400 });
    }

    const application = result.data;
    const referenceNumber = generateRefNumber();
    const timestamp = new Date().toISOString();

    // Redact SSN for CRM (send only last 4 if provided)
    const crmData = {
      ...application,
      ssn: application.ssn ? `***-**-${application.ssn.slice(-4)}` : undefined,
      referenceNumber,
      timestamp,
    };

    const crmPromise = forwardToCRM({ type: "application", data: crmData, timestamp });
    const emailPromise = sendApplicationNotification(crmData, referenceNumber);

    await Promise.allSettled([crmPromise, emailPromise]);

    return NextResponse.json({ success: true, referenceNumber });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 5: Verify build**

```bash
cd "G:/claudefolder/Loandepot-design"
npm run build
```

- [ ] **Step 6: Commit**

```bash
cd "G:/claudefolder/Loandepot-design"
git add -A
git commit -m "feat: add API routes for leads and applications with CRM forwarding and email notifications"
```

---

## Task 8: Full Mortgage Application Page (/apply/)

**Files:**
- Create: `src/components/forms/mortgage-application/application-wizard.tsx`
- Create: `src/components/forms/mortgage-application/step-loan-info.tsx`
- Create: `src/components/forms/mortgage-application/step-personal-info.tsx`
- Create: `src/components/forms/mortgage-application/step-employment.tsx`
- Create: `src/components/forms/mortgage-application/step-assets.tsx`
- Create: `src/components/forms/mortgage-application/step-declarations.tsx`
- Create: `src/components/forms/mortgage-application/step-review.tsx`
- Create: `src/app/apply/page.tsx`

This task builds a 6-step form wizard. The wizard component manages state and renders the active step. Each step is a standalone component receiving form methods from react-hook-form.

- [ ] **Step 1: Create the Application Wizard wrapper**

`src/components/forms/mortgage-application/application-wizard.tsx` — manages all 6 steps, localStorage persistence, form state, and submission. Uses `useForm` with the `applicationSchema` from `src/lib/schemas.ts`. Renders a `<Progress>` bar, step indicator, the active step component, and Back/Next/Submit buttons. On submit, POSTs to `/api/applications`, shows success with reference number.

Key implementation details:
- Store form data in localStorage key `alta-mortgage-app` on each step change (exclude SSN)
- Load from localStorage on mount to resume incomplete applications
- Validate only the fields for the current step before allowing "Next"
- On final submit, clear localStorage

- [ ] **Step 2: Create Step 1 — Loan Information**

`src/components/forms/mortgage-application/step-loan-info.tsx` — fields: loanPurpose (select), propertyType (select), propertyUse (radio group), purchasePrice (number input), loanAmount (number input), downPayment (conditional on purchase), currentBalance (conditional on refinance). All fields use the form's `register` and `setValue` methods passed as props.

- [ ] **Step 3: Create Step 2 — Personal Information**

`src/components/forms/mortgage-application/step-personal-info.tsx` — fields: firstName, middleName, lastName, suffix, dateOfBirth (date input), SSN (masked input with type="password", pattern `\d{3}-?\d{2}-?\d{4}`), maritalStatus (select), phone, email, currentAddress (street/city/state/zip group), yearsAtAddress, previousAddress (shown conditionally when yearsAtAddress < 2), housingStatus (radio), monthlyHousingPayment.

- [ ] **Step 4: Create Step 3 — Employment & Income**

`src/components/forms/mortgage-application/step-employment.tsx` — fields: employmentStatus (select), employerName (conditional), jobTitle, yearsAtJob, monthlyIncome, previousEmployer (conditional when yearsAtJob < 2), otherIncome (repeatable add/remove rows with type + amount).

- [ ] **Step 5: Create Step 4 — Assets & Liabilities**

`src/components/forms/mortgage-application/step-assets.tsx` — fields: bankAccounts (repeatable rows: institution, type, balance), monthly debt fields (autoLoan, studentLoan, creditCards, childSupport, other — all number inputs), creditScoreRange (select dropdown).

- [ ] **Step 6: Create Step 5 — Declarations**

`src/components/forms/mortgage-application/step-declarations.tsx` — fields: usCitizen (radio: yes/permanent-resident/other), bankruptcy (yes/no radio), foreclosure (yes/no), outstandingJudgments (yes/no), downPaymentBorrowed (yes/no), primaryResidence (yes/no), veteran (yes/no — show note about VA loan eligibility), firstTimeBuyer (yes/no — show note about FTHB programs).

- [ ] **Step 7: Create Step 6 — Review & Submit**

`src/components/forms/mortgage-application/step-review.tsx` — displays all entered data in read-only summary sections. Each section has an "Edit" button that navigates back to that step. Includes: consent checkbox with authorization text, eSignatureName text input, eSignatureDate (auto-filled with today's date). Submit button triggers form submission.

- [ ] **Step 8: Create the Apply page**

`src/app/apply/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ApplicationWizard } from "@/components/forms/mortgage-application/application-wizard";

export const metadata: Metadata = {
  title: "Apply for a Mortgage",
  description: "Apply for a mortgage online with Alta Mortgage Group. Complete our secure application for home purchase, refinance, or home equity loans in Utah.",
};

export default function ApplyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Apply" }]} />
      <h1 className="mt-6 text-4xl font-bold text-navy">Mortgage Application</h1>
      <p className="mt-2 text-text-muted">
        Complete the application below. Your information is secure and encrypted. You can save your progress and return later.
      </p>
      <div className="mt-8">
        <ApplicationWizard />
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Verify build and test wizard navigation**

```bash
cd "G:/claudefolder/Loandepot-design"
npm run build
npm run dev
```

Visit `/apply`. Verify all 6 steps render, navigation works (Next/Back), localStorage persistence works (refresh page and data persists), and the review step shows all entered data.

- [ ] **Step 10: Commit**

```bash
cd "G:/claudefolder/Loandepot-design"
git add -A
git commit -m "feat: add full 6-step mortgage application form at /apply"
```

---

## Task 9: Utah Landing Pages (State + County)

**Files:**
- Create: `src/app/utah/page.tsx`
- Create: `src/app/utah/weber-county/page.tsx`
- Create: `src/app/utah/davis-county/page.tsx`

- [ ] **Step 1: Create Utah state landing page**

`src/app/utah/page.tsx` — H1: "Utah Mortgage Lender". Content about Utah housing market, why Alta, links to county pages, Utah-specific programs (USDA, Utah Housing Corp), CTA to contact. Metadata with "Utah mortgage lender" keywords. LocalBusiness schema.

- [ ] **Step 2: Create Weber County page**

`src/app/utah/weber-county/page.tsx` — H1: "Weber County Mortgage Lender". Cities served list (from `SERVICE_AREAS.counties[0].cities`), local market content, FAQ section with FAQPage schema (questions like "What are current mortgage rates in Weber County?", "Can I buy a home in Ogden with no down payment?"), CTA. Breadcrumbs: Home > Utah > Weber County.

- [ ] **Step 3: Create Davis County page**

`src/app/utah/davis-county/page.tsx` — Same pattern as Weber County but for Davis County cities and content. H1: "Davis County Mortgage Lender". Breadcrumbs: Home > Utah > Davis County.

- [ ] **Step 4: Verify and commit**

```bash
cd "G:/claudefolder/Loandepot-design"
npm run build
npm run dev
```

Visit `/utah`, `/utah/weber-county`, `/utah/davis-county`. Verify content, breadcrumbs, schema markup in page source.

```bash
git add -A
git commit -m "feat: add Utah, Weber County, and Davis County landing pages with local SEO"
```

---

## Task 10: Legal Pages + SEO Infrastructure (Sitemap, Robots, Schema)

**Files:**
- Create: `src/app/privacy/page.tsx`
- Create: `src/app/terms/page.tsx`
- Create: `src/app/licensing/page.tsx`
- Create: `src/app/accessibility/page.tsx`
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`

- [ ] **Step 1: Create sitemap.ts**

`src/app/sitemap.ts`:

```typescript
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://altamortgagegroup.net";
  const now = new Date().toISOString();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/purchase`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/refinance`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/home-equity`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/loan-options`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/mortgage-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/rates`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/apply`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/utah`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/utah/weber-county`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/utah/davis-county`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/licensing`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/accessibility`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
```

- [ ] **Step 2: Create robots.ts**

`src/app/robots.ts`:

```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://altamortgagegroup.net";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

- [ ] **Step 3: Create Privacy Policy page**

`src/app/privacy/page.tsx` — Standard privacy policy for a mortgage company. Metadata title "Privacy Policy". Covers: information collection (personal info, financial info, cookies), how information is used, third-party sharing, data security, user rights, contact for privacy concerns. Breadcrumbs. Use `<article>` wrapper with prose styling.

- [ ] **Step 4: Create Terms of Service page**

`src/app/terms/page.tsx` — Standard terms. Covers: acceptance, use of site, not a commitment to lend, rate disclaimers, intellectual property, limitation of liability, governing law (Utah). Breadcrumbs.

- [ ] **Step 5: Create Licensing page**

`src/app/licensing/page.tsx` — NMLS number, Utah Division of Real Estate licensing info, Equal Housing Opportunity statement, NMLS Consumer Access link. Breadcrumbs.

- [ ] **Step 6: Create Accessibility page**

`src/app/accessibility/page.tsx` — WCAG 2.1 AA compliance commitment, features implemented, how to report issues. Breadcrumbs.

- [ ] **Step 7: Verify all pages and SEO infrastructure**

```bash
cd "G:/claudefolder/Loandepot-design"
npm run build
npm run dev
```

Visit `/sitemap.xml` (should render XML), `/robots.txt`, and all four legal pages. Verify breadcrumbs work.

- [ ] **Step 8: Commit**

```bash
cd "G:/claudefolder/Loandepot-design"
git add -A
git commit -m "feat: add legal pages, XML sitemap, and robots.txt"
```

---

## Task 11: Mobile Sticky CTA + Final Polish

**Files:**
- Create: `src/components/layout/mobile-cta-bar.tsx`
- Modify: `src/app/layout.tsx` — add mobile CTA bar
- Create: `public/favicon.ico` (placeholder or generate)

- [ ] **Step 1: Create floating mobile CTA bar**

`src/components/layout/mobile-cta-bar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { COMPANY } from "@/lib/constants";

export function MobileCTABar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border p-3 flex gap-2 lg:hidden">
      <Link
        href="/contact"
        className="flex-1 bg-emerald hover:bg-emerald-light text-white text-center py-3 rounded-lg font-medium text-sm transition-colors"
      >
        Get Pre-Approved
      </Link>
      <a
        href={`tel:${COMPANY.phone.replace(/\D/g, "")}`}
        className="flex items-center justify-center gap-2 bg-navy hover:bg-navy-light text-white px-4 py-3 rounded-lg font-medium text-sm transition-colors"
      >
        <Phone className="w-4 h-4" />
        Call
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Add MobileCTABar to root layout**

Import and add `<MobileCTABar />` after `<Footer />` in `src/app/layout.tsx`. Add `pb-20 lg:pb-0` to `<main>` to prevent content from being hidden behind the sticky bar on mobile.

- [ ] **Step 3: Final build verification**

```bash
cd "G:/claudefolder/Loandepot-design"
npm run build
```

Build must succeed with zero errors. If there are issues, fix them.

- [ ] **Step 4: Dev server full walkthrough**

```bash
npm run dev
```

Test the following pages at both desktop (1280px) and mobile (375px) widths:
- Homepage: all 11 sections, CTAs link correctly
- `/mortgage-calculator`: all 3 tabs, sliders work, chart renders
- `/rates`: table renders, responsive on mobile
- `/loan-options`: cards render, FAQ visible
- `/purchase`, `/refinance`, `/home-equity`: content + CTAs
- `/about`: values, team, CTA
- `/contact`: multi-step form navigates, sidebar info correct
- `/apply`: 6-step wizard navigates
- `/utah`, `/utah/weber-county`, `/utah/davis-county`: content, cities, FAQ
- `/privacy`, `/terms`, `/licensing`, `/accessibility`: content renders
- Navigation: all links work, mobile hamburger opens drawer
- Footer: all links work
- Mobile: sticky CTA bar visible, no content hidden behind it

- [ ] **Step 5: Final commit**

```bash
cd "G:/claudefolder/Loandepot-design"
git add -A
git commit -m "feat: add mobile sticky CTA bar and final polish"
```

---

## Post-Implementation Checklist

After all 11 tasks are complete, verify:

- [ ] All pages have unique `<title>` and `<meta name="description">`
- [ ] Schema.org JSON-LD on: homepage (Organization, LocalBusiness), loan options (FAQ), testimonials (Review), county pages (FAQ), breadcrumbs (all pages)
- [ ] Sitemap includes all pages
- [ ] robots.txt blocks `/api/`
- [ ] Mobile responsive at 375px, 768px, 1024px, 1280px
- [ ] Forms submit to API routes (test with browser dev tools network tab)
- [ ] Color contrast passes WCAG AA (navy on white: 8.6:1 ✓, emerald on white: 4.6:1 ✓)
- [ ] All images have alt text
- [ ] Skip-to-content link works
- [ ] No console errors in browser
