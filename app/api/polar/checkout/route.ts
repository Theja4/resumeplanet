import { NextRequest, NextResponse } from 'next/server'

import { detectRequestCountry } from '@/lib/cookie-consent'
import { resolveDiscountCodeForApplication } from '@/lib/discount-code-resolution'
import {
  createPolarCheckout,
  getPolarConfigurationError,
  getPolarDiscountId,
  getPolarProductId,
} from '@/lib/polar'
import { getProPlanForCountry } from '@/lib/pricing'
import { getSiteUrl } from '@/lib/site'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createClient } from '@/lib/supabase/server'

function ok(data: Record<string, unknown>) {
  return NextResponse.json({ success: true, data })
}

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

async function resolvePolarDiscountId(body: Record<string, unknown>) {
  const promotionCode =
    typeof body.promotionCode === 'string' ? body.promotionCode.trim().toUpperCase() : ''

  if (!promotionCode) return undefined

  const serviceSupabase = createServiceRoleClient()
  const resolution = await resolveDiscountCodeForApplication(serviceSupabase, promotionCode, {
    scope: 'polar-checkout',
    allowPromotionFallbackOnAffiliateLookupError: true,
  })

  if (resolution.status === 'affiliate') {
    return resolution.affiliate.polar_discount_id ?? getPolarDiscountId(resolution.affiliate.discount_code)
  }

  if (resolution.status === 'promotion') {
    return getPolarDiscountId(resolution.promotion.paddleDiscountCode ?? resolution.code)
  }

  return undefined
}

export async function POST(request: NextRequest) {
  const configurationError = getPolarConfigurationError()
  if (configurationError) return err(configurationError, 500)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return err('Unauthorized', 401)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return err('Invalid JSON body')
  }

  const requestedPriceId = typeof body.priceId === 'string' ? body.priceId : undefined
  const pricingCountryCode = detectRequestCountry(request.headers)
  const proPlan = getProPlanForCountry(pricingCountryCode)
  const selectedPriceOption =
    requestedPriceId
      ? proPlan.getPriceById(requestedPriceId)
      : proPlan.defaultPrice

  if (!selectedPriceOption || !['monthly', 'annual'].includes(selectedPriceOption.id)) {
    return err('Invalid Pro plan selection')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, plan, subscription_status')
    .eq('id', user.id)
    .single()

  if (!profile) return err('Profile not found', 500)
  if (profile.plan === 'pro' && profile.subscription_status === 'active') {
    return err('Already subscribed to Pro')
  }

  const interval = selectedPriceOption.id === 'annual' ? 'annual' : 'monthly'
  const productId = getPolarProductId(interval)
  if (!productId) return err(`Polar ${interval} product is not configured`, 500)

  const discountId = await resolvePolarDiscountId(body)
  const siteUrl = getSiteUrl()

  try {
    const checkout = await createPolarCheckout({
      userId: user.id,
      userEmail: profile.email,
      userName: profile.full_name,
      priceOption: selectedPriceOption,
      productId,
      discountId,
      successUrl: `${siteUrl}/dashboard/pricing?upgraded=true&provider=polar&checkout_id={CHECKOUT_ID}`,
      returnUrl: `${siteUrl}/dashboard/pricing?polar_cancelled=true`,
    })

    if (!checkout.url) {
      return err('Polar did not return a checkout URL', 500)
    }

    return ok({
      provider: 'polar',
      checkoutId: checkout.id,
      checkoutUrl: checkout.url,
      priceId: selectedPriceOption.id,
      productId,
      currency: selectedPriceOption.display.currency,
      amount: selectedPriceOption.display.displayPrice,
      discountId: discountId ?? null,
    })
  } catch (error) {
    console.error('Polar checkout failed:', error)
    return err('Polar checkout failed. Check Polar credentials and product IDs.', 502)
  }
}
