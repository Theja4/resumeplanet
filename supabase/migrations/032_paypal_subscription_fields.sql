alter table public.profiles
  add column if not exists paypal_customer_id text,
  add column if not exists paypal_subscription_id text;

create index if not exists profiles_paypal_subscription_id_idx
  on public.profiles(paypal_subscription_id)
  where paypal_subscription_id is not null;
