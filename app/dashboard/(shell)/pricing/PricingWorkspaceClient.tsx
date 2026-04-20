'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import ExitIntentProvider from '@/components/shared/ExitIntentProvider'
import PricingCodeRibbon from '@/components/shared/PricingCodeRibbon'
import { getPaddle } from '@/components/providers/PaddleProvider'
import BillingUpgradeSection from './BillingUpgradeSection'
import {
  resolvePromoPriceOption,
  type PriceOption,
  type PromoConfig,
} from '@/lib/pricing'
import { usePaddleCheckout } from '@/hooks/usePaddleCheckout'
import {
  clearPricingCheckoutIntent,
  readPricingCheckoutIntent,
} from '@/lib/pricingCheckoutIntent'

interface PricingWorkspaceClientProps {
  autoFillPromo?: string
  availablePromo: PromoConfig | null
  isPro: boolean
  priceOptions: PriceOption[]
  currentSubscriptionInterval?: 'monthly' | 'annual' | null
  pricingCountryCode?: string | null
  loginRedirectPath?: string | null
  consumeCheckoutIntent?: boolean
}

export default function PricingWorkspaceClient({
  autoFillPromo,
  availablePromo,
  isPro,
  priceOptions,
  currentSubscriptionInterval = null,
  pricingCountryCode,
  loginRedirectPath = null,
  consumeCheckoutIntent = false,
}: PricingWorkspaceClientProps) {
  const [activePromo, setActivePromo] = useState<PromoConfig | null>(null)
  const hasAttemptedIntentRef = useRef(false)
  const { openSubscriptionCheckout } = usePaddleCheckout()

  const ribbonCode = availablePromo?.paddleDiscountCode ?? null
  const ribbonDiscountPercent =
    availablePromo?.discountType === 'percent' ? availablePromo.discountValue : null
  const exitPriceOption = useMemo(
    () => resolvePromoPriceOption(priceOptions, availablePromo),
    [priceOptions, availablePromo]
  )

  useEffect(() => {
    if (!consumeCheckoutIntent || isPro || hasAttemptedIntentRef.current) {
      return
    }

    const intent = readPricingCheckoutIntent()
    if (!intent) {
      return
    }

    hasAttemptedIntentRef.current = true

    let attempts = 0
    let cancelled = false

    const tryResumeCheckout = async () => {
      if (cancelled) return

      if (!getPaddle() && attempts < 20) {
        attempts += 1
        window.setTimeout(() => {
          void tryResumeCheckout()
        }, 250)
        return
      }

      clearPricingCheckoutIntent()

      await openSubscriptionCheckout({
        priceId: intent.priceId,
        promotionId: intent.promotionId,
        promotionCode: intent.promotionCode,
      })
    }

    void tryResumeCheckout()

    return () => {
      cancelled = true
    }
  }, [consumeCheckoutIntent, isPro, openSubscriptionCheckout])

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
        loginRedirectPath={loginRedirectPath}
      />
    </ExitIntentProvider>
  )
}
