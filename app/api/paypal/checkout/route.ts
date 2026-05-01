import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getActivePromotionById,
  getEffectiveDisplay,
  getProPlanForCountry,
  type DiscountType,
  type PriceOption,
  type PromoConfig,
} from '@/lib/pricing'
import {
  createPayPalProOrder,
  getPayPalApprovalUrl,
  getPayPalConfigurationError,
  isPayPalOrderCurrencySupported,
} from '@/lib/paypal'
import { getSiteUrl } from '@/lib/site'
import { detectRequestCountry } from '@/lib/cookie-consent'
import { resolveDiscountCodeForApplication } from '@/lib/discount-code-resolution'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

function ok(data: Record<string, unknown>) {
  return NextResponse.json({ success: true, data })
}

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

function buildRuntimePromo(params: {
  id: string
  code?: string
  discountType: DiscountType
  discountValue: number
  appliesTo: 'all' | string
  badge?: string
  label?: string
}): PromoConfig {
  return {
    id: params.id,
    name: params.label ?? params.code ?? params.id,
    paddleDiscountId: '',
    paddleDiscountCode: params.code,
    discountType: params.discountType,
    discountValue: params.discountValue,
    appliesTo: params.appliesTo,
    label: params.label ?? params.code ?? 'Discount',
    badge: params.badge ?? (params.discountType === 'percent' ? `${params.discountValue}% OFF` : 'Discount'),
    headline: '',
    subheadline: '',
    ctaLabel: '',
    disclaimerText: '',
    isExitIntent: false,
    isBanner: false,
    isAutoApply: false,
    exitIntentTimerSeconds: 0,
  }
}

async function resolvePayPalPromo(body: Record<string, unknown>) {
  const promotionCode =
    typeof body.promotionCode === 'string' ? body.promotionCode.trim().toUpperCase() : ''
  const promotionId =
    typeof body.promotionId === 'string' ? body.promotionId.trim() : ''

  if (promotionCode) {
    const serviceSupabase = createServiceRoleClient()
    const resolution = await resolveDiscountCodeForApplication(serviceSupabase, promotionCode, {
      scope: 'paypal-checkout',
      allowPromotionFallbackOnAffiliateLookupError: true,
    })

    if (resolution.status === 'affiliate') {
      return buildRuntimePromo({
        id: `affiliate-${resolution.affiliate.discount_code.toLowerCase()}`,
        code: resolution.affiliate.discount_code,
        discountType: 'percent',
        discountValue: resolution.affiliate.discount_percent,
        appliesTo: 'all',
        badge: `${resolution.affiliate.discount_percent}% OFF`,
        label: resolution.affiliate.discount_code,
      })
    }

    if (resolution.status === 'promotion') {
      return resolution.promotion
    }

    return null
  }

  if (promotionId) {
    return getActivePromotionById(promotionId)
  }

  return null
}

function applyPromoToPriceOption(priceOption: PriceOption, promo: PromoConfig | null): PriceOption {
  if (!promo) return priceOption

  return {
    ...priceOption,
    display: getEffectiveDisplay(priceOption, promo),
  }
}

export async function POST(request: NextRequest) {
  const configurationError = getPayPalConfigurationError()
  if (configurationError) return err(configurationError, 500)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return err('Unauthorized', 401)

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, plan, subscription_status')
    .eq('id', user.id)
    .single()

  if (!profile) return err('Profile not found', 500)
  if (profile.plan === 'pro' && profile.subscription_status === 'active') {
    return err('Already subscribed to Pro')
  }

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

  const activePromo = await resolvePayPalPromo(body)
  const checkoutPriceOption = applyPromoToPriceOption(selectedPriceOption, activePromo)

  if (!isPayPalOrderCurrencySupported(checkoutPriceOption.display.currency)) {
    return err(
      `PayPal does not support ${checkoutPriceOption.display.currency} checkout here. Use USD for PayPal or enable Razorpay/Cashfree for INR payments.`,
      400
    )
  }

  const siteUrl = getSiteUrl()
  const returnUrl = `${siteUrl}/api/paypal/capture`
  const cancelUrl = `${siteUrl}/dashboard/pricing?paypal_cancelled=true`

  try {
    const order = await createPayPalProOrder({
      userId: user.id,
      userEmail: profile.email,
      priceOption: checkoutPriceOption,
      returnUrl,
      cancelUrl,
    })
    const approvalUrl = getPayPalApprovalUrl(order)

    if (!approvalUrl) {
      console.error('PayPal order missing buyer approval URL:', {
        orderId: order.id,
        status: order.status,
        links: order.links?.map(link => ({ rel: link.rel, method: link.method })),
      })
      return err('PayPal did not return an approval URL', 500)
    }

    return ok({
      provider: 'paypal',
      mode: 'order',
      orderId: order.id,
      approvalUrl,
      priceId: selectedPriceOption.id,
      currency: checkoutPriceOption.display.currency,
      amount: checkoutPriceOption.display.displayPrice,
      originalAmount: checkoutPriceOption.display.actualPrice ?? checkoutPriceOption.display.displayPrice,
      discountCode: activePromo?.paddleDiscountCode,
    })
  } catch (error) {
    console.error('PayPal order checkout failed:', error)
    return err('PayPal checkout failed. Check PayPal credentials.', 502)
  }
}
