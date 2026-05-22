import { NextResponse } from 'next/server'

import {
  getPolarIntervalFromProductId,
  listPolarSubscriptions,
  updatePolarSubscription,
  type PolarSubscription,
} from '@/lib/polar'
import { cancelRazorpaySubscription } from '@/lib/razorpay'
import { syncRazorpaySubscriptionAccess } from '@/lib/razorpay-subscription-access'
import { normalizeIsoDate } from '@/lib/subscriptionPeriod'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createClient } from '@/lib/supabase/server'

type SubscriptionProvider = 'polar' | 'razorpay'

type CancellationProfile = {
  id: string
  plan: 'free' | 'pro'
  payment_provider: string | null
  subscription_interval: 'monthly' | 'annual' | null
  polar_customer_id: string | null
  polar_subscription_id: string | null
  razorpay_subscription_id: string | null
}

function resolvePolarInterval(subscription: PolarSubscription) {
  if (subscription.recurring_interval === 'month') return 'monthly'
  if (subscription.recurring_interval === 'year') return 'annual'
  return getPolarIntervalFromProductId(subscription.product_id)
}

function isCancellablePolarSubscription(subscription: PolarSubscription) {
  return ['active', 'trialing', 'past_due'].includes(subscription.status)
}

function pickCancellablePolarSubscription(subscriptions: PolarSubscription[]) {
  return subscriptions.find(subscription =>
    isCancellablePolarSubscription(subscription) && subscription.cancel_at_period_end !== true
  ) ?? subscriptions.find(isCancellablePolarSubscription) ?? null
}

function inferProvider(profile: CancellationProfile): SubscriptionProvider | null {
  if (profile.payment_provider === 'polar') return 'polar'
  if (profile.payment_provider === 'razorpay') return 'razorpay'
  if (profile.polar_subscription_id || profile.polar_customer_id) return 'polar'
  if (profile.razorpay_subscription_id) return 'razorpay'
  return 'polar'
}

async function cancelPolarSubscription(params: {
  userId: string
  profile: CancellationProfile
}) {
  let subscriptionId = params.profile.polar_subscription_id

  if (!subscriptionId) {
    const subscriptions = params.profile.polar_customer_id
      ? await listPolarSubscriptions({ customerId: params.profile.polar_customer_id })
      : await listPolarSubscriptions({ externalCustomerId: params.userId })
    const subscription = pickCancellablePolarSubscription(subscriptions)
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
      polar_customer_id: subscription.customer_id ?? params.profile.polar_customer_id ?? null,
      polar_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_interval: resolvePolarInterval(subscription),
      payment_provider: 'polar',
      current_period_start: normalizeIsoDate(subscription.current_period_start),
      current_period_end:
        normalizeIsoDate(subscription.current_period_end) ?? normalizeIsoDate(subscription.ends_at),
    })
    .eq('id', params.userId)

  if (error) throw new Error(error.message)

  return NextResponse.json({
    success: true,
    provider: 'polar',
    message: 'Polar subscription cancellation scheduled.',
  })
}

async function cancelRazorpaySubscriptionForUser(params: {
  userId: string
  profile: CancellationProfile
}) {
  if (!params.profile.razorpay_subscription_id) {
    return NextResponse.json(
      { success: false, error: 'No active Razorpay subscription found' },
      { status: 400 }
    )
  }

  const subscription = await cancelRazorpaySubscription({
    subscriptionId: params.profile.razorpay_subscription_id,
    cancelAtCycleEnd: true,
  })

  const serviceSupabase = createServiceRoleClient()
  const interval = params.profile.subscription_interval === 'annual' ? 'annual' : 'monthly'
  await syncRazorpaySubscriptionAccess({
    supabase: serviceSupabase,
    userId: params.userId,
    subscription,
    interval,
    metadata: {
      source: 'unified_cancel_endpoint',
      cancel_at_cycle_end: true,
    },
  })

  return NextResponse.json({
    success: true,
    provider: 'razorpay',
    message: 'Razorpay subscription cancellation scheduled.',
  })
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
    .select(
      [
        'id',
        'plan',
        'payment_provider',
        'subscription_interval',
        'polar_customer_id',
        'polar_subscription_id',
        'razorpay_subscription_id',
      ].join(', ')
    )
    .eq('id', user.id)
    .single()

  const typedProfile = profile as unknown as CancellationProfile | null

  if (profileError || !typedProfile || typedProfile.plan !== 'pro') {
    return NextResponse.json(
      { success: false, error: 'No active Pro subscription found' },
      { status: 400 }
    )
  }

  const provider = inferProvider(typedProfile)

  try {
    if (provider === 'polar') {
      return await cancelPolarSubscription({ userId: user.id, profile: typedProfile })
    }

    if (provider === 'razorpay') {
      return await cancelRazorpaySubscriptionForUser({ userId: user.id, profile: typedProfile })
    }

    return NextResponse.json(
      {
        success: false,
        error:
          'No cancellable subscription provider was found for this account. Contact support@rezoomed.com.',
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('Subscription cancellation failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
