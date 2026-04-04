import type { SupabaseClient } from '@supabase/supabase-js'
import { getTrackerLimit } from '@/lib/jobs/shared'
import type { Profile, TrackedJobStatus } from '@/types'

type SupabaseClientLike = SupabaseClient

interface TrackerMutationOk {
  ok: true
  trackedJob: {
    id: string
    job_id: string
    status: TrackedJobStatus
    applied_at: string | null
    saved_on: string | null
    salary_text: string | null
    job_description: string | null
    excitement_rating: number | null
    notes: string | null
  }
  limit: number
}

interface TrackerMutationError {
  ok: false
  error: 'TRACKER_LIMIT_REACHED' | 'NOT_FOUND'
  limit?: number
}

export type TrackerMutationResult = TrackerMutationOk | TrackerMutationError

const TRACKED_JOB_SELECT = 'id, job_id, status, applied_at, saved_on, salary_text, job_description, excitement_rating, notes'

async function ensureTrackerCapacity(
  supabase: SupabaseClientLike,
  userId: string,
  profile: Profile
) {
  const { count } = await supabase
    .from('tracked_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('status', 'archived')

  const limit = getTrackerLimit(profile)

  return {
    limit,
    hasCapacity: (count ?? 0) < limit,
  }
}

export async function upsertTrackedJobForUser({
  supabase,
  userId,
  profile,
  jobId,
  status,
}: {
  supabase: SupabaseClientLike
  userId: string
  profile: Profile
  jobId: string
  status: TrackedJobStatus
}): Promise<TrackerMutationResult> {
  const { data: existing } = await supabase
    .from('tracked_jobs')
    .select(TRACKED_JOB_SELECT)
    .eq('user_id', userId)
    .eq('job_id', jobId)
    .maybeSingle()

  const existingStatus = (existing?.status ?? null) as TrackedJobStatus | null
  const needsCapacity =
    (!existing && status !== 'archived') ||
    (existingStatus === 'archived' && status !== 'archived')

  if (needsCapacity) {
    const capacity = await ensureTrackerCapacity(supabase, userId, profile)

    if (!capacity.hasCapacity) {
      return { ok: false, error: 'TRACKER_LIMIT_REACHED', limit: capacity.limit }
    }
  }

  const appliedAt =
    status === 'applied' && !existing?.applied_at ? new Date().toISOString() : existing?.applied_at ?? null
  const savedOn = existing?.saved_on ?? new Date().toISOString().slice(0, 10)

  if (existing?.id) {
    const { data } = await supabase
      .from('tracked_jobs')
      .update({
        status,
        applied_at: appliedAt,
        saved_on: savedOn,
        salary_text: existing?.salary_text ?? null,
        job_description: existing?.job_description ?? null,
        excitement_rating: existing?.excitement_rating ?? null,
        notes: existing?.notes ?? null,
      })
      .eq('id', existing.id)
      .eq('user_id', userId)
      .select(TRACKED_JOB_SELECT)
      .single()

    return {
      ok: true,
      trackedJob: data as TrackerMutationOk['trackedJob'],
      limit: getTrackerLimit(profile),
    }
  }

  const { data } = await supabase
    .from('tracked_jobs')
    .insert({
      user_id: userId,
      job_id: jobId,
      status,
      applied_at: appliedAt,
      saved_on: new Date().toISOString().slice(0, 10),
      salary_text: null,
      job_description: null,
      excitement_rating: null,
      notes: null,
    })
    .select(TRACKED_JOB_SELECT)
    .single()

  return {
    ok: true,
    trackedJob: data as TrackerMutationOk['trackedJob'],
    limit: getTrackerLimit(profile),
  }
}

export async function updateTrackedJobStatusForUser({
  supabase,
  userId,
  profile,
  trackedJobId,
  status,
}: {
  supabase: SupabaseClientLike
  userId: string
  profile: Profile
  trackedJobId: string
  status: TrackedJobStatus
}): Promise<TrackerMutationResult> {
  return updateTrackedJobForUser({
    supabase,
    userId,
    profile,
    trackedJobId,
    status,
  })
}

export async function updateTrackedJobForUser({
  supabase,
  userId,
  profile,
  trackedJobId,
  status,
  notes,
  salaryText,
  jobDescription,
  excitementRating,
  savedOn,
  appliedAt,
}: {
  supabase: SupabaseClientLike
  userId: string
  profile: Profile
  trackedJobId: string
  status?: TrackedJobStatus
  notes?: string | null
  salaryText?: string | null
  jobDescription?: string | null
  excitementRating?: number | null
  savedOn?: string | null
  appliedAt?: string | null
}): Promise<TrackerMutationResult> {
  const { data: existing } = await supabase
    .from('tracked_jobs')
    .select(TRACKED_JOB_SELECT)
    .eq('id', trackedJobId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing?.id) {
    return { ok: false, error: 'NOT_FOUND' }
  }

  const nextStatus = status ?? (existing.status as TrackedJobStatus)
  const needsCapacity =
    existing.status === 'archived' && nextStatus !== 'archived'

  if (needsCapacity) {
    const capacity = await ensureTrackerCapacity(supabase, userId, profile)

    if (!capacity.hasCapacity) {
      return { ok: false, error: 'TRACKER_LIMIT_REACHED', limit: capacity.limit }
    }
  }

  const nextAppliedAt =
    appliedAt !== undefined
      ? appliedAt
      : nextStatus === 'applied' && !existing.applied_at
        ? new Date().toISOString()
        : existing.applied_at ?? null

  const nextSavedOn =
    savedOn !== undefined ? savedOn : existing.saved_on ?? new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from('tracked_jobs')
    .update({
      status: nextStatus,
      applied_at: nextAppliedAt,
      saved_on: nextSavedOn,
      salary_text: salaryText === undefined ? existing.salary_text ?? null : salaryText,
      job_description: jobDescription === undefined ? existing.job_description ?? null : jobDescription,
      excitement_rating:
        excitementRating === undefined ? existing.excitement_rating ?? null : excitementRating,
      notes: notes === undefined ? existing.notes ?? null : notes,
    })
    .eq('id', existing.id)
    .eq('user_id', userId)
    .select(TRACKED_JOB_SELECT)
    .single()

  return {
    ok: true,
    trackedJob: data as TrackerMutationOk['trackedJob'],
    limit: getTrackerLimit(profile),
  }
}
