import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/planEnforcement'
import type { DashboardOverview } from '@/types'

export async function GET() {
  const auth = await requireAuth()

  if (auth instanceof NextResponse) {
    return auth
  }

  const { supabase, userId } = auth
  const [resumeCountResult, latestScoreResult, affiliateResult] = await Promise.all([
    supabase
      .from('resumes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('resumes')
      .select('ats_score')
      .eq('user_id', userId)
      .not('ats_score', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('affiliates')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (resumeCountResult.error) {
    return NextResponse.json(
      { success: false, error: `Failed to load resume count: ${resumeCountResult.error.message}` },
      { status: 500 }
    )
  }

  if (latestScoreResult.error) {
    return NextResponse.json(
      { success: false, error: `Failed to load latest ATS score: ${latestScoreResult.error.message}` },
      { status: 500 }
    )
  }

  if (affiliateResult.error) {
    return NextResponse.json(
      { success: false, error: `Failed to load affiliate status: ${affiliateResult.error.message}` },
      { status: 500 }
    )
  }

  const payload: DashboardOverview = {
    resumeCount: resumeCountResult.count ?? 0,
    lastScore:
      typeof latestScoreResult.data?.ats_score === 'number'
        ? latestScoreResult.data.ats_score
        : null,
    hasAffiliate: Boolean(affiliateResult.data?.id),
  }

  return NextResponse.json({
    success: true,
    ...payload,
  })
}
