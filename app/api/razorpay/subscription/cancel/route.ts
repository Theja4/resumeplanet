import { NextResponse } from 'next/server'

import { cancelRazorpaySubscription } from '@/lib/razorpay'
import { syncRazorpaySubscriptionAccess } from '@/lib/razorpay-subscription-access'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createClient } from '@/lib/supabase/server'

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
    .select('razorpay_subscription_id, subscription_interval, plan')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.razorpay_subscription_id || profile.plan !== 'pro') {
    return NextResponse.json(
      { success: false, error: 'No active Razorpay subscription found' },
      { status: 400 }
    )
  }

  try {
    const subscription = await cancelRazorpaySubscription({
      subscriptionId: profile.razorpay_subscription_id,
      cancelAtCycleEnd: true,
    })

    const serviceSupabase = createServiceRoleClient()
    const interval = profile.subscription_interval === 'annual' ? 'annual' : 'monthly'
    await syncRazorpaySubscriptionAccess({
      supabase: serviceSupabase,
      userId: user.id,
      subscription,
      interval,
      metadata: {
        source: 'cancel_endpoint',
        cancel_at_cycle_end: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Razorpay subscription cancellation scheduled.',
    })
  } catch (error) {
    console.error('Razorpay subscription cancellation failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
