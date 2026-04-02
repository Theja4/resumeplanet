-- Add template_config column to resumes table

ALTER TABLE resumes
ADD COLUMN template_config JSONB;

-- Backfill existing resumes with default Modern Minimal preset
UPDATE resumes
SET template_config = '{
  "layout": "single-column",
  "headerStyle": "minimal",
  "bulletStyle": "plain",
  "accentColor": "#4F46E5",
  "fontFamily": "Inter, ui-sans-serif, system-ui, sans-serif",
  "density": "relaxed"
}'::jsonb
WHERE template_config IS NULL;
