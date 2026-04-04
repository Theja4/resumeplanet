import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/planEnforcement'
import { updateTrackedJobForUser } from '@/lib/jobs/tracker'
import { formatSalaryInput, parseTrackerDateInput, trackerDateToTimestamp } from '@/lib/jobs/shared'
import type { TrackedJobStatus } from '@/types'

const ALLOWED_UPDATE_STATUSES = new Set<TrackedJobStatus>([
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'archived',
])

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ trackedJobId: string }> }
) {
  const auth = await requireAuth()

  if (auth instanceof NextResponse) {
    return auth
  }

  const { trackedJobId } = await params
  const body = (await request.json().catch(() => null)) as
    | {
        status?: TrackedJobStatus
        notes?: string | null
        salaryText?: string | null
        jobDescription?: string | null
        excitementRating?: number | null
        savedOn?: string | null
        appliedOn?: string | null
      }
    | null
  const status = body?.status
  const notes =
    body?.notes === undefined
      ? undefined
      : typeof body.notes === 'string'
        ? body.notes.trim().slice(0, 1000) || null
        : body.notes === null
          ? null
          : undefined
  const salaryText =
    body?.salaryText === undefined
      ? undefined
      : typeof body.salaryText === 'string'
        ? formatSalaryInput(body.salaryText).slice(0, 120) || null
        : body.salaryText === null
          ? null
          : undefined
  const jobDescription =
    body?.jobDescription === undefined
      ? undefined
      : typeof body.jobDescription === 'string'
        ? body.jobDescription.trim().slice(0, 12000) || null
        : body.jobDescription === null
          ? null
          : undefined
  const excitementRating =
    body?.excitementRating === undefined
      ? undefined
      : typeof body.excitementRating === 'number' && Number.isInteger(body.excitementRating)
        ? body.excitementRating
        : body.excitementRating === null
          ? null
          : undefined
  const savedOn =
    body?.savedOn === undefined
      ? undefined
      : body.savedOn === null || body.savedOn === ''
        ? null
        : typeof body.savedOn === 'string'
          ? parseTrackerDateInput(body.savedOn)
          : undefined
  const appliedAt =
    body?.appliedOn === undefined
      ? undefined
      : body.appliedOn === null || body.appliedOn === ''
        ? null
        : typeof body.appliedOn === 'string'
          ? trackerDateToTimestamp(body.appliedOn)
          : undefined

  if (
    !trackedJobId ||
    (status !== undefined && !ALLOWED_UPDATE_STATUSES.has(status)) ||
    (body?.notes !== undefined && typeof body.notes !== 'string' && body.notes !== null) ||
    (body?.salaryText !== undefined && typeof body.salaryText !== 'string' && body.salaryText !== null) ||
    (body?.jobDescription !== undefined && typeof body.jobDescription !== 'string' && body.jobDescription !== null) ||
    (body?.excitementRating !== undefined &&
      body.excitementRating !== null &&
      (!Number.isInteger(body.excitementRating) || body.excitementRating < 1 || body.excitementRating > 5)) ||
    (body?.savedOn !== undefined && body.savedOn !== null && body.savedOn !== '' && savedOn === null) ||
    (body?.appliedOn !== undefined && body.appliedOn !== null && body.appliedOn !== '' && appliedAt === null) ||
    (status === undefined &&
      notes === undefined &&
      salaryText === undefined &&
      jobDescription === undefined &&
      excitementRating === undefined &&
      savedOn === undefined &&
      appliedAt === undefined)
  ) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
  }

  const result = await updateTrackedJobForUser({
    supabase: auth.supabase,
    userId: auth.userId,
    profile: auth.profile,
    trackedJobId,
    status,
    notes,
    salaryText,
    jobDescription,
    excitementRating,
    savedOn,
    appliedAt,
  })

  if (!result.ok) {
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

    return NextResponse.json({ success: false, error: result.error }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    trackedJob: result.trackedJob,
    limit: result.limit,
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ trackedJobId: string }> }
) {
  const auth = await requireAuth()

  if (auth instanceof NextResponse) {
    return auth
  }

  const { trackedJobId } = await params

  await auth.supabase
    .from('tracked_jobs')
    .delete()
    .eq('id', trackedJobId)
    .eq('user_id', auth.userId)

  return NextResponse.json({ success: true })
}
