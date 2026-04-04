import { notFound } from 'next/navigation'
import { DashboardPageIntro } from '@/components/layout/DashboardSurface'
import BlogPostEditor from '@/components/admin/BlogPostEditor'
import { getAdminBlogPostById } from '@/lib/blog'

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

export default async function AdminEditBlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const query = (await searchParams) ?? {}
  const post = await getAdminBlogPostById(id)

  if (!post) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {query.saved === '1' ? (
        <AdminNotice tone="success" message="Blog post saved." />
      ) : null}
      {query.error === 'missing-fields' ? (
        <AdminNotice tone="error" message="Title and content are required before saving." />
      ) : null}
      {query.error === 'save-failed' ? (
        <AdminNotice tone="error" message="Saving the post failed. Please try again." />
      ) : null}

      <DashboardPageIntro
        kicker="Blog Editor"
        title="Edit blog post."
        description="Update the content, status, and metadata for this post."
      />
      <BlogPostEditor post={post} />
    </div>
  )
}
