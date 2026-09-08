-- Adds MISMO document tracking to the applications table.
-- Run in phpMyAdmin (cPanel -> phpMyAdmin -> select database -> SQL tab).
-- Safe to re-run: each column is guarded by an INFORMATION_SCHEMA check.

SET @tbl = 'applications';

-- mismo_path -----------------------------------------------------------------
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl
       AND COLUMN_NAME = 'mismo_path') > 0,
  'SELECT ''mismo_path already present'' AS note',
  'ALTER TABLE applications ADD COLUMN mismo_path VARCHAR(500) NULL AFTER raw_payload'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- mismo_sha256 ---------------------------------------------------------------
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl
       AND COLUMN_NAME = 'mismo_sha256') > 0,
  'SELECT ''mismo_sha256 already present'' AS note',
  'ALTER TABLE applications ADD COLUMN mismo_sha256 CHAR(64) NULL AFTER mismo_path'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- mismo_status ---------------------------------------------------------------
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl
       AND COLUMN_NAME = 'mismo_status') > 0,
  'SELECT ''mismo_status already present'' AS note',
  'ALTER TABLE applications ADD COLUMN mismo_status ENUM(''pending'',''written'',''failed'',''skipped'') NOT NULL DEFAULT ''pending'' AFTER mismo_sha256'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- mismo_error ----------------------------------------------------------------
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl
       AND COLUMN_NAME = 'mismo_error') > 0,
  'SELECT ''mismo_error already present'' AS note',
  'ALTER TABLE applications ADD COLUMN mismo_error TEXT NULL AFTER mismo_status'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- index on mismo_status ------------------------------------------------------
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl
       AND INDEX_NAME = 'idx_mismo_status') > 0,
  'SELECT ''idx_mismo_status already present'' AS note',
  'ALTER TABLE applications ADD INDEX idx_mismo_status (mismo_status)'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
