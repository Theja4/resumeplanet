create extension if not exists pgcrypto;

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;

create or replace function public.verify_admin_credentials(input_username text, input_password text)
returns jsonb
language sql
security definer
set search_path = public, extensions
as $$
  select jsonb_build_object(
    'id', admin_users.id,
    'username', admin_users.username
  )
  from public.admin_users
  where admin_users.username = lower(trim(input_username))
    and admin_users.password_hash = extensions.crypt(input_password, admin_users.password_hash)
  limit 1;
$$;

grant execute on function public.verify_admin_credentials(text, text) to anon, authenticated;

insert into public.admin_users (username, password_hash)
values ('admin', extensions.crypt('admin@1999', extensions.gen_salt('bf')))
on conflict (username) do update
set password_hash = excluded.password_hash;
