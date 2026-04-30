import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paddle } from '@/lib/paddle'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('paddle_subscription_id, plan')
      .eq('id', user.id)
      .single()

    if (!profile?.paddle_subscription_id || profile.plan !== 'pro') {
      return NextResponse.json(
        { success: false, error: 'No active Pro subscription found' },
        { status: 400 }
      )
    }

    // Schedule cancellation for the end of the current billing period.
    // This ensures access remains until the end of the period and NO refund is issued.
    await paddle.subscriptions.cancel(profile.paddle_subscription_id, {
      effectiveFrom: 'next_billing_period',
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription scheduled for cancellation at the end of the billing period.',
    })
  } catch (error: any) {
    console.error('Subscription cancellation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
