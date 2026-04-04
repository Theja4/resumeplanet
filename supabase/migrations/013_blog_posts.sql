create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  content text not null default '',
  category text not null default 'Product Update',
  cover_image_url text,
  author_name text not null default 'Rezoomed Team',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

drop policy if exists "Published blog posts are public" on public.blog_posts;

create policy "Published blog posts are public"
  on public.blog_posts for select
  using (status = 'published');

drop trigger if exists blog_posts_updated_at on public.blog_posts;

create or replace trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row execute procedure set_updated_at();

create index if not exists blog_posts_status_idx on public.blog_posts(status);
create index if not exists blog_posts_published_at_idx on public.blog_posts(published_at desc);
create index if not exists blog_posts_slug_idx on public.blog_posts(slug);
