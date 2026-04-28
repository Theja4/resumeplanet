import ResumesClient from './ResumesClient'
import type { Resume, Profile } from '@/types'
import { getAuthenticatedUserContext } from '@/lib/authenticated-user'

export default async function ResumesPage() {
  const { supabase, userId, profile } = await getAuthenticatedUserContext()

  const [resumesResult] = await Promise.all([
    supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ])

  const resumes = (resumesResult.data ?? []) as Resume[]

  // Build score map from denormalized ats_score field first
  const latestScores: Record<string, number> = {}
  const missingScoreIds: string[] = []

  for (const resume of resumes) {
    if (typeof resume.ats_score === 'number') {
      latestScores[resume.id] = resume.ats_score
    } else {
      missingScoreIds.push(resume.id)
    }
  }

  // Only query ats_scores table for resumes missing the denormalized value
  if (missingScoreIds.length > 0) {
    const { data: scores } = await supabase
      .from('ats_scores')
      .select('resume_id, score')
      .in('resume_id', missingScoreIds)
      .order('created_at', { ascending: false })

    if (scores) {
      for (const score of scores) {
        if (score.resume_id && !(score.resume_id in latestScores)) {
          latestScores[score.resume_id] = score.score
        }
      }
    }
  }

  const plan = (profile.plan ?? 'free') as Profile['plan']

  return (
    <ResumesClient
      initialResumes={resumes}
      latestScores={latestScores}
      plan={plan}
    />
  )
}
