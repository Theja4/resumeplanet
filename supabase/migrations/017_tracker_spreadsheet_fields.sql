alter table public.tracked_jobs
  add column if not exists salary_text text,
  add column if not exists job_description text,
  add column if not exists excitement_rating integer,
  add column if not exists saved_on date;

alter table public.tracked_jobs
  drop constraint if exists tracked_jobs_excitement_rating_check;

alter table public.tracked_jobs
  add constraint tracked_jobs_excitement_rating_check
  check (excitement_rating is null or excitement_rating between 1 and 5);

update public.tracked_jobs
set saved_on = coalesce(saved_on, created_at::date)
where saved_on is null;

create index if not exists tracked_jobs_user_saved_on_idx
  on public.tracked_jobs(user_id, saved_on desc nulls last, updated_at desc);
