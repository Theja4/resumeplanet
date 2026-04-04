import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/planEnforcement'
import { upsertTrackedJobForUser } from '@/lib/jobs/tracker'
import type { TrackedJobStatus } from '@/types'

const ALLOWED_CREATE_STATUSES = new Set<TrackedJobStatus>(['saved', 'applied'])

export async function POST(request: NextRequest) {
  const auth = await requireAuth()

  if (auth instanceof NextResponse) {
    return auth
  }

  const body = (await request.json().catch(() => null)) as
    | { jobId?: string; status?: TrackedJobStatus }
    | null

  const jobId = body?.jobId?.trim()
  const status = body?.status ?? 'saved'

  if (!jobId || !ALLOWED_CREATE_STATUSES.has(status)) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
  }

  const { data: job } = await auth.supabase
    .from('jobs')
    .select('id')
    .eq('id', jobId)
    .maybeSingle()

  if (!job?.id) {
    return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
  }

  const result = await upsertTrackedJobForUser({
    supabase: auth.supabase,
    userId: auth.userId,
    profile: auth.profile,
    jobId,
    status,
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

    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    trackedJob: result.trackedJob,
    limit: result.limit,
  })
}
