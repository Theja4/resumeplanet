'use client'

import { useState } from 'react'
import {
  PRO_PLAN,
  getActivePromotion,
  type PromoConfig,
} from '@/lib/pricing'
import PricingToggle from '@/components/shared/PricingToggle'
import PricingCard from '@/components/shared/PricingCard'
import PromoCodeInput, { type PromoValidationResult } from '@/components/shared/PromoCodeInput'
import { usePaddleCheckout } from '@/hooks/usePaddleCheckout'

interface Props {
  autoFillPromo?: string
  displayPromo?: PromoConfig | null
  isPro: boolean
  compact?: boolean
}

export default function BillingUpgradeSection({
  autoFillPromo,
  displayPromo,
  isPro,
  compact = false,
}: Props) {
  const [selectedPriceId, setSelectedPriceId] = useState(PRO_PLAN.defaultPrice.id)
  const [appliedPromotionId, setAppliedPromotionId] = useState<string | undefined>(undefined)
  const [appliedPromotionCode, setAppliedPromotionCode] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const activePromo: PromoConfig | null = displayPromo ?? getActivePromotion()
  const { openSubscriptionCheckout } = usePaddleCheckout()

  function handlePromoApply(result: PromoValidationResult) {
    setAppliedPromotionId(result.valid ? result.promotionId : undefined)
    setAppliedPromotionCode(result.valid ? result.discountCode : undefined)
  }

  const hasAppliedPromotion =
    appliedPromotionId !== undefined || appliedPromotionCode !== undefined

  const effectivePromotionId =
    hasAppliedPromotion
      ? appliedPromotionId
      : (activePromo?.isAutoApply && activePromo.paddleDiscountId ? activePromo.id : undefined)
  const effectivePromotionCode =
    hasAppliedPromotion
      ? appliedPromotionCode
      : (activePromo?.isAutoApply ? activePromo.paddleDiscountCode : undefined)

  async function handleUpgrade() {
    setIsLoading(true)
    setCheckoutError(null)
    await openSubscriptionCheckout({
      priceId: selectedPriceId,
      promotionId: effectivePromotionId,
      promotionCode: effectivePromotionCode,
      onSuccess: () => setIsLoading(false),
      onError: (err) => {
        setIsLoading(false)
        setCheckoutError(err)
        console.error('Checkout error:', err)
      },
    })
  }

  return (
    <div className={compact ? 'space-y-3.5' : 'space-y-6'}>
      {/* Interval toggle — only relevant when upgrading from free */}
      {!isPro &&
        (compact ? (
          <div className="grid gap-3 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1fr)_minmax(0,0.94fr)] xl:items-start xl:gap-4">
            <div className="hidden xl:block" />
            <div className="xl:flex xl:justify-center">
              <PricingToggle
                selectedPriceId={selectedPriceId}
                onChange={setSelectedPriceId}
                activePromo={activePromo}
              />
            </div>
            <div className="xl:col-start-3 xl:w-full">
              <PromoCodeInput
                autoFillCode={autoFillPromo}
                onApply={handlePromoApply}
                compact
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <PricingToggle
              selectedPriceId={selectedPriceId}
              onChange={setSelectedPriceId}
              activePromo={activePromo}
            />
          </div>
        ))}

      {/* 3-column card grid */}
      <div className={`grid grid-cols-1 md:grid-cols-3 md:items-stretch ${compact ? 'gap-4 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1fr)_minmax(0,0.94fr)]' : 'gap-5 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.08fr)_minmax(0,0.96fr)]'}`}>
        <PricingCard
          variant="free"
          activePromo={activePromo}
          isCurrentPlan={!isPro}
          compact={compact}
          delay="0ms"
        />
        <PricingCard
          variant="pro"
          selectedPriceId={selectedPriceId}
          activePromo={activePromo}
          isCurrentPlan={isPro}
          onUpgrade={isPro ? undefined : handleUpgrade}
          isUpgrading={isLoading}
          compact={compact}
          delay="120ms"
        />
        <PricingCard
          variant="professional"
          activePromo={activePromo}
          compact={compact}
          delay="240ms"
        />
      </div>

      {checkoutError && (
        <p className="text-sm text-red-600 text-center">{checkoutError}</p>
      )}

      {/* Promo code input — only relevant when upgrading from free */}
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
