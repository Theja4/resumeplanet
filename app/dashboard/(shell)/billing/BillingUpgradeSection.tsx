'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PRO_PLAN,
  getActivePromotion,
  type PromoConfig,
} from '@/lib/pricing'
import PricingToggle from '@/components/shared/PricingToggle'
import PricingCard from '@/components/shared/PricingCard'
import PromoCodeInput, { type PromoValidationResult } from '@/components/shared/PromoCodeInput'

interface Props {
  autoFillPromo?: string
}

export default function BillingUpgradeSection({ autoFillPromo }: Props) {
  const router = useRouter()
  const [selectedPriceId, setSelectedPriceId] = useState(PRO_PLAN.defaultPrice.id)
  const [appliedCouponId, setAppliedCouponId] = useState<string | undefined>(undefined)
  const activePromo: PromoConfig | null = getActivePromotion()

  async function handleUpgrade() {
    const effectiveCouponId = appliedCouponId ??
      (activePromo?.isAutoApply ? activePromo.stripeCouponId : undefined)

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'subscription',
        priceId: selectedPriceId,
        couponId: effectiveCouponId,
      }),
    })
    const json = await res.json()
    if (json.data?.checkoutUrl) {
      window.location.href = json.data.checkoutUrl
    }
  }

  function handlePromoApply(result: PromoValidationResult) {
    setAppliedCouponId(result.valid ? result.couponId : undefined)
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

      {/* Pricing card */}
      <PricingCard
        variant="pro"
        selectedPriceId={selectedPriceId}
        activePromo={activePromo}
        isCurrentPlan={false}
        onUpgrade={handleUpgrade}
      />

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
