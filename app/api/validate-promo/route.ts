import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActivePromotionByCode } from '@/lib/pricing'

// Replaces /api/paddle/validate-promo (removed when Paddle integration was deleted).
// Validates a promo code against:
//   1. PROMOTIONS in lib/pricing.ts (e.g. CAREER50, JOBS50, NEHA50, NEERAJA50)
//   2. The affiliates table (user-generated affiliate discount codes)
// Returns the PromoValidationResult shape expected by components/shared/PromoCodeInput.tsx.

type PromoValidationResult = {
  valid: boolean
  source?: 'affiliate' | 'promotion'
  promotionId?: string
  discountCode?: string
  discountType?: string
  discountValue?: number
  appliesTo?: 'all' | string
  badge?: string
  displayLabel?: string
  errorMessage?: string
}

function reply(payload: PromoValidationResult, status = 200) {
  return NextResponse.json(payload, { status })
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { code?: string } | null
  const code = body?.code?.trim().toUpperCase() ?? ''

  if (!code) {
    return reply({ valid: false, errorMessage: 'Enter a promo code.' }, 400)
  }

  // 1. Try built-in PROMOTIONS first (synchronous, fastest path).
  const promotion = getActivePromotionByCode(code)
  if (promotion) {
    const discountValue = promotion.discountValue ?? 0
    const discountType = promotion.discountType ?? 'percent'
    const displayLabel =
      discountType === 'percent' ? `${discountValue}% off` : `${discountValue} off`
    return reply({
      valid: true,
      source: 'promotion',
      promotionId: promotion.id,
      discountCode: promotion.paddleDiscountCode ?? code,
      discountType,
      discountValue,
      appliesTo: promotion.appliesTo,
      badge: promotion.badge,
      displayLabel,
    })
  }

  // 2. Try affiliate codes (DB lookup).
  try {
    const supabase = await createClient()
    const { data: affiliate, error } = await supabase
      .from('affiliates')
      .select('id, discount_code, discount_percent')
      .eq('discount_code', code)
      .maybeSingle()

    if (error) {
      console.error('[validate-promo] affiliate lookup failed', { code, error })
      // Fall through to "invalid" — don't 500 the user because of a DB hiccup.
    } else if (affiliate) {
      const discountValue = Number((affiliate as { discount_percent: number }).discount_percent ?? 0)
      return reply({
        valid: true,
        source: 'affiliate',
        promotionId: `affiliate:${(affiliate as { id: string }).id}`,
        discountCode: (affiliate as { discount_code: string }).discount_code,
        discountType: 'percent',
        discountValue,
        appliesTo: 'all',
        badge: `${discountValue}% OFF`,
        displayLabel: `${discountValue}% off`,
      })
    }
  } catch (e) {
    console.error('[validate-promo] unexpected error', { code, error: e })
  }

  return reply(
    {
      valid: false,
      errorMessage: 'This code is not valid. Double-check the spelling or try a different code.',
    },
    200, // 200 because client treats 400+ as network error and shows generic "Something went wrong"
  )
}
