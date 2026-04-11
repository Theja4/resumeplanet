'use client'

import { useState } from 'react'
import {
  type DiscountType,
  type PriceOption,
  type PromoConfig,
  promoAppliesToOption,
} from '@/lib/pricing'
import PricingCard from '@/components/shared/PricingCard'
import PromoCodeInput, { type PromoValidationResult } from '@/components/shared/PromoCodeInput'
import { usePaddleCheckout } from '@/hooks/usePaddleCheckout'

interface Props {
  autoFillPromo?: string
  baseDisplayPromo?: PromoConfig | null
  displayPromo?: PromoConfig | null
  onDisplayPromoChange?: (promo: PromoConfig | null) => void
  isPro: boolean
  priceOptions: PriceOption[]
  currentSubscriptionInterval?: 'monthly' | 'annual' | null
  compact?: boolean
  pricingCountryCode?: string | null
}

export default function BillingUpgradeSection({
  autoFillPromo,
  baseDisplayPromo,
  displayPromo,
  onDisplayPromoChange,
  isPro,
  priceOptions,
  currentSubscriptionInterval = null,
  compact = false,
  pricingCountryCode,
}: Props) {
  const [appliedPromotionId, setAppliedPromotionId] = useState<string | undefined>(undefined)
  const [appliedPromotionCode, setAppliedPromotionCode] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const activePromo: PromoConfig | null = displayPromo ?? baseDisplayPromo ?? null
  const { openSubscriptionCheckout } = usePaddleCheckout()
  const monthlyOption = priceOptions.find(option => option.id === 'monthly') ?? priceOptions[0]
  const annualOption = priceOptions.find(option => option.id === 'annual') ?? priceOptions[1]
  const freeCurrencySymbol = monthlyOption?.display.currencySymbol ?? annualOption?.display.currencySymbol ?? '$'

  function buildAppliedDisplayPromo(result: PromoValidationResult): PromoConfig | null {
    if (!result.valid || !result.discountType || result.discountValue == null) {
      return null
    }

    const discountCode = result.discountCode?.trim().toUpperCase()

    return {
      id: result.promotionId ?? `applied-${discountCode ?? 'promo'}`,
      name: discountCode ?? 'Applied promotion',
      paddleDiscountId: '',
      paddleDiscountCode: discountCode,
      discountType: result.discountType as DiscountType,
      discountValue: result.discountValue,
      appliesTo: result.appliesTo ?? 'all',
      label: result.displayLabel ?? 'Applied promotion',
      badge: result.badge ?? result.displayLabel ?? 'Discount',
      headline: '',
      subheadline: '',
      ctaLabel: '',
      disclaimerText: '',
      isExitIntent: false,
      isBanner: false,
      isAutoApply: false,
      exitIntentTimerSeconds: 0,
    }
  }

  function handlePromoApply(result: PromoValidationResult) {
    setAppliedPromotionId(result.valid ? result.promotionId : undefined)
    setAppliedPromotionCode(result.valid ? result.discountCode : undefined)
    onDisplayPromoChange?.(buildAppliedDisplayPromo(result) ?? baseDisplayPromo ?? null)
  }

  const hasAppliedPromotion =
    appliedPromotionId !== undefined || appliedPromotionCode !== undefined

  const effectivePromotionId =
    hasAppliedPromotion
      ? appliedPromotionId
      : activePromo?.isAutoApply && activePromo.paddleDiscountId
        ? activePromo.id
        : undefined
  const effectivePromotionCode =
    hasAppliedPromotion
      ? appliedPromotionCode
      : activePromo?.isAutoApply
        ? activePromo.paddleDiscountCode
        : undefined

  async function handleUpgrade(priceId: string) {
    setIsLoading(true)
    setCheckoutError(null)

    const selectedOption = priceOptions.find(option => option.id === priceId)
    const promoApplies = promoAppliesToOption(activePromo, selectedOption ?? priceId)

    await openSubscriptionCheckout({
      priceId,
      promotionId: promoApplies ? effectivePromotionId : undefined,
      promotionCode: promoApplies ? effectivePromotionCode : undefined,
      onSuccess: () => setIsLoading(false),
      onError: (err) => {
        setIsLoading(false)
        setCheckoutError(err)
        console.error('Checkout error:', err)
      },
    })
  }

  function getLockedMessage(optionId: string) {
    if (!isPro) {
      return undefined
    }

    if (currentSubscriptionInterval === optionId) {
      return undefined
    }

    return 'You already have Pro. Interval changes from this page are coming soon.'
  }

  return (
    <div className={compact ? 'space-y-3.5' : 'space-y-6'}>
      {!isPro && compact && (
        <div className="flex justify-end">
          <div className="w-full xl:max-w-md">
            <PromoCodeInput
              autoFillCode={autoFillPromo}
              onApply={handlePromoApply}
              compact
            />
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 md:grid-cols-3 md:items-stretch ${compact ? 'gap-4 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1fr)_minmax(0,1fr)]' : 'gap-5 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.08fr)_minmax(0,1.08fr)]'}`}>
        <PricingCard
          variant="free"
          freeCurrencySymbol={freeCurrencySymbol}
          activePromo={activePromo}
          isCurrentPlan={!isPro}
          compact={compact}
          delay="0ms"
          pricingCountryCode={pricingCountryCode}
        />

        {monthlyOption ? (
          <PricingCard
            variant="pro"
            priceOption={monthlyOption}
            activePromo={activePromo}
            isCurrentPlan={isPro && currentSubscriptionInterval === 'monthly'}
            onUpgrade={isPro ? undefined : () => handleUpgrade(monthlyOption.id)}
            isUpgrading={isLoading}
            lockedMessage={getLockedMessage('monthly')}
            compact={compact}
            delay="120ms"
            pricingCountryCode={pricingCountryCode}
          />
        ) : null}

        {annualOption ? (
          <PricingCard
            variant="pro"
            priceOption={annualOption}
            activePromo={activePromo}
            isCurrentPlan={isPro && currentSubscriptionInterval === 'annual'}
            onUpgrade={isPro ? undefined : () => handleUpgrade(annualOption.id)}
            isUpgrading={isLoading}
            lockedMessage={getLockedMessage('annual')}
            compact={compact}
            delay="240ms"
            pricingCountryCode={pricingCountryCode}
          />
        ) : null}
      </div>

      {checkoutError && (
        <p className="text-sm text-red-600 text-center">{checkoutError}</p>
      )}

      {!isPro && !compact && (
        <div className="rounded-[1.6rem] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(244,248,246,0.9))] p-4 shadow-[0_18px_45px_rgba(25,28,29,0.05)] sm:p-5">
          <div className="mb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Discount code</p>
            <p className="mt-1 text-sm text-slate-500">Apply a promo code before opening checkout.</p>
          </div>
          <PromoCodeInput
            autoFillCode={autoFillPromo}
            onApply={handlePromoApply}
          />
        </div>
      )}
    </div>
  )
}
