alter table public.affiliates
  add column if not exists paddle_discount_id text;

create index if not exists affiliates_paddle_discount_id_idx
  on public.affiliates(paddle_discount_id)
  where paddle_discount_id is not null;
