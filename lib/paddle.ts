import { Paddle, Environment } from '@paddle/paddle-node-sdk'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { isValidPricingPriceId } from '@/lib/pricing'

let _paddle: Paddle | null = null

function getPaddleInstance(): Paddle {
  if (!_paddle) {
    if (!process.env.PADDLE_API_KEY) {
      throw new Error('PADDLE_API_KEY is not set')
    }
    _paddle = new Paddle(process.env.PADDLE_API_KEY, {
      environment:
        process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'production'
          ? Environment.production
          : Environment.sandbox,
    })
  }
  return _paddle
}

// Lazy proxy — safe to import at module level without PADDLE_API_KEY set
export const paddle = new Proxy({} as Paddle, {
  get(_target, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getPaddleInstance() as any)[prop]
  },
})

// ── Price / Product ID constants ──────────────────────────────────────────────

export const PADDLE_PRICES = {
  proMonthly: process.env.PADDLE_PRO_PRICE_MONTHLY ?? '',
  proAnnual: process.env.PADDLE_PRO_PRICE_ANNUAL ?? '',
  proWeekly: process.env.PADDLE_PRO_PRICE_WEEKLY ?? '',
  professionalOrder: process.env.PADDLE_PROFESSIONAL_ORDER_PRICE_ID ?? '',
}

export const PADDLE_PRODUCTS = {
  professional: process.env.PADDLE_PROFESSIONAL_PRODUCT_ID ?? '',
}

// ── Validation ────────────────────────────────────────────────────────────────

export function isValidPaddlePriceId(id: string): boolean {
  if (!id) return false

  if (PADDLE_PRICES.professionalOrder && id === PADDLE_PRICES.professionalOrder) {
    return true
  }

  return isValidPricingPriceId(id)
}

// ── Customer helper ───────────────────────────────────────────────────────────

export async function getOrCreatePaddleCustomer(
  userId: string,
  email: string,
  name: string | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('paddle_customer_id')
    .eq('id', userId)
    .single()

  if (profile?.paddle_customer_id) {
    return profile.paddle_customer_id
  }

  const customer = await paddle.customers.create({
    email,
    name: name ?? undefined,
    customData: { supabase_user_id: userId },
  })

  const serviceSupabase = createServiceRoleClient()

  await serviceSupabase
    .from('profiles')
    .update({ paddle_customer_id: customer.id })
    .eq('id', userId)

  return customer.id
}

// ── Webhook verification ──────────────────────────────────────────────────────

export function verifyPaddleWebhook(
  rawBody: string,
  signature: string,
  secret: string
) {
  return paddle.webhooks.unmarshal(rawBody, secret, signature)
}
