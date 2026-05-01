import type { PriceOption } from '@/lib/pricing'

type PayPalEnvironment = 'sandbox' | 'live'

interface PayPalAccessTokenResponse {
  access_token?: string
  token_type?: string
  expires_in?: number
}

interface PayPalVerifyWebhookSignatureResponse {
  verification_status?: 'SUCCESS' | 'FAILURE'
}

export interface PayPalOrderResponse {
  id: string
  status?: string
  links?: Array<{
    href: string
    rel: string
    method?: string
  }>
  purchase_units?: Array<{
    reference_id?: string
    custom_id?: string
  }>
}

export interface PayPalSubscriptionResponse {
  id: string
  plan_id?: string
  custom_id?: string
  status?: string
  links?: Array<{
    href: string
    rel: string
    method?: string
  }>
}

function getPayPalEnvironment(): PayPalEnvironment {
  return process.env.PAYPAL_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'live'
}

function getPayPalBaseUrl() {
  return getPayPalEnvironment() === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com'
}

function getPayPalClientId() {
  return process.env.PAYPAL_CLIENT_ID ?? process.env.PAYPAL_API_KEY
}

function getPayPalClientSecret() {
  return process.env.PAYPAL_CLIENT_SECRET ?? process.env.PAYPAL_SECRET
}

export function isPayPalCheckoutEnabled() {
  return process.env.NEXT_PUBLIC_PAYMENT_PROVIDER !== 'paddle'
    || process.env.NEXT_PUBLIC_PAYPAL_CHECKOUT_ENABLED === 'true'
}

export function getPayPalConfigurationError() {
  if (!getPayPalClientId()) return 'PAYPAL_CLIENT_ID is not set.'
  if (!getPayPalClientSecret()) return 'PAYPAL_CLIENT_SECRET is not set.'
  return null
}

async function getPayPalAccessToken() {
  const clientId = getPayPalClientId()
  const clientSecret = getPayPalClientSecret()

  if (!clientId || !clientSecret) {
    throw new Error(getPayPalConfigurationError() ?? 'PayPal is not configured')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })

  const body = await response.json().catch(() => null) as PayPalAccessTokenResponse | null

  if (!response.ok || !body?.access_token) {
    throw new Error(`PayPal token request failed with ${response.status}`)
  }

  return body.access_token
}

export function getPayPalApprovalUrl(order: PayPalOrderResponse) {
  return order.links?.find(link => link.rel === 'approve')?.href ?? null
}

const PAYPAL_SUBSCRIPTION_PLAN_ENV_KEYS = [
  'PAYPAL_PRO_PLAN_MONTHLY_USD',
  'PAYPAL_PRO_PLAN_ANNUAL_USD',
  'PAYPAL_PRO_PLAN_MONTHLY_EUR',
  'PAYPAL_PRO_PLAN_ANNUAL_EUR',
  'PAYPAL_PRO_PLAN_MONTHLY_GBP',
  'PAYPAL_PRO_PLAN_ANNUAL_GBP',
  'PAYPAL_PRO_PLAN_MONTHLY_INR',
  'PAYPAL_PRO_PLAN_ANNUAL_INR',
  'PAYPAL_PRO_PLAN_MONTHLY_AUD',
  'PAYPAL_PRO_PLAN_ANNUAL_AUD',
  'PAYPAL_PRO_PLAN_MONTHLY_CAD',
  'PAYPAL_PRO_PLAN_ANNUAL_CAD',
] as const

function normalizeCurrency(currency?: string | null) {
  return (currency ?? 'USD').trim().toUpperCase()
}

export function getPayPalSubscriptionPlanId(interval: 'monthly' | 'annual', currency?: string | null) {
  const normalizedCurrency = normalizeCurrency(currency)
  const intervalKey = interval === 'annual' ? 'ANNUAL' : 'MONTHLY'
  const currencySpecificPlanId = process.env[`PAYPAL_PRO_PLAN_${intervalKey}_${normalizedCurrency}`]

  if (currencySpecificPlanId) {
    return currencySpecificPlanId
  }

  if (normalizedCurrency === 'USD') {
    return interval === 'annual'
      ? process.env.PAYPAL_PRO_PLAN_ANNUAL
      : process.env.PAYPAL_PRO_PLAN_MONTHLY
  }

  return undefined
}

export function getPayPalSubscriptionIntervalFromPlanId(planId?: string | null) {
  if (!planId) return null
  for (const key of PAYPAL_SUBSCRIPTION_PLAN_ENV_KEYS) {
    if (planId !== process.env[key]) continue
    return key.includes('_ANNUAL_') ? 'annual' as const : 'monthly' as const
  }
  if (planId === process.env.PAYPAL_PRO_PLAN_ANNUAL) return 'annual' as const
  if (planId === process.env.PAYPAL_PRO_PLAN_MONTHLY) return 'monthly' as const
  return null
}

export async function createPayPalProSubscription(params: {
  userId: string
  userEmail: string
  priceOption: PriceOption
  planId: string
  returnUrl: string
  cancelUrl: string
}) {
  const accessToken = await getPayPalAccessToken()

  const response = await fetch(`${getPayPalBaseUrl()}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      plan_id: params.planId,
      custom_id: params.userId,
      subscriber: {
        email_address: params.userEmail,
      },
      application_context: {
        brand_name: 'Rezoomed',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
    cache: 'no-store',
  })

  const body = await response.json().catch(() => null) as PayPalSubscriptionResponse | null

  if (!response.ok || !body?.id) {
    throw new Error(`PayPal subscription creation failed with ${response.status}`)
  }

  return body
}

export async function getPayPalSubscription(subscriptionId: string) {
  const accessToken = await getPayPalAccessToken()

  const response = await fetch(`${getPayPalBaseUrl()}/v1/billing/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  const body = await response.json().catch(() => null) as PayPalSubscriptionResponse | null

  if (!response.ok || !body?.id) {
    throw new Error(`PayPal subscription lookup failed with ${response.status}`)
  }

  return body
}

export async function verifyPayPalWebhookSignature(params: {
  transmissionId: string | null
  transmissionTime: string | null
  certUrl: string | null
  authAlgo: string | null
  transmissionSig: string | null
  webhookEvent: unknown
}) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) {
    throw new Error('PAYPAL_WEBHOOK_ID is not set.')
  }

  const {
    transmissionId,
    transmissionTime,
    certUrl,
    authAlgo,
    transmissionSig,
    webhookEvent,
  } = params

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return false
  }

  const accessToken = await getPayPalAccessToken()
  const response = await fetch(`${getPayPalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: webhookEvent,
    }),
    cache: 'no-store',
  })

  const body = await response.json().catch(() => null) as PayPalVerifyWebhookSignatureResponse | null

  if (!response.ok) {
    throw new Error(`PayPal webhook verification failed with ${response.status}`)
  }

  return body?.verification_status === 'SUCCESS'
}

export async function createPayPalProOrder(params: {
  userId: string
  userEmail: string
  priceOption: PriceOption
  returnUrl: string
  cancelUrl: string
}) {
  const accessToken = await getPayPalAccessToken()
  const amount = params.priceOption.display.displayPrice.toFixed(2)
  const intervalLabel = params.priceOption.id === 'annual' ? 'Annual' : 'Monthly'

  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: `pro-${params.priceOption.id}`,
          custom_id: params.userId,
          description: `Rezoomed Pro ${intervalLabel}`,
          amount: {
            currency_code: params.priceOption.display.currency,
            value: amount,
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            brand_name: 'Rezoomed',
            locale: 'en-US',
            landing_page: 'LOGIN',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW',
            return_url: params.returnUrl,
            cancel_url: params.cancelUrl,
          },
        },
      },
    }),
    cache: 'no-store',
  })

  const body = await response.json().catch(() => null) as PayPalOrderResponse | null

  if (!response.ok || !body?.id) {
    throw new Error(`PayPal order creation failed with ${response.status}`)
  }

  return body
}

export async function capturePayPalOrder(orderId: string) {
  const accessToken = await getPayPalAccessToken()

  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: '{}',
    cache: 'no-store',
  })

  const body = await response.json().catch(() => null) as PayPalOrderResponse | null

  if (!response.ok || !body?.id) {
    throw new Error(`PayPal capture failed with ${response.status}`)
  }

  return body
}
