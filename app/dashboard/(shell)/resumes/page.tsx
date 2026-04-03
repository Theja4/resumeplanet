import { createClient } from '@/lib/supabase/server'
import ResumesClient from './ResumesClient'
import type { Resume, Profile } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ResumesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch resumes + profile in parallel
  const [resumesResult, profileResult] = await Promise.all([
    supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('plan').eq('id', user.id).single(),
  ])

  const resumes = (resumesResult.data ?? []) as Resume[]

  // Fetch latest ATS score for each resume in a single query
  const resumeIds = resumes.map((r) => r.id)
  const latestScores: Record<string, number> = Object.fromEntries(
    resumes
      .filter((resume): resume is Resume & { ats_score: number } => typeof resume.ats_score === 'number')
      .map(resume => [resume.id, resume.ats_score])
  )

  if (resumeIds.length > 0) {
    const { data: scores } = await supabase
      .from('ats_scores')
      .select('resume_id, score, created_at')
      .in('resume_id', resumeIds)
      .order('created_at', { ascending: false })

    if (scores) {
      // Keep only the most recent score per resume
      for (const score of scores) {
        if (score.resume_id && !(score.resume_id in latestScores)) {
          latestScores[score.resume_id] = score.score
        }
      }
    }
  }

  const plan = (profileResult.data?.plan ?? 'free') as Profile['plan']

  return (
    <ResumesClient
      initialResumes={resumes}
      latestScores={latestScores}
      plan={plan}
    />
  )
}
