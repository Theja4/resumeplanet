import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ResumeDetailClient from './ResumeDetailClient'
import type { Resume, ATSScore } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ResumeDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [resumeResult, scoresResult] = await Promise.all([
    supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('ats_scores')
      .select('id, score, created_at, job_description')
      .eq('resume_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (!resumeResult.data) {
    notFound()
  }

  return (
    <ResumeDetailClient
      resume={resumeResult.data as Resume}
      atsHistory={(scoresResult.data ?? []) as Pick<ATSScore, 'id' | 'score' | 'created_at' | 'job_description'>[]}
    />
  )
}
