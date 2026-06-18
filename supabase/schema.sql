-- =============================================
-- Find Reviewer - Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Teams table
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Designations table (with ordering for hierarchy)
CREATE TABLE designations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  designation_id INTEGER REFERENCES designations(id),
  team_id INTEGER REFERENCES teams(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
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
CREATE INDEX idx_users_designation ON users(designation_id);
CREATE INDEX idx_review_counts_user_type ON review_counts(user_id, review_type_id);
CREATE INDEX idx_review_counts_count ON review_counts(count);
CREATE INDEX idx_review_audit_user ON review_audit_log(user_id);
CREATE INDEX idx_review_audit_assigned ON review_audit_log(assigned_at DESC);
CREATE INDEX idx_review_audit_type ON review_audit_log(review_type_id);

-- =============================================
-- Seed Data
-- =============================================
INSERT INTO teams (name) VALUES ('SIMBA'), ('MUFASA');

INSERT INTO designations (name, "order") VALUES
  ('SDE1', 1), ('SDE2', 2), ('SDE3', 3), ('EM', 4), ('ARCH', 5);

INSERT INTO review_types (name) VALUES
  ('PR_REVIEW'), ('SOLUTIONING_REVIEW'), ('GO_LIVE_REVIEW');
