import ATSCheckerClient from '../ats-checker/ATSCheckerClient'
import ProFeaturePageGate from '@/components/shared/ProFeaturePageGate'
import type { Resume, ResumeData } from '@/types'
import { getAuthenticatedUserContext } from '@/lib/authenticated-user'
import { syncResumeData } from '@/lib/resume-data'

export default async function MatchScorePage() {
  const { supabase, userId, profile } = await getAuthenticatedUserContext()

  const [resumesResult] = await Promise.all([
    supabase
      .from('resumes')
      .select('id, title, raw_text, parsed_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ])

  const resumes = ((resumesResult.data ?? []) as Pick<Resume, 'id' | 'title' | 'raw_text' | 'parsed_data'>[]).map((resume) => ({
    ...resume,
    parsed_data: syncResumeData((resume.parsed_data as ResumeData | null) ?? {}),
  }))

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
