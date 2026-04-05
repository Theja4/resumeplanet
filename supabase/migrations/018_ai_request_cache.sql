create table if not exists public.ai_request_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in ('ats_basic', 'ats_pro', 'match_pro', 'cover_letter')),
  signature text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, feature, signature)
);

create index if not exists ai_request_cache_user_feature_updated_idx
  on public.ai_request_cache(user_id, feature, updated_at desc);

alter table public.ai_request_cache enable row level security;

create policy "Users can view their own AI cache"
  on public.ai_request_cache
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own AI cache"
  on public.ai_request_cache
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own AI cache"
  on public.ai_request_cache
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own AI cache"
  on public.ai_request_cache
  for delete
  using (auth.uid() = user_id);
