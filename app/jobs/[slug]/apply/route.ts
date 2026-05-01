import { NextResponse } from 'next/server'
import { JOB_BOARD_ENABLED } from '@/lib/featureFlags'
import { getJobBySlug } from '@/lib/jobs'
import { createClient } from '@/lib/supabase/server'
import {
  isValidExternalUrl,
  PENDING_JOB_APPLY_COOKIE,
  serializePendingApplyCookie,
} from '@/lib/jobs/shared'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!JOB_BOARD_ENABLED) {
    return NextResponse.redirect(new URL('/', appOrigin))
  }

  const { slug } = await params
  const job = await getJobBySlug(slug)

  if (!job) {
    return NextResponse.redirect(new URL('/jobs', appOrigin))
  }

  if (!isValidExternalUrl(job.apply_url)) {
    return NextResponse.redirect(
      new URL(job.source_provider === 'manual' ? '/dashboard/jobs' : `/jobs/${job.slug}`, appOrigin)
    )
  }

  if (job.source_provider === 'manual') {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', appOrigin))
    }

    const { data: trackedJob } = await supabase
      .from('tracked_jobs')
      .select('id')
      .eq('job_id', job.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!trackedJob?.id) {
      return NextResponse.redirect(new URL('/dashboard/jobs', appOrigin))
    }
  }

  const response = NextResponse.redirect(job.apply_url)

  response.cookies.set({
    name: PENDING_JOB_APPLY_COOKIE,
    value: serializePendingApplyCookie({
      jobId: job.id,
      slug: job.slug,
      title: job.title,
      companyName: job.company_name,
    }),
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}
