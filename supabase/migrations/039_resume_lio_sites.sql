create table if not exists public.resume_lio_sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null,
  source_resume_id uuid null references public.resumes(id) on delete set null,
  template_id text not null default 'jane',
  resume_data jsonb not null default '{}',
  social_links jsonb not null default '{}',
  image_overrides jsonb not null default '{}',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique constraints: one site per user, one site per slug
alter table public.resume_lio_sites
  add constraint resume_lio_sites_user_id_unique unique (user_id);

alter table public.resume_lio_sites
  add constraint resume_lio_sites_slug_unique unique (slug);

-- Indexes
create index if not exists resume_lio_sites_user_id_idx on public.resume_lio_sites(user_id);
create index if not exists resume_lio_sites_slug_idx on public.resume_lio_sites(slug);
create index if not exists resume_lio_sites_published_idx on public.resume_lio_sites(published);

-- RLS
alter table public.resume_lio_sites enable row level security;

create policy "Users can manage their own resume lio sites"
  on public.resume_lio_sites
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Public can view published resume lio sites"
  on public.resume_lio_sites
  for select
  to anon, authenticated
  using (published = true);

-- Updated-at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger resume_lio_sites_updated_at
  before update on public.resume_lio_sites
  for each row
  execute function public.set_updated_at();
