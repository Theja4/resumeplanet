import type { PromoConfig } from '@/lib/pricing'
import type { Affiliate, Profile } from '@/types'

export const AFFILIATE_REFERRAL_COOKIE = 'rezoomed_affiliate_ref'
export const AFFILIATE_REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30
export const AFFILIATE_REFERRALS_PER_PAGE = 10

function readPercentEnv(key: string, fallback: number) {
  const raw = process.env[key]
  if (!raw) return fallback

  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return fallback

  return Math.max(0, Math.min(100, parsed))
}

export const AFFILIATE_ACTIVATION_DISCOUNT_PERCENT = readPercentEnv(
  'NEXT_PUBLIC_AFFILIATE_DISCOUNT_PERCENT',
  50
)
export const AFFILIATE_ACTIVATION_COMMISSION_PERCENT = readPercentEnv(
  'NEXT_PUBLIC_AFFILIATE_COMMISSION_PERCENT',
  40
)

const AFFILIATE_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,39}$/
const AFFILIATE_ACTIVATION_BASE_CODE_PATTERN = /^[A-Z0-9]{4,8}$/
const RESERVED_REF_SOURCES = new Set(['BLOG'])

function roundCurrencyAmount(value: number) {
  return Math.round(value * 100) / 100
}

function toCurrencyAmount(value: string | number | null | undefined) {
  const numeric = typeof value === 'number' ? value : Number(value ?? 0)
  if (!Number.isFinite(numeric)) {
    return 0
  }

  return roundCurrencyAmount(numeric)
}

export function fromMinorUnitAmount(value: string | number | null | undefined) {
  return roundCurrencyAmount(toCurrencyAmount(value) / 100)
}

export function toMonthlyRecurringRevenue(
  amountInMinorUnits: string | number | null | undefined,
  interval: string | null | undefined,
  frequency = 1
) {
  const normalizedAmount = fromMinorUnitAmount(amountInMinorUnits)
  const safeFrequency = Math.max(1, frequency)

  switch (interval) {
    case 'month':
      return roundCurrencyAmount(normalizedAmount / safeFrequency)
    case 'year':
      return roundCurrencyAmount(normalizedAmount / (12 * safeFrequency))
    case 'week':
      return roundCurrencyAmount((normalizedAmount * 52) / (12 * safeFrequency))
    default:
      return normalizedAmount
  }
}

export function parseAffiliatePageNumber(value: string | null | undefined) {
  const page = Number(value)

  if (!Number.isFinite(page)) {
    return 1
  }

  return Math.max(1, Math.floor(page))
}

export function normalizeAffiliateCode(value: string | null | undefined) {
  return value?.trim().toUpperCase() ?? ''
}

export function normalizeAffiliateActivationBaseCode(value: string | null | undefined) {
  return value?.trim().toUpperCase() ?? ''
}

export function isValidAffiliateActivationBaseCode(value: string | null | undefined) {
  return AFFILIATE_ACTIVATION_BASE_CODE_PATTERN.test(normalizeAffiliateActivationBaseCode(value))
}

export function buildActivatedAffiliateCode(baseCode: string) {
  return `${normalizeAffiliateActivationBaseCode(baseCode)}50`
}

export function isAffiliateReferralCode(value: string | null | undefined) {
  const normalized = normalizeAffiliateCode(value)

  return (
    normalized.length > 0 &&
    AFFILIATE_CODE_PATTERN.test(normalized) &&
    !RESERVED_REF_SOURCES.has(normalized)
  )
}

export function readAffiliateReferralCodeFromCookieStore(cookieStore: {
  get(name: string): { value: string } | undefined
}) {
  const rawValue = cookieStore.get(AFFILIATE_REFERRAL_COOKIE)?.value
  return isAffiliateReferralCode(rawValue) ? normalizeAffiliateCode(rawValue) : null
}

export function buildAffiliateReferralLink(appUrl: string | undefined, discountCode: string) {
  const origin = (appUrl ?? 'https://www.rezoomed.com').replace(/\/+$/, '')
  return `${origin}/${encodeURIComponent(normalizeAffiliateCode(discountCode))}`
}

export function resolveAffiliateSourceCodeFromProfile(
  profile: Pick<Profile, 'affiliate_source_code'> | null | undefined
) {
  return isAffiliateReferralCode(profile?.affiliate_source_code)
    ? normalizeAffiliateCode(profile?.affiliate_source_code)
    : null
}

export function buildAffiliatePricingPromo(
  affiliate:
    | Pick<Affiliate, 'discount_code' | 'discount_percent'>
    | null
    | undefined
): PromoConfig | null {
  if (!affiliate) {
    return null
  }

  const discountPercent = toCurrencyAmount(affiliate.discount_percent)

  if (discountPercent <= 0) {
    return null
  }

  const badgeLabel = `${discountPercent}% OFF`

  return {
    id: `affiliate-${affiliate.discount_code.toLowerCase()}`,
    name: `Affiliate ${affiliate.discount_code}`,
    paddleDiscountId: '',
    paddleDiscountCode: affiliate.discount_code,
    discountType: 'percent',
    discountValue: discountPercent,
    appliesTo: 'all',
    label: `${badgeLabel} via ${affiliate.discount_code}`,
    badge: badgeLabel,
    headline: `${badgeLabel} unlocked`,
    subheadline: `Affiliate code ${affiliate.discount_code} will be applied automatically.`,
    ctaLabel: 'Claim discount',
    disclaimerText: `Discount code ${affiliate.discount_code} applies automatically at checkout.`,
    isExitIntent: true,
    isBanner: false,
    isAutoApply: true,
    exitIntentTimerSeconds: 600,
  }
}

export function formatUsdCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
