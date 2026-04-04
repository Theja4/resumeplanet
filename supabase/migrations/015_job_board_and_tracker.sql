-- Job board sources, synced jobs, and per-user tracking

create table if not exists public.job_sources (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('greenhouse', 'lever', 'remotive')),
  source_key text not null,
  label text not null,
  is_active boolean not null default true,
  last_synced_at timestamptz,
  last_error text,
  jobs_synced integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, source_key)
);

alter table public.job_sources enable row level security;

drop policy if exists "Job sources are public" on public.job_sources;

create policy "Job sources are public"
  on public.job_sources for select
  using (true);

drop trigger if exists job_sources_updated_at on public.job_sources;

create trigger job_sources_updated_at
  before update on public.job_sources
  for each row execute procedure set_updated_at();

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  source_provider text not null check (source_provider in ('greenhouse', 'lever', 'remotive')),
  source_key text not null,
  external_id text not null,
  slug text not null unique,
  title text not null,
  company_name text not null,
  location_text text not null default 'Location flexible',
  remote_type text not null default 'unknown' check (remote_type in ('remote', 'hybrid', 'on_site', 'unknown')),
  employment_type text,
  salary_text text,
  description_text text not null default '',
  apply_url text not null,
  source_url text,
  company_logo_url text,
  category text,
  tags text[] not null default '{}',
  posted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_provider, source_key, external_id)
);

alter table public.jobs enable row level security;

drop policy if exists "Jobs are public" on public.jobs;

create policy "Jobs are public"
  on public.jobs for select
  using (true);

drop trigger if exists jobs_updated_at on public.jobs;

create trigger jobs_updated_at
  before update on public.jobs
  for each row execute procedure set_updated_at();

create index if not exists jobs_active_posted_idx
  on public.jobs(is_active, posted_at desc nulls last, updated_at desc);

create index if not exists jobs_source_idx
  on public.jobs(source_provider, source_key);

create index if not exists jobs_company_idx
  on public.jobs(company_name);

create index if not exists jobs_remote_idx
  on public.jobs(remote_type);

create table if not exists public.tracked_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  status text not null default 'saved'
    check (status in ('saved', 'applied', 'interviewing', 'offer', 'rejected', 'archived')),
  applied_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);

alter table public.tracked_jobs enable row level security;

drop policy if exists "Users can view own tracked jobs" on public.tracked_jobs;
create policy "Users can view own tracked jobs"
  on public.tracked_jobs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own tracked jobs" on public.tracked_jobs;
create policy "Users can insert own tracked jobs"
  on public.tracked_jobs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own tracked jobs" on public.tracked_jobs;
create policy "Users can update own tracked jobs"
  on public.tracked_jobs for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own tracked jobs" on public.tracked_jobs;
create policy "Users can delete own tracked jobs"
  on public.tracked_jobs for delete
  using (auth.uid() = user_id);

drop trigger if exists tracked_jobs_updated_at on public.tracked_jobs;

create trigger tracked_jobs_updated_at
  before update on public.tracked_jobs
  for each row execute procedure set_updated_at();

create index if not exists tracked_jobs_user_status_idx
  on public.tracked_jobs(user_id, status, updated_at desc);

create index if not exists tracked_jobs_job_idx
  on public.tracked_jobs(job_id);
