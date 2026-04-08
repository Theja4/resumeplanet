import { NextResponse } from 'next/server'
import { getAffiliateStats, requireAffiliateAccess } from '@/lib/affiliate-server'

export async function GET() {
  const auth = await requireAffiliateAccess()

  if (auth instanceof NextResponse) {
    return auth
  }

  try {
    const stats = await getAffiliateStats(auth.serviceSupabase, auth.affiliate.id)

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error('Affiliate stats API error:', error)
    return NextResponse.json(
      { success: false, error: 'Could not load affiliate stats' },
      { status: 500 }
    )
  }
}
