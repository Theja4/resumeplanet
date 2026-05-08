import { NextRequest, NextResponse } from 'next/server'

import { syncRazorpaySubscriptionAccess } from '@/lib/razorpay-subscription-access'
import {
  fetchRazorpayPayment,
  fetchRazorpaySubscription,
  verifyRazorpaySubscriptionSignature,
} from '@/lib/razorpay'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createClient } from '@/lib/supabase/server'

function ok(data: Record<string, unknown>) {
  return NextResponse.json({ success: true, data })
}

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return err('Unauthorized', 401)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return err('Invalid JSON body')
  }

  const subscriptionId =
    typeof body.razorpay_subscription_id === 'string' ? body.razorpay_subscription_id : ''
  const paymentId = typeof body.razorpay_payment_id === 'string' ? body.razorpay_payment_id : ''
  const signature = typeof body.razorpay_signature === 'string' ? body.razorpay_signature : ''

  if (!subscriptionId || !paymentId || !signature) {
    return err('Missing Razorpay subscription verification fields')
  }

  if (!verifyRazorpaySubscriptionSignature({ subscriptionId, paymentId, signature })) {
    return err('Invalid Razorpay subscription signature', 400)
  }

  const serviceSupabase = createServiceRoleClient()
  const { data: subscriptionRow, error: subscriptionReadError } = await serviceSupabase
    .from('razorpay_subscriptions')
    .select('user_id, plan_interval, razorpay_plan_id')
    .eq('razorpay_subscription_id', subscriptionId)
    .single()

  if (subscriptionReadError || !subscriptionRow) {
    return err('Razorpay subscription not found', 404)
  }

  if (subscriptionRow.user_id !== user.id) {
    return err('Razorpay subscription user mismatch', 403)
  }

  const [payment, subscription] = await Promise.all([
    fetchRazorpayPayment(paymentId),
    fetchRazorpaySubscription(subscriptionId),
  ])

  if (subscription.id !== subscriptionId) {
    return err('Razorpay subscription mismatch')
  }

  if (subscription.plan_id !== subscriptionRow.razorpay_plan_id) {
    return err('Razorpay plan mismatch')
  }

  if (!['authorized', 'captured'].includes(payment.status)) {
    return err('Razorpay authentication payment is not successful')
  }

  const interval = subscriptionRow.plan_interval === 'annual' ? 'annual' : 'monthly'
  const access = await syncRazorpaySubscriptionAccess({
    supabase: serviceSupabase,
    userId: user.id,
    subscription,
    interval,
    paymentId,
    metadata: {
      method: payment.method ?? null,
      captured: payment.captured ?? null,
      source: 'checkout_callback',
    },
  })

  return ok({
    provider: 'razorpay',
    subscriptionId,
    currentPeriodEnd: access.currentPeriodEnd,
  })
}
