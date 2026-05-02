alter table public.profiles
  add column if not exists polar_customer_id text,
  add column if not exists polar_subscription_id text;

create index if not exists profiles_polar_subscription_id_idx
  on public.profiles(polar_subscription_id)
  where polar_subscription_id is not null;

alter table public.affiliates
  add column if not exists polar_discount_id text;

create index if not exists affiliates_polar_discount_id_idx
  on public.affiliates(polar_discount_id)
  where polar_discount_id is not null;
