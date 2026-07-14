-- Refund a single rate-limit token within the caller's current fixed window.
--
-- consume_api_rate_limit increments a token BEFORE the expensive AI call runs,
-- so a request that fails downstream (provider timeout, Foundry 429, all
-- providers unavailable) still spends the user's hourly budget. When an AI
-- provider is flaky, users retry, burn their whole quota on failed attempts,
-- and hit RATE_LIMITED without ever getting a result. This lets routes give
-- the token back when they return no result due to a server-side failure.
--
-- Windows are fixed and hour-aligned, so a refund issued seconds after the
-- consume lands on the same window_key and simply decrements request_count
-- (floored at 0). If the window has already rolled over, the old row is
-- expired and the WHERE clause matches nothing — a no-op, which is correct.
create or replace function public.refund_api_rate_limit(
  p_scope text,
  p_identifier_hash text,
  p_window_seconds integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_window_seconds integer := greatest(p_window_seconds, 1);
  window_start timestamptz :=
    to_timestamp(floor(extract(epoch from now()) / safe_window_seconds) * safe_window_seconds);
  current_window_key text := floor(extract(epoch from window_start))::text;
begin
  if p_scope is null or btrim(p_scope) = '' then
    raise exception 'p_scope is required';
  end if;

  if p_identifier_hash is null or btrim(p_identifier_hash) = '' then
    raise exception 'p_identifier_hash is required';
  end if;

  update public.api_rate_limits
    set request_count = greatest(public.api_rate_limits.request_count - 1, 0),
        updated_at = now()
  where scope = p_scope
    and identifier_hash = p_identifier_hash
    and window_key = current_window_key;
end;
$$;

revoke all on function public.refund_api_rate_limit(text, text, integer) from public, anon, authenticated;
grant execute on function public.refund_api_rate_limit(text, text, integer) to service_role;
