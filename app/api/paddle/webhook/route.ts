import { NextRequest, NextResponse } from 'next/server'
import {
  fromMinorUnitAmount,
  normalizeAffiliateCode,
  toMonthlyRecurringRevenue,
} from '@/lib/affiliate'
import {
  findAffiliateByDiscountCode,
  getAffiliateById,
  getAffiliateReferralBySubscriptionId,
  upsertAffiliateReferral,
} from '@/lib/affiliate-server'
import { verifyPaddleWebhook } from '@/lib/paddle'
import { PRO_PLAN } from '@/lib/pricing'
import { captureServerAnalyticsEvent } from '@/lib/analytics-server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

function resolveInterval(priceId: string | undefined | null): 'monthly' | 'annual' | null {
  if (!priceId) return null
  const option = PRO_PLAN.getPriceByPaddleId(priceId)
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

  const option = PRO_PLAN.getPriceByPaddleId(priceId)
  if (!option) return 'Pro'

  return `Pro ${option.label}`
}

function resolveReferralStatus(status: string | undefined | null): 'active' | 'trialing' | 'churned' {
  if (status === 'active') return 'active'
  if (status === 'trialing') return 'trialing'
  return 'churned'
}

function roundCurrencyAmount(value: number) {
  return Math.round(value * 100) / 100
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customData: any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractAffiliateDiscountCode(customData: any) {
  const value = typeof customData?.affiliateDiscountCode === 'string'
    ? customData.affiliateDiscountCode
    : null

  return value ? normalizeAffiliateCode(value) : null
}

async function upsertAffiliateReferralFromSubscriptionLike(
  params: {
    affiliateCode: string | null
    subscriptionId: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customData: any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncAffiliateReferralFromSubscription(subscription: any, supabase: ServiceClient) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveAffiliateTransactionContext(transaction: any, supabase: ServiceClient) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function recordAffiliateCommission(transaction: any, supabase: ServiceClient) {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any
  try {
    event = verifyPaddleWebhook(
      rawBody,
      signature,
      process.env.PADDLE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Paddle webhook verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.eventType) {
      case 'transaction.completed': {
        const tx = event.data
        const customData = tx.customData ?? {}
        if (customData.mode === 'order') {
          await handleOrderCompleted(tx, supabase)
        } else if (customData.mode === 'subscription') {
          await handleSubscriptionFromTransaction(tx, supabase)
        }
        break
      }
      case 'subscription.activated': {
        await handleSubscriptionActivated(event.data, supabase)
        break
      }
      case 'subscription.created': {
        await handleSubscriptionCreated(event.data, supabase)
        break
      }
      case 'subscription.updated': {
        await handleSubscriptionUpdated(event.data, supabase)
        break
      }
      case 'subscription.canceled': {
        await handleSubscriptionCanceled(event.data, supabase)
        break
      }
      case 'transaction.payment_failed': {
        await handlePaymentFailed(event.data, supabase)
        break
      }
      default:
        break
    }
  } catch (err) {
    console.error(`Paddle webhook error [${event?.eventType}]:`, err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleOrderCompleted(transaction: any, supabase: ServiceClient) {
  const { orderId } = transaction.customData ?? {}
  if (!orderId) return

  // Idempotency check
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single()
  throwIfError(orderError, `handleOrderCompleted lookup ${orderId}`)
  if (!order || order.status === 'paid') return

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      paddle_transaction_id: transaction.id,
    })
    .eq('id', orderId)
  throwIfError(updateError, `handleOrderCompleted update ${orderId}`)

  const analyticsDistinctId = transaction.customData?.posthogDistinctId as string | undefined
  if (analyticsDistinctId) {
    await captureServerAnalyticsEvent(analyticsDistinctId, 'checkout_completed', {
      product: 'writing_service',
      revenue: Number(transaction.details?.totals?.total ?? 0) / 100,
      discountCode: undefined,
    })
  }

  console.log(`Order ${orderId} marked as paid`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionFromTransaction(transaction: any, supabase: ServiceClient) {
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
    (transaction.customData?.posthogDistinctId as string | undefined) ?? userId
  if (analyticsDistinctId) {
    await captureServerAnalyticsEvent(analyticsDistinctId, 'checkout_completed', {
      product: 'pro_subscription',
      revenue: Number(transaction.details?.totals?.total ?? 0) / 100,
      discountCode: undefined,
    })
  }

  console.log(`User ${userId} upgraded to Pro (via transaction), interval: ${subscriptionInterval}`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCreated(subscription: any, supabase: ServiceClient) {
  await syncAffiliateReferralFromSubscription(subscription, supabase)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionActivated(subscription: any, supabase: ServiceClient) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUpdated(subscription: any, supabase: ServiceClient) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCanceled(subscription: any, supabase: ServiceClient) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentFailed(transaction: any, supabase: ServiceClient) {
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
