import ATSCheckerClient from './ATSCheckerClient'
import type { Resume } from '@/types'
import { getAuthenticatedUserContext } from '@/lib/authenticated-user'

export default async function ATSCheckerPage() {
  const { supabase, userId, profile } = await getAuthenticatedUserContext()

  const [resumesResult] = await Promise.all([
    supabase
      .from('resumes')
      .select('id, title, raw_text, parsed_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ])

  const resumes = (resumesResult.data ?? []) as Pick<Resume, 'id' | 'title' | 'raw_text' | 'parsed_data'>[]

  return <ATSCheckerClient resumes={resumes} profile={profile} mode="ats" />
}
