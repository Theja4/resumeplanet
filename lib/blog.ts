import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
export {
  BLOG_COVER_BUCKET,
  buildBlogExcerpt,
  formatBlogDate,
  getBlogMediaFallback,
  getBlogCoverStoragePath,
  slugifyBlogTitle,
  stripMarkdown,
  type BlogPost,
  type BlogMediaFallback,
} from '@/lib/blog/shared'
import { slugifyBlogTitle, type BlogPost } from '@/lib/blog/shared'

export async function getPublishedBlogPosts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch published blog posts:', error)
    return [] as BlogPost[]
  }

  return (data ?? []) as BlogPost[]
}

export async function getPublishedBlogPostBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    console.error('Failed to fetch published blog post:', error)
    return null
  }

  return (data ?? null) as BlogPost | null
}

export async function getAdminBlogPosts() {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as BlogPost[]
}

export async function getAdminBlogPostById(id: string) {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data ?? null) as BlogPost | null
}

export async function resolveUniqueBlogSlug(slug: string, currentId?: string) {
  const supabase = createServiceRoleClient()
  const baseSlug = slugifyBlogTitle(slug) || 'post'
  let candidate = baseSlug
  let suffix = 1

  while (true) {
    const query = supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    const { data, error } = await query

    if (error) {
      throw error
    }

    if (!data || data.id === currentId) {
      return candidate
    }

    suffix += 1
    candidate = `${baseSlug}-${suffix}`
  }
}
