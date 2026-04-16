alter table public.resumes
  add column if not exists parse_selected_source text,
  add column if not exists parse_selected_score integer,
  add column if not exists parse_selected_issues text[],
  add column if not exists parse_fast_score integer,
  add column if not exists parse_client_score integer,
  add column if not exists parse_repair_score integer,
  add column if not exists parse_repair_attempted boolean not null default false,
  add column if not exists parse_source_text_length integer;
