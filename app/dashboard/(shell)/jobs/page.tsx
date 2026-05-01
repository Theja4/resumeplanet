import { notFound } from 'next/navigation'
import TrackedJobsClient from '@/components/jobs/TrackedJobsClient'
import type { Job, TrackedJob } from '@/types'
import { getAuthenticatedUserContext } from '@/lib/authenticated-user'
import { JOB_BOARD_ENABLED } from '@/lib/featureFlags'

type TrackedJobRow = Omit<TrackedJob, 'job'> & {
  job: Job | Job[] | null
}

export default async function DashboardJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  if (!JOB_BOARD_ENABLED) {
    notFound()
  }

  const { supabase, userId, profile } = await getAuthenticatedUserContext()

  const trackedJobsWithOverridesResult = await supabase
    .from('tracked_jobs')
    .select(
      'id, user_id, job_id, status, title_override, company_name_override, location_text_override, applied_at, saved_on, salary_text, job_description, excitement_rating, notes, created_at, updated_at, job:jobs(*)'
    )
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  let trackedJobRows: TrackedJobRow[]

  if (trackedJobsWithOverridesResult.error) {
    const fallbackTrackedJobsResult = await supabase
      .from('tracked_jobs')
      .select(
        'id, user_id, job_id, status, applied_at, saved_on, salary_text, job_description, excitement_rating, notes, created_at, updated_at, job:jobs(*)'
      )
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    trackedJobRows = ((fallbackTrackedJobsResult.data ?? []) as unknown as TrackedJobRow[]).map(
      trackedJob => ({
        ...trackedJob,
        title_override: null,
        company_name_override: null,
        location_text_override: null,
      })
    )
  } else {
    trackedJobRows = (trackedJobsWithOverridesResult.data ?? []) as unknown as TrackedJobRow[]
  }

  const trackedJobs = trackedJobRows.map(
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
