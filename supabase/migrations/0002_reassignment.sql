-- =============================================
-- Migration 0002 — reassignment + requester tracking
-- Adds requester_email, previous_user_id, reassigned_at to review_audit_log.
-- Backfills are not attempted; old rows simply have NULLs in the new columns.
-- =============================================

BEGIN;

ALTER TABLE review_audit_log
  ADD COLUMN IF NOT EXISTS requester_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS previous_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reassigned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_review_audit_requester ON review_audit_log(requester_email);
CREATE INDEX IF NOT EXISTS idx_review_audit_previous_user ON review_audit_log(previous_user_id);

COMMIT;
