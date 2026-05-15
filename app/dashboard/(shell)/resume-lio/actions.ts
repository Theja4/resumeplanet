'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { syncResumeData } from '@/lib/resume-data'
import type { ResumeData, ResumeLioSocialLinks, ResumeLioTemplateId } from '@/types'

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const RESERVED_SLUGS = new Set([
  'admin','api','auth','dashboard','login','logout','signup',
  'resume','resumes','builder','pricing','blog','jobs','affiliate',
  'contact','privacy','terms','cookie','refund','orders',
])

function isValidSlug(slug: string) {
  if (slug.length < 2 || slug.length > 64) return false
  if (RESERVED_SLUGS.has(slug)) return false
  return SLUG_RE.test(slug)
}

export async function getMyResumeLioSite() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('resume_lio_sites')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return { error: error.message }
  return { data }
}

export async function checkSlugAvailability(slug: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const trimmed = slug.trim().toLowerCase()
  if (!isValidSlug(trimmed)) return { error: 'Invalid slug' }

  const { data, error } = await supabase
    .from('resume_lio_sites')
    .select('id, user_id')
    .eq('slug', trimmed)
    .maybeSingle()

  if (error) return { error: error.message }
  if (data && data.user_id !== user.id) return { available: false }
  return { available: true }
}

export async function createResumeLioSite(payload: {
  slug: string
  source_resume_id?: string | null
  template_id?: ResumeLioTemplateId
  resume_data?: ResumeData
  social_links?: ResumeLioSocialLinks
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const trimmedSlug = payload.slug.trim().toLowerCase()
  if (!isValidSlug(trimmedSlug)) return { error: 'Invalid slug' }

  const { data: existingUserSite } = await supabase
    .from('resume_lio_sites')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingUserSite) {
    return { error: 'USER_ALREADY_HAS_SITE' }
  }

  const resumeData = payload.resume_data ? syncResumeData(payload.resume_data) : {}

  const { data, error } = await supabase
    .from('resume_lio_sites')
    .insert({
      user_id: user.id,
      slug: trimmedSlug,
      source_resume_id: payload.source_resume_id ?? null,
      template_id: payload.template_id ?? 'jane',
      resume_data: resumeData,
      social_links: payload.social_links ?? {},
      published: false,
    })
    .select()
    .single()

  if (error) {
    if (error.message.includes('resume_lio_sites_slug_unique')) {
      return { error: 'SLUG_TAKEN' }
    }
    if (error.message.includes('resume_lio_sites_user_id_unique')) {
      return { error: 'USER_ALREADY_HAS_SITE' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard/resume-lio')
  return { data }
}

export async function updateResumeLioSite(payload: {
  slug?: string
  source_resume_id?: string | null
  template_id?: ResumeLioTemplateId
  resume_data?: ResumeData
  social_links?: ResumeLioSocialLinks
  image_overrides?: Record<string, string | null>
  published?: boolean
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const update: Record<string, unknown> = {}
  if (payload.slug !== undefined) {
    const trimmed = payload.slug.trim().toLowerCase()
    if (!isValidSlug(trimmed)) return { error: 'Invalid slug' }
    update.slug = trimmed
  }
  if (payload.source_resume_id !== undefined) update.source_resume_id = payload.source_resume_id
  if (payload.template_id !== undefined) update.template_id = payload.template_id
  if (payload.resume_data !== undefined) update.resume_data = syncResumeData(payload.resume_data)
  if (payload.social_links !== undefined) update.social_links = payload.social_links
  if (payload.image_overrides !== undefined) update.image_overrides = payload.image_overrides
  if (payload.published !== undefined) update.published = payload.published

  const { data, error } = await supabase
    .from('resume_lio_sites')
    .update(update)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    if (error.message.includes('resume_lio_sites_slug_unique')) {
      return { error: 'SLUG_TAKEN' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard/resume-lio')
  if (data?.slug) revalidatePath(`/r/${data.slug}`)
  return { data }
}

export async function deleteResumeLioSite() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('resume_lio_sites')
    .delete()
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/resume-lio')
  return { success: true }
}
