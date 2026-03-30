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
}

export default function BillingUpgradeSection({ autoFillPromo }: Props) {
  const [selectedPriceId, setSelectedPriceId] = useState(PRO_PLAN.defaultPrice.id)
  const [appliedDiscountId, setAppliedDiscountId] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const activePromo: PromoConfig | null = getActivePromotion()
  const { openSubscriptionCheckout } = usePaddleCheckout()

  function handlePromoApply(result: PromoValidationResult) {
    setAppliedDiscountId(result.valid ? result.discountId : undefined)
  }

  const effectiveDiscountId = appliedDiscountId ??
    (activePromo?.isAutoApply ? activePromo.paddleDiscountId : undefined)

  async function handleUpgrade() {
    setIsLoading(true)
    setCheckoutError(null)
    await openSubscriptionCheckout({
      priceId: selectedPriceId,
      couponId: effectiveDiscountId,
      onSuccess: () => setIsLoading(false),
      onError: (err) => {
        setIsLoading(false)
        setCheckoutError(err)
        console.error('Checkout error:', err)
      },
    })
  }

  return (
    <div className="space-y-5">
      {/* Interval toggle */}
      <div className="flex justify-center">
        <PricingToggle
          selectedPriceId={selectedPriceId}
          onChange={setSelectedPriceId}
          activePromo={activePromo}
        />
      </div>

      {/* Pricing card — button wired to Paddle checkout */}
      <PricingCard
        variant="pro"
        selectedPriceId={selectedPriceId}
        activePromo={activePromo}
        isCurrentPlan={false}
        onUpgrade={handleUpgrade}
        isUpgrading={isLoading}
      />
      {checkoutError && (
        <p className="text-sm text-red-600 text-center">{checkoutError}</p>
      )}

      {/* Promo code input */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Have a promo code?</p>
        <PromoCodeInput
          autoFillCode={autoFillPromo}
          onApply={handlePromoApply}
        />
      </div>
    </div>
  )
}
