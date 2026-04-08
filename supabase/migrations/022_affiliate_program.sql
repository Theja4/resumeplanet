create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null,
  email text not null,
  discount_code text not null unique,
  discount_percent numeric(5, 2) not null check (discount_percent >= 0 and discount_percent <= 100),
  commission_percent numeric(5, 2) not null check (commission_percent >= 0 and commission_percent <= 100),
  paypal_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists affiliates_user_id_idx on public.affiliates(user_id);
create index if not exists affiliates_discount_code_idx on public.affiliates(discount_code);

drop trigger if exists affiliates_updated_at on public.affiliates;
create trigger affiliates_updated_at
  before update on public.affiliates
  for each row execute procedure public.set_updated_at();

alter table public.affiliates enable row level security;

drop policy if exists "Users can view own affiliate profile" on public.affiliates;
create policy "Users can view own affiliate profile"
  on public.affiliates for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own affiliate payout details" on public.affiliates;
create policy "Users can update own affiliate payout details"
  on public.affiliates for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.prevent_sensitive_affiliate_updates()
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

  if auth.uid() is distinct from old.user_id then
    raise exception 'Unauthorized affiliate update';
  end if;

  if (to_jsonb(new) - array['paypal_email', 'updated_at']) is distinct from (to_jsonb(old) - array['paypal_email', 'updated_at']) then
    raise exception 'Protected affiliate fields cannot be updated directly';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_affiliates_sensitive_fields on public.affiliates;
create trigger protect_affiliates_sensitive_fields
  before update on public.affiliates
  for each row execute procedure public.prevent_sensitive_affiliate_updates();

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  referred_user_email text not null,
  paddle_subscription_id text not null unique,
  plan_name text not null,
  status text not null default 'trialing'
    check (status in ('active', 'trialing', 'churned')),
  mrr numeric(10, 2) not null default 0 check (mrr >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists referrals_affiliate_id_idx on public.referrals(affiliate_id, created_at desc);
create index if not exists referrals_status_idx on public.referrals(status);
create index if not exists referrals_subscription_idx on public.referrals(paddle_subscription_id);

drop trigger if exists referrals_updated_at on public.referrals;
create trigger referrals_updated_at
  before update on public.referrals
  for each row execute procedure public.set_updated_at();

alter table public.referrals enable row level security;

drop policy if exists "Users can view own affiliate referrals" on public.referrals;
create policy "Users can view own affiliate referrals"
  on public.referrals for select
  using (
    exists (
      select 1
      from public.affiliates affiliate
      where affiliate.id = referrals.affiliate_id
        and affiliate.user_id = auth.uid()
    )
  );

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  amount numeric(10, 2) not null check (amount >= 0),
  paypal_email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'rejected')),
  requested_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists payouts_affiliate_id_idx on public.payouts(affiliate_id, requested_at desc);
create index if not exists payouts_status_idx on public.payouts(status);

alter table public.payouts enable row level security;

drop policy if exists "Users can view own affiliate payouts" on public.payouts;
create policy "Users can view own affiliate payouts"
  on public.payouts for select
  using (
    exists (
      select 1
      from public.affiliates affiliate
      where affiliate.id = payouts.affiliate_id
        and affiliate.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create own affiliate payouts" on public.payouts;
create policy "Users can create own affiliate payouts"
  on public.payouts for insert
  with check (
    exists (
      select 1
      from public.affiliates affiliate
      where affiliate.id = payouts.affiliate_id
        and affiliate.user_id = auth.uid()
    )
  );

create table if not exists public.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  referral_id uuid references public.referrals(id) on delete set null,
  paddle_transaction_id text not null unique,
  gross_amount numeric(10, 2) not null check (gross_amount >= 0),
  commission_amount numeric(10, 2) not null check (commission_amount >= 0),
  discount_code text,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_commissions_affiliate_id_idx
  on public.affiliate_commissions(affiliate_id, created_at desc);
create index if not exists affiliate_commissions_referral_id_idx
  on public.affiliate_commissions(referral_id);

alter table public.affiliate_commissions enable row level security;

drop policy if exists "Users can view own affiliate commissions" on public.affiliate_commissions;
create policy "Users can view own affiliate commissions"
  on public.affiliate_commissions for select
  using (
    exists (
      select 1
      from public.affiliates affiliate
      where affiliate.id = affiliate_commissions.affiliate_id
        and affiliate.user_id = auth.uid()
    )
  );

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
      select sum(commission_amount)
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
