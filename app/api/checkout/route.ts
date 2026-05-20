import { NextRequest, NextResponse } from 'next/server'

import { detectRequestCountry } from '@/lib/cookie-consent'
import { resolveDiscountCodeForApplication } from '@/lib/discount-code-resolution'
import {
  createPolarCheckout,
  getPolarConfigurationError,
  getPolarDiscountId,
  getPolarProductId,
} from '@/lib/polar'
import {
  createRazorpaySubscription,
  getRazorpayAmountPaise,
  getRazorpaySubscriptionConfigurationError,
  getRazorpaySubscriptionPlanId,
} from '@/lib/razorpay'
import { getProPlanForCountry } from '@/lib/pricing'
import { isPro as hasActiveProAccess } from '@/lib/planUtils'
import { getSiteUrl } from '@/lib/site'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createClient } from '@/lib/supabase/server'

type CheckoutProfile = {
  id: string
  email: string
  full_name: string | null
  plan: 'free' | 'pro'
  subscription_status: string | null
  payment_provider?: string | null
  current_period_end?: string | null
}

function ok(data: Record<string, unknown>) {
  return NextResponse.json({ success: true, data })
}

function err(message: string, status = 400) {
  // Log every failure server-side so it shows up in Vercel runtime logs.
  // Status >= 500 is logged as console.error (visible at Error level filter),
  // 4xx is console.warn so it's distinguishable from real exceptions.
  if (status >= 500) {
    console.error('[checkout] error', { status, message })
  } else {
    console.warn('[checkout] rejected', { status, message })
  }
  return NextResponse.json({ success: false, error: message }, { status })
}

function getPolarEmbedOrigin(request: NextRequest, fallbackSiteUrl: string) {
  const requestOrigin = request.headers.get('origin')

  try {
    return new URL(requestOrigin || fallbackSiteUrl).origin
  } catch {
    return new URL(fallbackSiteUrl).origin
  }
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

async function getOrCreateCheckoutProfile(params: {
  supabase: Awaited<ReturnType<typeof createClient>>
  user: NonNullable<Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>['auth']['getUser']>>['data']['user']>
}) {
  const selectColumns = 'id, email, full_name, plan, subscription_status, payment_provider, current_period_end'
  const { data: existingProfile, error: existingError } = await params.supabase
    .from('profiles')
    .select(selectColumns)
    .eq('id', params.user.id)
    .maybeSingle()

  if (existingError) {
    throw new Error(`Profile lookup failed: ${existingError.message}`)
  }

  if (existingProfile) {
    return existingProfile as CheckoutProfile
  }

  const serviceSupabase = createServiceRoleClient()
  const { data: createdProfile, error: createError } = await serviceSupabase
    .from('profiles')
    .upsert({
      id: params.user.id,
      email: params.user.email ?? '',
      full_name: (params.user.user_metadata?.full_name as string | undefined) ?? null,
      avatar_url: (params.user.user_metadata?.avatar_url as string | undefined) ?? null,
    }, { onConflict: 'id' })
    .select(selectColumns)
    .single()

  if (createError || !createdProfile) {
    throw new Error(`Profile creation failed: ${createError?.message ?? 'unknown error'}`)
  }

  return createdProfile as CheckoutProfile
}

export async function POST(request: NextRequest) {
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

  const pricingCountryCode = detectRequestCountry(request.headers)
  const proPlan = getProPlanForCountry(pricingCountryCode)
  const requestedPriceId = typeof body.priceId === 'string' ? body.priceId : undefined
  const selectedPriceOption =
    requestedPriceId
      ? proPlan.getPriceById(requestedPriceId)
      : proPlan.defaultPrice

  if (!selectedPriceOption || !['monthly', 'annual'].includes(selectedPriceOption.id)) {
    return err('Invalid Pro plan selection')
  }

  let profile: CheckoutProfile
  try {
    profile = await getOrCreateCheckoutProfile({ supabase, user })
  } catch (error) {
    console.error('Checkout profile resolution failed:', error)
    return err('Profile could not be prepared for checkout', 500)
  }

  if (hasActiveProAccess(profile)) {
    return err('Already subscribed to Pro')
  }

  const interval = selectedPriceOption.id === 'annual' ? 'annual' : 'monthly'

  if (pricingCountryCode === 'IN') {
    const promotionCode =
      typeof body.promotionCode === 'string' ? body.promotionCode.trim().toUpperCase() : ''
    const useDiscountedPlan = Boolean(promotionCode)
    const configurationError = getRazorpaySubscriptionConfigurationError(interval, {
      discounted: useDiscountedPlan,
    })
    if (configurationError) return err(configurationError, 500)

    let amount: number
    try {
      amount = getRazorpayAmountPaise(selectedPriceOption)
    } catch (error) {
      return err(error instanceof Error ? error.message : 'Invalid Razorpay price configuration', 500)
    }

    const planId = getRazorpaySubscriptionPlanId(interval, { discounted: useDiscountedPlan })
    if (!planId) return err(`Razorpay ${interval} plan is not configured`, 500)

    const subscription = await createRazorpaySubscription({
      planId,
      interval,
      notes: {
        user_id: user.id,
        plan_interval: interval,
        product: 'pro_subscription',
        discount_applied: useDiscountedPlan ? 'true' : 'false',
        promotion_code: promotionCode,
      },
    })

    const serviceSupabase = createServiceRoleClient()
    const { error: insertError } = await serviceSupabase
      .from('razorpay_subscriptions')
      .upsert({
        user_id: user.id,
        razorpay_subscription_id: subscription.id,
        razorpay_plan_id: planId,
        razorpay_customer_id: subscription.customer_id ?? null,
        plan_interval: interval,
        status: subscription.status ?? 'created',
        current_period_start: subscription.current_start ? new Date(subscription.current_start * 1000).toISOString() : null,
        current_period_end: subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : null,
        paid_count: subscription.paid_count ?? 0,
        remaining_count: subscription.remaining_count ?? null,
        metadata: {
          price_id: selectedPriceOption.id,
          country: pricingCountryCode,
          amount,
          discount_applied: useDiscountedPlan,
          promotion_code: promotionCode || null,
        },
      }, { onConflict: 'razorpay_subscription_id' })

    if (insertError) {
      console.error('Razorpay subscription insert failed:', insertError)
      return err('Razorpay subscription could not be recorded', 500)
    }

    return ok({
      provider: 'razorpay',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID,
      subscriptionId: subscription.id,
      amount,
      currency: 'INR',
      priceId: selectedPriceOption.id,
      interval,
      discountApplied: useDiscountedPlan,
      discountCode: promotionCode || null,
      name: 'Rezoomed Pro',
      description: `Rezoomed Pro ${interval === 'annual' ? 'Annual' : 'Monthly'}`,
      customerEmail: profile.email,
      customerName: profile.full_name,
    })
  }

  const configurationError = getPolarConfigurationError()
  if (configurationError) return err(configurationError, 500)

  const productId = getPolarProductId(interval)
  if (!productId) return err(`Polar ${interval} product is not configured`, 500)

  const discountId = await resolvePolarDiscountId(body)
  const siteUrl = getSiteUrl()
  const embedOrigin = getPolarEmbedOrigin(request, siteUrl)

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
      embedOrigin,
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
