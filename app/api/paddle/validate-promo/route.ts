import { NextRequest, NextResponse } from 'next/server'
import { resolveDiscountCodeForApplication } from '@/lib/discount-code-resolution'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

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
    const serviceSupabase = createServiceRoleClient()
    const resolution = await resolveDiscountCodeForApplication(serviceSupabase, code, {
      scope: 'validate-promo',
      allowPromotionFallbackOnAffiliateLookupError: true,
    })

    if (resolution.status === 'affiliate') {
      const affiliateBadge = `${resolution.affiliate.discount_percent}% OFF`

      return NextResponse.json({
        valid: true,
        source: 'affiliate',
        discountCode: resolution.affiliate.discount_code,
        discountType: 'percent',
        discountValue: resolution.affiliate.discount_percent,
        appliesTo: 'all',
        badge: affiliateBadge,
        displayLabel: buildDisplayLabel('percent', resolution.affiliate.discount_percent),
      })
    }

    if (resolution.status !== 'promotion') {
      return NextResponse.json({
        valid: false,
        errorMessage: 'Invalid or expired promo code',
      })
    }

    const promo = resolution.promotion

    return NextResponse.json({
      valid: true,
      source: 'promotion',
      promotionId: promo.id,
      discountCode: promo.paddleDiscountCode ?? code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      appliesTo: promo.appliesTo,
      badge: promo.badge,
      displayLabel: buildDisplayLabel(promo.discountType, promo.discountValue),
    })
  } catch (err) {
    console.error('Promo validation error:', err)
    return NextResponse.json({
      valid: false,
      errorMessage: 'Could not validate code. Please try again.',
    })
  }
}
