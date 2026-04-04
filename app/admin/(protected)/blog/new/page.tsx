import { DashboardPageIntro } from '@/components/layout/DashboardSurface'
import BlogPostEditor from '@/components/admin/BlogPostEditor'

function AdminNotice({ message }: { message: string }) {
  return (
    <div className="rounded-[1.4rem] border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
      {message}
    </div>
  )
}

export default async function AdminNewBlogPostPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await searchParams) ?? {}

  return (
    <div className="space-y-6">
      {params.error === 'missing-fields' ? (
        <AdminNotice message="Title and content are required before creating a post." />
      ) : null}
      {params.error === 'save-failed' ? (
        <AdminNotice message="Creating the post failed. Please try again." />
      ) : null}

      <DashboardPageIntro
        kicker="Blog Editor"
        title="Create a new post."
        description="Write the post, choose draft or published status, and push it live from the admin workspace."
      />
      <BlogPostEditor post={null} />
    </div>
  )
}
