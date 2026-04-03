alter table resumes
  add column if not exists ai_insights_signature text,
  add column if not exists ai_insights_cache jsonb,
  add column if not exists ai_insights_cached_at timestamptz;
