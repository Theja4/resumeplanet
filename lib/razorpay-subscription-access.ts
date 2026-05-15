import type { RazorpaySubscriptionResponse } from '@/lib/razorpay'
import { isPeriodEndInFuture } from '@/lib/subscriptionPeriod'

type ServiceSupabaseClient = ReturnType<typeof import('@/lib/supabase/service-role').createServiceRoleClient>
type RazorpayInterval = 'monthly' | 'annual'

function unixToIso(value: number | null | undefined) {
  if (!value) return null
  return new Date(value * 1000).toISOString()
}

function fallbackPeriodEnd(interval: RazorpayInterval) {
  const end = new Date()
  if (interval === 'annual') {
    end.setFullYear(end.getFullYear() + 1)
  } else {
    end.setMonth(end.getMonth() + 1)
  }
  return end.toISOString()
}

export function isRazorpaySubscriptionProStatus(status: string | null | undefined) {
  return status === 'active' || status === 'authenticated' || status === 'pending'
}

function hasPaidAccessThroughCancelledPeriod(
  subscription: RazorpaySubscriptionResponse,
  currentPeriodEnd: string | null
) {
  return (
    subscription.status === 'cancelled' &&
    (subscription.paid_count ?? 0) > 0 &&
    isPeriodEndInFuture(currentPeriodEnd)
  )
}

export async function syncRazorpaySubscriptionAccess(params: {
  supabase: ServiceSupabaseClient
  userId: string
  subscription: RazorpaySubscriptionResponse
  interval: RazorpayInterval
  paymentId?: string | null
  metadata?: Record<string, unknown>
}) {
  const status = params.subscription.status
  const currentPeriodStart = unixToIso(params.subscription.current_start) ?? new Date().toISOString()
  const currentPeriodEnd =
    unixToIso(params.subscription.current_end) ??
    unixToIso(params.subscription.end_at) ??
    (isRazorpaySubscriptionProStatus(status) ? fallbackPeriodEnd(params.interval) : null)
  const isActiveAccess =
    isRazorpaySubscriptionProStatus(status) ||
    hasPaidAccessThroughCancelledPeriod(params.subscription, currentPeriodEnd)

  const { error: subscriptionError } = await params.supabase
    .from('razorpay_subscriptions')
    .upsert({
      user_id: params.userId,
      razorpay_subscription_id: params.subscription.id,
      razorpay_plan_id: params.subscription.plan_id,
      razorpay_customer_id: params.subscription.customer_id ?? null,
      plan_interval: params.interval,
      status,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      ended_at: unixToIso(params.subscription.ended_at),
      paid_count: params.subscription.paid_count ?? 0,
      remaining_count: params.subscription.remaining_count ?? null,
      razorpay_payment_id: params.paymentId ?? null,
      metadata: params.metadata ?? {},
      updated_at: new Date().toISOString(),
    }, { onConflict: 'razorpay_subscription_id' })

  if (subscriptionError) {
    throw new Error(`Razorpay subscription sync failed: ${subscriptionError.message}`)
  }

  const { error: profileError } = await params.supabase
    .from('profiles')
    .update({
      plan: isActiveAccess ? 'pro' : 'free',
      subscription_status: status,
      subscription_interval: isActiveAccess ? params.interval : null,
      payment_provider: 'razorpay',
      current_period_start: isActiveAccess ? currentPeriodStart : null,
      current_period_end: isActiveAccess ? currentPeriodEnd : null,
      razorpay_subscription_id: params.subscription.id,
      razorpay_plan_id: params.subscription.plan_id,
      razorpay_customer_id: params.subscription.customer_id ?? null,
      razorpay_payment_id: params.paymentId ?? null,
    })
    .eq('id', params.userId)

  if (profileError) {
    throw new Error(`Razorpay subscription profile sync failed: ${profileError.message}`)
  }

  return {
    isActiveAccess,
    currentPeriodStart,
    currentPeriodEnd,
  }
}
