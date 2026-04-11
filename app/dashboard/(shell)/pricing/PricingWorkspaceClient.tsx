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
  availablePromo: PromoConfig | null
  isPro: boolean
  priceOptions: PriceOption[]
  currentSubscriptionInterval?: 'monthly' | 'annual' | null
  pricingCountryCode?: string | null
}

export default function PricingWorkspaceClient({
  autoFillPromo,
  availablePromo,
  isPro,
  priceOptions,
  currentSubscriptionInterval = null,
  pricingCountryCode,
}: PricingWorkspaceClientProps) {
  const [activePromo, setActivePromo] = useState<PromoConfig | null>(null)

  const ribbonCode = availablePromo?.paddleDiscountCode ?? null
  const ribbonDiscountPercent =
    availablePromo?.discountType === 'percent' ? availablePromo.discountValue : null
  const exitPriceOption = useMemo(
    () => resolvePromoPriceOption(priceOptions, availablePromo),
    [priceOptions, availablePromo]
  )

  return (
    <ExitIntentProvider
      isPro={isPro}
      exitPromo={availablePromo}
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
        baseDisplayPromo={null}
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
