export const PRICING_CHECKOUT_INTENT_STORAGE_KEY = 'rezoomed_pricing_checkout_intent'

export interface PricingCheckoutIntent {
  priceId: string
  promotionId?: string
  promotionCode?: string
  createdAt: string
}

function isBrowser() {
  return typeof window !== 'undefined'
}

export function setPricingCheckoutIntent(intent: Omit<PricingCheckoutIntent, 'createdAt'>) {
  if (!isBrowser()) return

  window.sessionStorage.setItem(
    PRICING_CHECKOUT_INTENT_STORAGE_KEY,
    JSON.stringify({
      ...intent,
      createdAt: new Date().toISOString(),
    } satisfies PricingCheckoutIntent)
  )
}

export function readPricingCheckoutIntent(): PricingCheckoutIntent | null {
  if (!isBrowser()) return null

  const raw = window.sessionStorage.getItem(PRICING_CHECKOUT_INTENT_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<PricingCheckoutIntent>
    if (!parsed.priceId || typeof parsed.priceId !== 'string') return null

    return {
      priceId: parsed.priceId,
      promotionId: typeof parsed.promotionId === 'string' ? parsed.promotionId : undefined,
      promotionCode: typeof parsed.promotionCode === 'string' ? parsed.promotionCode : undefined,
      createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function clearPricingCheckoutIntent() {
  if (!isBrowser()) return
  window.sessionStorage.removeItem(PRICING_CHECKOUT_INTENT_STORAGE_KEY)
}
