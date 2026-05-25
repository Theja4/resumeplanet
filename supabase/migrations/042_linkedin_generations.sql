-- linkedin_generations
-- Metadata-only log for the LinkedIn LLM rewrite feature. We intentionally
-- do NOT store profile content here (compliance + the brief's stateless
-- guarantee). Just enough to drive billing reconciliation, abuse detection,
-- and feature analytics.

create table if not exists public.linkedin_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generator_type text not null check (generator_type in ('headline','about','experience_bullets','skills')),
  target_role text,
  features_used jsonb not null default '{}'::jsonb,
  cached boolean not null default false,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists linkedin_generations_user_created_idx
  on public.linkedin_generations (user_id, created_at desc);

alter table public.linkedin_generations enable row level security;

-- Owner can read their own generations. Inserts come from the service role
-- in /api/linkedin/generate, so no insert policy needed.
create policy "linkedin_generations_owner_select"
  on public.linkedin_generations
  for select
  using (auth.uid() = user_id);
