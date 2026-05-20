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
import { isPayPalCheckoutPreferred, isPolarCheckoutPreferred } from '@/hooks/usePaddleCheckout'
import {
  clearPricingCheckoutIntent,
  readPricingCheckoutIntent,
} from '@/lib/pricingCheckoutIntent'

// ─── Live counter (Booking.com-style) ─────────────────────────────────────────

function useLiveCount(initial: number) {
  const [count, setCount] = useState(initial)
  useEffect(() => {
    const tick = () => setCount(c => c + Math.floor(Math.random() * 20) + 5)
    const id = window.setInterval(tick, 7000 + Math.random() * 5000)
    return () => clearInterval(id)
  }, [])
  return count
}

// ─── FOMO: Slim competition strip ────────────────────────────────────────────

function CompetitionStrip() {
  const count = useLiveCount(284700)

  return (
    <div className="flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm text-white">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </span>
      {/* Explicit en-US locale — toLocaleString() defaults differ between Vercel
          (en-US → "284,700") and Indian browsers (en-IN → "2,84,700") and trips
          React hydration. Lock to US grouping so SSR + client match. */}
      <span className="text-zinc-400"><strong className="text-white">{count.toLocaleString('en-US')}</strong> resumes upgraded this month</span>
      <span className="text-zinc-600">—</span>
      <span className="font-semibold text-amber-300">your competition is optimizing right now</span>
    </div>
  )
}

// ─── FOMO: Compact proof + anchor bar (below cards) ──────────────────────────

function ProofBar() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
      {/* Testimonial */}
      <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-black text-emerald-800">JF</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-800 italic truncate sm:text-clip sm:whitespace-normal">
            &ldquo;41% to 89% in one click. Had 2 interviews within a week.&rdquo;
          </p>
          <p className="text-xs text-on-surface-variant">James Fullerton, SWE at Stripe</p>
        </div>
        <span className="hidden sm:inline-flex shrink-0 rounded-full bg-emerald-200 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
          +48 pts
        </span>
      </div>

      {/* Price anchor */}
      <div className="flex items-center gap-3 rounded-2xl bg-zinc-950 px-5 py-3.5 text-white">
        <div className="text-center">
          <p className="text-lg font-black text-red-400 line-through decoration-1">$5.50</p>
          <p className="text-[9px] text-zinc-500">coffee</p>
        </div>
        <div className="h-8 w-px bg-white/15" />
        <div className="text-center">
          <p className="text-lg font-black text-emerald-400">$0.14</p>
          <p className="text-[9px] text-zinc-500">Pro/day</p>
        </div>
      </div>
    </div>
  )
}

function ClosingLine() {
  return (
    <p className="text-center text-xs text-on-surface-variant">
      Every day without Pro = interviews going to someone else · Cancel anytime · Instant access
    </p>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

interface PricingWorkspaceClientProps {
  autoFillPromo?: string
  availablePromo: PromoConfig | null
  isPro: boolean
  priceOptions: PriceOption[]
  currentSubscriptionInterval?: 'monthly' | 'annual' | null
  currentPaymentProvider?: string | null
  currentPeriodEnd?: string | null
  pricingCountryCode?: string | null
  loginRedirectPath?: string | null
  consumeCheckoutIntent?: boolean
  showPromoRibbon?: boolean
}

export default function PricingWorkspaceClient({
  autoFillPromo,
  availablePromo,
  isPro,
  priceOptions,
  currentSubscriptionInterval = null,
  currentPaymentProvider = null,
  currentPeriodEnd = null,
  pricingCountryCode,
  loginRedirectPath = null,
  consumeCheckoutIntent = false,
  showPromoRibbon = true,
}: PricingWorkspaceClientProps) {
  const [activePromo, setActivePromo] = useState<PromoConfig | null>(null)
  const hasAttemptedIntentRef = useRef(false)
  const { openSubscriptionCheckout } = usePaddleCheckout()
  const isRazorpaySubscriptionPro = isPro && currentPaymentProvider === 'razorpay'
  const isPeriodBoundSubscriptionPro =
    isPro && (currentPaymentProvider === 'razorpay' || currentPaymentProvider === 'polar')
  const isManualProAccess = isPro && currentSubscriptionInterval == null

  const ribbonCode = availablePromo?.paddleDiscountCode ?? null
  const ribbonDiscountPercent =
    availablePromo?.discountType === 'percent' ? availablePromo.discountValue : null
  const shouldShowPromoRibbon =
    showPromoRibbon &&
    Boolean(ribbonCode && ribbonDiscountPercent) &&
    !isPro
  const baseDisplayPromo = null
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

      if (!isPayPalCheckoutPreferred() && !isPolarCheckoutPreferred() && !getPaddle() && attempts < 20) {
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
                <h3 className="text-xl font-black tracking-tight text-slate-900">
                  Current Subscription
                </h3>
                <p className="text-sm text-slate-500">
                  You are currently on the <span className="font-bold text-[#026d32]">Pro {currentSubscriptionInterval === 'annual' ? 'Annual' : 'Monthly'}</span> plan.
                  {isPeriodBoundSubscriptionPro && currentPeriodEnd ? (
                    <> Current period ends <span className="font-bold text-slate-700">{new Date(currentPeriodEnd).toLocaleDateString()}</span>.</>
                  ) : null}
                </p>
              </div>
              <div className="flex w-full flex-col items-center gap-4 md:w-auto">
                {isRazorpaySubscriptionPro ? null : (
                  <ManageSubscriptionButton
                    provider={currentPaymentProvider}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#026d32] px-8 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#026d32]/20 transition-all hover:bg-[#015623] hover:-translate-y-0.5 md:w-auto"
                  />
                )}
                <CancelSubscriptionButton provider={currentPaymentProvider} />
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

        {!isPro && <CompetitionStrip />}

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

        {!isPro && (
          <>
            <ProofBar />
            <ClosingLine />
          </>
        )}
      </div>
    </ExitIntentProvider>
  )
}
