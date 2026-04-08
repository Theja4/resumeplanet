alter table public.profiles
  add column if not exists affiliate_source_code text references public.affiliates(discount_code) on delete set null,
  add column if not exists affiliate_source_recorded_at timestamptz;

create index if not exists profiles_affiliate_source_code_idx
  on public.profiles(affiliate_source_code)
  where affiliate_source_code is not null;
