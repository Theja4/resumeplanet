'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, CheckCircle } from 'lucide-react'
import {
  PRO_PLAN,
  getEffectiveDisplay,
  formatPriceDisplay,
  type PromoConfig,
} from '@/lib/pricing'
import PriceDisplay from './PriceDisplay'
import { usePaddleCheckout } from '@/hooks/usePaddleCheckout'

interface Props {
  promo: PromoConfig
  onClose: () => void
}

export default function ExitIntentModal({ promo, onClose }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasShown, setHasShown] = useState(false)
  const [timeLeft, setTimeLeft] = useState(promo.exitIntentTimerSeconds)
  const [isLoading, setIsLoading] = useState(false)
  const { openSubscriptionCheckout } = usePaddleCheckout()

  const showModal = useCallback(() => {
    const key = `exit-intent-${promo.id}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, 'true')
    setHasShown(true)
    setIsOpen(true)
  }, [promo.id])

  // Exit intent detection: trigger when cursor leaves from the top
  useEffect(() => {
    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY <= 5 && !hasShown) {
        showModal()
      }
    }
    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
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
    onClose()
  }

  async function handleClaim() {
    setIsLoading(true)
    await openSubscriptionCheckout({
      priceId: PRO_PLAN.defaultPrice.paddlePriceId,
      couponId: promo.paddleDiscountId,
      onSuccess: () => setIsLoading(false),
      onError: () => setIsLoading(false),
    })
  }

  // Build price display for the promo's override
  const priceOption = PRO_PLAN.defaultPrice
  const display = getEffectiveDisplay(priceOption, promo)
  const formatted = formatPriceDisplay(display, priceOption)

  const mins = Math.floor(timeLeft / 60)
  const secs = String(timeLeft % 60).padStart(2, '0')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Top ribbon */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 py-2 px-4 text-center">
          <p className="text-sm font-medium text-white">⚡ Limited time offer</p>
        </div>

        {/* Content */}
        <div className="p-8 text-center relative">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <h2 className="text-2xl font-bold text-gray-900">{promo.headline}</h2>
          <p className="text-gray-500 mt-2 text-sm">{promo.subheadline}</p>

          {/* Price display */}
          {promo.overrideDisplay && (
            <div className="bg-gray-50 rounded-xl p-5 my-6">
              <PriceDisplay
                display={formatted}
                size="xl"
                showInterval={true}
                className="items-center"
              />
            </div>
          )}

          {/* Countdown timer */}
          {promo.exitIntentTimerSeconds > 0 && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-sm text-gray-500">Offer expires in</span>
              <span className="font-mono font-bold text-red-500 text-xl tabular-nums">
                {mins}:{secs}
              </span>
            </div>
          )}

          {/* Top 3 features */}
          <ul className="space-y-1.5 mb-6 text-left">
            {PRO_PLAN.features.slice(0, 3).map(feature => (
              <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle size={14} className="text-green-500 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            onClick={handleClaim}
            disabled={isLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3.5 rounded-xl text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Redirecting…' : promo.ctaLabel}
          </button>

          {/* Dismiss link */}
          <button
            onClick={handleClose}
            className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 py-2"
          >
            No thanks, I&apos;ll pay full price later
          </button>

          {/* Disclaimer */}
          <p className="text-[11px] text-gray-400 mt-2">{promo.disclaimerText}</p>
        </div>
      </div>
    </div>
  )
}
