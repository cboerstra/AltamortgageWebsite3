# MISMO v3.4 Application Export + Submission Pipeline Hardening

Date: 2026-09-08
Status: Approved

## Problem

The "Apply Now" wizard collects a full 1003-shaped mortgage application, then
discards most of it.

1. **Nothing is persisted.** `insertApplication()` in `src/lib/db.ts` is dead
   code — no caller. `src/lib/email.ts` is dead code. The `applications` table
   in `db/schema.sql` has never received a row.
2. **Most fields are dropped.** Only name/email/phone become CRM columns.
   Everything else is flattened into one free-text activity note. SSN, DOB,
   middle name, suffix, marital status, years at address, previous address,
   housing status and payment, employer, job title, years at job, previous
   employer, other income, bank accounts, and the individual debt lines are
   discarded. Of the five declarations only `veteran` and `firstTimeBuyer`
   survive.
3. **Consent and e-signature are not retained.** `consentAuthorization`,
   `eSignatureName` and `eSignatureDate` are required to submit and then thrown
   away. For a mortgage application this is the most serious gap.
4. **Silent success on total delivery failure.** If `CRM_API_URL`/`CRM_API_KEY`
   are unset, `forwardToCRM` returns `"skipped"` and the route still responds
   `success: true`. The applicant sees "Application Submitted!" and the data is
   gone. The same shape occurs when all three CRM retries fail.
5. **The reference number is never stored**, so an applicant quoting it cannot
   be looked up.
6. **Ref numbers can collide.** `generateRefNumber()` draws 5 chars from a
   32-char alphabet. `applications.ref_number` is `UNIQUE`, so a collision
   throws inside `insertApplication`, which swallows the error and returns
   `null`.
7. **`localStorage` progress has no TTL or schema version.** A half-finished
   form from an older build can be restored into a changed schema.
8. **The notification email dumps `Object.entries`** of the payload, so any new
   schema field auto-leaks into email.
9. **The CRM `/api/website-lead` endpoint sends `Access-Control-Allow-Origin: *`**,
   making the shared key the only guard.

## Goals

- Persist every submitted application in a standards-conformant, durable form.
- Emit a MISMO v3.4 (ULAD/URLA) XML file per application.
- Never report success to an applicant whose data was not durably stored.
- Stop dropping fields on the way to the CRM.

## Non-goals

- SMS consent capture (requires 10DLC disclosure language — separate decision).
- A background retry worker. The schema supports it; not built yet.
- Full XSD validation in CI (the official MISMO XSD is licensed and cannot be
  redistributed in this repo).

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| MISMO version | v3.4 (ULAD/URLA), `MISMOReferenceModelIdentifier="3.4.0322"` | Current standard; what DU and LPA accept. |
| SSN in XML | Masked (`XXX-XX-1234`) | Preserves the existing posture: full SSN never leaves the request handler. No recoverable PII on a shared cPanel disk. |
| File destination | Disk + DB pointer + emailed to loan officer | Three copies, no new infrastructure, survives a CRM outage. |
| Delivery ordering | Durable-first, then best-effort | Success cannot be reported for data that was not stored. |
| XML library | Hand-rolled writer | Small, byte-stable output for golden-file tests, no new dependency. |

## Architecture

### `src/lib/mismo/`

| File | Purpose |
|---|---|
| `xml.ts` | Element builder + escaping. Deterministic output. No I/O. |
| `enums.ts` | Form value to MISMO enumeration lookups. Pure. |
| `map.ts` | `ApplicationFormData` to a normalized deal object. Pure. |
| `build.ts` | Deal object to a v3.4 XML string. Pure. |
| `store.ts` | Atomic write, SHA-256, path resolution. All I/O lives here. |
| `index.ts` | Public surface: `buildMismoXml`, `writeMismoFile`. |

Only `store.ts` touches the filesystem, so `map`/`build` are testable without a
tmpdir and the XML can be generated in contexts that never write it.

### Document structure

```
MESSAGE -> ABOUT_VERSIONS -> DEAL_SETS -> DEAL_SET -> DEALS -> DEAL
  COLLATERALS  -> COLLATERAL -> SUBJECT_PROPERTY (ADDRESS, PROPERTY_DETAIL,
                  PROPERTY_VALUATION)
  LOANS        -> LOAN[SubjectLoan] (TERMS_OF_LOAN, LOAN_DETAIL,
                  LOAN_IDENTIFIERS, REFINANCE?)
  PARTIES      -> PARTY -> INDIVIDUAL (NAME, CONTACT_POINTS)
                  ROLES -> ROLE -> BORROWER (BORROWER_DETAIL,
                  DECLARATION -> DECLARATION_DETAIL, RESIDENCES, EMPLOYERS,
                  CURRENT_INCOME, LIABILITIES) + TAXPAYER_IDENTIFIERS
  RELATIONSHIPS -> xlink arcs Party <-> Loan
EXTENSION -> OTHER -> alta:APPLICATION_METADATA
```

Declarations map to real MISMO elements — `BankruptcyIndicator`,
`PriorPropertyForeclosureCompletedIndicator`, `OutstandingJudgmentsIndicator`,
`BorrowedDownPaymentIndicator`, `IntentToOccupySubjectPropertyIndicator`,
`HomeownerPastThreeYearsType`. Nothing is dropped.

Consent, e-signature, credit score range and the Alta reference number have no
clean home in a DEAL-only v3.4 file. They go in a namespaced `EXTENSION` block
rather than being forced into elements that do not mean that.

### Storage layout

```
<MISMO_STORAGE_DIR>/2026/09/ALT-K7M2Q-20260908T143012Z.xml
```

Defaults to `../storage/mismo` relative to `process.cwd()` — a sibling of the
app directory, never under `public/`, so Passenger cannot serve it. Overridable
via `MISMO_STORAGE_DIR`. A deny-all `.htaccess` is written to the storage root
on first write in case the directory is later relocated under `public_html`.

Writes are atomic: write `.tmp`, `fsync`, `rename`. A crash mid-write cannot
leave a truncated 1003 on disk.

### Schema migration

`db/migrations/2026-09-08-add-mismo-columns.sql`, idempotent via
`INFORMATION_SCHEMA` guards to match the existing "safe to re-run" convention:

```
mismo_path    VARCHAR(500)
mismo_sha256  CHAR(64)
mismo_status  ENUM('pending','written','failed','skipped') DEFAULT 'pending'
mismo_error   TEXT
```

### Rewritten `POST /api/applications`

1. Validate with zod. 400 on failure.
2. Allocate a reference number, retrying on collision against the DB.
3. **Durable phase:** build XML, write atomically, insert the DB row with the
   full payload (SSN stripped), `ssn_last4`, and the MISMO path and hash.
4. **Best-effort phase:** `forwardToCRM` with a complete summary, and
   `sendApplicationNotification` with the `.xml` attached.
5. Record CRM, email and MISMO status on the row.
6. **Response contract:** 200 only if the XML file or the DB row succeeded. If
   every durable sink failed *and* the CRM forward did not land, return 502 and
   the wizard tells the applicant to call.
7. Logs carry the reference number only. Never SSN, never the full payload.

The CRM summary grows to include every field currently dropped: all five
declarations, citizenship, marital status, DOB, housing status and payment, job
title and tenure, individual debt lines, credit range, e-signature name and
date, consent timestamp, and the MISMO filename.

### Supporting fixes

- `email.ts`: attachment support; the `Object.entries` dump replaced with an
  explicit allowlist of fields, and HTML escaping of applicant values, which
  previously went into the notification table unescaped.
- A shared `application-summary.ts` feeds both the CRM note and the email, so
  the two cannot drift apart.
- Wizard `localStorage`: 24-hour TTL and a schema-version key; a visible
  "clear saved progress" control. The storage moves into its own
  `draft-storage.ts` exposing a subscribable store, so the wizard reads it
  during render via `useSyncExternalStore` rather than syncing it into state
  from an effect.
- `.env.example`: rewritten. It claimed the CRM "sends the confirmation email,
  so no SMTP/database config is needed here" — which is why neither was ever
  configured, and therefore why nothing was persisted. That sentence is the
  root cause of defect 1.
- `crm.ts`: correct the stale comments claiming Vercel deployment and claiming
  the CRM sends a confirmation email. It does not.
- `smsConsent: false` stays hardcoded — the form collects no SMS consent, so
  false is the correct value.
- Alta-crm3 `websiteLeads.ts`: CORS allowlist from `WEBSITE_ORIGIN`
  (comma-separated). Falls back to `*` with a warning when unset so an
  un-configured deploy does not break the live site.

## Testing

`vitest` (already the runner in Alta-crm3):

- `map` translation, including every enum branch.
- XML escaping: ampersand, angle brackets, quotes, control characters.
- A golden-file build test over a complete fixture application. Regenerate it
  with `npx vite-node scripts/generate-mismo-golden.ts` and read the diff — a
  silently blessed golden file is worse than none.
- `store` against a tmpdir: atomicity, path shape, hash, `.htaccess` creation.
- Route contract tests for `POST /api/applications`. These are hermetic: with
  `CRM_*`, `SMTP_*` and `DB_*` unset, every outbound path short-circuits to
  "skipped" without touching the network. That is precisely the misconfigured
  production shape that used to answer 200 while dropping the application, so
  the 502 case is asserted directly.

Structure and the golden file are asserted. XSD validation is available as a
follow-on if the licensed schema is supplied locally.
