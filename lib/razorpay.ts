import crypto from 'crypto'

import type { PriceOption } from '@/lib/pricing'

type RazorpayInterval = 'monthly' | 'annual'

export interface RazorpayOrderResponse {
  id: string
  entity: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string | null
  status: string
  attempts: number
  notes?: Record<string, string>
  created_at: number
}

export interface RazorpayPaymentResponse {
  id: string
  entity: string
  amount: number
  currency: string
  status: string
  order_id: string
  method?: string
  captured?: boolean
  email?: string
  contact?: string
  error_code?: string | null
  error_description?: string | null
  notes?: Record<string, string>
}

export interface RazorpaySubscriptionResponse {
  id: string
  entity: 'subscription'
  plan_id: string
  customer_id?: string | null
  status: 'created' | 'authenticated' | 'active' | 'pending' | 'halted' | 'cancelled' | 'completed' | 'expired'
  current_start?: number | null
  current_end?: number | null
  ended_at?: number | null
  quantity: number
  charge_at?: number | null
  start_at?: number | null
  end_at?: number | null
  auth_attempts?: number
  total_count: number
  paid_count: number
  customer_notify: boolean
  created_at: number
  expire_by?: number | null
  short_url?: string | null
  has_scheduled_changes?: boolean
  change_scheduled_at?: number | null
  source?: string
  remaining_count?: number
  notes?: Record<string, string>
}

function getRazorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? ''
}

function getRazorpayKeySecret() {
  return process.env.RAZORPAY_KEY_SECRET ?? ''
}

export function getRazorpayConfigurationError() {
  if (!getRazorpayKeyId()) return 'RAZORPAY_KEY_ID is not set.'
  if (!getRazorpayKeySecret()) return 'RAZORPAY_KEY_SECRET is not set.'
  return null
}

export function getRazorpaySubscriptionPlanId(
  interval: RazorpayInterval,
  options: { discounted?: boolean } = {}
) {
  if (options.discounted) {
    return interval === 'annual'
      ? process.env.RAZORPAY_PRO_PLAN_ANNUAL_DISCOUNT
      : process.env.RAZORPAY_PRO_PLAN_MONTHLY_DISCOUNT
  }

  return interval === 'annual'
    ? process.env.RAZORPAY_PRO_PLAN_ANNUAL
    : process.env.RAZORPAY_PRO_PLAN_MONTHLY
}

export function getRazorpaySubscriptionConfigurationError(
  interval: RazorpayInterval,
  options: { discounted?: boolean } = {}
) {
  const configurationError = getRazorpayConfigurationError()
  if (configurationError) return configurationError
  if (!getRazorpaySubscriptionPlanId(interval, options)) {
    const intervalKey = interval === 'annual' ? 'ANNUAL' : 'MONTHLY'
    return `RAZORPAY_PRO_PLAN_${intervalKey}${options.discounted ? '_DISCOUNT' : ''} is not set.`
  }
  return null
}

function getAuthHeader() {
  const credentials = Buffer.from(`${getRazorpayKeyId()}:${getRazorpayKeySecret()}`).toString('base64')
  return `Basic ${credentials}`
}

async function razorpayFetch<T>(path: string, init?: RequestInit) {
  const configurationError = getRazorpayConfigurationError()
  if (configurationError) throw new Error(configurationError)

  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const description =
      typeof body?.error?.description === 'string'
        ? body.error.description
        : `Razorpay request failed with ${response.status}`
    throw new Error(description)
  }

  return body as T
}

export function getRazorpayAmountPaise(priceOption: PriceOption) {
  if (priceOption.display.currency !== 'INR') {
    throw new Error('Razorpay checkout requires INR pricing.')
  }

  return Math.round(priceOption.display.displayPrice * 100)
}

export function getRazorpayAccessPeriod(interval: RazorpayInterval, from = new Date()) {
  const start = new Date(from)
  const end = new Date(start)

  if (interval === 'annual') {
    end.setFullYear(end.getFullYear() + 1)
  } else {
    end.setMonth(end.getMonth() + 1)
  }

  return { start, end }
}

export async function createRazorpayOrder(params: {
  amount: number
  currency: 'INR'
  receipt: string
  notes: Record<string, string>
}) {
  return razorpayFetch<RazorpayOrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
      receipt: params.receipt,
      notes: params.notes,
    }),
  })
}

export async function createRazorpaySubscription(params: {
  planId: string
  interval: RazorpayInterval
  notes: Record<string, string>
}) {
  const totalCount = params.interval === 'annual' ? 10 : 120

  return razorpayFetch<RazorpaySubscriptionResponse>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      plan_id: params.planId,
      total_count: totalCount,
      quantity: 1,
      customer_notify: true,
      notes: params.notes,
    }),
  })
}

export async function fetchRazorpaySubscription(subscriptionId: string) {
  return razorpayFetch<RazorpaySubscriptionResponse>(`/subscriptions/${subscriptionId}`)
}

export async function cancelRazorpaySubscription(params: {
  subscriptionId: string
  cancelAtCycleEnd?: boolean
}) {
  return razorpayFetch<RazorpaySubscriptionResponse>(`/subscriptions/${params.subscriptionId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({
      cancel_at_cycle_end: params.cancelAtCycleEnd ?? true,
    }),
  })
}

export async function fetchRazorpayPayment(paymentId: string) {
  return razorpayFetch<RazorpayPaymentResponse>(`/payments/${paymentId}`)
}

export async function captureRazorpayPayment(params: {
  paymentId: string
  amount: number
  currency: string
}) {
  return razorpayFetch<RazorpayPaymentResponse>(`/payments/${params.paymentId}/capture`, {
    method: 'POST',
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
    }),
  })
}

export function verifyRazorpayCheckoutSignature(params: {
  orderId: string
  paymentId: string
  signature: string
}) {
  const expected = crypto
    .createHmac('sha256', getRazorpayKeySecret())
    .update(`${params.orderId}|${params.paymentId}`)
    .digest('hex')

  const expectedBuffer = Buffer.from(expected)
  const signatureBuffer = Buffer.from(params.signature)
  return expectedBuffer.length === signatureBuffer.length
    && crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
}

export function verifyRazorpaySubscriptionSignature(params: {
  subscriptionId: string
  paymentId: string
  signature: string
}) {
  const expected = crypto
    .createHmac('sha256', getRazorpayKeySecret())
    .update(`${params.paymentId}|${params.subscriptionId}`)
    .digest('hex')

  const expectedBuffer = Buffer.from(expected)
  const signatureBuffer = Buffer.from(params.signature)
  return expectedBuffer.length === signatureBuffer.length
    && crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
}

export function verifyRazorpayWebhookSignature(params: {
  rawBody: string
  signature: string
}) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? ''
  if (!secret) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(params.rawBody)
    .digest('hex')

  const expectedBuffer = Buffer.from(expected)
  const signatureBuffer = Buffer.from(params.signature)
  return expectedBuffer.length === signatureBuffer.length
    && crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
}
