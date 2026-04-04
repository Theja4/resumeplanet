'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { BLOG_COVER_BUCKET, buildBlogExcerpt, getBlogCoverStoragePath, resolveUniqueBlogSlug } from '@/lib/blog'
import { getAdminSession } from '@/lib/admin-auth'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

function normalizeField(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function upsertBlogPostAction(formData: FormData) {
  const adminSession = await getAdminSession()

  if (!adminSession) {
    redirect('/admin/login')
  }

  const id = normalizeField(formData.get('id'))
  const title = normalizeField(formData.get('title'))
  const providedSlug = normalizeField(formData.get('slug'))
  const excerpt = normalizeField(formData.get('excerpt'))
  const content = normalizeField(formData.get('content'))
  const category = normalizeField(formData.get('category')) || 'Product Update'
  const coverImageUrl = normalizeField(formData.get('cover_image_url')) || null
  const authorName = normalizeField(formData.get('author_name')) || 'Rezoomed Team'
  const status = normalizeField(formData.get('status')) === 'published' ? 'published' : 'draft'

  if (!title || !content) {
    redirect(id ? `/admin/blog/${id}?error=missing-fields` : '/admin/blog/new?error=missing-fields')
  }

  const supabase = createServiceRoleClient()
  const slug = await resolveUniqueBlogSlug(providedSlug || title, id || undefined)
  const finalExcerpt = excerpt || buildBlogExcerpt(content)

  let publishedAt: string | null = null

  if (id) {
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('published_at, cover_image_url')
      .eq('id', id)
      .maybeSingle()

    publishedAt = status === 'published'
      ? existing?.published_at ?? new Date().toISOString()
      : null

    const { error } = await supabase
      .from('blog_posts')
      .update({
        title,
        slug,
        excerpt: finalExcerpt,
        content,
        category,
        cover_image_url: coverImageUrl,
        author_name: authorName,
        status,
        published_at: publishedAt,
      })
      .eq('id', id)

    if (error) {
      console.error('Failed to update blog post:', error)
      redirect(`/admin/blog/${id}?error=save-failed`)
    }

    const previousCoverPath = getBlogCoverStoragePath(existing?.cover_image_url)
    const nextCoverPath = getBlogCoverStoragePath(coverImageUrl)

    if (previousCoverPath && previousCoverPath !== nextCoverPath) {
      const { error: removeError } = await supabase.storage.from(BLOG_COVER_BUCKET).remove([previousCoverPath])

      if (removeError) {
        console.error('Failed to remove previous blog cover:', removeError)
      }
    }
  } else {
    publishedAt = status === 'published' ? new Date().toISOString() : null

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        title,
        slug,
        excerpt: finalExcerpt,
        content,
        category,
        cover_image_url: coverImageUrl,
        author_name: authorName,
        status,
        published_at: publishedAt,
      })
      .select('id')
      .single()

    if (error || !data?.id) {
      console.error('Failed to create blog post:', error)
      redirect('/admin/blog/new?error=save-failed')
    }

    revalidatePath('/admin/blog')
    revalidatePath('/blog')
    revalidatePath(`/blog/${slug}`)
    redirect(`/admin/blog/${data.id}?saved=1`)
  }

  revalidatePath('/admin/blog')
  revalidatePath(`/admin/blog/${id}`)
  revalidatePath('/blog')
  revalidatePath(`/blog/${slug}`)
  redirect(`/admin/blog/${id}?saved=1`)
}

export async function deleteBlogPostAction(formData: FormData) {
  const adminSession = await getAdminSession()

  if (!adminSession) {
    redirect('/admin/login')
  }

  const id = normalizeField(formData.get('id'))
  const slug = normalizeField(formData.get('slug'))

  if (!id) {
    redirect('/admin/blog')
  }

  const supabase = createServiceRoleClient()
  const { data: existing } = await supabase
    .from('blog_posts')
    .select('cover_image_url')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('blog_posts').delete().eq('id', id)

  if (error) {
    console.error('Failed to delete blog post:', error)
    redirect(`/admin/blog/${id}?error=delete-failed`)
  }

  const coverPath = getBlogCoverStoragePath(existing?.cover_image_url)

  if (coverPath) {
    const { error: removeError } = await supabase.storage.from(BLOG_COVER_BUCKET).remove([coverPath])

    if (removeError) {
      console.error('Failed to remove deleted blog cover:', removeError)
    }
  }

  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  if (slug) {
    revalidatePath(`/blog/${slug}`)
  }
  redirect('/admin/blog?deleted=1')
}
