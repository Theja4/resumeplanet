-- ─────────────────────────────────────────────────────────────────────────────
-- ResumAI — Initial Schema Migration
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── PROFILES ────────────────────────────────────────────────────────────────
-- One row per user. Mirrors auth.users and holds plan/billing state.

create table if not exists profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  email                  text not null,
  full_name              text,
  avatar_url             text,
  plan                   text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id     text,
  stripe_subscription_id text,
  subscription_status    text,
  ats_scans_today        integer not null default 0,
  ats_scans_reset_at     timestamptz not null default now(),
  created_at             timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);


-- ─── AUTO-CREATE PROFILE ON SIGN-UP ─────────────────────────────────────────
-- Fires after a new row is inserted into auth.users (Google OAuth, email, etc.)

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ─── RESUMES ─────────────────────────────────────────────────────────────────
-- Uploaded resume files and their parsed structured data.

create table if not exists resumes (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  title             text not null,
  raw_text          text,
  parsed_data       jsonb,
  original_file_url text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table resumes enable row level security;

create policy "Users can view own resumes"
  on resumes for select
  using (auth.uid() = user_id);

create policy "Users can insert own resumes"
  on resumes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own resumes"
  on resumes for update
  using (auth.uid() = user_id);

create policy "Users can delete own resumes"
  on resumes for delete
  using (auth.uid() = user_id);

-- Keep updated_at current on every update
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger resumes_updated_at
  before update on resumes
  for each row execute procedure set_updated_at();

create index if not exists resumes_user_id_idx on resumes(user_id);


-- ─── ATS SCORES ──────────────────────────────────────────────────────────────
-- Results of ATS analysis runs (scored + suggestion data).

create table if not exists ats_scores (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references profiles(id) on delete cascade,
  resume_id             uuid references resumes(id) on delete set null,
  job_description       text,
  score                 integer not null check (score >= 0 and score <= 100),
  missing_keywords      text[] not null default '{}',
  suggestions           jsonb not null default '[]',
  optimised_resume_text text,
  created_at            timestamptz not null default now()
);

alter table ats_scores enable row level security;

create policy "Users can view own ATS scores"
  on ats_scores for select
  using (auth.uid() = user_id);

create policy "Users can insert own ATS scores"
  on ats_scores for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own ATS scores"
  on ats_scores for delete
  using (auth.uid() = user_id);

create index if not exists ats_scores_resume_id_idx on ats_scores(resume_id);
create index if not exists ats_scores_user_id_idx on ats_scores(user_id);


-- ─── ORDERS ──────────────────────────────────────────────────────────────────
-- Professional resume writing orders (paid via Stripe).

create table if not exists orders (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references profiles(id) on delete cascade,
  resume_id                 uuid references resumes(id) on delete set null,
  stripe_payment_intent_id  text,
  stripe_session_id         text,
  amount                    integer not null,
  status                    text not null default 'pending'
                              check (status in ('pending', 'paid', 'in_progress', 'delivered')),
  job_title                 text,
  job_description           text,
  additional_notes          text,
  delivered_file_url        text,
  created_at                timestamptz not null default now()
);

alter table orders enable row level security;

create policy "Users can view own orders"
  on orders for select
  using (auth.uid() = user_id);

create policy "Users can insert own orders"
  on orders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own orders"
  on orders for update
  using (auth.uid() = user_id);

create index if not exists orders_user_id_idx on orders(user_id);
