import { NextRequest, NextResponse } from 'next/server'
import {
  getPayPalSubscriptionIntervalFromPlanId,
  verifyPayPalWebhookSignature,
} from '@/lib/paypal'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

type PayPalWebhookResource = {
  id?: string
  custom_id?: string
  plan_id?: string
  status?: string
  subscriber?: {
    payer_id?: string
    email_address?: string
  }
  billing_agreement_id?: string
}

type PayPalWebhookEvent = {
  id?: string
  event_type?: string
  resource?: PayPalWebhookResource
}

function ok() {
  return NextResponse.json({ success: true })
}

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

function getSubscriptionId(resource?: PayPalWebhookResource) {
  return resource?.id ?? resource?.billing_agreement_id ?? null
}

function isActiveSubscriptionStatus(status?: string) {
  return ['ACTIVE', 'APPROVED'].includes(status ?? '')
}

async function findProfileBySubscriptionId(subscriptionId: string) {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('paypal_subscription_id', subscriptionId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data?.id ?? null
}

async function upsertActiveSubscription(resource: PayPalWebhookResource) {
  const subscriptionId = getSubscriptionId(resource)
  const userId = resource.custom_id ?? (subscriptionId ? await findProfileBySubscriptionId(subscriptionId) : null)
  const subscriptionInterval = getPayPalSubscriptionIntervalFromPlanId(resource.plan_id)

  if (!subscriptionId || !userId || !subscriptionInterval) {
    console.warn('PayPal webhook active subscription missing lookup data', {
      subscriptionId,
      userId,
      planId: resource.plan_id,
    })
    return
  }

  const supabase = createServiceRoleClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      plan: 'pro',
      subscription_status: 'active',
      subscription_interval: subscriptionInterval,
      paypal_subscription_id: subscriptionId,
      paypal_customer_id: resource.subscriber?.payer_id ?? null,
    })
    .eq('id', userId)

  if (error) {
    throw error
  }
}

async function markSubscriptionInactive(resource: PayPalWebhookResource, status: string) {
  const subscriptionId = getSubscriptionId(resource)
  const userId = resource.custom_id ?? (subscriptionId ? await findProfileBySubscriptionId(subscriptionId) : null)

  if (!subscriptionId && !userId) {
    console.warn('PayPal webhook inactive subscription missing lookup data', {
      subscriptionId,
      userId,
      status,
    })
    return
  }

  const supabase = createServiceRoleClient()
  const query = supabase
    .from('profiles')
    .update({
      plan: 'free',
      subscription_status: status,
      subscription_interval: null,
    })

  const { error } = userId
    ? await query.eq('id', userId)
    : await query.eq('paypal_subscription_id', subscriptionId!)

  if (error) {
    throw error
  }
}

export async function POST(request: NextRequest) {
  let event: PayPalWebhookEvent

  try {
    event = await request.json()
  } catch {
    return err('Invalid JSON body')
  }

  try {
    const verified = await verifyPayPalWebhookSignature({
      transmissionId: request.headers.get('paypal-transmission-id'),
      transmissionTime: request.headers.get('paypal-transmission-time'),
      certUrl: request.headers.get('paypal-cert-url'),
      authAlgo: request.headers.get('paypal-auth-algo'),
      transmissionSig: request.headers.get('paypal-transmission-sig'),
      webhookEvent: event,
    })

    if (!verified) {
      return err('Invalid PayPal webhook signature', 401)
    }

    const resource = event.resource ?? {}

    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.CREATED':
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.UPDATED': {
        if (isActiveSubscriptionStatus(resource.status)) {
          await upsertActiveSubscription(resource)
        }
        break
      }
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await markSubscriptionInactive(resource, 'cancelled')
        break
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await markSubscriptionInactive(resource, 'suspended')
        break
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await markSubscriptionInactive(resource, 'expired')
        break
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await markSubscriptionInactive(resource, 'past_due')
        break
      case 'PAYMENT.SALE.COMPLETED':
        // Subscription activations are handled by BILLING.SUBSCRIPTION.* events.
        break
      default:
        console.log(`Unhandled PayPal webhook event: ${event.event_type ?? 'unknown'}`)
    }

    return ok()
  } catch (error) {
    console.error('PayPal webhook handling failed:', error)
    return err('PayPal webhook handling failed', 500)
  }
}
