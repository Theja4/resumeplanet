alter table public.profiles
  add column if not exists razorpay_subscription_id text,
  add column if not exists razorpay_plan_id text,
  add column if not exists razorpay_customer_id text;

create index if not exists profiles_razorpay_subscription_id_idx
  on public.profiles(razorpay_subscription_id)
  where razorpay_subscription_id is not null;

create index if not exists profiles_razorpay_customer_id_idx
  on public.profiles(razorpay_customer_id)
  where razorpay_customer_id is not null;

create table if not exists public.razorpay_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  razorpay_subscription_id text not null unique,
  razorpay_plan_id text not null,
  razorpay_customer_id text,
  razorpay_payment_id text,
  plan_interval text not null check (plan_interval in ('monthly', 'annual')),
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  ended_at timestamptz,
  paid_count integer not null default 0,
  remaining_count integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.razorpay_subscriptions enable row level security;

drop policy if exists "Users can view own razorpay subscriptions"
  on public.razorpay_subscriptions;

create policy "Users can view own razorpay subscriptions"
  on public.razorpay_subscriptions for select
  using (auth.uid() = user_id);

create index if not exists razorpay_subscriptions_user_id_idx
  on public.razorpay_subscriptions(user_id);

create index if not exists razorpay_subscriptions_status_idx
  on public.razorpay_subscriptions(status);
