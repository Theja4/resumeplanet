import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod/v4'
import {
  fromMinorUnitAmount,
  normalizeAffiliateCode,
  roundCurrencyAmount,
  toMonthlyRecurringRevenue,
} from '@/lib/affiliate'
import {
  findAffiliateByDiscountCode,
  getAffiliateById,
  getAffiliateReferralBySubscriptionId,
  upsertAffiliateReferral,
} from '@/lib/affiliate-server'
import { verifyPaddleWebhook } from '@/lib/paddle'
import { findProPriceOptionByPaddleId } from '@/lib/pricing'
import { captureServerAnalyticsEvent } from '@/lib/analytics-server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

// ── Webhook payload schemas ─────────────────────────────────────────────────

const paddleCustomDataSchema = z.object({
  mode: z.string().optional(),
  userId: z.string().optional(),
  userEmail: z.string().optional(),
  orderId: z.string().optional(),
  affiliateDiscountCode: z.string().optional(),
  posthogDistinctId: z.string().optional(),
}).passthrough().optional().default({})

const paddlePriceSchema = z.object({
  id: z.string(),
  unitPrice: z.object({ amount: z.union([z.string(), z.number()]) }).optional(),
  billingCycle: z.object({
    interval: z.string(),
    frequency: z.number().optional(),
  }).optional(),
}).passthrough()

const paddleItemSchema = z.object({
  price: paddlePriceSchema.optional(),
}).passthrough()

const paddleTransactionSchema = z.object({
  id: z.string(),
  subscriptionId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  customData: paddleCustomDataSchema,
  items: z.array(paddleItemSchema).optional().default([]),
  details: z.object({
    totals: z.object({
      total: z.union([z.string(), z.number()]).optional(),
    }).optional(),
  }).optional(),
  status: z.string().optional(),
}).passthrough()

const paddleSubscriptionSchema = z.object({
  id: z.string(),
  status: z.string(),
  customerId: z.string().optional().nullable(),
  customData: paddleCustomDataSchema,
  items: z.array(paddleItemSchema).optional().default([]),
}).passthrough()

const paddleWebhookEventSchema = z.object({
  eventType: z.string(),
  data: z.record(z.string(), z.unknown()),
}).passthrough()

type PaddleTransaction = z.infer<typeof paddleTransactionSchema>
type PaddleSubscription = z.infer<typeof paddleSubscriptionSchema>
type PaddleCustomData = z.infer<typeof paddleCustomDataSchema>

function resolveInterval(priceId: string | undefined | null): 'monthly' | 'annual' | null {
  if (!priceId) return null
  const option = findProPriceOptionByPaddleId(priceId)
  if (!option) {
    console.warn(`resolveInterval: unknown Paddle price ID "${priceId}" — subscription_interval will be null`)
    return null
  }
  // 'week' interval is intentionally excluded (hidden price, not sold to end users)
  if (option.interval === 'month') return 'monthly'
  if (option.interval === 'year') return 'annual'
  return null
}

function resolvePlanName(priceId: string | undefined | null) {
  if (!priceId) return 'Pro'

  const option = findProPriceOptionByPaddleId(priceId)
  if (!option) return 'Pro'

  return `Pro ${option.label}`
}

function resolveReferralStatus(status: string | undefined | null): 'active' | 'trialing' | 'churned' {
  if (status === 'active') return 'active'
  if (status === 'trialing') return 'trialing'
  return 'churned'
}


// Service role client for webhook (bypasses RLS)
function createServiceClient() {
  return createServiceRoleClient()
}

type ServiceClient = ReturnType<typeof createServiceClient>

function throwIfError(error: { message: string } | null, context: string) {
  if (error) {
    throw new Error(`${context}: ${error.message}`)
  }
}

async function resolveReferredUserEmail(
  supabase: ServiceClient,
  customData: PaddleCustomData,
) {
  const explicitEmail =
    typeof customData?.userEmail === 'string' ? customData.userEmail.trim().toLowerCase() : ''

  if (explicitEmail) {
    return explicitEmail
  }

  const userId = typeof customData?.userId === 'string' ? customData.userId : null

  if (!userId) {
    return 'unknown@rezoomed.local'
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`resolveReferredUserEmail: ${error.message}`)
  }

  return data?.email ?? 'unknown@rezoomed.local'
}

function extractAffiliateDiscountCode(customData: PaddleCustomData) {
  const value = typeof customData?.affiliateDiscountCode === 'string'
    ? customData.affiliateDiscountCode
    : null

  return value ? normalizeAffiliateCode(value) : null
}

async function upsertAffiliateReferralFromSubscriptionLike(
  params: {
    affiliateCode: string | null
    subscriptionId: string
    customData: PaddleCustomData
    priceId: string | undefined | null
    priceAmount: string | number | undefined | null
    priceInterval: string | undefined | null
    priceFrequency?: number
    status: string | undefined | null
  },
  supabase: ServiceClient
) {
  if (!params.affiliateCode) {
    return null
  }

  const affiliate = await findAffiliateByDiscountCode(supabase, params.affiliateCode)
  if (!affiliate) {
    return null
  }

  const referredUserEmail = await resolveReferredUserEmail(supabase, params.customData)
  const referral = await upsertAffiliateReferral(supabase, {
    affiliateId: affiliate.id,
    referredUserEmail,
    paddleSubscriptionId: params.subscriptionId,
    planName: resolvePlanName(params.priceId),
    status: resolveReferralStatus(params.status),
    mrr:
      resolveReferralStatus(params.status) === 'churned'
        ? 0
        : toMonthlyRecurringRevenue(
            params.priceAmount,
            params.priceInterval,
            params.priceFrequency ?? 1
          ),
  })

  return { affiliate, referral }
}

async function syncAffiliateReferralFromSubscription(subscription: PaddleSubscription, supabase: ServiceClient) {
  const price = subscription.items?.[0]?.price
  const existingReferral = await getAffiliateReferralBySubscriptionId(supabase, subscription.id)

  if (existingReferral) {
    await upsertAffiliateReferral(supabase, {
      affiliateId: existingReferral.affiliate_id,
      referredUserEmail: existingReferral.referred_user_email,
      paddleSubscriptionId: subscription.id,
      planName: resolvePlanName(price?.id ?? null),
      status: resolveReferralStatus(subscription.status),
      mrr:
        resolveReferralStatus(subscription.status) === 'churned'
          ? 0
          : toMonthlyRecurringRevenue(
              price?.unitPrice?.amount,
              price?.billingCycle?.interval,
              price?.billingCycle?.frequency ?? 1
            ),
    })
    return
  }

  await upsertAffiliateReferralFromSubscriptionLike(
    {
      affiliateCode: extractAffiliateDiscountCode(subscription.customData),
      subscriptionId: subscription.id,
      customData: subscription.customData,
      priceId: price?.id ?? null,
      priceAmount: price?.unitPrice?.amount,
      priceInterval: price?.billingCycle?.interval,
      priceFrequency: price?.billingCycle?.frequency ?? 1,
      status: subscription.status,
    },
    supabase
  )
}

async function resolveAffiliateTransactionContext(transaction: PaddleTransaction, supabase: ServiceClient) {
  const existingReferral = await getAffiliateReferralBySubscriptionId(supabase, transaction.subscriptionId)

  if (existingReferral) {
    const affiliate = await getAffiliateById(supabase, existingReferral.affiliate_id)

    if (affiliate) {
      return { affiliate, referral: existingReferral }
    }
  }

  if (!transaction.subscriptionId) {
    return null
  }

  return upsertAffiliateReferralFromSubscriptionLike(
    {
      affiliateCode: extractAffiliateDiscountCode(transaction.customData),
      subscriptionId: transaction.subscriptionId,
      customData: transaction.customData,
      priceId: transaction.items?.[0]?.price?.id ?? null,
      priceAmount: transaction.items?.[0]?.price?.unitPrice?.amount ?? transaction.details?.totals?.total,
      priceInterval: transaction.items?.[0]?.price?.billingCycle?.interval ?? 'month',
      priceFrequency: transaction.items?.[0]?.price?.billingCycle?.frequency ?? 1,
      status: 'active',
    },
    supabase
  )
}

async function recordAffiliateCommission(transaction: PaddleTransaction, supabase: ServiceClient) {
  const context = await resolveAffiliateTransactionContext(transaction, supabase)

  if (!context) {
    return
  }

  const grossAmount = fromMinorUnitAmount(transaction.details?.totals?.total)
  if (grossAmount <= 0) {
    return
  }

  const commissionAmount = roundCurrencyAmount(
    grossAmount * (context.affiliate.commission_percent / 100)
  )

  if (commissionAmount <= 0) {
    return
  }

  const { error } = await supabase
    .from('affiliate_commissions')
    .upsert(
      {
        affiliate_id: context.affiliate.id,
        referral_id: context.referral.id,
        paddle_transaction_id: transaction.id,
        gross_amount: grossAmount,
        commission_amount: commissionAmount,
        discount_code: context.affiliate.discount_code,
      },
      {
        onConflict: 'paddle_transaction_id',
        ignoreDuplicates: true,
      }
    )

  throwIfError(error, `recordAffiliateCommission ${transaction.id}`)
}

async function updateProfileByUserId(supabase: ServiceClient, userId: string, values: Record<string, unknown>, context: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update(values)
    .eq('id', userId)
    .select('id')
    .maybeSingle()

  throwIfError(error, context)

  if (!data?.id) {
    throw new Error(`${context}: profile ${userId} not found`)
  }

  return data.id as string
}

async function updateProfileBySubscriptionReference(
  supabase: ServiceClient,
  subscriptionId: string,
  userId: string | undefined,
  values: Record<string, unknown>,
  context: string,
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(values)
    .eq('paddle_subscription_id', subscriptionId)
    .select('id')
    .maybeSingle()

  throwIfError(error, context)

  if (data?.id) {
    return data.id as string
  }

  if (!userId) {
    throw new Error(`${context}: no profile matched subscription ${subscriptionId}`)
  }

  const fallbackValues = {
    ...values,
    paddle_subscription_id:
      values.paddle_subscription_id === undefined ? subscriptionId : values.paddle_subscription_id,
  }

  return updateProfileByUserId(supabase, userId, fallbackValues, `${context} (fallback by user)`)
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('paddle-signature') ?? ''

  if (!process.env.PADDLE_WEBHOOK_SECRET) {
    console.error('PADDLE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let rawEvent: unknown
  try {
    rawEvent = verifyPaddleWebhook(
      rawBody,
      signature,
      process.env.PADDLE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Paddle webhook verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const eventResult = paddleWebhookEventSchema.safeParse(rawEvent)
  if (!eventResult.success) {
    console.error('Paddle webhook payload validation failed:', eventResult.error.message)
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
  }

  const event = eventResult.data
  const supabase = createServiceClient()

  try {
    switch (event.eventType) {
      case 'transaction.completed': {
        const tx = paddleTransactionSchema.parse(event.data)
        const customData = tx.customData ?? {}
        if (customData.mode === 'order') {
          await handleOrderCompleted(tx, supabase)
        } else if (customData.mode === 'subscription') {
          await handleSubscriptionFromTransaction(tx, supabase)
        }
        break
      }
      case 'subscription.activated': {
        const sub = paddleSubscriptionSchema.parse(event.data)
        await handleSubscriptionActivated(sub, supabase)
        break
      }
      case 'subscription.created': {
        const sub = paddleSubscriptionSchema.parse(event.data)
        await handleSubscriptionCreated(sub, supabase)
        break
      }
      case 'subscription.updated': {
        const sub = paddleSubscriptionSchema.parse(event.data)
        await handleSubscriptionUpdated(sub, supabase)
        break
      }
      case 'subscription.canceled': {
        const sub = paddleSubscriptionSchema.parse(event.data)
        await handleSubscriptionCanceled(sub, supabase)
        break
      }
      case 'transaction.payment_failed': {
        const tx = paddleTransactionSchema.parse(event.data)
        await handlePaymentFailed(tx, supabase)
        break
      }
      default:
        break
    }
  } catch (err) {
    // Log the error but return 200 so Paddle doesn't retry indefinitely.
    // Signature was already verified — the failure is in our business logic.
    console.error(`Paddle webhook error [${event.eventType}]:`, err)
  }

  return NextResponse.json({ received: true })
}

async function handleOrderCompleted(transaction: PaddleTransaction, supabase: ServiceClient) {
  const { orderId } = transaction.customData ?? {}
  if (!orderId) return

  // Idempotency check — skip if already paid with matching transaction
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('status, paddle_transaction_id')
    .eq('id', orderId)
    .single()
  throwIfError(orderError, `handleOrderCompleted lookup ${orderId}`)
  if (!order) return
  if (order.status === 'paid') {
    if (order.paddle_transaction_id && order.paddle_transaction_id !== transaction.id) {
      console.warn(`handleOrderCompleted: order ${orderId} already paid by transaction ${order.paddle_transaction_id}, ignoring duplicate from ${transaction.id}`)
    }
    return
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      paddle_transaction_id: transaction.id,
    })
    .eq('id', orderId)
  throwIfError(updateError, `handleOrderCompleted update ${orderId}`)

  const analyticsDistinctId = transaction.customData?.posthogDistinctId
  if (analyticsDistinctId) {
    await captureServerAnalyticsEvent(analyticsDistinctId, 'checkout_completed', {
      product: 'writing_service',
      revenue: Number(transaction.details?.totals?.total ?? 0) / 100,
      discountCode: undefined,
    })
  }

  console.log(`Order ${orderId} marked as paid`)
}

async function handleSubscriptionFromTransaction(transaction: PaddleTransaction, supabase: ServiceClient) {
  const { userId } = transaction.customData ?? {}
  if (!userId) return

  const priceId = transaction.items?.[0]?.price?.id ?? null
  const subscriptionInterval = resolveInterval(priceId)

  await updateProfileByUserId(
    supabase,
    userId,
    {
      plan: 'pro',
      paddle_subscription_id: transaction.subscriptionId ?? null,
      paddle_customer_id: transaction.customerId ?? null,
      subscription_status: 'active',
      subscription_interval: subscriptionInterval,
    },
    'handleSubscriptionFromTransaction update'
  )

  await recordAffiliateCommission(transaction, supabase)

  const analyticsDistinctId =
    transaction.customData?.posthogDistinctId ?? userId
  if (analyticsDistinctId) {
    await captureServerAnalyticsEvent(analyticsDistinctId, 'checkout_completed', {
      product: 'pro_subscription',
      revenue: Number(transaction.details?.totals?.total ?? 0) / 100,
      discountCode: undefined,
    })
  }

  console.log(`User ${userId} upgraded to Pro (via transaction), interval: ${subscriptionInterval}`)
}

async function handleSubscriptionCreated(subscription: PaddleSubscription, supabase: ServiceClient) {
  await syncAffiliateReferralFromSubscription(subscription, supabase)
}

async function handleSubscriptionActivated(subscription: PaddleSubscription, supabase: ServiceClient) {
  const userId = subscription.customData?.userId
  if (!userId) return

  const priceId = subscription.items?.[0]?.price?.id ?? null
  const subscriptionInterval = resolveInterval(priceId)

  await updateProfileByUserId(
    supabase,
    userId,
    {
      plan: 'pro',
      paddle_subscription_id: subscription.id,
      paddle_customer_id: subscription.customerId,
      subscription_status: 'active',
      subscription_interval: subscriptionInterval,
    },
    'handleSubscriptionActivated update'
  )

  await syncAffiliateReferralFromSubscription(subscription, supabase)

  console.log(`User ${userId} subscription activated, interval: ${subscriptionInterval}`)
}

async function handleSubscriptionUpdated(subscription: PaddleSubscription, supabase: ServiceClient) {
  const isActive = ['active', 'trialing'].includes(subscription.status)
  const priceId = subscription.items?.[0]?.price?.id ?? null
  const subscriptionInterval = isActive ? resolveInterval(priceId) : null

  await updateProfileBySubscriptionReference(
    supabase,
    subscription.id,
    subscription.customData?.userId,
    {
      subscription_status: subscription.status,
      plan: isActive ? 'pro' : 'free',
      paddle_customer_id: subscription.customerId ?? null,
      paddle_subscription_id: subscription.id,
      subscription_interval: subscriptionInterval,
    },
    'handleSubscriptionUpdated update'
  )

  await syncAffiliateReferralFromSubscription(subscription, supabase)
}

async function handleSubscriptionCanceled(subscription: PaddleSubscription, supabase: ServiceClient) {
  await updateProfileBySubscriptionReference(
    supabase,
    subscription.id,
    subscription.customData?.userId,
    {
      plan: 'free',
      subscription_status: 'cancelled',
      paddle_subscription_id: null,
      subscription_interval: null,
    },
    'handleSubscriptionCanceled update'
  )

  await syncAffiliateReferralFromSubscription(subscription, supabase)

  console.log(`Subscription ${subscription.id} cancelled`)
}

async function handlePaymentFailed(transaction: PaddleTransaction, supabase: ServiceClient) {
  // Don't downgrade immediately — Paddle retries
  const subscriptionId = transaction.subscriptionId
  if (!subscriptionId) return
  await updateProfileBySubscriptionReference(
    supabase,
    subscriptionId,
    transaction.customData?.userId,
    { subscription_status: 'past_due' },
    'handlePaymentFailed update'
  )
}
