import Link from 'next/link'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import { formatBlogDate, getAdminBlogPosts } from '@/lib/blog'

function AdminNotice({
  tone,
  message,
}: {
  tone: 'success' | 'error'
  message: string
}) {
  return (
    <div
      className={`rounded-[1.4rem] border px-5 py-4 text-sm font-medium ${
        tone === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {message}
    </div>
  )
}

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await searchParams) ?? {}
  const posts = await getAdminBlogPosts()
  const publishedCount = posts.filter(post => post.status === 'published').length
  const draftCount = posts.length - publishedCount

  return (
    <div className="space-y-6">
      {params.deleted === '1' ? (
        <AdminNotice tone="success" message="Blog post deleted." />
      ) : null}
      {params.error === 'delete-failed' ? (
        <AdminNotice tone="error" message="Deleting the blog post failed. Please try again." />
      ) : null}

      <DashboardPageIntro
        kicker="Blog Management"
        title="Manage blog publishing from one place."
        description="Create, edit, publish, and delete posts for the public blog experience."
        actions={
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-zinc-900"
          >
            New post
          </Link>
        }
        aside={
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Post summary</p>
            <p className="text-lg font-black text-on-background">{posts.length} total posts</p>
            <p className="text-sm leading-6 text-on-surface-variant">
              {publishedCount} published and {draftCount} draft.
            </p>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Published', value: String(publishedCount) },
          { label: 'Drafts', value: String(draftCount) },
          { label: 'Latest update', value: posts[0] ? formatBlogDate(posts[0].updated_at) : 'No posts yet' },
        ].map(item => (
          <DashboardSurface key={item.label} variant="subtle" className="px-5 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{item.label}</p>
            <p className="mt-3 text-2xl font-black tracking-tight text-zinc-900">{item.value}</p>
          </DashboardSurface>
        ))}
      </div>

      <DashboardSurface variant="default" className="overflow-hidden">
        <div className="border-b border-black/6 px-6 py-4">
          <h2 className="text-lg font-black tracking-tight text-on-background">All posts</h2>
        </div>

        {posts.length === 0 ? (
          <div className="px-6 py-10 text-sm text-on-surface-variant">
            No blog posts yet. Create the first one from the admin panel.
          </div>
        ) : (
          <div className="divide-y divide-black/6">
            {posts.map(post => (
              <div key={post.id} className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                        post.status === 'published'
                          ? 'bg-primary-container/45 text-on-primary-container'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {post.status}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                      {post.category}
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-bold tracking-tight text-on-background">{post.title}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">{post.excerpt}</p>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {post.status === 'published' ? `Published ${formatBlogDate(post.published_at)}` : `Updated ${formatBlogDate(post.updated_at)}`}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {post.status === 'published' ? (
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center rounded-full border border-black/8 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-900 transition hover:bg-surface-container-low"
                    >
                      View
                    </Link>
                  ) : null}
                  <Link
                    href={`/admin/blog/${post.id}`}
                    className="inline-flex items-center rounded-full bg-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-zinc-900"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSurface>
    </div>
  )
}
