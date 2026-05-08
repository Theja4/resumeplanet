import { getRazorpayAccessPeriod } from '@/lib/razorpay'

type ServiceSupabaseClient = ReturnType<typeof import('@/lib/supabase/service-role').createServiceRoleClient>
type RazorpayInterval = 'monthly' | 'annual'

function resolveAccessStart(profile: { current_period_end?: string | null; payment_provider?: string | null }) {
  if (profile.payment_provider !== 'razorpay' || !profile.current_period_end) {
    return new Date()
  }

  const currentEnd = new Date(profile.current_period_end)
  if (Number.isNaN(currentEnd.getTime()) || currentEnd <= new Date()) {
    return new Date()
  }

  return currentEnd
}

export async function activateRazorpayFixedTermAccess(params: {
  supabase: ServiceSupabaseClient
  userId: string
  orderId: string
  paymentId: string
  interval: RazorpayInterval
  amount: number
  currency: string
  metadata?: Record<string, unknown>
}) {
  const { data: paymentRow, error: paymentReadError } = await params.supabase
    .from('razorpay_payments')
    .select('status, current_period_start, current_period_end')
    .eq('razorpay_order_id', params.orderId)
    .maybeSingle()

  if (paymentReadError) {
    throw new Error(`Razorpay payment lookup failed: ${paymentReadError.message}`)
  }

  if (paymentRow?.status === 'paid' && paymentRow.current_period_start && paymentRow.current_period_end) {
    return {
      currentPeriodStart: new Date(paymentRow.current_period_start),
      currentPeriodEnd: new Date(paymentRow.current_period_end),
      alreadyProcessed: true,
    }
  }

  const { data: profile, error: profileReadError } = await params.supabase
    .from('profiles')
    .select('current_period_end, payment_provider')
    .eq('id', params.userId)
    .single()

  if (profileReadError) {
    throw new Error(`Profile lookup failed: ${profileReadError.message}`)
  }

  const period = getRazorpayAccessPeriod(params.interval, resolveAccessStart(profile ?? {}))

  const { error: paymentUpdateError } = await params.supabase
    .from('razorpay_payments')
    .update({
      razorpay_payment_id: params.paymentId,
      status: 'paid',
      amount: params.amount,
      currency: params.currency,
      current_period_start: period.start.toISOString(),
      current_period_end: period.end.toISOString(),
      metadata: params.metadata ?? {},
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_order_id', params.orderId)

  if (paymentUpdateError) {
    throw new Error(`Razorpay payment update failed: ${paymentUpdateError.message}`)
  }

  const { error: profileUpdateError } = await params.supabase
    .from('profiles')
    .update({
      plan: 'pro',
      subscription_status: 'active',
      subscription_interval: params.interval,
      payment_provider: 'razorpay',
      current_period_start: period.start.toISOString(),
      current_period_end: period.end.toISOString(),
      razorpay_order_id: params.orderId,
      razorpay_payment_id: params.paymentId,
    })
    .eq('id', params.userId)

  if (profileUpdateError) {
    throw new Error(`Profile upgrade failed: ${profileUpdateError.message}`)
  }

  return {
    currentPeriodStart: period.start,
    currentPeriodEnd: period.end,
    alreadyProcessed: false,
  }
}
