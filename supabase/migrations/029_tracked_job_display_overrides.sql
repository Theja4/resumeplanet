alter table public.tracked_jobs
  add column if not exists title_override text,
  add column if not exists company_name_override text,
  add column if not exists location_text_override text;
