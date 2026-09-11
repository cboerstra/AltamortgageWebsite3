-- Server-side drafts for the application wizard, so an applicant can resume
-- on another device and be reminded if they stop.
-- Run in phpMyAdmin (cPanel -> phpMyAdmin -> select database -> SQL tab).
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS application_drafts (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- SHA-256 of the resume token, for lookup. The raw token is never stored
  -- in the clear.
  token_hash CHAR(64) NOT NULL UNIQUE,

  -- The token again, AES-256-GCM under DRAFT_LINK_KEY, so the reminder job
  -- can rebuild the resume link. NULL if the key was unset when the draft
  -- was created; such drafts get no reminders.
  token_enc VARCHAR(255) NULL,

  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),

  -- Partial ApplicationFormData. Never contains the SSN.
  data JSON NOT NULL,
  schema_version SMALLINT NOT NULL,
  furthest_step TINYINT NOT NULL DEFAULT 0,

  reminders_sent TINYINT NOT NULL DEFAULT 0,
  last_reminder_at TIMESTAMP NULL,
  opted_out TINYINT(1) NOT NULL DEFAULT 0,

  -- Set when the application is finally submitted. Stops all reminders.
  submitted_ref VARCHAR(20) NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Bumped by applicant activity only. The reminder job writes
  -- updated_at = updated_at explicitly so its own updates do not count.
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_due (opted_out, submitted_ref, reminders_sent, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- If the table was created from an earlier version of this script without
-- token_enc, add it. Guarded so the whole file stays re-runnable.
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'application_drafts'
       AND COLUMN_NAME = 'token_enc') > 0,
  'SELECT ''token_enc already present'' AS note',
  'ALTER TABLE application_drafts ADD COLUMN token_enc VARCHAR(255) NULL AFTER token_hash'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
