import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  AFFILIATE_ACTIVATION_COMMISSION_PERCENT,
  AFFILIATE_ACTIVATION_DISCOUNT_PERCENT,
  buildActivatedAffiliateCode,
  isValidAffiliateActivationBaseCode,
} from '@/lib/affiliate'
import {
  createPolarPercentageDiscount,
  getPolarConfigurationError,
  getPolarProductId,
} from '@/lib/polar'
import { PROMOTIONS } from '@/lib/pricing'

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  const body = (await request.json().catch(() => null)) as
    | { base_code?: string }
    | null

  const baseCode = body?.base_code?.trim().toUpperCase() ?? ''

  if (!isValidAffiliateActivationBaseCode(baseCode)) {
    return errorResponse('Choose a 4 to 8 character code using only A-Z and 0-9.')
  }

  const discountCode = buildActivatedAffiliateCode(baseCode)

  if (
    PROMOTIONS.some(
      promo => promo.paddleDiscountCode?.trim().toUpperCase() === discountCode
    )
  ) {
    return errorResponse('That code is unavailable. Choose a different one.', 409)
  }

  const [profileResult, affiliateResult] = await Promise.all([
    supabase.from('profiles').select('id, email, full_name, plan').eq('id', user.id).single(),
    supabase.from('affiliates').select('id, user_id, discount_code, commission_percent, discount_percent, paddle_discount_id, polar_discount_id, paypal_email').eq('user_id', user.id).maybeSingle(),
  ])

  if (profileResult.error) {
    return errorResponse('Could not load your profile.', 500)
  }

  if (affiliateResult.error) {
    return errorResponse('Could not load affiliate status.', 500)
  }

  if (!profileResult.data) {
    return errorResponse('Profile not found.', 401)
  }

  if (affiliateResult.data) {
    return NextResponse.json({
      success: true,
      affiliate: affiliateResult.data,
    })
  }

  const serviceSupabase = createServiceRoleClient()
  const { data: existingCode } = await serviceSupabase
    .from('affiliates')
    .select('id')
    .eq('discount_code', discountCode)
    .maybeSingle()

  if (existingCode?.id) {
    return errorResponse('That code is unavailable. Choose a different one.', 409)
  }

  const profile = profileResult.data
  const affiliateName = profile.full_name?.trim() || profile.email.split('@')[0] || 'Affiliate'
  let polarDiscountId: string | null = null

  if (!getPolarConfigurationError()) {
    try {
      const monthlyProductId = getPolarProductId('monthly')
      const annualProductId = getPolarProductId('annual')
      const polarDiscount = await createPolarPercentageDiscount({
        code: discountCode,
        percent: AFFILIATE_ACTIVATION_DISCOUNT_PERCENT,
        name: `Affiliate ${discountCode}`,
        productIds: [monthlyProductId, annualProductId].filter(
          (value): value is string => Boolean(value)
        ),
        metadata: {
          source: 'affiliate_program',
          affiliate_user_id: user.id,
        },
      })
      polarDiscountId = polarDiscount.id
    } catch (error) {
      console.error('Affiliate Polar discount creation failed:', error)
      return errorResponse('Could not create the checkout discount for that code right now.', 502)
    }
  }

  const { data: affiliate, error: insertError } = await serviceSupabase
    .from('affiliates')
    .insert({
      user_id: user.id,
      name: affiliateName,
      email: profile.email,
      discount_code: discountCode,
      paddle_discount_id: null,
      polar_discount_id: polarDiscountId,
      discount_percent: AFFILIATE_ACTIVATION_DISCOUNT_PERCENT,
      commission_percent: AFFILIATE_ACTIVATION_COMMISSION_PERCENT,
      paypal_email: null,
    })
    .select('id, user_id, discount_code, commission_percent, discount_percent, paddle_discount_id, polar_discount_id, paypal_email')
    .single()

  if (insertError || !affiliate) {
    if (insertError?.message?.toLowerCase().includes('duplicate')) {
      return errorResponse('That code is unavailable. Choose a different one.', 409)
    }

    console.error('Affiliate activation insert failed:', insertError)
    return errorResponse('Could not activate your affiliate code right now.', 500)
  }

  return NextResponse.json({
    success: true,
    affiliate,
  })
}
