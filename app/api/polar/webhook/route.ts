import { NextRequest, NextResponse } from 'next/server'

import {
  getPolarIntervalFromProductId,
  verifyPolarWebhookSignature,
} from '@/lib/polar'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

type PolarWebhookEvent = {
  type?: string
  data?: Record<string, any>
}

function getCustomerExternalId(data: Record<string, any>) {
  return (
    data.metadata?.user_id ??
    data.customer?.external_id ??
    data.external_customer_id ??
    data.customer_external_id ??
    null
  )
}

function getSubscriptionInterval(data: Record<string, any>) {
  const metadataInterval = data.metadata?.interval
  if (metadataInterval === 'monthly' || metadataInterval === 'annual') {
    return metadataInterval
  }

  const recurringInterval = data.recurring_interval ?? data.product?.recurring_interval
  if (recurringInterval === 'month') return 'monthly'
  if (recurringInterval === 'year') return 'annual'

  return getPolarIntervalFromProductId(data.product_id ?? data.product?.id)
}

async function upsertActiveSubscription(data: Record<string, any>, status = 'active') {
  const userId = getCustomerExternalId(data)
  if (!userId) {
    console.warn('Polar webhook missing customer external id', {
      subscriptionId: data.id ?? data.subscription_id,
      customerId: data.customer_id,
    })
    return
  }

  const subscriptionId = data.subscription_id ?? data.id ?? null
  const customerId = data.customer_id ?? data.customer?.id ?? null
  const interval = getSubscriptionInterval(data)
  const serviceSupabase = createServiceRoleClient()

  const { error } = await serviceSupabase
    .from('profiles')
    .update({
      plan: 'pro',
      subscription_status: status,
      subscription_interval: interval,
      payment_provider: 'polar',
      polar_customer_id: customerId,
      polar_subscription_id: subscriptionId,
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Polar webhook profile update failed: ${error.message}`)
  }
}

async function markSubscriptionStatus(data: Record<string, any>, status: string) {
  const serviceSupabase = createServiceRoleClient()
  const subscriptionId = data.subscription_id ?? data.id ?? null
  const userId = getCustomerExternalId(data)

  const values =
    status === 'canceled' || status === 'revoked'
      ? {
          plan: 'free',
          subscription_status: status,
          subscription_interval: null,
          polar_subscription_id: null,
        }
      : {
          subscription_status: status,
          payment_provider: 'polar',
        }

  let query = serviceSupabase.from('profiles').update(values)

  if (userId) {
    query = query.eq('id', userId)
  } else if (subscriptionId) {
    query = query.eq('polar_subscription_id', subscriptionId)
  } else {
    console.warn('Polar webhook cannot mark subscription status without user/subscription id')
    return
  }

  const { error } = await query
  if (error) {
    throw new Error(`Polar webhook status update failed: ${error.message}`)
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'POLAR_WEBHOOK_SECRET is not set' }, { status: 500 })
  }

  const rawBody = await request.text()
  const isValid = verifyPolarWebhookSignature({
    rawBody,
    headers: request.headers,
    secret: webhookSecret,
  })

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  let event: PolarWebhookEvent
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const eventType = event.type
  const data = event.data ?? {}

  try {
    switch (eventType) {
      case 'subscription.created':
      case 'subscription.active':
      case 'subscription.updated':
        await upsertActiveSubscription(data, data.status ?? 'active')
        break
      case 'order.paid':
        if (data.subscription_id) {
          await upsertActiveSubscription(data, 'active')
        }
        break
      case 'subscription.past_due':
        await markSubscriptionStatus(data, 'past_due')
        break
      case 'subscription.canceled':
        if (data.cancel_at_period_end && data.status === 'active') {
          await markSubscriptionStatus(data, 'active')
        } else {
          await markSubscriptionStatus(data, 'canceled')
        }
        break
      case 'subscription.revoked':
        await markSubscriptionStatus(data, 'revoked')
        break
      case 'subscription.uncanceled':
        await upsertActiveSubscription(data, data.status ?? 'active')
        break
      case 'order.refunded':
        await markSubscriptionStatus(data, 'refunded')
        break
      default:
        console.log(`Unhandled Polar webhook event: ${eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Polar webhook handler failed:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
