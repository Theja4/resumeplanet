import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { stripe, constructWebhookEvent } from '@/lib/stripe'
import type Stripe from 'stripe'

// Service role client for webhook (bypasses RLS)
function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const payload = await request.bytes()
  const sig = request.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(Buffer.from(payload), sig)
  } catch (err) {
    console.error('Webhook signature failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { mode, orderId, userId } = session.metadata ?? {}
        if (mode === 'order' && orderId) {
          await handleOrderCompleted(session, orderId, supabase)
        } else if (mode === 'subscription' && userId) {
          await handleSubscriptionCheckout(session, userId, supabase)
        }
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(sub, supabase)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(sub, supabase)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice, supabase)
        break
      }
      default:
        break
    }
  } catch (err) {
    console.error(`Webhook handler error [${event.type}]:`, err)
    // Always return 200 — log error but don't make Stripe retry
  }

  return NextResponse.json({ received: true })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleOrderCompleted(session: Stripe.Checkout.Session, orderId: string, supabase: any) {
  const { data: order } = await supabase.from('orders').select('status').eq('id', orderId).single()
  if (!order || order.status === 'paid') return // idempotent

  await supabase
    .from('orders')
    .update({
      status: 'paid',
      stripe_payment_intent_id: (session.payment_intent as string) ?? null,
    })
    .eq('id', orderId)

  console.log(`Order ${orderId} marked as paid`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCheckout(session: Stripe.Checkout.Session, userId: string, supabase: any) {
  const subscriptionId = session.subscription as string
  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', userId).single()
  if (profile?.plan === 'pro') return // idempotent

  await supabase
    .from('profiles')
    .update({
      plan: 'pro',
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: session.customer as string,
      subscription_status: subscription.status,
    })
    .eq('id', userId)

  console.log(`User ${userId} upgraded to Pro`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: any) {
  const userId = subscription.metadata?.userId
  if (!userId) return

  const isActive = ['active', 'trialing'].includes(subscription.status)

  await supabase
    .from('profiles')
    .update({
      subscription_status: subscription.status,
      plan: isActive ? 'pro' : 'free',
    })
    .eq('stripe_subscription_id', subscription.id)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  await supabase
    .from('profiles')
    .update({ plan: 'free', subscription_status: 'cancelled', stripe_subscription_id: null })
    .eq('stripe_subscription_id', subscription.id)

  console.log(`Subscription ${subscription.id} cancelled`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  const subscriptionId =
    invoice.parent?.type === 'subscription_details'
      ? (invoice.parent.subscription_details?.subscription as string | null)
      : null
  if (!subscriptionId) return
  await supabase
    .from('profiles')
    .update({ subscription_status: 'past_due' })
    .eq('stripe_subscription_id', subscriptionId)
}
