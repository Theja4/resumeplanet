import { NextRequest, NextResponse } from 'next/server'
import {
  formatUsdCurrency,
} from '@/lib/affiliate'
import {
  createAffiliatePayoutRequest,
  getAffiliateStats,
  requireAffiliateAccess,
} from '@/lib/affiliate-server'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function buildPayoutErrorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(request: NextRequest) {
  const auth = await requireAffiliateAccess()

  if (auth instanceof NextResponse) {
    return auth
  }

  const body = (await request.json().catch(() => null)) as
    | { paypal_email?: string }
    | null

  const paypalEmail = body?.paypal_email?.trim().toLowerCase() ?? ''

  if (!paypalEmail) {
    return buildPayoutErrorResponse('PayPal email is required')
  }

  if (!EMAIL_PATTERN.test(paypalEmail)) {
    return buildPayoutErrorResponse('Enter a valid PayPal email address')
  }

  try {
    const stats = await getAffiliateStats(auth.serviceSupabase, auth.affiliate.id)

    if (stats.pendingPayout < 10) {
      return buildPayoutErrorResponse('Minimum payout is $10.00')
    }

    const payout = await createAffiliatePayoutRequest(
      auth.serviceSupabase,
      auth.affiliate.id,
      paypalEmail
    )

    return NextResponse.json({
      success: true,
      payout,
      pendingPayout: 0,
      message: `Request received! Your payout of ${formatUsdCurrency(payout.amount)} will be processed to your PayPal account within 3 working days.`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create payout request'

    if (message.includes('MINIMUM_PAYOUT_NOT_REACHED')) {
      return buildPayoutErrorResponse('Minimum payout is $10.00')
    }

    if (message.includes('INVALID_PAYPAL_EMAIL') || message.includes('PAYPAL_EMAIL_REQUIRED')) {
      return buildPayoutErrorResponse('Enter a valid PayPal email address')
    }

    console.error('Affiliate payout request API error:', error)
    return buildPayoutErrorResponse('Could not create payout request', 500)
  }
}
