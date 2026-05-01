import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PRO_PLAN } from '@/lib/pricing'
import {
  createPayPalProSubscription,
  getPayPalApprovalUrl,
  getPayPalConfigurationError,
  getPayPalSubscriptionPlanId,
} from '@/lib/paypal'
import { getSiteUrl } from '@/lib/site'

function ok(data: Record<string, unknown>) {
  return NextResponse.json({ success: true, data })
}

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
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
  const selectedPriceOption =
    requestedPriceId
      ? PRO_PLAN.getPriceById(requestedPriceId)
      : PRO_PLAN.defaultPrice

  if (!selectedPriceOption || !['monthly', 'annual'].includes(selectedPriceOption.id)) {
    return err('Invalid Pro plan selection')
  }

  const siteUrl = getSiteUrl()
  const returnUrl = `${siteUrl}/api/paypal/capture`
  const cancelUrl = `${siteUrl}/dashboard/pricing?paypal_cancelled=true`
  const subscriptionInterval = selectedPriceOption.id === 'annual' ? 'annual' : 'monthly'
  const subscriptionPlanId = getPayPalSubscriptionPlanId(subscriptionInterval)

  if (!subscriptionPlanId) {
    return err(
      `PayPal ${subscriptionInterval} subscription plan is not configured. Add ${subscriptionInterval === 'annual' ? 'PAYPAL_PRO_PLAN_ANNUAL' : 'PAYPAL_PRO_PLAN_MONTHLY'} in Vercel.`,
      500
    )
  }

  if (subscriptionPlanId) {
    try {
      const subscription = await createPayPalProSubscription({
        userId: user.id,
        userEmail: profile.email,
        priceOption: selectedPriceOption,
        planId: subscriptionPlanId,
        returnUrl,
        cancelUrl,
      })
      const approvalUrl = getPayPalApprovalUrl(subscription)

      if (!approvalUrl) {
        return err('PayPal did not return a subscription approval URL', 500)
      }

      return ok({
        provider: 'paypal',
        mode: 'subscription',
        subscriptionId: subscription.id,
        approvalUrl,
        priceId: selectedPriceOption.id,
        currency: selectedPriceOption.display.currency,
        amount: selectedPriceOption.display.displayPrice,
      })
    } catch (error) {
      console.error('PayPal subscription checkout failed:', error)
      return err('PayPal subscription checkout failed. Check PayPal credentials and plan IDs.', 502)
    }
  }
}
