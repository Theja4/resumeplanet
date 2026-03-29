import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const code: string = (body.code ?? '').trim().toUpperCase()

    if (!code) {
      return NextResponse.json({
        valid: false,
        errorMessage: 'Please enter a promo code',
      })
    }

    // Look up active promotion codes from Stripe
    const promoCodes = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
    })

    if (promoCodes.data.length === 0) {
      return NextResponse.json({
        valid: false,
        errorMessage: 'Invalid or expired promo code',
      })
    }

    const promoCode = promoCodes.data[0]
    // Stripe SDK: coupon is a direct field on PromotionCode
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const couponData = (promoCode as any).coupon

    // Handle case where coupon is returned as a string ID instead of object
    if (typeof couponData === 'string' || !couponData) {
      return NextResponse.json({
        valid: false,
        errorMessage: 'Could not retrieve coupon details. Please try again.',
      })
    }

    const coupon = couponData

    // Build human-readable label
    let displayLabel = ''
    if (coupon.percent_off) {
      displayLabel = `${coupon.percent_off}% off`
      if (coupon.duration === 'once') {
        displayLabel += ' your first month'
      } else if (coupon.duration === 'repeating' && coupon.duration_in_months) {
        displayLabel += ` for ${coupon.duration_in_months} months`
      } else if (coupon.duration === 'forever') {
        displayLabel += ' forever'
      }
    } else if (coupon.amount_off) {
      const dollars = coupon.amount_off / 100
      displayLabel = `$${dollars} off`
      if (coupon.duration === 'once') {
        displayLabel += ' your first month'
      }
    }

    return NextResponse.json({
      valid: true,
      couponId: coupon.id,
      stripePromoCodeId: promoCode.id,
      discountType: coupon.percent_off ? 'percent' : 'fixed',
      discountValue: coupon.percent_off ?? (coupon.amount_off ?? 0) / 100,
      displayLabel: displayLabel || 'Discount applied',
    })
  } catch (err) {
    console.error('validate-promo error:', err)
    return NextResponse.json({
      valid: false,
      errorMessage: 'Could not validate code. Please try again.',
    })
  }
}
