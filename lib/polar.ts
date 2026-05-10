import crypto from 'crypto'

import type { PriceOption } from '@/lib/pricing'

type PolarEnvironment = 'sandbox' | 'production'
type PolarInterval = 'monthly' | 'annual'

interface PolarCheckoutResponse {
  id: string
  url?: string
  amount?: number
  total_amount?: number
  currency?: string
}

interface PolarCustomerSessionResponse {
  customer_portal_url?: string
}

const POLAR_PRODUCT_BY_INTERVAL: Record<PolarInterval, string | undefined> = {
  monthly: process.env.POLAR_PRO_MONTHLY_PRODUCT_ID,
  annual: process.env.POLAR_PRO_ANNUAL_PRODUCT_ID,
}

const POLAR_DISCOUNT_BY_CODE: Record<string, string | undefined> = {
  CAREER50: process.env.POLAR_DISCOUNT_CAREER50_ID,
  JOBS50: process.env.POLAR_DISCOUNT_JOBS50_ID,
  NEERAJA50: process.env.POLAR_DISCOUNT_NEERAJA50_ID,
}

function getPolarEnvironment(): PolarEnvironment {
  return process.env.POLAR_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'production'
}

function getPolarBaseUrl() {
  return getPolarEnvironment() === 'sandbox'
    ? 'https://sandbox-api.polar.sh/v1'
    : 'https://api.polar.sh/v1'
}

function getPolarAccessToken() {
  return process.env.POLAR_ACCESS_TOKEN
}

export function isPolarCheckoutEnabled() {
  return process.env.NEXT_PUBLIC_PAYMENT_PROVIDER === 'polar'
    || process.env.NEXT_PUBLIC_POLAR_CHECKOUT_ENABLED === 'true'
}

export function getPolarConfigurationError() {
  if (!getPolarAccessToken()) return 'POLAR_ACCESS_TOKEN is not set.'
  if (!process.env.POLAR_PRO_MONTHLY_PRODUCT_ID) return 'POLAR_PRO_MONTHLY_PRODUCT_ID is not set.'
  if (!process.env.POLAR_PRO_ANNUAL_PRODUCT_ID) return 'POLAR_PRO_ANNUAL_PRODUCT_ID is not set.'
  return null
}

export function getPolarProductId(interval: PolarInterval) {
  return POLAR_PRODUCT_BY_INTERVAL[interval]
}

export function getPolarIntervalFromProductId(productId?: string | null): PolarInterval | null {
  if (!productId) return null
  if (productId === process.env.POLAR_PRO_ANNUAL_PRODUCT_ID) return 'annual'
  if (productId === process.env.POLAR_PRO_MONTHLY_PRODUCT_ID) return 'monthly'
  return null
}

export function getPolarDiscountId(code?: string | null) {
  if (!code) return undefined
  return POLAR_DISCOUNT_BY_CODE[code.trim().toUpperCase()]
}

async function polarFetch<T>(path: string, init: RequestInit) {
  const token = getPolarAccessToken()
  if (!token) throw new Error(getPolarConfigurationError() ?? 'Polar is not configured')

  const response = await fetch(`${getPolarBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })

  const body = await response.json().catch(() => null) as T | null

  if (!response.ok || !body) {
    throw new Error(`Polar request failed with ${response.status}`)
  }

  return body
}

export async function createPolarCheckout(params: {
  userId: string
  userEmail: string
  userName?: string | null
  priceOption: PriceOption
  productId: string
  discountId?: string
  successUrl: string
  returnUrl: string
  embedOrigin?: string
}) {
  const interval = params.priceOption.id === 'annual' ? 'annual' : 'monthly'
  const currency = params.priceOption.display.currency.trim().toLowerCase()

  return polarFetch<PolarCheckoutResponse>('/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      products: [params.productId],
      currency,
      external_customer_id: params.userId,
      customer_email: params.userEmail,
      customer_name: params.userName || undefined,
      discount_id: params.discountId,
      allow_discount_codes: true,
      allow_trial: false,
      success_url: params.successUrl,
      return_url: params.returnUrl,
      embed_origin: params.embedOrigin,
      metadata: {
        user_id: params.userId,
        plan: 'pro',
        interval,
        price_id: params.priceOption.id,
        currency: params.priceOption.display.currency,
      },
    }),
  })
}

export async function createPolarCustomerPortalSession(params: {
  externalCustomerId: string
  returnUrl: string
}) {
  return polarFetch<PolarCustomerSessionResponse>('/customer-sessions', {
    method: 'POST',
    body: JSON.stringify({
      external_customer_id: params.externalCustomerId,
      return_url: params.returnUrl,
    }),
  })
}

function timingSafeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && crypto.timingSafeEqual(left, right)
}

function getWebhookSigningKeys(secret: string) {
  const keys: Buffer[] = [Buffer.from(secret)]
  const prefixedMatch = secret.match(/^(?:whsec|polar_whs)_(.+)$/)

  if (prefixedMatch?.[1]) {
    try {
      keys.push(Buffer.from(prefixedMatch[1], 'base64'))
    } catch {
      // Keep raw secret fallback.
    }
  }

  try {
    keys.push(Buffer.from(secret, 'base64'))
  } catch {
    // Keep raw secret fallback.
  }

  return keys
}

export function verifyPolarWebhookSignature(params: {
  rawBody: string
  headers: Headers
  secret: string
}) {
  const webhookId = params.headers.get('webhook-id')
  const webhookTimestamp = params.headers.get('webhook-timestamp')
  const webhookSignature = params.headers.get('webhook-signature')

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return false
  }

  const timestampMs = Number(webhookTimestamp) * 1000
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return false
  }

  const signedPayload = `${webhookId}.${webhookTimestamp}.${params.rawBody}`
  const expectedSignatures = getWebhookSigningKeys(params.secret).map(key =>
    crypto.createHmac('sha256', key).update(signedPayload).digest('base64')
  )
  const receivedSignatures = webhookSignature
    .split(' ')
    .flatMap(part => part.split(','))
    .map(part => part.trim())
    .map(part => part.startsWith('v1,') ? part.slice(3) : part)
    .filter(Boolean)

  return expectedSignatures.some(expected =>
    receivedSignatures.some(received => timingSafeEqual(expected, received))
  )
}
