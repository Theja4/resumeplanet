alter table public.jobs
  drop constraint if exists jobs_source_provider_check;

alter table public.jobs
  add constraint jobs_source_provider_check
  check (source_provider in ('greenhouse', 'lever', 'remotive', 'manual'));
