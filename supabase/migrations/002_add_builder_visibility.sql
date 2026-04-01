-- Add builder_visibility column to resumes table to safely persist drag-and-drop state, compressed density, and hidden sections
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS builder_visibility jsonb DEFAULT '{}';
