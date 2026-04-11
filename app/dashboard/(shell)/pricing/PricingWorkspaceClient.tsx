'use client'

import { useMemo, useState } from 'react'
import ExitIntentProvider from '@/components/shared/ExitIntentProvider'
import PricingCodeRibbon from '@/components/shared/PricingCodeRibbon'
import BillingUpgradeSection from './BillingUpgradeSection'
import {
  resolvePromoPriceOption,
  type PriceOption,
  type PromoConfig,
} from '@/lib/pricing'

interface PricingWorkspaceClientProps {
  autoFillPromo?: string
  initialPromo: PromoConfig | null
  isPro: boolean
  priceOptions: PriceOption[]
  currentSubscriptionInterval?: 'monthly' | 'annual' | null
  pricingCountryCode?: string | null
}

export default function PricingWorkspaceClient({
  autoFillPromo,
  initialPromo,
  isPro,
  priceOptions,
  currentSubscriptionInterval = null,
  pricingCountryCode,
}: PricingWorkspaceClientProps) {
  const [activePromo, setActivePromo] = useState<PromoConfig | null>(initialPromo)

  const ribbonCode = activePromo?.paddleDiscountCode ?? null
  const ribbonDiscountPercent =
    activePromo?.discountType === 'percent' ? activePromo.discountValue : null
  const exitPriceOption = useMemo(
    () => resolvePromoPriceOption(priceOptions, activePromo),
    [priceOptions, activePromo]
  )

  return (
    <ExitIntentProvider
      isPro={isPro}
      exitPromo={activePromo}
      exitPriceOption={exitPriceOption}
    >
      {ribbonCode && ribbonDiscountPercent ? (
        <PricingCodeRibbon
          code={ribbonCode}
          discountPercent={ribbonDiscountPercent}
        />
      ) : null}

      <BillingUpgradeSection
        autoFillPromo={autoFillPromo}
        baseDisplayPromo={initialPromo}
        displayPromo={activePromo}
        onDisplayPromoChange={setActivePromo}
        isPro={isPro}
        priceOptions={priceOptions}
        currentSubscriptionInterval={currentSubscriptionInterval}
        compact
        pricingCountryCode={pricingCountryCode}
      />
    </ExitIntentProvider>
  )
}
