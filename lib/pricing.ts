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
        displayPrice: 12,
        actualPrice: undefined,
        currency: 'USD',
        currencySymbol: '$',
      },
      label: 'Monthly',
      badge: undefined,
      isDefault: true,
      isHidden: false,
      perMonthEquivalent: 12,
      savingsNote: undefined,
    },
    {
      id: 'annual',
      paddlePriceId: process.env.PADDLE_PRO_PRICE_ANNUAL ?? '',
      interval: 'year' as BillingInterval,
      intervalCount: 1,
      display: {
        displayPrice: 99,
        actualPrice: 144,
        currency: 'USD',
        currencySymbol: '$',
      },
      label: 'Annual',
      badge: 'Save 31%',
      isDefault: false,
      isHidden: false,
      perMonthEquivalent: 8.25,
      savingsNote: 'Save $45 vs monthly',
    },
    {
      id: 'weekly',
      paddlePriceId: process.env.PADDLE_PRO_PRICE_WEEKLY ?? '',
      interval: 'week' as BillingInterval,
      intervalCount: 1,
      display: {
        displayPrice: 4.99,
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROFESSIONAL ORDER CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PROFESSIONAL_ORDER = {
  name: 'Professional Resume Writing',
  display: {
    displayPrice: 29.99,
    actualPrice: undefined,
    currency: 'USD',
    currencySymbol: '$',
  },
  amountCents: 2999,
  deliveryHours: 48,
  revisions: 1,
  features: [
    'Written by a former recruiter',
    'ATS-optimised formatting',
    'Tailored to your target role',
    '48-hour delivery',
    'One round of revisions',
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
    discountValue: 50,
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
    discountValue: 30,
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
    name: 'Default Exit Offer',
    paddleDiscountId: process.env.PADDLE_DISCOUNT_EXIT_DEFAULT ?? '',
    paddleDiscountCode: undefined,
    discountType: 'fixed',
    discountValue: 6,
    appliesTo: 'monthly',
    overrideDisplay: {
      displayPrice: 6,
      actualPrice: 12,
    },
    label: 'Special Offer',
    badge: 'MOST POPULAR',
    bannerEmoji: undefined,
    headline: 'Wait — before you go',
    subheadline: 'Get your first month of Pro for just $6. Cancel anytime.',
    ctaLabel: 'Claim $6 offer →',
    disclaimerText: 'First month only. Renews at $12/month. Cancel anytime.',
    startDate: undefined,
    endDate: undefined,
    isExitIntent: true,
    isBanner: false,
    isAutoApply: false,
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

  if (promo.overrideDisplay) {
    return {
      displayPrice: promo.overrideDisplay.displayPrice,
      actualPrice: promo.overrideDisplay.actualPrice,
      currency: option.display.currency,
      currencySymbol: option.display.currencySymbol,
    }
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

export function getProfessionalOrderDisplay(): PriceDisplay {
  return PROFESSIONAL_ORDER.display
}

export const PLANS = {
  FREE: 'free' as PlanId,
  PRO: 'pro' as PlanId,
}

export function isValidPricingPriceId(id: string): boolean {
  return PRO_PLAN.prices.some(p => p.paddlePriceId === id && p.paddlePriceId !== '')
}
