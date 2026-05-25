import { NextResponse } from 'next/server'
import { readBearerClaims } from '@/lib/extensionAuth'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { ResumeData } from '@/types'

export const dynamic = 'force-dynamic'

interface ConsistencyResponse {
  resumeId: string
  resumeTitle: string
  headline: string | null
  jobTitle: string | null
  topSkills: string[]
}

// Returns the bits of a user's resume that the LinkedIn panel needs to
// compute the consistency gap. Defaults to the latest resume if no
// resumeId is supplied. Read-only — never mutates.
export async function GET(request: Request) {
  const claims = await readBearerClaims(request)
  if (!claims) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 })
  }

  const url = new URL(request.url)
  const requestedId = url.searchParams.get('resumeId')

  const supabase = createServiceRoleClient()

  // Always scope to the user. If a resumeId is given, fetch that specific
  // row but still enforce the user_id filter so a stolen token can't read
  // someone else's resume.
  const baseQuery = supabase
    .from('resumes')
    .select('id, title, parsed_data')
    .eq('user_id', claims.sub)

  const { data, error } = requestedId
    ? await baseQuery.eq('id', requestedId).maybeSingle()
    : await baseQuery.order('updated_at', { ascending: false }).limit(1).maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'resume_query_failed' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ hasResume: false }, { status: 200 })
  }

  const parsed = (data.parsed_data ?? null) as ResumeData | null
  const headline = parsed?.summary?.trim() || null
  const jobTitle = parsed?.currentRole?.trim() || parsed?.experience?.[0]?.title?.trim() || null
  const topSkills = (parsed?.skills ?? []).slice(0, 8)

  const result: ConsistencyResponse = {
    resumeId: data.id as string,
    resumeTitle: (data.title as string) || 'Untitled resume',
    headline,
    jobTitle,
    topSkills,
  }

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
