'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Timer, CheckCircle2, ArrowRight, X, BadgePercent } from 'lucide-react'
import {
  PRO_PLAN,
  getEffectiveDisplay,
  formatPriceDisplay,
  promoAppliesToOption,
  type PriceOption,
  type PromoConfig,
} from '@/lib/pricing'
import { usePaddleCheckout } from '@/hooks/usePaddleCheckout'
import { Analytics } from '@/lib/analytics'

interface Props {
  promo: PromoConfig
  priceOption: PriceOption
  onClose: () => void
}

export default function ExitIntentModal({ promo, priceOption, onClose }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasShown, setHasShown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(promo.exitIntentTimerSeconds)
  const mountedAtRef = useRef(0)
  const lastPointerYRef = useRef<number | null>(null)
  const pendingTopExitRef = useRef(false)
  const { openSubscriptionCheckout } = usePaddleCheckout()

  const showModal = useCallback(() => {
    const key = `exit-intent-${promo.id}`
    // Only constrain to once-per-session in production so we can easily test locally
    if (process.env.NODE_ENV === 'production' && sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, 'true')
    setHasShown(true)
    setIsOpen(true)
    Analytics.exitIntentModalShown({
      page: window.location.pathname,
      promoCode: promo.paddleDiscountCode,
    })
  }, [promo.id, promo.paddleDiscountCode])

  // Exit intent detection: desktop only, no timer fallback.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.innerWidth < 1024) return

    mountedAtRef.current = Date.now()

    function triggerOpen() {
      const dwellMs = Date.now() - mountedAtRef.current
      if (dwellMs < 12000) return
      if (!hasShown) {
        showModal()
      }
    }

    function isLikelyBrowserChromeExit() {
      return (lastPointerYRef.current ?? 999) <= 140
    }

    function handlePointerMove(e: MouseEvent) {
      lastPointerYRef.current = e.clientY
    }

    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY <= 24) {
        triggerOpen()
      }
    }

    function handleMouseOut(e: MouseEvent) {
      if (!e.relatedTarget && e.clientY <= 28) {
        triggerOpen()
      }
    }

    function handleWindowBlur() {
      if (isLikelyBrowserChromeExit()) {
        pendingTopExitRef.current = true
        if (document.visibilityState === 'visible') {
          triggerOpen()
        }
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden' && isLikelyBrowserChromeExit()) {
        pendingTopExitRef.current = true
        return
      }

      if (document.visibilityState === 'visible' && pendingTopExitRef.current) {
        pendingTopExitRef.current = false
        triggerOpen()
      }
    }

    function handleWindowFocus() {
      if (pendingTopExitRef.current) {
        pendingTopExitRef.current = false
        triggerOpen()
      }
    }

    document.addEventListener('mousemove', handlePointerMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseout', handleMouseOut)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('mousemove', handlePointerMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseout', handleMouseOut)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [hasShown, showModal])
  
  // Countdown timer
  useEffect(() => {
    if (!isOpen || !promo.exitIntentTimerSeconds) return
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer)
          setIsOpen(false)
          onClose()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, promo.exitIntentTimerSeconds])

  function handleClose() {
    setIsOpen(false)
    Analytics.exitIntentModalDismissed({
      page: window.location.pathname,
    })
    onClose()
  }

  async function handleClaim() {
    setIsLoading(true)
    const promoApplies = promoAppliesToOption(promo, priceOption)
    if (promo.paddleDiscountCode) {
      Analytics.exitIntentModalConverted({
        promoCode: promo.paddleDiscountCode,
      })
    }
    await openSubscriptionCheckout({
      priceId: priceOption.id,
      promotionId: promoApplies && promo.paddleDiscountId ? promo.id : undefined,
      promotionCode: promoApplies ? promo.paddleDiscountCode : undefined,
      onSuccess: () => setIsLoading(false),
      onError: () => setIsLoading(false),
    })
  }

  const display = getEffectiveDisplay(priceOption, promo)
  const formatted = formatPriceDisplay(display, priceOption)
  const mins = Math.floor(timeLeft / 60)
  const secs = String(timeLeft % 60).padStart(2, '0')
  const intervalLabel = priceOption.id === 'annual' ? 'annual' : 'monthly'
  const timerLabel = promo.paddleDiscountCode
    ? `${promo.paddleDiscountCode} expires in ${Math.max(0, mins)}:${secs}`
    : `Offer expires in ${Math.max(0, mins)}:${secs}`
  const monthlyEquivalent =
    priceOption.interval === 'year'
      ? display.displayPrice / 12
      : display.displayPrice
  const valueMessage =
    monthlyEquivalent <= 5
      ? 'Less than a coffee for a stronger shot at interviews.'
      : 'A small cost compared with another missed interview cycle.'
  const proofPills = [
    'Unlimited ATS scans',
    'Tailor Mode',
    'Custom exports',
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-zinc-950/45 backdrop-blur-md"
        onClick={handleClose}
      />

      <div className="relative z-50 w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(243,247,244,0.96))] text-zinc-900 shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 top-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-52 w-52 rounded-full bg-primary-container/60 blur-3xl" />
        </div>

        <div className="relative border-b border-black/6 bg-[linear-gradient(90deg,rgba(163,255,179,0.42),rgba(255,255,255,0.92),rgba(163,255,179,0.18))] px-6 py-3 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/12 bg-white/86 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
              <Timer size={14} />
              {promo.exitIntentTimerSeconds > 0 ? timerLabel : 'Limited time offer'}
            </div>
            {promo.paddleDiscountCode ? (
              <div className="rounded-full border border-primary/12 bg-primary-container/40 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-on-primary-container">
                Code: {promo.paddleDiscountCode}
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative p-6 sm:p-8 lg:p-10">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/6 bg-white/75 text-zinc-500 transition-colors hover:text-zinc-900"
          >
            <X size={18} />
          </button>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-container/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-primary-container">
                <BadgePercent size={12} />
                Rezoomed Pro
              </div>
              <div className="space-y-3">
                <h2 className="max-w-xl text-[2.2rem] font-black leading-[0.95] tracking-tight text-on-background sm:text-[2.9rem]">
                  Leave now and this offer goes with you.
                </h2>
                <p className="max-w-xl text-sm leading-7 text-on-surface-variant sm:text-[15px]">
                  Unlock Pro while the discount is still active and tighten your resume before the next application cycle.
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
              <div className="rounded-[1.6rem] border border-primary/12 bg-[linear-gradient(160deg,rgba(2,109,50,0.08),rgba(255,255,255,0.96))] p-5 shadow-[0_18px_42px_rgba(2,109,50,0.08)]">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/70">
                  {intervalLabel} plan
                </p>
                <div className="mt-3">
                  <div className="flex flex-wrap items-end gap-3">
                    {formatted.actual ? (
                      <span className="text-2xl font-semibold text-on-surface-variant/45 line-through">
                        {formatted.actual}
                      </span>
                    ) : null}
                    <span className="text-5xl font-black tracking-tight text-on-background">
                      {formatted.main}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-primary">
                    {promo.paddleDiscountCode ? `${promo.paddleDiscountCode} applied` : 'Offer applied'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    {valueMessage}
                  </p>
                  {formatted.perMonth ? (
                    <p className="mt-2 text-sm font-medium text-on-surface-variant">
                      {formatted.perMonth} billed annually
                    </p>
                  ) : null}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {proofPills.map((pill) => (
                    <span
                      key={pill}
                      className="inline-flex rounded-full border border-black/6 bg-white/80 px-3 py-1.5 text-[11px] font-bold text-zinc-700"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary/75">
                  Protected by our 14-day refund policy
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-black/6 bg-white/82 p-5 shadow-[0_16px_36px_rgba(25,28,29,0.05)]">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/60">
                  Why people upgrade
                </p>
                <div className="mt-4 space-y-3">
                  {PRO_PLAN.features.slice(0, 3).map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" />
                      <span className="text-sm leading-6 text-on-background">{feature}</span>
                    </div>
                  ))}
                  <div className="rounded-[1rem] bg-primary-container/30 px-4 py-3 text-sm font-semibold text-on-primary-container">
                    Better resume iterations now beat another missed callback later.
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleClaim}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'Opening checkout…' : 'Claim discount now'}
                {!isLoading ? <ArrowRight size={16} /> : null}
              </button>
              <button
                onClick={handleClose}
                className="w-full text-sm font-semibold text-on-surface-variant transition-colors hover:text-on-background"
              >
                No thanks
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
