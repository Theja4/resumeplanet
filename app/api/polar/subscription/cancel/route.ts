import { NextResponse } from 'next/server'

import { getPolarIntervalFromProductId, listPolarSubscriptions, updatePolarSubscription, type PolarSubscription } from '@/lib/polar'
import { normalizeIsoDate } from '@/lib/subscriptionPeriod'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createClient } from '@/lib/supabase/server'

function resolveInterval(subscription: PolarSubscription) {
  if (subscription.recurring_interval === 'month') return 'monthly'
  if (subscription.recurring_interval === 'year') return 'annual'
  return getPolarIntervalFromProductId(subscription.product_id)
}

function isCancellablePolarSubscription(subscription: PolarSubscription) {
  return ['active', 'trialing', 'past_due'].includes(subscription.status)
}

function pickCancellableSubscription(subscriptions: PolarSubscription[]) {
  return subscriptions.find(subscription =>
    isCancellablePolarSubscription(subscription) && subscription.cancel_at_period_end !== true
  ) ?? subscriptions.find(isCancellablePolarSubscription) ?? null
}

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('polar_customer_id, polar_subscription_id, payment_provider, plan')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.payment_provider !== 'polar' || profile.plan !== 'pro') {
    return NextResponse.json(
      { success: false, error: 'No active Polar subscription found' },
      { status: 400 }
    )
  }

  try {
    let subscriptionId = profile.polar_subscription_id ?? null

    if (!subscriptionId) {
      const subscriptions = profile.polar_customer_id
        ? await listPolarSubscriptions({ customerId: profile.polar_customer_id })
        : await listPolarSubscriptions({ externalCustomerId: user.id })
      const subscription = pickCancellableSubscription(subscriptions)
      subscriptionId = subscription?.id ?? null
    }

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'No active Polar subscription found' },
        { status: 400 }
      )
    }

    const subscription = await updatePolarSubscription({
      subscriptionId,
      cancelAtPeriodEnd: true,
    })

    const serviceSupabase = createServiceRoleClient()
    const { error } = await serviceSupabase
      .from('profiles')
      .update({
        plan: 'pro',
        polar_customer_id: subscription.customer_id ?? profile.polar_customer_id ?? null,
        polar_subscription_id: subscription.id,
        subscription_status: subscription.status,
        subscription_interval: resolveInterval(subscription),
        payment_provider: 'polar',
        current_period_start: normalizeIsoDate(subscription.current_period_start),
        current_period_end: normalizeIsoDate(subscription.current_period_end) ?? normalizeIsoDate(subscription.ends_at),
      })
      .eq('id', user.id)

    if (error) throw new Error(error.message)

    return NextResponse.json({
      success: true,
      message: 'Polar subscription cancellation scheduled.',
    })
  } catch (error) {
    console.error('Polar subscription cancellation failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
