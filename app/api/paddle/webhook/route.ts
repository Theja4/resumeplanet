import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { paddle } from '@/lib/paddle'

// Service role client for webhook (bypasses RLS)
function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
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
    event = paddle.webhooks.unmarshal(
      rawBody,
      process.env.PADDLE_WEBHOOK_SECRET,
      signature
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
      case 'subscription.updated': {
        await handleSubscriptionUpdated(event.data, supabase)
        break
      }
      case 'subscription.canceled': {
        await handleSubscriptionCanceled(event.data, supabase)
        break
      }
      case 'subscription.payment.failed': {
        await handlePaymentFailed(event.data, supabase)
        break
      }
      default:
        break
    }
  } catch (err) {
    // Log but always return 200 — don't make Paddle retry on our bugs
    console.error(`Paddle webhook error [${event?.eventType}]:`, err)
  }

  return NextResponse.json({ received: true })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleOrderCompleted(transaction: any, supabase: any) {
  const { orderId } = transaction.customData ?? {}
  if (!orderId) return

  // Idempotency check
  const { data: order } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single()
  if (!order || order.status === 'paid') return

  await supabase
    .from('orders')
    .update({
      status: 'paid',
      paddle_transaction_id: transaction.id,
    })
    .eq('id', orderId)

  console.log(`Order ${orderId} marked as paid`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionFromTransaction(transaction: any, supabase: any) {
  const { userId } = transaction.customData ?? {}
  if (!userId) return

  // Idempotency
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single()
  if (profile?.plan === 'pro') return

  await supabase
    .from('profiles')
    .update({
      plan: 'pro',
      paddle_subscription_id: transaction.subscriptionId ?? null,
      paddle_customer_id: transaction.customerId ?? null,
      subscription_status: 'active',
    })
    .eq('id', userId)

  console.log(`User ${userId} upgraded to Pro (via transaction)`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionActivated(subscription: any, supabase: any) {
  const userId = subscription.customData?.userId
  if (!userId) return

  await supabase
    .from('profiles')
    .update({
      plan: 'pro',
      paddle_subscription_id: subscription.id,
      paddle_customer_id: subscription.customerId,
      subscription_status: 'active',
    })
    .eq('id', userId)

  console.log(`User ${userId} subscription activated`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUpdated(subscription: any, supabase: any) {
  const isActive = ['active', 'trialing'].includes(subscription.status)

  await supabase
    .from('profiles')
    .update({
      subscription_status: subscription.status,
      plan: isActive ? 'pro' : 'free',
    })
    .eq('paddle_subscription_id', subscription.id)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCanceled(subscription: any, supabase: any) {
  await supabase
    .from('profiles')
    .update({
      plan: 'free',
      subscription_status: 'cancelled',
      paddle_subscription_id: null,
    })
    .eq('paddle_subscription_id', subscription.id)

  console.log(`Subscription ${subscription.id} cancelled`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentFailed(subscription: any, supabase: any) {
  // Don't downgrade immediately — Paddle retries
  await supabase
    .from('profiles')
    .update({ subscription_status: 'past_due' })
    .eq('paddle_subscription_id', subscription.id)
}
