-- Alta Mortgage Group — database schema (Postgres)
--
-- Run once against the Neon database provisioned from the Vercel Storage tab:
--   Vercel → Storage → your Neon database → "Open in Neon" → SQL Editor → paste → Run
-- or from a terminal with the connection string from the same page:
--   psql "$DATABASE_URL" -f db/schema.sql
--
-- Safe to re-run: every statement is IF NOT EXISTS.

-- ============================================================================
-- LEADS — captures from /api/leads (mini lead form + pre-approval form)
-- ============================================================================
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,

  -- Lead info
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  loan_purpose VARCHAR(50) NOT NULL,
  estimated_amount VARCHAR(50),
  preferred_contact VARCHAR(20),
  best_time_to_call VARCHAR(100),

  -- Optional pre-approval fields
  property_type VARCHAR(50),
  property_zip VARCHAR(10),
  first_time_buyer VARCHAR(10),
  timeline VARCHAR(50),

  -- Tracking
  source VARCHAR(255),
  utm JSONB,
  raw_payload JSONB,

  -- Delivery status
  crm_status VARCHAR(10) NOT NULL DEFAULT 'pending'
    CHECK (crm_status IN ('pending','sent','failed','skipped')),
  crm_response TEXT,
  email_status VARCHAR(10) NOT NULL DEFAULT 'pending'
    CHECK (email_status IN ('pending','sent','failed','skipped')),
  email_error TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at);
CREATE INDEX IF NOT EXISTS idx_leads_crm_status ON leads (crm_status);
CREATE INDEX IF NOT EXISTS idx_leads_email_status ON leads (email_status);

-- ============================================================================
-- APPLICATIONS — captures from /api/applications (6-step mortgage wizard)
-- ============================================================================
-- IMPORTANT: We store ONLY the last 4 digits of the SSN. The full SSN never
-- touches the database, Blob storage, or any email.
CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  ref_number VARCHAR(20) NOT NULL UNIQUE,

  -- Loan info
  loan_purpose VARCHAR(50) NOT NULL,
  property_type VARCHAR(50),
  property_use VARCHAR(50),
  purchase_price NUMERIC(15, 2),
  loan_amount NUMERIC(15, 2),
  down_payment NUMERIC(15, 2),
  current_balance NUMERIC(15, 2),

  -- Personal info
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  suffix VARCHAR(10),
  date_of_birth VARCHAR(20),
  ssn_last4 VARCHAR(4),
  marital_status VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(255) NOT NULL,

  -- Address
  current_street VARCHAR(255),
  current_city VARCHAR(100),
  current_state VARCHAR(50),
  current_zip VARCHAR(20),
  years_at_address NUMERIC(5, 2),
  housing_status VARCHAR(20),
  monthly_housing_payment NUMERIC(15, 2),

  -- Employment & income
  employment_status VARCHAR(50),
  employer_name VARCHAR(255),
  job_title VARCHAR(255),
  years_at_job NUMERIC(5, 2),
  monthly_income NUMERIC(15, 2),

  -- Credit & declarations
  credit_score_range VARCHAR(20),
  us_citizen VARCHAR(50),
  veteran BOOLEAN NOT NULL DEFAULT FALSE,
  first_time_buyer BOOLEAN NOT NULL DEFAULT FALSE,

  -- Full payload (everything except SSN, for completeness)
  raw_payload JSONB NOT NULL,

  -- MISMO v3.4 document generated for this application.
  -- mismo_path is the Vercel Blob pathname (private access), e.g.
  -- mismo/2026/09/ALT-K7M2Q-20260908T143012Z.xml
  mismo_path VARCHAR(500),
  mismo_sha256 CHAR(64),
  mismo_status VARCHAR(10) NOT NULL DEFAULT 'pending'
    CHECK (mismo_status IN ('pending','written','failed','skipped')),
  mismo_error TEXT,

  -- Delivery status
  crm_status VARCHAR(10) NOT NULL DEFAULT 'pending'
    CHECK (crm_status IN ('pending','sent','failed','skipped')),
  crm_response TEXT,
  email_status VARCHAR(10) NOT NULL DEFAULT 'pending'
    CHECK (email_status IN ('pending','sent','failed','skipped')),
  email_error TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_email ON applications (email);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications (created_at);
CREATE INDEX IF NOT EXISTS idx_applications_crm_status ON applications (crm_status);
CREATE INDEX IF NOT EXISTS idx_applications_email_status ON applications (email_status);
CREATE INDEX IF NOT EXISTS idx_applications_mismo_status ON applications (mismo_status);

-- ============================================================================
-- APPLICATION DRAFTS — server-side saves from the wizard, so an applicant can
-- resume on another device and be reminded if they stop.
-- ============================================================================
-- token_hash is the SHA-256 of the resume token and is the only lookup key.
-- token_enc is the same token encrypted under DRAFT_LINK_KEY so the reminder
-- job can rebuild the link; it is NULL if the key was unset at creation.
-- data never contains the SSN.
-- updated_at means "the applicant last touched this". The app sets it on
-- every applicant write; the reminder job never does.
CREATE TABLE IF NOT EXISTS application_drafts (
  id SERIAL PRIMARY KEY,
  token_hash CHAR(64) NOT NULL UNIQUE,
  token_enc VARCHAR(255),

  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),

  data JSONB NOT NULL,
  schema_version SMALLINT NOT NULL,
  furthest_step SMALLINT NOT NULL DEFAULT 0,

  reminders_sent SMALLINT NOT NULL DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  opted_out BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_ref VARCHAR(20),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drafts_email ON application_drafts (email);
-- Shaped for the one query the reminder job runs.
CREATE INDEX IF NOT EXISTS idx_drafts_due
  ON application_drafts (opted_out, submitted_ref, reminders_sent, updated_at);

-- ============================================================================
-- BORROWER PORTAL — sign-in by emailed one-time code, and the document vault.
-- ============================================================================
-- A borrower is anyone who has submitted an application or started a draft.
-- Rows are created on first successful sign-in; applications and drafts are
-- matched by lowercased email.
CREATE TABLE IF NOT EXISTS borrowers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- One-time sign-in codes. Only the SHA-256 of the code is stored.
CREATE TABLE IF NOT EXISTS borrower_login_codes (
  id SERIAL PRIMARY KEY,
  borrower_id INT NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
  code_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  attempts SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_login_codes_borrower ON borrower_login_codes (borrower_id, created_at);

-- Sessions. The cookie carries a random token; only its SHA-256 is stored.
CREATE TABLE IF NOT EXISTS borrower_sessions (
  id SERIAL PRIMARY KEY,
  borrower_id INT NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Uploaded documents. Bytes live in private Vercel Blob, encrypted under
-- DOCUMENT_ENCRYPTION_KEY, in chunks (see borrower_document_parts). sha256 is
-- of the plaintext, computed server-side as the parts arrive.
CREATE TABLE IF NOT EXISTS borrower_documents (
  id SERIAL PRIMARY KEY,
  borrower_id INT NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
  slot VARCHAR(20) NOT NULL
    CHECK (slot IN ('bank_statement','w2','paystub','tax_return','other')),
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  byte_size INT NOT NULL,
  sha256 CHAR(64),
  part_count SMALLINT NOT NULL DEFAULT 0,
  status VARCHAR(10) NOT NULL DEFAULT 'uploading'
    CHECK (status IN ('uploading','available','deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_documents_borrower ON borrower_documents (borrower_id, status);

CREATE TABLE IF NOT EXISTS borrower_document_parts (
  document_id INT NOT NULL REFERENCES borrower_documents(id) ON DELETE CASCADE,
  part_index SMALLINT NOT NULL,
  blob_pathname VARCHAR(500) NOT NULL,
  cipher_bytes INT NOT NULL,
  PRIMARY KEY (document_id, part_index)
);
