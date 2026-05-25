-- linkedin_scans
-- One row per scan run by the Rezoomed Chrome extension. Used to power the
-- authenticated /dashboard/linkedin history view and (later) trend
-- analytics. profile_url is stored verbatim so users can spot scans of
-- profiles they were optimizing for clients/candidates, not themselves.

create table if not exists public.linkedin_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_url text not null,
  score integer not null check (score >= 0 and score <= 100),
  sections jsonb not null default '[]'::jsonb,
  scanned_at timestamptz not null default now()
);

create index if not exists linkedin_scans_user_scanned_at_idx
  on public.linkedin_scans (user_id, scanned_at desc);

alter table public.linkedin_scans enable row level security;

-- Users can read their own scans. Inserts go through the service-role key
-- from /api/extension/scan, which bypasses RLS — so no insert policy.
create policy "linkedin_scans_owner_select"
  on public.linkedin_scans
  for select
  using (auth.uid() = user_id);
