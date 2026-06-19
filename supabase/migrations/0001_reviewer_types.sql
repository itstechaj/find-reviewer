-- =============================================
-- Migration 0001 — replace designations with reviewer_types
-- Safe to run on an existing prod database. Preserves users and review history.
-- =============================================

BEGIN;

-- 1. Create reviewer_types lookup
CREATE TABLE IF NOT EXISTS reviewer_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO reviewer_types (name)
VALUES ('PRIMARY_REVIEWER'), ('SECONDARY_REVIEWER')
ON CONFLICT (name) DO NOTHING;

-- 2. Create the junction table
CREATE TABLE IF NOT EXISTS user_reviewer_types (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewer_type_id INTEGER NOT NULL REFERENCES reviewer_types(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, reviewer_type_id)
);

CREATE INDEX IF NOT EXISTS idx_user_reviewer_types_user ON user_reviewer_types(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reviewer_types_type ON user_reviewer_types(reviewer_type_id);

-- 3. Default every existing user to PRIMARY_REVIEWER
INSERT INTO user_reviewer_types (user_id, reviewer_type_id)
SELECT u.id, rt.id
FROM users u
CROSS JOIN reviewer_types rt
WHERE rt.name = 'PRIMARY_REVIEWER'
ON CONFLICT DO NOTHING;

-- 4. Drop the old designation linkage and indexes
DROP INDEX IF EXISTS idx_users_designation;
ALTER TABLE users DROP COLUMN IF EXISTS designation_id;
DROP TABLE IF EXISTS designations;

COMMIT;
