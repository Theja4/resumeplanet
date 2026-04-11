// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RESUMAI PRICING CONFIGURATION
//
// This is the ONLY file you need to edit
// for any pricing, discount, or promotion change.
//
// Changes here propagate automatically to:
//   Landing page pricing section
//   Billing page
//   PaywallModal
//   Upgrade buttons
//   Exit intent modal
//   Promo banners
//   Paddle checkout (price IDs)
//   Plan enforcement (scan limits etc)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type BillingInterval = 'week' | 'month' | 'year'
export type DiscountType = 'percent' | 'fixed'
export type PlanId = 'free' | 'pro'
export type PricingIntervalId = 'monthly' | 'annual' | 'weekly'

function readNumberEnv(key: string, fallback: number) {
  const raw = process.env[key]
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeCountryCode(value: string | null | undefined) {
  if (!value) return null
  const normalized = value.trim().toUpperCase()
  if (!normalized || normalized === 'XX' || normalized === 'T1') return null
  return normalized
}

const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
])

type RegionalPricingConfig = {
  id: 'EUR' | 'GBP' | 'INR' | 'AUD' | 'CAD'
  countries: Set<string>
  currency: string
  currencySymbol: string
  prices: Record<PricingIntervalId, {
    paddlePriceId: string
    displayPrice: number
    actualPrice?: number
    perMonthEquivalent?: number
    savingsNote?: string
  }>
}

const REGIONAL_PRICING_CONFIGS: RegionalPricingConfig[] = [
  {
    id: 'EUR',
    countries: EU_COUNTRIES,
    currency: 'EUR',
    currencySymbol: '€',
    prices: {
      monthly: {
        paddlePriceId: process.env.PADDLE_PRO_PRICE_MONTHLY_EUR ?? '',
        displayPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_MONTHLY_DISPLAY_EUR', 11),
        perMonthEquivalent: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_MONTHLY_PER_MONTH_EUR', 11),
      },
      annual: {
        paddlePriceId: process.env.PADDLE_PRO_PRICE_ANNUAL_EUR ?? '',
        displayPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_ANNUAL_DISPLAY_EUR', 89),
        actualPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_ANNUAL_ACTUAL_EUR', 132),
        perMonthEquivalent: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_ANNUAL_PER_MONTH_EUR', 7.42),
        savingsNote: process.env.NEXT_PUBLIC_PRO_PRICE_ANNUAL_SAVINGS_EUR ?? 'Save €43 vs monthly',
      },
      weekly: {
        paddlePriceId: process.env.PADDLE_PRO_PRICE_WEEKLY_EUR ?? '',
        displayPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_WEEKLY_DISPLAY_EUR', 4.49),
      },
    },
  },
  {
    id: 'GBP',
    countries: new Set(['GB']),
    currency: 'GBP',
    currencySymbol: '£',
    prices: {
      monthly: {
        paddlePriceId: process.env.PADDLE_PRO_PRICE_MONTHLY_GBP ?? '',
        displayPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_MONTHLY_DISPLAY_GBP', 10),
        perMonthEquivalent: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_MONTHLY_PER_MONTH_GBP', 10),
      },
      annual: {
        paddlePriceId: process.env.PADDLE_PRO_PRICE_ANNUAL_GBP ?? '',
        displayPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_ANNUAL_DISPLAY_GBP', 79),
        actualPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_ANNUAL_ACTUAL_GBP', 120),
        perMonthEquivalent: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_ANNUAL_PER_MONTH_GBP', 6.58),
        savingsNote: process.env.NEXT_PUBLIC_PRO_PRICE_ANNUAL_SAVINGS_GBP ?? 'Save £41 vs monthly',
      },
      weekly: {
        paddlePriceId: process.env.PADDLE_PRO_PRICE_WEEKLY_GBP ?? '',
        displayPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_WEEKLY_DISPLAY_GBP', 3.99),
      },
    },
  },
  {
    id: 'INR',
    countries: new Set(['IN']),
    currency: 'INR',
    currencySymbol: '₹',
    prices: {
      monthly: {
        paddlePriceId: process.env.PADDLE_PRO_PRICE_MONTHLY_INR ?? '',
        displayPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_MONTHLY_DISPLAY_INR', 799),
        perMonthEquivalent: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_MONTHLY_PER_MONTH_INR', 799),
      },
      annual: {
        paddlePriceId: process.env.PADDLE_PRO_PRICE_ANNUAL_INR ?? '',
        displayPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_ANNUAL_DISPLAY_INR', 6999),
        actualPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_ANNUAL_ACTUAL_INR', 9588),
        perMonthEquivalent: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_ANNUAL_PER_MONTH_INR', 583.25),
        savingsNote: process.env.NEXT_PUBLIC_PRO_PRICE_ANNUAL_SAVINGS_INR ?? 'Save ₹2,589 vs monthly',
      },
      weekly: {
        paddlePriceId: process.env.PADDLE_PRO_PRICE_WEEKLY_INR ?? '',
        displayPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_WEEKLY_DISPLAY_INR', 349),
      },
    },
  },
  {
    id: 'AUD',
    countries: new Set(['AU']),
    currency: 'AUD',
    currencySymbol: 'A$',
    prices: {
      monthly: {
        paddlePriceId: process.env.PADDLE_PRO_PRICE_MONTHLY_AUD ?? '',
        displayPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_MONTHLY_DISPLAY_AUD', 19.99),
        perMonthEquivalent: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_MONTHLY_PER_MONTH_AUD', 19.99),
      },
      annual: {
        paddlePriceId: process.env.PADDLE_PRO_PRICE_ANNUAL_AUD ?? '',
        displayPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_ANNUAL_DISPLAY_AUD', 149),
        actualPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_ANNUAL_ACTUAL_AUD', 239.88),
        perMonthEquivalent: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_ANNUAL_PER_MONTH_AUD', 12.42),
        savingsNote: process.env.NEXT_PUBLIC_PRO_PRICE_ANNUAL_SAVINGS_AUD ?? 'Save A$90.88 vs monthly',
      },
      weekly: {
        paddlePriceId: process.env.PADDLE_PRO_PRICE_WEEKLY_AUD ?? '',
        displayPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_WEEKLY_DISPLAY_AUD', 6.99),
      },
    },
  },
  {
    id: 'CAD',
    countries: new Set(['CA']),
    currency: 'CAD',
    currencySymbol: 'CA$',
    prices: {
      monthly: {
        paddlePriceId: process.env.PADDLE_PRO_PRICE_MONTHLY_CAD ?? '',
        displayPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_MONTHLY_DISPLAY_CAD', 19.99),
        perMonthEquivalent: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_MONTHLY_PER_MONTH_CAD', 19.99),
      },
      annual: {
        paddlePriceId: process.env.PADDLE_PRO_PRICE_ANNUAL_CAD ?? '',
        displayPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_ANNUAL_DISPLAY_CAD', 149),
        actualPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_ANNUAL_ACTUAL_CAD', 239.88),
        perMonthEquivalent: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_ANNUAL_PER_MONTH_CAD', 12.42),
        savingsNote: process.env.NEXT_PUBLIC_PRO_PRICE_ANNUAL_SAVINGS_CAD ?? 'Save CA$90.88 vs monthly',
      },
      weekly: {
        paddlePriceId: process.env.PADDLE_PRO_PRICE_WEEKLY_CAD ?? '',
        displayPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_WEEKLY_DISPLAY_CAD', 6.99),
      },
    },
  },
]

function getRegionalPricingConfig(countryCode: string | null | undefined) {
  const normalized = normalizeCountryCode(countryCode)
  if (!normalized) return null
  return REGIONAL_PRICING_CONFIGS.find(region => region.countries.has(normalized)) ?? null
}

// ─────────────────────────────────────
// PRICE DISPLAY CONFIG
// ─────────────────────────────────────

export interface PriceDisplay {
  displayPrice: number
  actualPrice?: number
  currency: string
  currencySymbol: string
}

// ─────────────────────────────────────
// BILLING INTERVAL
// ─────────────────────────────────────

export interface PriceOption {
  id: string
  paddlePriceId: string
  interval: BillingInterval
  intervalCount: number
  display: PriceDisplay
  label: string
  badge?: string
  isDefault: boolean
  isHidden?: boolean
  perMonthEquivalent?: number
  savingsNote?: string
}

// ─────────────────────────────────────
// PROMOTION CONFIG
// ─────────────────────────────────────

export interface PromoConfig {
  id: string
  name: string

  paddleDiscountId: string
  paddleDiscountCode?: string

  discountType: DiscountType
  discountValue: number

  appliesTo: 'all' | string

  overrideDisplay?: {
    displayPrice: number
    actualPrice: number
  }

  label: string
  badge: string
  headline: string
  subheadline: string
  ctaLabel: string
  disclaimerText: string

  startDate?: string
  endDate?: string

  isExitIntent: boolean
  isBanner: boolean
  isAutoApply: boolean
  exitIntentTimerSeconds: number

  bannerBgColor?: string
  bannerTextColor?: string
  bannerEmoji?: string
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FREE PLAN CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const FREE_PLAN = {
  id: 'free' as PlanId,
  name: 'Free',

  limits: {
    atsScansPerDay: 5,
    maxResumes: 3,
    maxTrackedJobs: 5,
  },

  features: [
    '5 ATS scans per day',
    'Up to 3 saved resumes',
    'Resume Builder with PDF export',
    'Basic ATS analysis',
    'Job board beta + track up to 5 jobs',
  ],

  lockedFeatures: [
    'Match Score against any job description',
    'AI-generated cover letters',
    'Unlimited ATS scans',
    'Unlimited resumes',
    'AI - insights (Claude Opus)',
    'Tailor Mode rewrites',
    'Editable DOCX exports',
    'Track up to 3,000 jobs',
    'Ad-free workspace',
  ],
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRO PLAN CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PRO_PLAN = {
  id: 'pro' as PlanId,
  name: 'Pro',
  limits: {
    maxTrackedJobs: 3000,
  },

  prices: [
    {
      id: 'monthly',
      paddlePriceId: process.env.PADDLE_PRO_PRICE_MONTHLY ?? '',
      interval: 'month' as BillingInterval,
      intervalCount: 1,
      display: {
        displayPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_MONTHLY_DISPLAY_USD', 12),
        actualPrice: undefined,
        currency: 'USD',
        currencySymbol: '$',
      },
      label: 'Monthly',
      badge: undefined,
      isDefault: true,
      isHidden: false,
      perMonthEquivalent: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_MONTHLY_PER_MONTH_USD', 12),
      savingsNote: undefined,
    },
    {
      id: 'annual',
      paddlePriceId: process.env.PADDLE_PRO_PRICE_ANNUAL ?? '',
      interval: 'year' as BillingInterval,
      intervalCount: 1,
      display: {
        displayPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_ANNUAL_DISPLAY_USD', 99),
        actualPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_ANNUAL_ACTUAL_USD', 144),
        currency: 'USD',
        currencySymbol: '$',
      },
      label: 'Annual',
      badge: 'Save 31%',
      isDefault: false,
      isHidden: false,
      perMonthEquivalent: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_ANNUAL_PER_MONTH_USD', 8.25),
      savingsNote: process.env.NEXT_PUBLIC_PRO_PRICE_ANNUAL_SAVINGS_USD ?? 'Save $45 vs monthly',
    },
    {
      id: 'weekly',
      paddlePriceId: process.env.PADDLE_PRO_PRICE_WEEKLY ?? '',
      interval: 'week' as BillingInterval,
      intervalCount: 1,
      display: {
        displayPrice: readNumberEnv('NEXT_PUBLIC_PRO_PRICE_WEEKLY_DISPLAY_USD', 4.99),
        actualPrice: undefined,
        currency: 'USD',
        currencySymbol: '$',
      },
      label: 'Weekly',
      badge: undefined,
      isDefault: false,
      isHidden: true,
      savingsNote: undefined,
    },
  ] satisfies PriceOption[],

  features: [
    'Unlimited ATS scans',
    'Match Score against any job description',
    'AI-generated cover letters',
    'AI - insights (Claude Opus)',
    'Tailor Mode rewrites',
    'Unlimited saved resumes',
    'PDF + editable DOCX exports',
    'Track up to 3,000 jobs',
    'Ad-free workspace',
  ],

  get visiblePrices() {
    return this.prices.filter(p => !p.isHidden)
  },
  get defaultPrice() {
    return this.prices.find(p => p.isDefault) ?? this.prices[0]
  },
  getPriceById(id: string) {
    return this.prices.find(p => p.id === id)
  },
  getPriceByPaddleId(pid: string) {
    return this.prices.find(p => p.paddlePriceId === pid)
  },
}

function intervalIdFromPriceOption(option: PriceOption): PricingIntervalId {
  if (option.id === 'annual') return 'annual'
  if (option.id === 'weekly') return 'weekly'
  return 'monthly'
}

function applyRegionalOverride(option: PriceOption, countryCode: string | null | undefined): PriceOption {
  const region = getRegionalPricingConfig(countryCode)
  if (!region) return option

  const regionalPrice = region.prices[intervalIdFromPriceOption(option)]

  if (!regionalPrice?.paddlePriceId) {
    return option
  }

  return {
    ...option,
    paddlePriceId: regionalPrice.paddlePriceId,
    display: {
      displayPrice: regionalPrice.displayPrice,
      actualPrice: regionalPrice.actualPrice,
      currency: region.currency,
      currencySymbol: region.currencySymbol,
    },
    perMonthEquivalent: regionalPrice.perMonthEquivalent ?? option.perMonthEquivalent,
    savingsNote: regionalPrice.savingsNote ?? option.savingsNote,
  }
}

export function getProPlanForCountry(countryCode: string | null | undefined) {
  const prices = PRO_PLAN.prices.map(option => applyRegionalOverride(option, countryCode))

  return {
    ...PRO_PLAN,
    prices,
    visiblePrices: prices.filter(price => !price.isHidden),
    defaultPrice: prices.find(price => price.isDefault) ?? prices[0],
    getPriceById(id: string) {
      return prices.find(price => price.id === id)
    },
    getPriceByPaddleId(paddlePriceId: string) {
      return prices.find(price => price.paddlePriceId === paddlePriceId)
    },
  }
}

export function findProPriceOptionByPaddleId(paddlePriceId: string) {
  if (!paddlePriceId) return null

  const directMatch = PRO_PLAN.getPriceByPaddleId(paddlePriceId)
  if (directMatch) return directMatch

  for (const region of REGIONAL_PRICING_CONFIGS) {
    const regionalPlan = getProPlanForCountry([...region.countries][0] ?? null)
    const regionalMatch = regionalPlan.getPriceByPaddleId(paddlePriceId)
    if (regionalMatch) return regionalMatch
  }

  return null
}

export function getAllConfiguredProPaddlePriceIds() {
  const ids = new Set<string>()

  for (const option of PRO_PLAN.prices) {
    if (option.paddlePriceId) {
      ids.add(option.paddlePriceId)
    }
  }

  for (const region of REGIONAL_PRICING_CONFIGS) {
    for (const interval of Object.values(region.prices)) {
      if (interval.paddlePriceId) {
        ids.add(interval.paddlePriceId)
      }
    }
  }

  return [...ids]
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HUMAN-WRITTEN ORDER CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const HUMAN_WRITTEN_ORDER = {
  name: 'Human-Written Resume',
  display: {
    displayPrice: readNumberEnv('NEXT_PUBLIC_HUMAN_WRITTEN_ORDER_PRICE_USD', 199),
    actualPrice: undefined,
    currency: 'USD',
    currencySymbol: '$',
  },
  amountCents: Math.round(readNumberEnv('NEXT_PUBLIC_HUMAN_WRITTEN_ORDER_PRICE_USD', 199) * 100),
  deliveryHours: 96,
  previousDeliveryLabel: process.env.NEXT_PUBLIC_HUMAN_WRITTEN_ORDER_PREVIOUS_DELIVERY ?? '1-2 working days',
  deliveryLabel: process.env.NEXT_PUBLIC_HUMAN_WRITTEN_ORDER_DELIVERY ?? '3-4 working days',
  revisions: 1,
  features: [
    'Written by expert hiring managers from Apple, Meta, and Microsoft',
    'High-impact narrative framing for 5+ years of experience',
    'ATS-safe structure that passes through recruiter screeners',
    'Sharper executive summary and ownership-driven bullet points',
    'One revision round included to ensure 100% satisfaction',
  ],
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROMOTIONS REGISTRY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PROMOTIONS: PromoConfig[] = [
  // ── DIWALI 2026 ───────────────────
  {
    id: 'diwali-2026',
    name: 'Diwali Special 2026',
    paddleDiscountId: process.env.PADDLE_DISCOUNT_DIWALI_2026 ?? '',
    paddleDiscountCode: 'DIWALI50',
    discountType: 'percent',
    discountValue: readNumberEnv('NEXT_PUBLIC_PROMO_DIWALI_2026_PERCENT', 50),
    appliesTo: 'monthly',
    overrideDisplay: {
      displayPrice: 6,
      actualPrice: 12,
    },
    label: 'Diwali Special',
    badge: '50% OFF',
    bannerEmoji: '🪔',
    headline: 'Happy Diwali — 50% off Pro',
    subheadline:
      'Celebrate the festival of lights with ResumAI Pro at half price. Offer ends Oct 24.',
    ctaLabel: 'Claim 50% off →',
    disclaimerText:
      'Discount on first month only. Renews at $12/month. Cancel anytime.',
    startDate: '2026-10-20',
    endDate: '2026-10-24',
    isExitIntent: true,
    isBanner: true,
    isAutoApply: true,
    exitIntentTimerSeconds: 600,
    bannerBgColor: 'bg-orange-500',
    bannerTextColor: 'text-white',
  },

  // ── NEW YEAR 2027 ─────────────────
  {
    id: 'newyear-2027',
    name: 'New Year 2027',
    paddleDiscountId: process.env.PADDLE_DISCOUNT_NEWYEAR_2027 ?? '',
    paddleDiscountCode: 'NEWYEAR2027',
    discountType: 'percent',
    discountValue: readNumberEnv('NEXT_PUBLIC_PROMO_NEWYEAR_2027_PERCENT', 30),
    appliesTo: 'annual',
    overrideDisplay: {
      displayPrice: 69,
      actualPrice: 99,
    },
    label: 'New Year Offer',
    badge: '30% OFF',
    bannerEmoji: '🎉',
    headline: 'New Year, new career',
    subheadline: 'Start 2027 strong — 30% off ResumAI Pro annual plan.',
    ctaLabel: 'Start my new year →',
    disclaimerText: '30% off annual plan. Renews at $99/year. Cancel anytime.',
    startDate: '2026-12-31',
    endDate: '2027-01-03',
    isExitIntent: true,
    isBanner: true,
    isAutoApply: false,
    exitIntentTimerSeconds: 900,
    bannerBgColor: 'bg-indigo-600',
    bannerTextColor: 'text-white',
  },

  // ── DEFAULT EXIT INTENT ───────────
  {
    id: 'exit-default',
    name: 'CAREER50 Default Offer',
    paddleDiscountId: process.env.PADDLE_DISCOUNT_EXIT_DEFAULT ?? '',
    paddleDiscountCode: 'CAREER50',
    discountType: 'percent',
    discountValue: readNumberEnv('NEXT_PUBLIC_PROMO_EXIT_DEFAULT_PERCENT', 50),
    appliesTo: 'monthly',
    overrideDisplay: {
      displayPrice: 0,
      actualPrice: 0,
    },
    label: 'CAREER50',
    badge: '50% OFF',
    bannerEmoji: undefined,
    headline: 'Wait — keep your 50% off',
    subheadline: 'CAREER50 is ready to apply on your Pro plan right now.',
    ctaLabel: 'Claim CAREER50 →',
    disclaimerText: '50% off applies at checkout using CAREER50. Renewal pricing follows your selected Paddle plan.',
    startDate: undefined,
    endDate: undefined,
    isExitIntent: true,
    isBanner: false,
    isAutoApply: true,
    exitIntentTimerSeconds: 600,
    bannerBgColor: undefined,
    bannerTextColor: undefined,
  },
]

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUNTIME HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function isPromotionActive(promo: PromoConfig, now = new Date()) {
  const current = new Date(now)
  current.setHours(0, 0, 0, 0)

  const start = promo.startDate ? new Date(promo.startDate) : null
  const end = promo.endDate ? new Date(promo.endDate) : null

  if (start && current < start) return false
  if (end && current > end) return false

  return true
}

export function getPromotionById(id: string) {
  return PROMOTIONS.find(promo => promo.id === id) ?? null
}

export function getActivePromotionById(id: string) {
  const promo = getPromotionById(id)
  return promo && isPromotionActive(promo) ? promo : null
}

export function getActivePromotionByCode(code: string) {
  const normalizedCode = code.trim().toUpperCase()
  if (!normalizedCode) return null

  return (
    PROMOTIONS.find(
      promo =>
        promo.paddleDiscountCode?.trim().toUpperCase() === normalizedCode &&
        isPromotionActive(promo)
    ) ?? null
  )
}

export function getActivePromotion(): PromoConfig | null {
  return PROMOTIONS.find(promo => isPromotionActive(promo)) ?? null
}

export function getActiveAutoApplyPromotion(): PromoConfig | null {
  return PROMOTIONS.find(promo => promo.isAutoApply && isPromotionActive(promo)) ?? null
}

export function getActiveBannerPromo(): PromoConfig | null {
  const active = getActivePromotion()
  return active?.isBanner ? active : null
}

export function getActiveExitIntentPromo(): PromoConfig | null {
  const active = getActivePromotion()
  return active?.isExitIntent ? active : null
}

function roundDisplayPrice(value: number) {
  return Math.round(value * 100) / 100
}

function formatCurrencyAmount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

export function getEffectiveDisplay(
  option: PriceOption,
  promo: PromoConfig | null
): PriceDisplay {
  const appliesToOption =
    promo && (promo.appliesTo === 'all' || promo.appliesTo === option.id)

  if (!appliesToOption) {
    return option.display
  }

  const basePrice = option.display.displayPrice
  const discountedPrice =
    promo.discountType === 'percent'
      ? basePrice * (1 - promo.discountValue / 100)
      : Math.max(0, basePrice - promo.discountValue)

  return {
    displayPrice: roundDisplayPrice(discountedPrice),
    actualPrice: basePrice,
    currency: option.display.currency,
    currencySymbol: option.display.currencySymbol,
  }
}

export function formatPriceDisplay(
  display: PriceDisplay,
  option: PriceOption
) {
  const sym = display.currencySymbol
  const main = `${sym}${formatCurrencyAmount(display.displayPrice)}`
  const actual =
    display.actualPrice != null ? `${sym}${formatCurrencyAmount(display.actualPrice)}` : null
  const perMonth =
    option.interval === 'year'
      ? `${sym}${(display.displayPrice / (12 * option.intervalCount)).toFixed(2)}/mo`
      : option.perMonthEquivalent
        ? `${sym}${option.perMonthEquivalent.toFixed(2)}/mo`
        : null

  return {
    main,
    actual,
    perMonth,
    hasDiscount: actual !== null,
    interval: option.interval,
    intervalCount: option.intervalCount,
    savingsNote: option.savingsNote,
    badge: option.badge,
  }
}

export type FormattedPrice = ReturnType<typeof formatPriceDisplay>

export function resolvePromoPriceOption(
  priceOptions: PriceOption[],
  promo: PromoConfig | null
) {
  if (priceOptions.length === 0) {
    return null
  }

  if (!promo || promo.appliesTo === 'all') {
    return priceOptions.find(option => option.id === 'monthly') ?? priceOptions[0]
  }

  return (
    priceOptions.find(option => option.id === promo.appliesTo) ??
    priceOptions.find(option => option.id === 'monthly') ??
    priceOptions[0]
  )
}

export function getHumanWrittenOrderDisplay(): PriceDisplay {
  return HUMAN_WRITTEN_ORDER.display
}

export const PLANS = {
  FREE: 'free' as PlanId,
  PRO: 'pro' as PlanId,
}

export function isValidPricingPriceId(id: string): boolean {
  return getAllConfiguredProPaddlePriceIds().includes(id)
}
