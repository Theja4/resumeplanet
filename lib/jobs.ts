import { createClient } from '@/lib/supabase/server'
import type { Job, JobSourceProvider } from '@/types'

function escapeLikeQuery(value: string) {
  return value.replace(/['%,()]/g, ' ').trim()
}

export async function getPublicJobs({
  q,
  source,
  remoteType,
  limit = 60,
}: {
  q?: string
  source?: JobSourceProvider | 'all'
  remoteType?: Job['remote_type'] | 'all'
  limit?: number
}) {
  const supabase = await createClient()
  let query = supabase
    .from('jobs')
    .select('*')
    .eq('is_active', true)
    .order('posted_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (source && source !== 'all') {
    query = query.eq('source_provider', source)
  }

  if (remoteType && remoteType !== 'all') {
    query = query.eq('remote_type', remoteType)
  }

  if (q?.trim()) {
    const term = escapeLikeQuery(q)

    if (term) {
      query = query.or(
        `title.ilike.%${term}%,company_name.ilike.%${term}%,location_text.ilike.%${term}%`
      )
    }
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch jobs:', error)
    return [] as Job[]
  }

  return (data ?? []) as Job[]
}

export async function getJobBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('Failed to fetch job by slug:', error)
    return null
  }

  return (data ?? null) as Job | null
}
