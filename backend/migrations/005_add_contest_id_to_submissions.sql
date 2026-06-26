-- Migration: Add contest_id to submissions
-- Date: 2026-06-26

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS contest_id UUID REFERENCES contests(id) ON DELETE SET NULL;
