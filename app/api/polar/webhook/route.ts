import { NextRequest, NextResponse } from 'next/server'

import {
  getPolarIntervalFromProductId,
  verifyPolarWebhookSignature,
} from '@/lib/polar'
import { recordAffiliateConversionForUser } from '@/lib/affiliate-server'
import { isPeriodEndInFuture, normalizeIsoDate } from '@/lib/subscriptionPeriod'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

type PolarWebhookEvent = {
  type?: string
  data?: PolarWebhookData
}

type PolarWebhookData = Record<string, unknown>

function asRecord(value: unknown): PolarWebhookData | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as PolarWebhookData
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : null
}

function getNumber(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function getCustomerExternalId(data: PolarWebhookData) {
  const metadata = asRecord(data.metadata)
  const customer = asRecord(data.customer)

  return (
    getString(metadata?.user_id) ??
    getString(customer?.external_id) ??
    getString(data.external_customer_id) ??
    getString(data.customer_external_id) ??
    null
  )
}

function getSubscriptionInterval(data: PolarWebhookData) {
  const metadata = asRecord(data.metadata)
  const product = asRecord(data.product)
  const metadataInterval = getString(metadata?.interval)
  if (metadataInterval === 'monthly' || metadataInterval === 'annual') {
    return metadataInterval
  }

  const recurringInterval = getString(data.recurring_interval) ?? getString(product?.recurring_interval)
  if (recurringInterval === 'month') return 'monthly'
  if (recurringInterval === 'year') return 'annual'

  return getPolarIntervalFromProductId(getString(data.product_id) ?? getString(product?.id))
}

function getCurrentPeriodStart(data: PolarWebhookData) {
  return normalizeIsoDate(getString(data.current_period_start))
}

function getCurrentPeriodEnd(data: PolarWebhookData) {
  return normalizeIsoDate(getString(data.current_period_end)) ?? normalizeIsoDate(getString(data.ends_at))
}

function hasPaidAccessThroughCanceledPeriod(data: PolarWebhookData) {
  return isPeriodEndInFuture(getCurrentPeriodEnd(data))
}

function hasPolarProAccess(status: string, data: PolarWebhookData) {
  return (
    status === 'active' ||
    status === 'trialing' ||
    status === 'past_due' ||
    (status === 'canceled' && hasPaidAccessThroughCanceledPeriod(data))
  )
}

function getStatus(data: PolarWebhookData, fallback = 'active') {
  return getString(data.status) ?? fallback
}

function getPolarPaidAmount(data: PolarWebhookData) {
  const rawAmount =
    getNumber(data.total_amount) ??
    getNumber(data.amount) ??
    getNumber(data.subtotal_amount)

  return rawAmount == null ? 0 : rawAmount / 100
}

function shouldDowngradeForStatus(status: string) {
  return (
    status === 'canceled' ||
    status === 'revoked' ||
    status === 'unpaid' ||
    status === 'incomplete_expired'
  )
}

async function upsertActiveSubscription(data: PolarWebhookData, status = 'active') {
  if (!hasPolarProAccess(status, data)) {
    await markSubscriptionStatus(data, status)
    return
  }

  const userId = getCustomerExternalId(data)
  if (!userId) {
    console.warn('Polar webhook missing customer external id', {
      subscriptionId: getString(data.id) ?? getString(data.subscription_id),
      customerId: getString(data.customer_id),
    })
    return
  }

  const customer = asRecord(data.customer)
  const subscriptionId = getString(data.subscription_id) ?? getString(data.id)
  const customerId = getString(data.customer_id) ?? getString(customer?.id)
  const interval = getSubscriptionInterval(data)
  const currentPeriodStart = getCurrentPeriodStart(data)
  const currentPeriodEnd = getCurrentPeriodEnd(data)
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
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Polar webhook profile update failed: ${error.message}`)
  }
}

async function markSubscriptionStatus(data: PolarWebhookData, status: string) {
  const serviceSupabase = createServiceRoleClient()
  const customer = asRecord(data.customer)
  const subscriptionId = getString(data.subscription_id) ?? getString(data.id)
  const customerId = getString(data.customer_id) ?? getString(customer?.id)
  const userId = getCustomerExternalId(data)
  const interval = getSubscriptionInterval(data)
  const currentPeriodStart = getCurrentPeriodStart(data)
  const currentPeriodEnd = getCurrentPeriodEnd(data)
  const hasDeferredAccess = status === 'canceled' && hasPaidAccessThroughCanceledPeriod(data)

  const values =
    hasDeferredAccess
      ? {
          plan: 'pro',
          subscription_status: status,
          subscription_interval: interval,
          payment_provider: 'polar',
          polar_customer_id: customerId,
          polar_subscription_id: subscriptionId,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
        }
      : shouldDowngradeForStatus(status)
      ? {
          plan: 'free',
          subscription_status: status,
          subscription_interval: null,
          polar_subscription_id: null,
          current_period_start: null,
          current_period_end: null,
        }
      : {
          subscription_status: status,
          payment_provider: 'polar',
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
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
  const data = asRecord(event.data) ?? {}

  try {
    switch (eventType) {
      case 'subscription.created':
        if (hasPolarProAccess(getStatus(data), data)) {
          await upsertActiveSubscription(data, getStatus(data))
        }
        break
      case 'subscription.active':
      case 'subscription.updated':
        await upsertActiveSubscription(data, getStatus(data))
        break
      case 'order.paid':
        if (getString(data.subscription_id)) {
          await upsertActiveSubscription(data, 'active')
          const userId = getCustomerExternalId(data)
          if (userId) {
            const subscriptionId = getString(data.subscription_id) ?? getString(data.id)
            const interval = getSubscriptionInterval(data)
            try {
              await recordAffiliateConversionForUser(createServiceRoleClient(), {
                userId,
                provider: 'polar',
                subscriptionId,
                transactionId: getString(data.id) ?? subscriptionId,
                planName: `Polar Pro ${interval ?? 'subscription'}`,
                status: 'active',
                grossAmount: getPolarPaidAmount(data),
                currencyCode: getString(data.currency) ?? 'USD',
                interval,
              })
            } catch (affiliateError) {
              console.error('Polar affiliate conversion recording failed:', affiliateError)
            }
          }
        }
        break
      case 'subscription.past_due':
        await markSubscriptionStatus(data, 'past_due')
        break
      case 'subscription.canceled':
        await markSubscriptionStatus(data, 'canceled')
        break
      case 'subscription.revoked':
        await markSubscriptionStatus(data, 'revoked')
        break
      case 'subscription.uncanceled':
        await upsertActiveSubscription(data, getStatus(data))
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
