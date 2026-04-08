import { NextRequest, NextResponse } from 'next/server'
import { parseAffiliatePageNumber } from '@/lib/affiliate'
import {
  getAffiliateReferralPage,
  requireAffiliateAccess,
} from '@/lib/affiliate-server'

export async function GET(request: NextRequest) {
  const auth = await requireAffiliateAccess()

  if (auth instanceof NextResponse) {
    return auth
  }

  try {
    const page = parseAffiliatePageNumber(request.nextUrl.searchParams.get('page'))
    const referrals = await getAffiliateReferralPage(
      auth.serviceSupabase,
      auth.affiliate.id,
      page
    )

    return NextResponse.json({
      success: true,
      ...referrals,
    })
  } catch (error) {
    console.error('Affiliate referrals API error:', error)
    return NextResponse.json(
      { success: false, error: 'Could not load affiliate referrals' },
      { status: 500 }
    )
  }
}
