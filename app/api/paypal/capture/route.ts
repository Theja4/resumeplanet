import { NextRequest, NextResponse } from 'next/server'
import {
  capturePayPalOrder,
  getPayPalSubscription,
  getPayPalSubscriptionIntervalFromPlanId,
} from '@/lib/paypal'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getSiteUrl } from '@/lib/site'
import { recordAffiliateConversionForUser } from '@/lib/affiliate-server'

function redirectWithStatus(path: string) {
  return NextResponse.redirect(`${getSiteUrl()}${path}`)
}

function resolveSubscriptionInterval(referenceId?: string) {
  if (referenceId === 'pro-annual') return 'annual' as const
  if (referenceId === 'pro-monthly') return 'monthly' as const
  return null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const subscriptionId = searchParams.get('subscription_id')
  const orderId = searchParams.get('token')

  if (!orderId && !subscriptionId) {
    return redirectWithStatus('/dashboard/pricing?paypal_error=missing_order')
  }

  try {
    if (subscriptionId) {
      const subscription = await getPayPalSubscription(subscriptionId)
      const userId = subscription.custom_id
      const subscriptionInterval = getPayPalSubscriptionIntervalFromPlanId(subscription.plan_id)

      if (!userId || !subscriptionInterval) {
        return redirectWithStatus('/dashboard/pricing?paypal_error=invalid_subscription')
      }

      if (!['ACTIVE', 'APPROVED'].includes(subscription.status ?? '')) {
        return redirectWithStatus('/dashboard/pricing?paypal_error=subscription_not_active')
      }

      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user && user.id !== userId) {
        return redirectWithStatus('/dashboard/pricing?paypal_error=user_mismatch')
      }

      const serviceSupabase = createServiceRoleClient()
      const { error } = await serviceSupabase
        .from('profiles')
        .update({
          plan: 'pro',
          subscription_status: 'paid',
          subscription_interval: subscriptionInterval,
          paypal_subscription_id: subscription.id,
        })
        .eq('id', userId)

      if (error) {
        console.error('PayPal subscription profile upgrade failed:', error)
        return redirectWithStatus('/dashboard/pricing?paypal_error=profile_update_failed')
      }

      return redirectWithStatus('/dashboard/pricing?upgraded=true&provider=paypal')
    }

    if (!orderId) {
      return redirectWithStatus('/dashboard/pricing?paypal_error=missing_order')
    }

    const capturedOrder = await capturePayPalOrder(orderId)
    const purchaseUnit = capturedOrder.purchase_units?.[0]
    const userId = purchaseUnit?.custom_id
    const subscriptionInterval = resolveSubscriptionInterval(purchaseUnit?.reference_id)

    if (!userId || !subscriptionInterval) {
      return redirectWithStatus('/dashboard/pricing?paypal_error=invalid_order')
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user && user.id !== userId) {
      return redirectWithStatus('/dashboard/pricing?paypal_error=user_mismatch')
    }

    const serviceSupabase = createServiceRoleClient()
    const { error } = await serviceSupabase
      .from('profiles')
      .update({
        plan: 'pro',
        subscription_status: 'paid',
        subscription_interval: subscriptionInterval,
      })
      .eq('id', userId)

    if (error) {
      console.error('PayPal profile upgrade failed:', error)
      return redirectWithStatus('/dashboard/pricing?paypal_error=profile_update_failed')
    }

    const capture = purchaseUnit?.payments?.captures?.[0]
    const amount = Number(capture?.amount?.value ?? purchaseUnit?.amount?.value ?? 0)

    try {
      await recordAffiliateConversionForUser(serviceSupabase, {
        userId,
        provider: 'paypal',
        subscriptionId: orderId,
        transactionId: capture?.id ?? orderId,
        planName: `PayPal Pro ${subscriptionInterval}`,
        status: 'active',
        grossAmount: Number.isFinite(amount) ? amount : 0,
        currencyCode: capture?.amount?.currency_code ?? purchaseUnit?.amount?.currency_code ?? 'USD',
        interval: subscriptionInterval,
      })
    } catch (affiliateError) {
      console.error('PayPal affiliate conversion recording failed:', affiliateError)
    }

    return redirectWithStatus('/dashboard/pricing?upgraded=true&provider=paypal')
  } catch (error) {
    console.error('PayPal capture failed:', error)
    return redirectWithStatus('/dashboard/pricing?paypal_error=capture_failed')
  }
}
