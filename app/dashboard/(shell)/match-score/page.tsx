import { createClient } from '@/lib/supabase/server'
import ATSCheckerClient from '../ats-checker/ATSCheckerClient'
import ProFeaturePageGate from '@/components/shared/ProFeaturePageGate'
import type { Resume, Profile } from '@/types'

export default async function MatchScorePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [resumesResult, profileResult] = await Promise.all([
    supabase
      .from('resumes')
      .select('id, title, raw_text, parsed_data')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  const resumes = (resumesResult.data ?? []) as Pick<Resume, 'id' | 'title' | 'raw_text' | 'parsed_data'>[]
  const profile = profileResult.data as Profile | null

  if (profile?.plan !== 'pro') {
    return (
      <ProFeaturePageGate
        feature="Match Score"
        title="Match Score is a Pro workflow."
        description="Compare your resume against a live job description, surface the real fit gaps, and prioritize what to strengthen before you apply."
        bullets={[
          'Measure resume-to-role fit instead of generic ATS hygiene.',
          'See which requirements have strong, partial, or missing evidence.',
          'Upgrade instantly through Paddle without leaving the dashboard.',
        ]}
        analyticsLocation="route-gate:match-score"
      />
    )
  }

  return <ATSCheckerClient resumes={resumes} profile={profile} mode="match" />
}
