create or replace function public.consume_daily_ats_scan(
  p_user_id uuid,
  p_limit integer
)
returns table(
  allowed boolean,
  scans_used integer,
  scans_remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles%rowtype;
  effective_count integer;
  effective_reset timestamptz;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if p_limit <= 0 then
    raise exception 'p_limit must be greater than zero';
  end if;

  select *
  into profile_row
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'Profile not found for user %', p_user_id;
  end if;

  effective_count := coalesce(profile_row.ats_scans_today, 0);
  effective_reset := coalesce(profile_row.ats_scans_reset_at, now());

  if now() - effective_reset >= interval '24 hours' then
    effective_count := 0;
    effective_reset := now();
  end if;

  if effective_count >= p_limit then
    update public.profiles
    set
      ats_scans_today = effective_count,
      ats_scans_reset_at = effective_reset
    where id = p_user_id;

    return query
    select false, effective_count, greatest(p_limit - effective_count, 0), effective_reset;
    return;
  end if;

  effective_count := effective_count + 1;

  update public.profiles
  set
    ats_scans_today = effective_count,
    ats_scans_reset_at = effective_reset
  where id = p_user_id;

  return query
  select true, effective_count, greatest(p_limit - effective_count, 0), effective_reset;
end;
$$;

revoke all on function public.consume_daily_ats_scan(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_daily_ats_scan(uuid, integer) to service_role;
