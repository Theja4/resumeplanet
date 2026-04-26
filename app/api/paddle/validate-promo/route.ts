import { NextRequest, NextResponse } from 'next/server'
import { findAffiliateByDiscountCode } from '@/lib/affiliate-server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getActivePromotionByCode } from '@/lib/pricing'

function buildDisplayLabel(discountType: 'percent' | 'fixed', discountValue: number) {
  if (discountType === 'percent') {
    return `${discountValue}% off`
  }

  return `$${discountValue.toFixed(2)} off`
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ valid: false, errorMessage: 'Invalid request' })
  }

  const code = ((body.code as string) ?? '').trim().toUpperCase()
  if (!code) {
    return NextResponse.json({ valid: false, errorMessage: 'Please enter a promo code' })
  }

  try {
    const promo = getActivePromotionByCode(code)

    if (promo) {
      if (!promo.paddleDiscountId) {
        return NextResponse.json({
          valid: false,
          errorMessage: 'Invalid or expired promo code',
        })
      }

      return NextResponse.json({
        valid: true,
        promotionId: promo.id,
        discountCode: promo.paddleDiscountCode ?? code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        appliesTo: promo.appliesTo,
        badge: promo.badge,
        displayLabel: buildDisplayLabel(promo.discountType, promo.discountValue),
      })
    }

    const serviceSupabase = createServiceRoleClient()
    const affiliate = await findAffiliateByDiscountCode(serviceSupabase, code)

    if (!affiliate) {
      return NextResponse.json({
        valid: false,
        errorMessage: 'Invalid or expired promo code',
      })
    }

    const affiliateBadge = `${affiliate.discount_percent}% OFF`

    return NextResponse.json({
      valid: true,
      discountCode: affiliate.discount_code,
      discountType: 'percent',
      discountValue: affiliate.discount_percent,
      appliesTo: 'all',
      badge: affiliateBadge,
      displayLabel: buildDisplayLabel('percent', affiliate.discount_percent),
    })
  } catch (err) {
    console.error('Promo validation error:', err)
    return NextResponse.json({
      valid: false,
      errorMessage: 'Could not validate code. Please try again.',
    })
  }
}
