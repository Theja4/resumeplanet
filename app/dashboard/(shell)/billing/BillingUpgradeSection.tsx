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
import UpgradeButton from '@/components/shared/UpgradeButton'

interface Props {
  autoFillPromo?: string
}

export default function BillingUpgradeSection({ autoFillPromo }: Props) {
  const [selectedPriceId, setSelectedPriceId] = useState(PRO_PLAN.defaultPrice.id)
  const [appliedDiscountId, setAppliedDiscountId] = useState<string | undefined>(undefined)
  const activePromo: PromoConfig | null = getActivePromotion()

  function handlePromoApply(result: PromoValidationResult) {
    setAppliedDiscountId(result.valid ? result.discountId : undefined)
  }

  const effectiveDiscountId = appliedDiscountId ??
    (activePromo?.isAutoApply ? activePromo.paddleDiscountId : undefined)

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

      {/* Pricing card */}
      <PricingCard
        variant="pro"
        selectedPriceId={selectedPriceId}
        activePromo={activePromo}
        isCurrentPlan={false}
        onUpgrade={() => {}}
      />

      {/* Upgrade button */}
      <UpgradeButton priceId={selectedPriceId} couponId={effectiveDiscountId} />

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
