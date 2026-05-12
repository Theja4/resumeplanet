'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Timer, CheckCircle2, ArrowRight, X, BadgePercent } from 'lucide-react'
import {
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
  const onCloseRef = useRef(onClose)
  const { openSubscriptionCheckout } = usePaddleCheckout()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

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
          onCloseRef.current()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isOpen, promo.exitIntentTimerSeconds, timeLeft])

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
  const discountLabel =
    promo.discountType === 'percent'
      ? `${promo.discountValue}% off`
      : 'your discount'
  const proofPills = [
    'Advanced ATS analysis',
    'Tailor Mode rewrites',
    'AI cover letters',
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto px-4 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-10 lg:pb-16 lg:pt-14">
      <div
        className="fixed inset-0 bg-zinc-950/45 backdrop-blur-md"
        onClick={handleClose}
      />

      <div className="relative z-50 w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.99),rgba(244,250,246,0.97))] text-zinc-900 shadow-[0_30px_90px_rgba(15,23,42,0.18)] max-h-[calc(100dvh-4rem)]">
        <div className="relative border-b border-black/6 bg-[linear-gradient(90deg,rgba(163,255,179,0.4),rgba(255,255,255,0.94))] px-5 py-2.5 sm:px-7">
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

        <div className="relative p-5 sm:p-6">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/6 bg-white/85 text-zinc-500 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-colors hover:text-zinc-900"
          >
            <X size={18} />
          </button>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
            <div className="min-w-0 pr-8 lg:pr-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-container/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-primary-container">
                <BadgePercent size={12} />
                Rezoomed Pro
              </div>

              <div className="mt-4 space-y-3">
                <h2 className="max-w-lg text-[2.05rem] font-black leading-[0.98] text-on-background sm:text-[2.55rem]">
                  Keep {discountLabel} Pro.
                </h2>
                <p className="max-w-xl text-sm leading-6 text-on-surface-variant sm:text-[15px]">
                  Claim it before the timer ends and keep building without limits.
                </p>
              </div>

              <div className="mt-5 rounded-[1.4rem] border border-primary/12 bg-white/82 p-3.5 shadow-[0_18px_42px_rgba(2,109,50,0.08)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/70">
                      {intervalLabel} plan
                    </p>
                    <p className="mt-2 text-sm font-semibold text-primary">
                      {promo.paddleDiscountCode ? `${promo.paddleDiscountCode} applied` : 'Offer applied'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    {formatted.actual ? (
                      <span className="text-xl font-semibold text-on-surface-variant/45 line-through">
                        {formatted.actual}
                      </span>
                    ) : null}
                    <span className="text-4xl font-black leading-none text-on-background sm:text-5xl">
                      {formatted.main}
                    </span>
                  </div>
                </div>
                {formatted.perMonth ? (
                  <p className="mt-3 text-sm font-medium text-on-surface-variant">
                    {formatted.perMonth} billed annually
                  </p>
                ) : null}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {proofPills.map((pill) => (
                  <div
                    key={pill}
                    className="flex min-h-12 items-center gap-2 rounded-[1rem] border border-black/6 bg-white/62 px-3 py-2 text-xs font-semibold text-zinc-700"
                  >
                    <CheckCircle2 size={15} className="shrink-0 text-primary" />
                    <span>{pill}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative order-first min-h-[12rem] overflow-hidden rounded-[1.5rem] border border-primary/12 bg-primary-container/30 shadow-[0_18px_42px_rgba(2,109,50,0.08)] lg:order-last lg:min-h-full">
              <Image
                src="/exit-intent-mascot.webp"
                alt="Rezoomed mascot"
                fill
                priority
                sizes="(min-width: 1024px) 272px, 100vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.08)_42%,rgba(0,0,0,0.06))]" />
              <div className="relative z-10 max-w-[12rem] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/75">
                  Offer ready
                </p>
                <p className="mt-2 text-2xl font-black leading-tight text-on-background">
                  {discountLabel}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-on-surface-variant">
                  Applied at checkout.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            <button
              onClick={handleClaim}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Opening checkout...' : 'Claim discount'}
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
  )
}
