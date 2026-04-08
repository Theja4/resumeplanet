import { NextResponse } from 'next/server'
import { getAffiliatePayouts, requireAffiliateAccess } from '@/lib/affiliate-server'

export async function GET() {
  const auth = await requireAffiliateAccess()

  if (auth instanceof NextResponse) {
    return auth
  }

  try {
    const payouts = await getAffiliatePayouts(auth.serviceSupabase, auth.affiliate.id)

    return NextResponse.json({
      success: true,
      payouts,
    })
  } catch (error) {
    console.error('Affiliate payouts API error:', error)
    return NextResponse.json(
      { success: false, error: 'Could not load payout history' },
      { status: 500 }
    )
  }
}
