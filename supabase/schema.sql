-- =============================================
-- Find Reviewer - Database Schema (fresh install)
-- Run this in Supabase SQL Editor on an empty project.
-- For an existing deployment, run supabase/migrations/* instead.
-- =============================================

-- Teams table
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviewer types lookup (PRIMARY_REVIEWER / SECONDARY_REVIEWER)
CREATE TABLE reviewer_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (no designation column)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  team_id INTEGER REFERENCES teams(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Many-to-many: a user can be primary, secondary, or both
CREATE TABLE user_reviewer_types (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewer_type_id INTEGER NOT NULL REFERENCES reviewer_types(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, reviewer_type_id)
);

-- Review types table
CREATE TABLE review_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review count table (tracks how many of each review type a user has done)
CREATE TABLE review_counts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  review_type_id INTEGER REFERENCES review_types(id) ON DELETE CASCADE,
  count INTEGER DEFAULT 0,
  UNIQUE(user_id, review_type_id)
);

-- Review audit log (full history of review assignments)
CREATE TABLE review_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  review_type_id INTEGER REFERENCES review_types(id) ON DELETE CASCADE,
  link TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_users_team ON users(team_id);
CREATE INDEX idx_user_reviewer_types_user ON user_reviewer_types(user_id);
CREATE INDEX idx_user_reviewer_types_type ON user_reviewer_types(reviewer_type_id);
CREATE INDEX idx_review_counts_user_type ON review_counts(user_id, review_type_id);
CREATE INDEX idx_review_counts_count ON review_counts(count);
CREATE INDEX idx_review_audit_user ON review_audit_log(user_id);
CREATE INDEX idx_review_audit_assigned ON review_audit_log(assigned_at DESC);
CREATE INDEX idx_review_audit_type ON review_audit_log(review_type_id);

-- =============================================
-- Seed Data
-- =============================================
INSERT INTO teams (name) VALUES ('SIMBA'), ('MUFASA');

INSERT INTO reviewer_types (name) VALUES
  ('PRIMARY_REVIEWER'), ('SECONDARY_REVIEWER');

INSERT INTO review_types (name) VALUES
  ('PR_REVIEW'), ('SOLUTIONING_REVIEW'), ('GO_LIVE_REVIEW');
