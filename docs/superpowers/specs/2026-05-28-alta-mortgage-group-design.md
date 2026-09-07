# Alta Mortgage Group Website — Design Specification

**Date:** 2026-05-28
**Domain:** altamortgagegroup.net
**Reference:** loanDepot.com (layout/structure clone, rebranded)
**Target:** G:/claudefolder/Loandepot-design

---

## 1. Overview

Build a complete, production-ready, SEO-optimized mortgage website for Alta Mortgage Group, modeled after loanDepot.com's proven conversion architecture. Light-themed with navy/emerald branding. Focused on Weber and Davis counties in northern Utah.

**Approach:** Pixel-perfect clone of loanDepot's layout structure, rebranded with Alta's identity. Proven conversion patterns from loanDepot; visually distinct brand.

**Phased delivery:**
- **Phase 1:** Homepage, Navigation/Footer, Loan Programs, About, Contact/Lead Capture Form, Full Mortgage Application (/apply/), Mortgage Calculator, Rates page, Utah/county landing pages, API routes (CRM integration + email notifications), full SEO infrastructure.
- **Phase 2:** Learning Center/Blog, First-Time Homebuyer page, Home Search, additional calculators, city-level pages, mobile app section, admin dashboard for submissions.

---

## 2. Brand Identity

### Color Palette

| Role | Token | Hex | Usage |
|------|-------|-----|-------|
| Primary | `--navy` | `#003087` | Headers, primary buttons, nav, trust elements |
| Primary Light | `--navy-light` | `#1a4a9e` | Hover states, secondary headings |
| Primary Dark | `--navy-dark` | `#001f5c` | Footer background, emphasis |
| Accent | `--emerald` | `#00A86B` | CTAs, success states, rate highlights |
| Accent Light | `--emerald-light` | `#00c77b` | Hover states on green elements |
| Background | `--bg` | `#FFFFFF` | Page background |
| Surface | `--surface` | `#F7F8FA` | Card backgrounds, alternate sections |
| Surface Warm | `--surface-warm` | `#F0F4F8` | Hero backgrounds, feature sections |
| Text Primary | `--text` | `#1A1A2E` | Body text, headings |
| Text Secondary | `--text-muted` | `#6B7280` | Captions, descriptions |
| Border | `--border` | `#E5E7EB` | Dividers, card borders |
| Warning | `--warning` | `#F59E0B` | Rate change indicators |
| Error | `--error` | `#EF4444` | Form validation |

### Typography

| Role | Font | Size | Weight |
|------|------|------|--------|
| H1 | Inter | 48px (3rem) | 700 |
| H2 | Inter | 36px (2.25rem) | 700 |
| H3 | Inter | 28px (1.75rem) | 700 |
| H4 | Inter | 22px (1.375rem) | 600 |
| Body | Inter | 16px (1rem) | 400 |
| Body Medium | Inter | 16px (1rem) | 500 |
| Small | Inter | 14px (0.875rem) | 400 |
| Caption | Inter | 12px (0.75rem) | 400 |
| Rate Display | DM Sans | 32-48px | 700 |

### Logo

Wordmark: "Alta Mortgage Group"
- "Alta" in Inter Bold, navy (#003087)
- "Mortgage Group" in Inter Regular, navy-light (#1a4a9e)
- Brand mark: small mountain peak chevron above the "A"
- SVG, scalable, works on white and dark backgrounds

---

## 3. Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS 4
- **Components:** shadcn/ui + Radix UI primitives
- **Charts:** Recharts (for calculator visualizations)
- **Icons:** Lucide React
- **Fonts:** Inter (Google Fonts / next/font), DM Sans (rate displays)
- **SEO:** Next.js metadata API, next-sitemap, schema-dts
- **Forms:** React Hook Form + Zod validation
- **Animation:** Tailwind transitions + CSS keyframes (no heavy animation library)
- **Testing:** Playwright (e2e), Vitest (unit for calculators)

---

## 4. Site Architecture

### URL Structure

```
/                                → Homepage
/purchase/                       → Home Purchase overview
/refinance/                      → Refinance overview
/home-equity/                    → Home Equity / HELOC
/loan-options/                   → All loan programs (FHA, VA, Conventional, Jumbo, USDA)
/mortgage-calculator/            → Interactive calculator (tabbed: Payment, Affordability, Refinance)
/rates/                          → Current rates table
/about/                          → About Alta Mortgage Group
/contact/                        → Contact + Get Pre-Approved form
/first-time-homebuyer/           → First-time buyer resources (Phase 2)
/learning-center/                → Blog index (Phase 2)
/utah/                           → Utah state landing page
/utah/weber-county/              → Weber County landing page
/utah/davis-county/              → Davis County landing page
/utah/ogden/                     → City page (Phase 2)
/utah/layton/                    → City page (Phase 2)
/utah/bountiful/                 → City page (Phase 2)
/apply/                          → Full mortgage application (multi-step 1003-style)
/privacy/                        → Privacy policy
/terms/                          → Terms of service
/licensing/                      → State licensing info
/accessibility/                  → Accessibility statement
/sitemap.xml                     → Auto-generated XML sitemap
/robots.txt                      → Crawl directives
```

### Internal Linking Strategy

- Every page links to `/mortgage-calculator/` and `/contact/`
- Loan program pages cross-link to `/rates/` and `/mortgage-calculator/`
- Utah pages link to relevant loan programs
- Footer contains full site navigation
- Breadcrumbs on all pages (with BreadcrumbList schema)

---

## 5. Page Designs

### 5.1 Homepage

Sections in order (mirroring loanDepot's conversion funnel):

1. **Utility Bar** — Phone: (801) XXX-XXXX, Hours, "Apply Now" link. Navy bg, white text.
2. **Navigation** — White bg, sticky. Logo left. Links: Purchase, Refinance, Home Equity, Loan Options, Rates, Calculator, About. Right side: "Get Pre-Approved" emerald button. Mobile: hamburger menu.
3. **Hero** — Full-width, surface-warm gradient bg. H1: "Your Trusted Utah Mortgage Partner". Subtext: "Helping families in Weber & Davis counties find the right home loan." Two CTAs: "Get Pre-Approved" (emerald, filled) + "Calculate Your Payment" (navy, outline). Right side: subtle Utah mountain landscape illustration (SVG).
4. **Product Cards** — 3-column grid on surface bg. Cards: "Buy a Home" (home icon, description, "Get Started" CTA), "Refinance" (refresh icon, description, "Start Saving" CTA), "Access Your Equity" (wallet icon, description, "Learn More" CTA).
5. **Rate Teaser Banner** — Navy bg, white text. "Today's Rates" with sample 30yr/15yr rates. "See All Rates" link.
6. **Local Expertise Section** — H2: "Proudly Serving Weber & Davis Counties". Left: description of local expertise, list of cities served in two columns. Right: stylized Utah map graphic highlighting Weber/Davis counties.
7. **Tools Grid** — 4-card grid: Mortgage Calculator, Loan Options Guide, First-Time Buyer Resources, Rate Comparison. Each with icon, title, short description, link.
8. **Testimonials Carousel** — 3-card carousel (auto-play, manual nav). Each: star rating, quote, customer name, city (Utah locations). ReviewAggregate schema markup.
9. **Why Choose Alta** — Stats row: "X+ Years Experience", "X+ Loans Closed", "X Utah Cities Served", "5-Star Reviews". Below: trust badges (NMLS, Equal Housing, BBB placeholder).
10. **CTA Section** — Gradient bg (navy→navy-dark). H2: "Ready to Start Your Home Loan Journey?" Inline mini form: Name, Email, Phone, Loan Type dropdown, "Get Started" button.
11. **Footer** — Navy-dark bg (#001f5c). 4-column link grid: Products, Resources, Company, Legal. Below: NMLS# display, Equal Housing Opportunity logo, Utah Division of Real Estate licensing info, copyright, social media icons (Facebook, Instagram, LinkedIn).

### 5.2 Loan Programs / Loan Options Page

- H1: "Mortgage Loan Options"
- Intro paragraph about finding the right loan
- Grid of loan type cards: Conventional, FHA, VA, USDA, Jumbo, Adjustable Rate (ARM), Fixed Rate
- Each card: icon, title, brief description (2-3 sentences), key features list (3-4 bullets), "Learn More" or "Apply Now" CTA
- FAQ section at bottom with FAQPage schema
- Sidebar or bottom CTA: "Not sure which loan is right? Contact us."

### 5.3 Mortgage Calculator Page

- H1: "Mortgage Calculator"
- Tabbed interface with 3 tabs:

**Payment Calculator (default tab):**
- Inputs: Home Price (slider + input, default $400,000), Down Payment (% toggle + $ amount), Loan Term (15/20/30 toggle), Interest Rate (input, default current avg), Property Tax (annual), Home Insurance (annual), HOA (optional)
- Output: Large monthly payment display, pie chart breakdown (P&I, taxes, insurance, HOA), amortization schedule table (expandable, shows year-by-year with option for monthly detail)

**Affordability Calculator:**
- Inputs: Annual Household Income, Monthly Debt Payments, Down Payment Available, Interest Rate, Loan Term
- Output: Maximum home price, comfortable monthly payment, debt-to-income ratio visual

**Refinance Calculator:**
- Inputs: Current Loan Balance, Current Interest Rate, Current Monthly Payment, New Interest Rate, New Loan Term, Closing Costs
- Output: New monthly payment, monthly savings, total savings over loan life, break-even point (months)

All calculators: real-time updates on input change, Recharts visualizations, mobile-optimized sliders, shareable URL with params.

### 5.4 Rates Page

- H1: "Current Mortgage Rates"
- Disclaimer: "Rates as of [date]. Rates are illustrative and subject to change."
- Table: Loan Type | Rate | APR | Points | Monthly Payment (per $100k)
- Loan types: 30yr Fixed, 20yr Fixed, 15yr Fixed, 7/1 ARM, 5/1 ARM, FHA 30yr, VA 30yr, Jumbo 30yr
- Rates are static/configurable data (JSON file) — not a live API feed
- Below table: "Rates updated regularly. Contact us for a personalized quote."
- CTA: "Get Your Personalized Rate" → contact form

### 5.5 About Page

- H1: "About Alta Mortgage Group"
- Company story / mission statement
- Values section (3-4 values with icons)
- "Our Utah Roots" section — connection to Weber/Davis counties
- Team section placeholder (photo, name, title, NMLS#, bio)
- NMLS and licensing info
- CTA: "Work With Us" → contact

### 5.6 Contact / Get Pre-Approved Page

- H1: "Get Pre-Approved" (primary framing as conversion, not just "contact")
- Multi-step form:
  - Step 1: Personal info (name, email, phone)
  - Step 2: Loan details (purchase/refinance/equity, estimated amount, timeline)
  - Step 3: Property info (type, location/zip, first-time buyer yes/no)
  - Step 4: Confirmation + "What happens next" explanation
- Progress bar showing current step
- Sidebar: phone number, email, office address (placeholder), hours, map embed placeholder
- Form validation: Zod schema, real-time field validation, clear error messages
- Success state: confirmation message, expected callback time

### 5.7 Utah Landing Pages

**State page (/utah/):**
- H1: "Utah Mortgage Lender — Alta Mortgage Group"
- Content about Utah housing market, why Alta for Utah homebuyers
- Links to county pages
- Utah-specific loan programs (USDA rural areas, Utah Housing Corp mention)

**County pages (/utah/weber-county/, /utah/davis-county/):**
- H1: "[County] County Mortgage Lender"
- Cities served list with brief descriptions
- Local market stats (median home price placeholders)
- Local expertise content
- FAQ section with county-specific questions
- CTA to contact form

---

## 6. SEO Strategy

### Technical SEO
- Next.js App Router with SSR/SSG per page
- `metadata` export on every page with unique title/description
- Title format: "[Page Topic] | Alta Mortgage Group | Utah Mortgage Lender"
- Canonical URLs on all pages
- XML sitemap auto-generated
- robots.txt allowing all crawlers
- Core Web Vitals optimized: lazy loading images, font-display: swap, minimal JS bundles

### Schema Markup
- **Organization:** Company name, logo, contact info, social profiles
- **LocalBusiness:** Address, service area (Weber/Davis counties), hours
- **MortgageLoan:** On loan program pages
- **FAQPage:** On product pages and county pages
- **BreadcrumbList:** On all pages
- **Review/AggregateRating:** On testimonials

### On-Page SEO
- One H1 per page with primary keyword
- H2/H3 hierarchy for supporting keywords
- Alt text on all images (descriptive + location context)
- Internal links in body content (not just nav)
- 300+ words of unique content per page minimum

### Target Keywords (primary)
- "mortgage lender utah"
- "home loans ogden utah"
- "mortgage rates weber county"
- "refinance davis county utah"
- "first time home buyer utah"
- "FHA loans utah"
- "VA loans ogden"
- "home equity loan layton utah"
- "best mortgage rates [city] utah" (per city)

### Analytics
- Google Analytics 4 placeholder (gtag script ready, ID configurable via env var)
- Google Tag Manager placeholder
- Conversion tracking on form submissions (dataLayer push)

---

## 7. Component Architecture

### Shared Layout
```
src/
├── app/
│   ├── layout.tsx              → Root layout (fonts, metadata, analytics)
│   ├── page.tsx                → Homepage
│   ├── purchase/page.tsx
│   ├── refinance/page.tsx
│   ├── home-equity/page.tsx
│   ├── loan-options/page.tsx
│   ├── mortgage-calculator/page.tsx
│   ├── rates/page.tsx
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   ├── apply/page.tsx              → Full mortgage application
│   ├── utah/
│   │   ├── page.tsx
│   │   ├── weber-county/page.tsx
│   │   └── davis-county/page.tsx
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   ├── licensing/page.tsx
│   ├── accessibility/page.tsx
│   ├── sitemap.ts
│   ├── api/
│   │   ├── leads/route.ts          → Lead capture endpoint
│   │   └── applications/route.ts   → Full application endpoint
│   └── robots.ts
├── components/
│   ├── layout/
│   │   ├── header.tsx          → Utility bar + main nav
│   │   ├── footer.tsx
│   │   ├── mobile-nav.tsx
│   │   └── breadcrumbs.tsx
│   ├── home/
│   │   ├── hero.tsx
│   │   ├── product-cards.tsx
│   │   ├── rate-teaser.tsx
│   │   ├── local-expertise.tsx
│   │   ├── tools-grid.tsx
│   │   ├── testimonials.tsx
│   │   ├── why-alta.tsx
│   │   └── cta-section.tsx
│   ├── calculator/
│   │   ├── payment-calculator.tsx
│   │   ├── affordability-calculator.tsx
│   │   ├── refinance-calculator.tsx
│   │   ├── amortization-table.tsx
│   │   └── calculator-chart.tsx
│   ├── forms/
│   │   ├── pre-approval-form.tsx
│   │   ├── contact-form.tsx
│   │   ├── mini-lead-form.tsx
│   │   └── mortgage-application/
│   │       ├── application-wizard.tsx    → Multi-step wrapper with progress bar
│   │       ├── step-loan-info.tsx
│   │       ├── step-personal-info.tsx
│   │       ├── step-employment.tsx
│   │       ├── step-assets.tsx
│   │       ├── step-declarations.tsx
│   │       └── step-review.tsx
│   ├── ui/                     → shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── slider.tsx
│   │   ├── tabs.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx (mobile nav)
│   │   └── ...etc
│   └── shared/
│       ├── section-heading.tsx
│       ├── cta-button.tsx
│       ├── loan-type-card.tsx
│       ├── testimonial-card.tsx
│       ├── stat-card.tsx
│       └── schema-markup.tsx
├── lib/
│   ├── constants.ts            → Company info, phone, NMLS, cities list
│   ├── calculator-utils.ts     → Mortgage math functions
│   ├── rates-data.ts           → Static rates JSON
│   ├── seo.ts                  → Metadata helpers, schema generators
│   ├── crm.ts                  → altamortgagecrm.net API integration
│   ├── email.ts                → Nodemailer SMTP email notifications
│   ├── db.ts                   → SQLite fallback storage for submissions
│   ├── schemas.ts              → Zod schemas for lead + application validation
│   └── utils.ts                → General utilities
├── styles/
│   └── globals.css             → Tailwind directives, CSS custom properties
└── public/
    ├── images/                 → Illustrations, icons, placeholder photos
    ├── favicon.ico
    └── og-image.png            → Default Open Graph image
```

---

## 8. Lead Capture & Loan Application System

### 8.1 Lead Capture (Quick Form)

Appears in multiple locations: homepage CTA section, floating mobile bar, exit-intent modal, sidebar on content pages, dedicated `/contact/` page.

**Fields:**
- Full Name (required)
- Email (required)
- Phone (required)
- Loan Purpose: Purchase / Refinance / Home Equity / Cash-Out (required)
- Estimated Loan Amount (optional, dropdown ranges)
- Preferred Contact Method: Phone / Email / Text (optional)
- Best Time to Call (optional)

**Behavior:**
- Client-side validation via Zod
- On submit: POST to `/api/leads` → forwards to altamortgagecrm.net API + sends email notification
- Success state: "Thank you! A loan specialist will contact you within 24 hours."
- Error state: Retry prompt with preserved form data
- UTM parameter capture (source, medium, campaign) stored with lead
- Page URL and timestamp captured automatically

### 8.2 Full Mortgage Application (/apply/)

Dedicated page at `/apply/` — multi-step form mirroring a simplified 1003 Uniform Residential Loan Application. 6 steps with progress indicator.

**Step 1 — Loan Information:**
- Loan Purpose (Purchase / Refinance / Home Equity)
- Property Type (Single Family / Condo / Townhome / Multi-Family / Manufactured)
- Property Use (Primary Residence / Second Home / Investment)
- Estimated Purchase Price or Property Value
- Desired Loan Amount
- Down Payment Amount (purchase only)
- Current Loan Balance (refinance only)

**Step 2 — Personal Information:**
- First Name, Middle Name, Last Name, Suffix
- Date of Birth
- SSN (optional, with security notice — stored encrypted)
- Marital Status
- Phone, Email
- Current Address (street, city, state, zip)
- Years at Current Address
- Previous Address (if < 2 years at current)
- Housing Status (Own / Rent / Other)
- Monthly Housing Payment

**Step 3 — Employment & Income:**
- Employment Status (Employed / Self-Employed / Retired / Other)
- Employer Name
- Job Title
- Years in Current Position
- Monthly Gross Income
- Previous Employer (if < 2 years at current)
- Other Income Sources (type + monthly amount, repeatable)

**Step 4 — Assets & Liabilities:**
- Bank Accounts (institution, type, approximate balance — repeatable)
- Monthly Debt Payments:
  - Auto Loans
  - Student Loans
  - Credit Card Minimum Payments
  - Child Support / Alimony
  - Other
- Estimated Credit Score Range (dropdown: Excellent 740+ / Good 700-739 / Fair 660-699 / Below 660 / Not Sure)

**Step 5 — Declarations:**
- Are you a US citizen? (Yes / Permanent Resident / Other)
- Have you had a bankruptcy in the past 7 years?
- Have you had a foreclosure in the past 7 years?
- Are there any outstanding judgments against you?
- Is any part of the down payment borrowed?
- Will you occupy as primary residence?
- Are you a veteran or active military? (triggers VA loan info)
- First-time homebuyer? (triggers FTHB program info)

**Step 6 — Review & Submit:**
- Summary of all entered information (editable — click section to go back)
- Consent checkbox: "I authorize Alta Mortgage Group to verify the information provided and pull a credit report."
- E-signature: typed name + date
- Submit button

**Application Behavior:**
- Progress saved to localStorage between steps (resume if browser closed)
- Each step validates before allowing "Next"
- Back button preserves all data
- On submit: POST to `/api/applications` → forwards to altamortgagecrm.net API + sends email notification with application summary
- SSN field: masked input (***-**-1234), transmitted over HTTPS only, never stored in localStorage, encrypted at rest if stored server-side
- Success state: "Application received! Your reference number is ALT-XXXXX. We'll be in touch within 1 business day."
- PDF generation: server-side generates a PDF summary of the application for email attachment

### 8.3 Backend API Routes

```
/api/leads          POST → Validate → Forward to altamortgagecrm.net → Send email notification → Return success
/api/applications   POST → Validate → Forward to altamortgagecrm.net → Send email notification w/ PDF → Return reference number
/api/admin/leads    GET  → List leads (protected, future admin dashboard)
/api/admin/apps     GET  → List applications (protected, future admin dashboard)
```

**CRM Integration (altamortgagecrm.net):**
- API endpoint URL configurable via environment variable: `CRM_API_URL`
- API key/token configurable via: `CRM_API_KEY`
- Webhook-style POST with JSON payload
- Retry logic: 3 attempts with exponential backoff on failure
- Local SQLite fallback: if CRM is unreachable, store submission locally and queue for retry

**Email Notifications:**
- Configurable via environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NOTIFICATION_EMAIL`
- Lead notification: subject "New Lead — [Name] — [Loan Purpose]", body with all lead fields
- Application notification: subject "New Application — [Name] — ALT-XXXXX", body with summary + PDF attachment
- Uses Nodemailer for SMTP delivery

### 8.4 Data Security

- All forms served over HTTPS only
- SSN encrypted with AES-256 before any storage
- No sensitive data in URL parameters
- CSRF protection on all form endpoints
- Rate limiting on submission endpoints (5 per minute per IP)
- Input sanitization against XSS/injection

---

## 9. Responsive Behavior

- **Mobile-first** approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Max content width: 1280px, centered
- Nav collapses to hamburger at md breakpoint
- Product cards: 1-col mobile → 3-col desktop
- Calculator: full-width inputs on mobile, side-by-side chart on desktop
- Footer: stacked on mobile, 4-col on desktop
- Floating "Get Pre-Approved" sticky bar on mobile (bottom of viewport)

---

## 9. Performance Targets

- Lighthouse Performance: 90+
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- Font loading: `next/font` with `display: swap`
- Images: WebP/AVIF with `next/image`, lazy loaded below fold
- JS bundles: dynamic imports for calculator, minimal client-side JS on static pages

---

## 10. Accessibility

- WCAG 2.1 AA compliance
- Semantic HTML (nav, main, article, section, footer)
- ARIA labels on interactive elements
- Keyboard navigation for all interactive components
- Focus visible indicators (navy ring)
- Color contrast ratios: all text meets 4.5:1 minimum
- Skip-to-content link
- Alt text on all images
- Form labels associated with inputs
- Error messages linked to form fields via aria-describedby

---

## 11. Out of Scope (Phase 2+)

- Blog/Learning Center with CMS
- Individual city pages (Ogden, Layton, Bountiful, etc.)
- Home search tool integration
- Mobile app promotion section
- Live rate API integration
- User accounts / loan portal
- Admin dashboard for viewing leads/applications
- Chat widget
- A/B testing infrastructure
