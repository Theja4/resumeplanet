import { createClient } from '@/lib/supabase/server'
import TrackedJobsClient from '@/components/jobs/TrackedJobsClient'
import type { Job, Profile, TrackedJob } from '@/types'

export const dynamic = 'force-dynamic'

type TrackedJobRow = Omit<TrackedJob, 'job'> & {
  job: Job | Job[] | null
}

export default async function DashboardJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [profileResult, trackedJobsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('tracked_jobs')
      .select(
        'id, user_id, job_id, status, applied_at, saved_on, salary_text, job_description, excitement_rating, notes, created_at, updated_at, job:jobs(*)'
      )
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
  ])

  const profile = profileResult.data as Profile | null
  const trackedJobs = ((trackedJobsResult.data ?? []) as unknown as TrackedJobRow[]).map(
    trackedJob => ({
      ...trackedJob,
      job: Array.isArray(trackedJob.job) ? trackedJob.job[0] ?? null : trackedJob.job,
    })
  )
  const params = await searchParams
  const initialStatusFilter =
    params.status &&
    ['saved', 'applied', 'interviewing', 'offer', 'rejected', 'archived'].includes(params.status)
      ? params.status
      : 'all'

  return (
    <TrackedJobsClient
      initialTrackedJobs={trackedJobs}
      plan={profile?.plan ?? 'free'}
      initialStatusFilter={initialStatusFilter as 'all' | TrackedJob['status']}
    />
  )
}
