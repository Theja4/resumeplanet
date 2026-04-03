-- Add ats_score column to resumes table for deterministic scoring persistence
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS ats_score integer;
