alter table public.profiles
  add column if not exists paddle_customer_id text,
  add column if not exists paddle_subscription_id text,
  add column if not exists subscription_interval text
    check (subscription_interval in ('monthly', 'annual'));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.prevent_sensitive_profile_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text := coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), current_user);
begin
  if actor_role in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if auth.uid() is distinct from old.id then
    raise exception 'Unauthorized profile update';
  end if;

  if (to_jsonb(new) - array['full_name', 'avatar_url']) is distinct from (to_jsonb(old) - array['full_name', 'avatar_url']) then
    raise exception 'Protected profile fields cannot be updated directly';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profiles_sensitive_fields on public.profiles;
create trigger protect_profiles_sensitive_fields
  before update on public.profiles
  for each row execute procedure public.prevent_sensitive_profile_updates();

drop policy if exists "Users can update own orders" on public.orders;

drop policy if exists "Jobs are public" on public.jobs;
create policy "Public or tracked jobs are visible"
  on public.jobs for select
  using (
    (
      is_active = true
      and source_provider <> 'manual'
    )
    or exists (
      select 1
      from public.tracked_jobs tracked
      where tracked.job_id = jobs.id
        and tracked.user_id = auth.uid()
    )
  );

revoke execute on function public.verify_admin_credentials(text, text) from anon, authenticated;
grant execute on function public.verify_admin_credentials(text, text) to service_role;

delete from public.admin_users
where username = 'admin'
  and password_hash = extensions.crypt('admin@1999', password_hash);

create table if not exists public.api_rate_limits (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  identifier_hash text not null,
  window_key text not null,
  request_count integer not null default 0 check (request_count >= 0),
  window_started_at timestamptz not null,
  window_ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scope, identifier_hash, window_key)
);

create index if not exists api_rate_limits_scope_updated_idx
  on public.api_rate_limits(scope, updated_at desc);

alter table public.api_rate_limits enable row level security;

drop trigger if exists api_rate_limits_updated_at on public.api_rate_limits;
create trigger api_rate_limits_updated_at
  before update on public.api_rate_limits
  for each row execute procedure set_updated_at();

create or replace function public.consume_api_rate_limit(
  p_scope text,
  p_identifier_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table(request_count integer, window_ends_at timestamptz, allowed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_window_seconds integer := greatest(p_window_seconds, 1);
  current_time timestamptz := now();
  window_start timestamptz :=
    to_timestamp(floor(extract(epoch from current_time) / safe_window_seconds) * safe_window_seconds);
  window_end timestamptz := window_start + make_interval(secs => safe_window_seconds);
  current_window_key text := floor(extract(epoch from window_start))::text;
begin
  if p_scope is null or btrim(p_scope) = '' then
    raise exception 'p_scope is required';
  end if;

  if p_identifier_hash is null or btrim(p_identifier_hash) = '' then
    raise exception 'p_identifier_hash is required';
  end if;

  if p_limit <= 0 then
    raise exception 'p_limit must be greater than zero';
  end if;

  insert into public.api_rate_limits (
    scope,
    identifier_hash,
    window_key,
    request_count,
    window_started_at,
    window_ends_at
  )
  values (
    p_scope,
    p_identifier_hash,
    current_window_key,
    1,
    window_start,
    window_end
  )
  on conflict (scope, identifier_hash, window_key)
  do update
    set request_count = public.api_rate_limits.request_count + 1,
        updated_at = now()
  returning public.api_rate_limits.request_count, public.api_rate_limits.window_ends_at
  into request_count, window_ends_at;

  allowed := request_count <= p_limit;
  return next;
end;
$$;

revoke all on table public.api_rate_limits from anon, authenticated;
revoke all on function public.consume_api_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, text, integer, integer) to service_role;
