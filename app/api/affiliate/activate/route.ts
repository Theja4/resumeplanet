import { NextRequest, NextResponse } from 'next/server'
import { getPaddleConfigurationError, paddle } from '@/lib/paddle'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  AFFILIATE_ACTIVATION_COMMISSION_PERCENT,
  AFFILIATE_ACTIVATION_DISCOUNT_PERCENT,
  buildActivatedAffiliateCode,
  isValidAffiliateActivationBaseCode,
} from '@/lib/affiliate'
import { PROMOTIONS } from '@/lib/pricing'

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

function getSafePaddleActivationError(error: unknown) {
  const configurationError = getPaddleConfigurationError()
  if (configurationError) {
    return configurationError
  }

  if (error instanceof Error && error.message.trim()) {
    const message = error.message.trim()

    if (/code/i.test(message) && /exist|taken|duplicate|already/i.test(message)) {
      return 'That code is unavailable. Choose a different one.'
    }

    return `Paddle discount creation failed: ${message}`
  }

  return 'Could not activate your affiliate code right now.'
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
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('affiliates').select('*').eq('user_id', user.id).maybeSingle(),
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

  let createdPaddleDiscountId: string | null = null

  try {
    const paddleDiscount = await paddle.discounts.create({
      amount: String(AFFILIATE_ACTIVATION_DISCOUNT_PERCENT),
      type: 'percentage',
      description: `Affiliate discount for ${discountCode}`,
      enabledForCheckout: true,
      code: discountCode,
      recur: false,
      customData: {
        userId: user.id,
        source: 'affiliate_activation',
      },
    })
    createdPaddleDiscountId = paddleDiscount.id
  } catch (error) {
    console.error('Affiliate activation Paddle discount creation failed:', error)
    return errorResponse(getSafePaddleActivationError(error), 500)
  }

  const profile = profileResult.data
  const affiliateName = profile.full_name?.trim() || profile.email.split('@')[0] || 'Affiliate'

  const { data: affiliate, error: insertError } = await serviceSupabase
    .from('affiliates')
    .insert({
      user_id: user.id,
      name: affiliateName,
      email: profile.email,
      discount_code: discountCode,
      discount_percent: AFFILIATE_ACTIVATION_DISCOUNT_PERCENT,
      commission_percent: AFFILIATE_ACTIVATION_COMMISSION_PERCENT,
      paypal_email: null,
    })
    .select('*')
    .single()

  if (insertError || !affiliate) {
    if (createdPaddleDiscountId) {
      try {
        await paddle.discounts.archive(createdPaddleDiscountId)
      } catch (cleanupError) {
        console.error('Affiliate activation Paddle discount cleanup failed:', cleanupError)
      }
    }

    if (insertError?.message?.toLowerCase().includes('duplicate')) {
      return errorResponse('That code is unavailable. Choose a different one.', 409)
    }

    console.error('Affiliate activation insert failed:', insertError)
    return errorResponse('Affiliate record creation failed after Paddle discount creation.', 500)
  }

  return NextResponse.json({
    success: true,
    affiliate,
  })
}
