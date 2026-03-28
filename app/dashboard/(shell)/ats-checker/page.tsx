import { createClient } from '@/lib/supabase/server'
import ATSCheckerClient from './ATSCheckerClient'
import type { Resume, Profile } from '@/types'

export default async function ATSCheckerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [resumesResult, profileResult] = await Promise.all([
    supabase
      .from('resumes')
      .select('id, title, raw_text')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  const resumes = (resumesResult.data ?? []) as Pick<Resume, 'id' | 'title' | 'raw_text'>[]
  const profile = profileResult.data as Profile | null

  return <ATSCheckerClient resumes={resumes} profile={profile} />
}
