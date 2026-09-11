-- Alta Mortgage Group — database schema
-- Run this in phpMyAdmin (cPanel → phpMyAdmin → select your database → SQL tab).
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS.

-- ============================================================================
-- LEADS — captures from /api/leads (mini lead form + pre-approval form)
-- ============================================================================
CREATE TABLE IF NOT EXISTS leads (
  id INT AUTO_INCREMENT PRIMARY KEY,

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
  utm JSON,
  raw_payload JSON,

  -- Delivery status
  crm_status ENUM('pending','sent','failed','skipped') NOT NULL DEFAULT 'pending',
  crm_response TEXT,
  email_status ENUM('pending','sent','failed','skipped') NOT NULL DEFAULT 'pending',
  email_error TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_created_at (created_at),
  INDEX idx_crm_status (crm_status),
  INDEX idx_email_status (email_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- APPLICATIONS — captures from /api/applications (6-step mortgage wizard)
-- ============================================================================
-- IMPORTANT: We store ONLY the last 4 digits of the SSN. The full SSN never
-- touches the database. It is forwarded to the CRM webhook over HTTPS only.
CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ref_number VARCHAR(20) NOT NULL UNIQUE,

  -- Loan info
  loan_purpose VARCHAR(50) NOT NULL,
  property_type VARCHAR(50),
  property_use VARCHAR(50),
  purchase_price DECIMAL(15, 2),
  loan_amount DECIMAL(15, 2),
  down_payment DECIMAL(15, 2),
  current_balance DECIMAL(15, 2),

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
  years_at_address DECIMAL(5, 2),
  housing_status VARCHAR(20),
  monthly_housing_payment DECIMAL(15, 2),

  -- Employment & income
  employment_status VARCHAR(50),
  employer_name VARCHAR(255),
  job_title VARCHAR(255),
  years_at_job DECIMAL(5, 2),
  monthly_income DECIMAL(15, 2),

  -- Credit & declarations
  credit_score_range VARCHAR(20),
  us_citizen VARCHAR(50),
  veteran TINYINT(1),
  first_time_buyer TINYINT(1),

  -- Full payload (everything except SSN, for completeness)
  raw_payload JSON NOT NULL,

  -- MISMO v3.4 document generated for this application.
  -- mismo_path is relative to MISMO_STORAGE_DIR, not an absolute path.
  mismo_path VARCHAR(500),
  mismo_sha256 CHAR(64),
  mismo_status ENUM('pending','written','failed','skipped') NOT NULL DEFAULT 'pending',
  mismo_error TEXT,

  -- Delivery status
  crm_status ENUM('pending','sent','failed','skipped') NOT NULL DEFAULT 'pending',
  crm_response TEXT,
  email_status ENUM('pending','sent','failed','skipped') NOT NULL DEFAULT 'pending',
  email_error TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_ref_number (ref_number),
  INDEX idx_email (email),
  INDEX idx_created_at (created_at),
  INDEX idx_crm_status (crm_status),
  INDEX idx_email_status (email_status),
  INDEX idx_mismo_status (mismo_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- APPLICATION DRAFTS — server-side saves from the wizard, so an applicant can
-- resume on another device and be reminded if they stop.
-- ============================================================================
-- token_hash is the SHA-256 of the resume token and is the only lookup key.
-- token_enc is the same token encrypted under DRAFT_LINK_KEY so the reminder
-- job can rebuild the link; it is NULL if the key was unset at creation.
-- data never contains the SSN.
CREATE TABLE IF NOT EXISTS application_drafts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token_hash CHAR(64) NOT NULL UNIQUE,
  token_enc VARCHAR(255) NULL,

  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),

  data JSON NOT NULL,
  schema_version SMALLINT NOT NULL,
  furthest_step TINYINT NOT NULL DEFAULT 0,

  reminders_sent TINYINT NOT NULL DEFAULT 0,
  last_reminder_at TIMESTAMP NULL,
  opted_out TINYINT(1) NOT NULL DEFAULT 0,
  submitted_ref VARCHAR(20) NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_due (opted_out, submitted_ref, reminders_sent, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
