import { NextRequest, NextResponse } from 'next/server'

import { syncRazorpaySubscriptionAccess } from '@/lib/razorpay-subscription-access'
import { recordAffiliateConversionForUser } from '@/lib/affiliate-server'
import {
  fetchRazorpaySubscription,
  verifyRazorpayWebhookSignature,
  type RazorpaySubscriptionResponse,
} from '@/lib/razorpay'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

type RazorpayWebhookEvent = {
  event?: string
  payload?: {
    subscription?: {
      entity?: RazorpaySubscriptionResponse
    }
    payment?: {
      entity?: {
        id?: string
        amount?: number
        currency?: string
        status?: string
        method?: string
        captured?: boolean
        subscription_id?: string
        notes?: Record<string, string>
      }
    }
  }
}

async function getStoredSubscription(
  serviceSupabase: ReturnType<typeof createServiceRoleClient>,
  subscriptionId: string
) {
  const { data, error } = await serviceSupabase
    .from('razorpay_subscriptions')
    .select('user_id, plan_interval')
    .eq('razorpay_subscription_id', subscriptionId)
    .maybeSingle()

  if (error) {
    throw new Error(`Razorpay subscription lookup failed: ${error.message}`)
  }

  return data
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature') ?? ''

  if (!verifyRazorpayWebhookSignature({ rawBody, signature })) {
    return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 })
  }

  let event: RazorpayWebhookEvent
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookEvent
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const serviceSupabase = createServiceRoleClient()
  const eventType = event.event ?? ''

  if (eventType.startsWith('subscription.')) {
    const subscription = event.payload?.subscription?.entity
    if (!subscription?.id) {
      return NextResponse.json({ success: false, error: 'Missing subscription data' }, { status: 400 })
    }

    const storedSubscription = await getStoredSubscription(serviceSupabase, subscription.id)
    if (!storedSubscription) {
      console.warn('Razorpay webhook subscription not found:', subscription.id)
      return NextResponse.json({ success: true, ignored: true })
    }

    const interval = storedSubscription.plan_interval === 'annual' ? 'annual' : 'monthly'
    await syncRazorpaySubscriptionAccess({
      supabase: serviceSupabase,
      userId: storedSubscription.user_id,
      subscription,
      interval,
      metadata: {
        source: 'webhook',
        event: eventType,
      },
    })

    return NextResponse.json({ success: true })
  }

  if (eventType === 'payment.captured' || eventType === 'payment.authorized') {
    const payment = event.payload?.payment?.entity
    const subscriptionId = payment?.subscription_id

    if (!subscriptionId || !payment?.id) {
      return NextResponse.json({ success: true, ignored: true })
    }

    const storedSubscription = await getStoredSubscription(serviceSupabase, subscriptionId)
    if (!storedSubscription) {
      console.warn('Razorpay webhook payment subscription not found:', subscriptionId)
      return NextResponse.json({ success: true, ignored: true })
    }

    const subscription = await fetchRazorpaySubscription(subscriptionId)
    const interval = storedSubscription.plan_interval === 'annual' ? 'annual' : 'monthly'
    await syncRazorpaySubscriptionAccess({
      supabase: serviceSupabase,
      userId: storedSubscription.user_id,
      subscription,
      interval,
      paymentId: payment.id,
      metadata: {
        method: payment.method ?? null,
        captured: payment.captured ?? null,
        source: 'webhook',
        event: eventType,
      },
    })

    try {
      await recordAffiliateConversionForUser(serviceSupabase, {
        userId: storedSubscription.user_id,
        provider: 'razorpay',
        subscriptionId,
        transactionId: payment.id,
        planName: `Razorpay Pro ${interval}`,
        status: 'active',
        grossAmount: (payment.amount ?? 0) / 100,
        currencyCode: payment.currency ?? 'INR',
        interval,
      })
    } catch (affiliateError) {
      console.error('Razorpay affiliate conversion recording failed:', affiliateError)
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: true, ignored: true })
}
