-- Migration: Add is_hidden to problems
-- Date: 2026-06-26

ALTER TABLE problems ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
