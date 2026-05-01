'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import ExitIntentProvider from '@/components/shared/ExitIntentProvider'
import PricingCodeRibbon from '@/components/shared/PricingCodeRibbon'
import { getPaddle } from '@/components/providers/PaddleProvider'
import BillingUpgradeSection from './BillingUpgradeSection'
import ManageSubscriptionButton from './ManageSubscriptionButton'
import CancelSubscriptionButton from './CancelSubscriptionButton'
import {
  resolvePromoPriceOption,
  type PriceOption,
  type PromoConfig,
} from '@/lib/pricing'
import { usePaddleCheckout } from '@/hooks/usePaddleCheckout'
import { isPayPalCheckoutPreferred } from '@/hooks/usePaddleCheckout'
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
  const isSubscribedMonthlyPro = isPro && currentSubscriptionInterval === 'monthly'
  const isManualProAccess = isPro && currentSubscriptionInterval == null

  const ribbonCode = availablePromo?.paddleDiscountCode ?? null
  const ribbonDiscountPercent =
    availablePromo?.discountType === 'percent' ? availablePromo.discountValue : null
  const shouldShowPromoRibbon =
    Boolean(ribbonCode && ribbonDiscountPercent) &&
    (!isPro || isSubscribedMonthlyPro)
  const baseDisplayPromo = isManualProAccess ? availablePromo : null
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

      if (!isPayPalCheckoutPreferred() && !getPaddle() && attempts < 20) {
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
      <div className="space-y-4">
        {shouldShowPromoRibbon ? (
          <PricingCodeRibbon
            code={ribbonCode!}
            discountPercent={ribbonDiscountPercent!}
          />
        ) : null}

        {isPro && !isManualProAccess && (
          <div className="rounded-[2.3rem] border border-black/5 bg-black/[0.02] p-8">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="space-y-1">
                <h3 className="text-xl font-black tracking-tight text-slate-900">Current Subscription</h3>
                <p className="text-sm text-slate-500">
                  You are currently on the <span className="font-bold text-[#026d32]">Pro {currentSubscriptionInterval === 'annual' ? 'Annual' : 'Monthly'}</span> plan.
                </p>
              </div>
              <div className="flex w-full flex-col items-center gap-4 md:w-auto">
                <ManageSubscriptionButton className="flex w-full items-center justify-center gap-2 rounded-full bg-[#026d32] px-8 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#026d32]/20 transition-all hover:bg-[#015623] hover:-translate-y-0.5 md:w-auto" />
                <CancelSubscriptionButton />
              </div>
            </div>
          </div>
        )}

        {isPro && (
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-black/5" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Available Plans</span>
            <div className="h-px flex-1 bg-black/5" />
          </div>
        )}

        <BillingUpgradeSection
          autoFillPromo={autoFillPromo}
          baseDisplayPromo={baseDisplayPromo}
          displayPromo={activePromo}
          onDisplayPromoChange={setActivePromo}
          isPro={isPro}
          priceOptions={priceOptions}
          currentSubscriptionInterval={currentSubscriptionInterval}
          compact
          pricingCountryCode={pricingCountryCode}
          loginRedirectPath={loginRedirectPath}
        />
      </div>
    </ExitIntentProvider>
  )
}
