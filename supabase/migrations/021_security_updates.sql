-- ─── RESUMES SECURITY: Hash-based duplicate detection ────────────────────────
alter table public.resumes
  add column if not exists file_hash text;

create index if not exists resumes_user_hash_idx
  on public.resumes(user_id, file_hash);


-- ─── BLOG POSTS SECURITY: Defense-in-depth RLS ──────────────────────────────
-- Only service_role (Admin Panel) can modify blog posts.
-- Selects are already handled by "Published blog posts are public".

drop policy if exists "Admin only insert" on public.blog_posts;
create policy "Admin only insert"
  on public.blog_posts for insert
  with check (false); -- Denies all. service_role bypasses this.

drop policy if exists "Admin only update" on public.blog_posts;
create policy "Admin only update"
  on public.blog_posts for update
  using (false); -- Denies all. service_role bypasses this.

drop policy if exists "Admin only delete" on public.blog_posts;
create policy "Admin only delete"
  on public.blog_posts for delete
  using (false); -- Denies all. service_role bypasses this.
