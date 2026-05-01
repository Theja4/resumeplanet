import { NextRequest, NextResponse } from 'next/server'
import { JOB_BOARD_ENABLED } from '@/lib/featureFlags'
import { requireAuth } from '@/lib/planEnforcement'
import { upsertTrackedJobForUser } from '@/lib/jobs/tracker'
import {
  buildJobSlug,
  formatSalaryInput,
  inferRemoteType,
  normalizeOptionalExternalUrl,
  parseTrackerDateInput,
  trackerDateToTimestamp,
} from '@/lib/jobs/shared'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { Job, TrackedJob, TrackedJobStatus } from '@/types'

const ALLOWED_MANUAL_CREATE_STATUSES = new Set<TrackedJobStatus>([
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected',
])

export async function POST(request: NextRequest) {
  if (!JOB_BOARD_ENABLED) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }

  const auth = await requireAuth()

  if (auth instanceof NextResponse) {
    return auth
  }

  const body = (await request.json().catch(() => null)) as
    | {
        title?: string
        companyName?: string
        locationText?: string
        applyUrl?: string
        status?: TrackedJobStatus
        notes?: string
        salaryText?: string
        jobDescription?: string
        excitementRating?: number | null
        savedOn?: string | null
        appliedOn?: string | null
      }
    | null

  const title = body?.title?.trim() ?? ''
  const companyName = body?.companyName?.trim() ?? ''
  const locationText = body?.locationText?.trim() || 'Location flexible'
  const status = body?.status ?? 'saved'
  const notes = body?.notes?.trim().slice(0, 1000) || null
  const salaryText = formatSalaryInput(body?.salaryText).slice(0, 120) || null
  const jobDescription = body?.jobDescription?.trim().slice(0, 12000) || null
  const applyUrl = normalizeOptionalExternalUrl(body?.applyUrl)
  const excitementRating =
    typeof body?.excitementRating === 'number' && Number.isInteger(body.excitementRating)
      ? body.excitementRating
      : body?.excitementRating === null || body?.excitementRating === undefined
        ? null
        : -1
  const savedOn =
    body?.savedOn === null || body?.savedOn === undefined || body.savedOn === ''
      ? null
      : parseTrackerDateInput(body.savedOn)
  const appliedAt =
    body?.appliedOn === null || body?.appliedOn === undefined || body.appliedOn === ''
      ? null
      : trackerDateToTimestamp(body.appliedOn)

  if (
    !title ||
    !companyName ||
    !ALLOWED_MANUAL_CREATE_STATUSES.has(status) ||
    excitementRating === -1 ||
    (body?.savedOn !== undefined && body.savedOn !== null && body.savedOn !== '' && savedOn === null) ||
    (body?.appliedOn !== undefined && body.appliedOn !== null && body.appliedOn !== '' && appliedAt === null) ||
    (excitementRating !== null && (excitementRating < 1 || excitementRating > 5))
  ) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const externalId = crypto.randomUUID()
  const slug = buildJobSlug({
    title,
    companyName,
    provider: 'manual',
    sourceKey: 'manual',
    externalId,
  })
  const now = new Date().toISOString()

  const manualJob = {
    source_provider: 'manual' as const,
    source_key: 'manual',
    external_id: externalId,
    slug,
    title,
    company_name: companyName,
    location_text: locationText,
    remote_type: inferRemoteType(locationText),
    employment_type: null,
    salary_text: salaryText,
    description_text: jobDescription ?? 'Manually added to your tracker.',
    apply_url: applyUrl,
    source_url: applyUrl || null,
    company_logo_url: null,
    category: null,
    tags: [],
    posted_at: now,
    metadata: {
      manual: true,
      created_by_user_id: auth.userId,
    },
    is_active: false,
    last_seen_at: now,
  }

  const { data: insertedJob, error: insertError } = await supabase
    .from('jobs')
    .insert(manualJob)
    .select('*')
    .single()

  if (insertError || !insertedJob?.id) {
    return NextResponse.json({ success: false, error: 'Could not create manual job' }, { status: 500 })
  }

  const result = await upsertTrackedJobForUser({
    supabase,
    userId: auth.userId,
    profile: auth.profile,
    jobId: insertedJob.id,
    status,
  })

  if (!result.ok) {
    await supabase.from('jobs').delete().eq('id', insertedJob.id)

    if (result.error === 'TRACKER_LIMIT_REACHED') {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          limit: result.limit,
        },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }

  const { data: updatedTrackedJob } = await supabase
    .from('tracked_jobs')
    .update({
      notes,
      salary_text: salaryText,
      job_description: jobDescription,
      excitement_rating: excitementRating,
      saved_on: savedOn ?? now.slice(0, 10),
      applied_at: appliedAt ?? (status === 'applied' ? now : result.trackedJob.applied_at),
    })
    .eq('id', result.trackedJob.id)
    .eq('user_id', auth.userId)
    .select('id, user_id, job_id, status, title_override, company_name_override, location_text_override, applied_at, saved_on, salary_text, job_description, excitement_rating, notes, created_at, updated_at')
    .single()

  const trackedJob = {
    ...(updatedTrackedJob ?? {
      ...result.trackedJob,
      user_id: auth.userId,
      title_override: null,
      company_name_override: null,
      location_text_override: null,
      notes,
      salary_text: salaryText,
      job_description: jobDescription,
      excitement_rating: excitementRating,
      saved_on: savedOn ?? now.slice(0, 10),
      applied_at: appliedAt ?? (status === 'applied' ? now : result.trackedJob.applied_at),
      created_at: now,
      updated_at: now,
    }),
    job: insertedJob as Job,
  } as TrackedJob

  return NextResponse.json({
    success: true,
    trackedJob,
    limit: result.limit,
  })
}
