alter table public.profiles
  add column if not exists payment_provider text,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists razorpay_order_id text,
  add column if not exists razorpay_payment_id text;

create index if not exists profiles_razorpay_order_id_idx
  on public.profiles(razorpay_order_id)
  where razorpay_order_id is not null;

create index if not exists profiles_razorpay_payment_id_idx
  on public.profiles(razorpay_payment_id)
  where razorpay_payment_id is not null;

create index if not exists profiles_current_period_end_idx
  on public.profiles(current_period_end)
  where current_period_end is not null;

create table if not exists public.razorpay_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  razorpay_order_id text not null unique,
  razorpay_payment_id text unique,
  plan_interval text not null check (plan_interval in ('monthly', 'annual')),
  amount integer not null,
  currency text not null default 'INR',
  status text not null default 'created',
  current_period_start timestamptz,
  current_period_end timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.razorpay_payments enable row level security;

create policy "Users can view own razorpay payments"
  on public.razorpay_payments for select
  using (auth.uid() = user_id);

create index if not exists razorpay_payments_user_id_idx
  on public.razorpay_payments(user_id);

create index if not exists razorpay_payments_status_idx
  on public.razorpay_payments(status);
