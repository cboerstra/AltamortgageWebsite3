// MySQL connection pool + helpers for persisting leads and applications.
// Reads connection config from environment variables.
//
// If DB_HOST is missing, the helpers no-op and return null. This lets the
// site work without a database during early setup — leads still go to CRM
// and email, but persistence is skipped.

import mysql, { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";

let pool: Pool | null = null;
let configWarned = false;

export function isDbConfigured(): boolean {
  return Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);
}

function getPool(): Pool | null {
  if (pool) return pool;

  if (!isDbConfigured()) {
    if (!configWarned) {
      console.warn("Database not configured (DB_HOST/DB_USER/DB_NAME missing). Skipping persistence.");
      configWarned = true;
    }
    return null;
  }

  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
  });

  return pool;
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
  /** Path to the generated MISMO document, relative to MISMO_STORAGE_DIR. */
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
    const [result] = await p.execute<ResultSetHeader>(
      `INSERT INTO leads (
        name, email, phone, loan_purpose, estimated_amount,
        preferred_contact, best_time_to_call, property_type,
        property_zip, first_time_buyer, timeline, source, utm, raw_payload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    return result.insertId;
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
    const [result] = await p.execute<ResultSetHeader>(
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        app.veteran ? 1 : 0,
        app.firstTimeBuyer ? 1 : 0,
        JSON.stringify(app.rawPayload),
        app.mismoPath || null,
        app.mismoSha256 || null,
        app.mismoStatus || "pending",
        app.mismoError || null,
      ]
    );
    return result.insertId;
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
    const [rows] = await p.execute<RowDataPacket[]>(
      "SELECT 1 FROM applications WHERE ref_number = ? LIMIT 1",
      [refNumber]
    );
    return rows.length > 0;
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

  const columns = ["crm_status = ?", "crm_response = ?", "email_status = ?", "email_error = ?"];
  const values: (string | number | null)[] = [
    crm.status,
    crm.response || null,
    email.status,
    email.error || null,
  ];

  if (mismo && table === "applications") {
    columns.push("mismo_status = ?", "mismo_path = ?", "mismo_sha256 = ?", "mismo_error = ?");
    values.push(mismo.status, mismo.path || null, mismo.sha256 || null, mismo.error || null);
  }
  values.push(id);

  try {
    await p.execute(`UPDATE ${table} SET ${columns.join(", ")} WHERE id = ?`, values);
  } catch (err) {
    console.error(`updateDeliveryStatus(${table}, ${id}) error:`, err);
  }
}
