create table if not exists public.fx_rates (
  id uuid primary key default gen_random_uuid(),
  rate_date date not null,
  currency_code text not null,
  rate_to_usd numeric(18, 8) not null check (rate_to_usd > 0),
  provider text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rate_date, currency_code)
);

create index if not exists fx_rates_currency_code_rate_date_idx
  on public.fx_rates(currency_code, rate_date desc);

alter table public.affiliate_commissions
  add column if not exists currency_code text,
  add column if not exists gross_amount_original numeric(10, 2),
  add column if not exists commission_amount_original numeric(10, 2),
  add column if not exists fx_rate_to_usd numeric(18, 8),
  add column if not exists gross_amount_usd numeric(10, 2),
  add column if not exists commission_amount_usd numeric(10, 2),
  add column if not exists fx_rate_date date,
  add column if not exists fx_provider text;

update public.affiliate_commissions
set
  currency_code = coalesce(currency_code, 'USD'),
  gross_amount_original = coalesce(gross_amount_original, gross_amount),
  commission_amount_original = coalesce(commission_amount_original, commission_amount),
  fx_rate_to_usd = coalesce(fx_rate_to_usd, 1),
  gross_amount_usd = coalesce(gross_amount_usd, gross_amount),
  commission_amount_usd = coalesce(commission_amount_usd, commission_amount),
  fx_rate_date = coalesce(fx_rate_date, current_date),
  fx_provider = coalesce(fx_provider, 'legacy_default'),
  gross_amount = coalesce(gross_amount_usd, gross_amount),
  commission_amount = coalesce(commission_amount_usd, commission_amount);

alter table public.affiliate_commissions
  alter column currency_code set default 'USD',
  alter column currency_code set not null,
  alter column gross_amount_original set not null,
  alter column commission_amount_original set not null,
  alter column fx_rate_to_usd set not null,
  alter column gross_amount_usd set not null,
  alter column commission_amount_usd set not null,
  alter column fx_rate_date set not null,
  alter column fx_provider set not null;

create index if not exists affiliate_commissions_currency_code_idx
  on public.affiliate_commissions(currency_code, created_at desc);

insert into public.fx_rates (rate_date, currency_code, rate_to_usd, provider)
values
  (current_date, 'USD', 1, 'seed'),
  (current_date, 'EUR', 1.09, 'seed'),
  (current_date, 'GBP', 1.27, 'seed'),
  (current_date, 'INR', 0.012, 'seed'),
  (current_date, 'AUD', 0.64, 'seed'),
  (current_date, 'CAD', 0.73, 'seed')
on conflict (rate_date, currency_code) do nothing;

create or replace function public.request_affiliate_payout(
  p_affiliate_id uuid,
  p_paypal_email text
)
returns table (
  id uuid,
  affiliate_id uuid,
  amount numeric,
  paypal_email text,
  status text,
  requested_at timestamptz,
  paid_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_paypal_email text := lower(btrim(coalesce(p_paypal_email, '')));
  available_balance numeric(10, 2);
begin
  if normalized_paypal_email = '' then
    raise exception 'PAYPAL_EMAIL_REQUIRED';
  end if;

  if normalized_paypal_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'INVALID_PAYPAL_EMAIL';
  end if;

  perform 1
  from public.affiliates
  where affiliates.id = p_affiliate_id
  for update;

  if not found then
    raise exception 'AFFILIATE_NOT_FOUND';
  end if;

  select greatest(
    coalesce((
      select sum(coalesce(commission_amount_usd, commission_amount))
      from public.affiliate_commissions
      where affiliate_commissions.affiliate_id = p_affiliate_id
    ), 0)
    - coalesce((
      select sum(amount)
      from public.payouts
      where payouts.affiliate_id = p_affiliate_id
        and payouts.status in ('pending', 'paid')
    ), 0),
    0
  )
  into available_balance;

  if available_balance < 10 then
    raise exception 'MINIMUM_PAYOUT_NOT_REACHED';
  end if;

  update public.affiliates
  set paypal_email = normalized_paypal_email,
      updated_at = now()
  where affiliates.id = p_affiliate_id;

  return query
  insert into public.payouts (
    affiliate_id,
    amount,
    paypal_email,
    status,
    requested_at
  )
  values (
    p_affiliate_id,
    available_balance,
    normalized_paypal_email,
    'pending',
    now()
  )
  returning
    payouts.id,
    payouts.affiliate_id,
    payouts.amount,
    payouts.paypal_email,
    payouts.status,
    payouts.requested_at,
    payouts.paid_at;
end;
$$;

revoke all on function public.request_affiliate_payout(uuid, text) from public, anon, authenticated;
grant execute on function public.request_affiliate_payout(uuid, text) to service_role;
