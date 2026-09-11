// Postgres connection pool + helpers for persisting leads and applications.
//
// The site deploys to Vercel; the database is Neon Postgres provisioned from
// the Vercel Storage tab, which injects DATABASE_URL into the project. Any
// Postgres reachable by URL works the same way.
//
// If no URL is configured, every helper no-ops and returns null. The site
// keeps working during setup — applications still go to Blob storage and the
// CRM — but nothing can be looked up by reference number until this is set.

import { Pool, type QueryResultRow } from "pg";

let pool: Pool | null = null;
let configWarned = false;

/**
 * Neon's Vercel integration sets several variants. Prefer the pooled one:
 * serverless functions open many short-lived connections, and PgBouncer in
 * front of Neon absorbs that far better than the direct endpoint.
 */
function connectionString(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    undefined
  );
}

export function isDbConfigured(): boolean {
  return Boolean(connectionString());
}

export function getPool(): Pool | null {
  if (pool) return pool;

  const url = connectionString();
  if (!url) {
    if (!configWarned) {
      console.warn("Database not configured (DATABASE_URL missing). Skipping persistence.");
      configWarned = true;
    }
    return null;
  }

  pool = new Pool({
    connectionString: url,
    // Each Vercel function instance gets its own pool; keep it small so a
    // burst of invocations does not exhaust Neon's connection limit.
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    ssl: url.includes("localhost") || url.includes("127.0.0.1") ? undefined : { rejectUnauthorized: true },
  });

  return pool;
}

/** Thin wrapper so callers never touch the pool directly. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<{ rows: T[]; rowCount: number } | null> {
  const p = getPool();
  if (!p) return null;
  const result = await p.query<T>(text, params);
  return { rows: result.rows, rowCount: result.rowCount ?? 0 };
}

export interface LeadRecord {
  name: string;
  email: string;
  phone: string;
  loanPurpose: string;
  estimatedAmount?: string;
  preferredContact?: string;
  bestTimeToCall?: string;
  propertyType?: string;
  propertyZip?: string;
  firstTimeBuyer?: string;
  timeline?: string;
  source?: string;
  utm?: Record<string, string>;
  rawPayload: Record<string, unknown>;
}

export interface ApplicationRecord {
  refNumber: string;
  loanPurpose: string;
  propertyType?: string;
  propertyUse?: string;
  purchasePrice?: number;
  loanAmount?: number;
  downPayment?: number;
  currentBalance?: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  dateOfBirth?: string;
  ssnLast4?: string;
  maritalStatus?: string;
  phone?: string;
  email: string;
  currentStreet?: string;
  currentCity?: string;
  currentState?: string;
  currentZip?: string;
  yearsAtAddress?: number;
  housingStatus?: string;
  monthlyHousingPayment?: number;
  employmentStatus?: string;
  employerName?: string;
  jobTitle?: string;
  yearsAtJob?: number;
  monthlyIncome?: number;
  creditScoreRange?: string;
  usCitizen?: string;
  veteran?: boolean;
  firstTimeBuyer?: boolean;
  rawPayload: Record<string, unknown>;
  /** Storage key of the generated MISMO document (Blob pathname in production). */
  mismoPath?: string;
  mismoSha256?: string;
  mismoStatus?: MismoStatus;
  mismoError?: string;
}

export type MismoStatus = "pending" | "written" | "failed" | "skipped";

/**
 * Insert a lead row. Returns the new lead id, or null if DB not configured.
 */
export async function insertLead(lead: LeadRecord): Promise<number | null> {
  const p = getPool();
  if (!p) return null;

  try {
    const result = await p.query<{ id: number }>(
      `INSERT INTO leads (
        name, email, phone, loan_purpose, estimated_amount,
        preferred_contact, best_time_to_call, property_type,
        property_zip, first_time_buyer, timeline, source, utm, raw_payload
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id`,
      [
        lead.name,
        lead.email,
        lead.phone,
        lead.loanPurpose,
        lead.estimatedAmount || null,
        lead.preferredContact || null,
        lead.bestTimeToCall || null,
        lead.propertyType || null,
        lead.propertyZip || null,
        lead.firstTimeBuyer || null,
        lead.timeline || null,
        lead.source || null,
        lead.utm ? JSON.stringify(lead.utm) : null,
        JSON.stringify(lead.rawPayload),
      ]
    );
    return result.rows[0]?.id ?? null;
  } catch (err) {
    console.error("insertLead error:", err);
    return null;
  }
}

/**
 * Insert an application row. Returns the new id, or null if DB not configured.
 */
export async function insertApplication(app: ApplicationRecord): Promise<number | null> {
  const p = getPool();
  if (!p) return null;

  try {
    const result = await p.query<{ id: number }>(
      `INSERT INTO applications (
        ref_number, loan_purpose, property_type, property_use,
        purchase_price, loan_amount, down_payment, current_balance,
        first_name, middle_name, last_name, suffix, date_of_birth,
        ssn_last4, marital_status, phone, email,
        current_street, current_city, current_state, current_zip,
        years_at_address, housing_status, monthly_housing_payment,
        employment_status, employer_name, job_title, years_at_job,
        monthly_income, credit_score_range, us_citizen, veteran,
        first_time_buyer, raw_payload,
        mismo_path, mismo_sha256, mismo_status, mismo_error
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38
      )
      RETURNING id`,
      [
        app.refNumber,
        app.loanPurpose,
        app.propertyType || null,
        app.propertyUse || null,
        app.purchasePrice ?? null,
        app.loanAmount ?? null,
        app.downPayment ?? null,
        app.currentBalance ?? null,
        app.firstName,
        app.middleName || null,
        app.lastName,
        app.suffix || null,
        app.dateOfBirth || null,
        app.ssnLast4 || null,
        app.maritalStatus || null,
        app.phone || null,
        app.email,
        app.currentStreet || null,
        app.currentCity || null,
        app.currentState || null,
        app.currentZip || null,
        app.yearsAtAddress ?? null,
        app.housingStatus || null,
        app.monthlyHousingPayment ?? null,
        app.employmentStatus || null,
        app.employerName || null,
        app.jobTitle || null,
        app.yearsAtJob ?? null,
        app.monthlyIncome ?? null,
        app.creditScoreRange || null,
        app.usCitizen || null,
        app.veteran ?? false,
        app.firstTimeBuyer ?? false,
        JSON.stringify(app.rawPayload),
        app.mismoPath || null,
        app.mismoSha256 || null,
        app.mismoStatus || "pending",
        app.mismoError || null,
      ]
    );
    return result.rows[0]?.id ?? null;
  } catch (err) {
    console.error("insertApplication error:", err);
    return null;
  }
}

/**
 * Whether a reference number is already taken.
 *
 * Returns false when the database is not configured — there is nothing to
 * collide with, and the caller must not block a submission on an optional
 * dependency being absent.
 */
export async function refNumberExists(refNumber: string): Promise<boolean> {
  const p = getPool();
  if (!p) return false;

  try {
    const result = await p.query(
      "SELECT 1 FROM applications WHERE ref_number = $1 LIMIT 1",
      [refNumber]
    );
    return (result.rowCount ?? 0) > 0;
  } catch (err) {
    console.error("refNumberExists error:", err);
    return false;
  }
}

export type DeliveryStatus = "pending" | "sent" | "failed" | "skipped";

/**
 * Update the CRM + email delivery status on an existing row.
 *
 * The MISMO columns exist only on `applications`, so they are updated only
 * when a status is supplied.
 */
export async function updateDeliveryStatus(
  table: "leads" | "applications",
  id: number,
  crm: { status: DeliveryStatus; response?: string },
  email: { status: DeliveryStatus; error?: string },
  mismo?: { status: MismoStatus; path?: string; sha256?: string; error?: string }
): Promise<void> {
  const p = getPool();
  if (!p) return;

  const columns = ["crm_status = $1", "crm_response = $2", "email_status = $3", "email_error = $4"];
  const values: (string | number | null)[] = [
    crm.status,
    crm.response || null,
    email.status,
    email.error || null,
  ];

  if (mismo && table === "applications") {
    columns.push("mismo_status = $5", "mismo_path = $6", "mismo_sha256 = $7", "mismo_error = $8");
    values.push(mismo.status, mismo.path || null, mismo.sha256 || null, mismo.error || null);
  }
  values.push(id);

  try {
    await p.query(
      `UPDATE ${table} SET ${columns.join(", ")} WHERE id = $${values.length}`,
      values
    );
  } catch (err) {
    console.error(`updateDeliveryStatus(${table}, ${id}) error:`, err);
  }
}
