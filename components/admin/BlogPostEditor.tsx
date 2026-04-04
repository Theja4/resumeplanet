import type { BlogPost } from '@/lib/blog/shared'
import { deleteBlogPostAction, upsertBlogPostAction } from '@/app/admin/(protected)/blog/actions'
import BlogPostEditorClient from '@/components/admin/BlogPostEditorClient'

export default function BlogPostEditor({
  post,
}: {
  post: BlogPost | null
}) {
  return (
    <BlogPostEditorClient
      post={post}
      saveAction={upsertBlogPostAction}
      deleteAction={deleteBlogPostAction}
    />
  )
}
