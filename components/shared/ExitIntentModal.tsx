'use client'

import { useState, useEffect, useCallback } from 'react'
import { Timer, CheckCircle2, ArrowRight, X } from 'lucide-react'
import {
  PRO_PLAN,
  getEffectiveDisplay,
  formatPriceDisplay,
  type PromoConfig,
} from '@/lib/pricing'
import { usePaddleCheckout } from '@/hooks/usePaddleCheckout'
import { Analytics } from '@/lib/analytics'

interface Props {
  promo: PromoConfig
  onClose: () => void
}

export default function ExitIntentModal({ promo, onClose }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasShown, setHasShown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(promo.exitIntentTimerSeconds)
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
    Analytics.exitIntentModalDismissed({
      page: window.location.pathname,
    })
    onClose()
  }

  async function handleClaim() {
    setIsLoading(true)
    if (promo.paddleDiscountCode) {
      Analytics.exitIntentModalConverted({
        promoCode: promo.paddleDiscountCode,
      })
    }
    await openSubscriptionCheckout({
      priceId: PRO_PLAN.defaultPrice.id,
      promotionId: promo.id,
      promotionCode: promo.paddleDiscountCode,
      onSuccess: () => setIsLoading(false),
      onError: () => setIsLoading(false),
    })
  }

  // Build price display for the promo's override
  const priceOption = PRO_PLAN.defaultPrice
  const display = getEffectiveDisplay(priceOption, promo)
  const formatted = formatPriceDisplay(display, priceOption)

  if (!isOpen) return null

  // Helper to split headline exactly like the mockup if it contains an em-dash
  const headlineParts = promo.headline.includes('—') 
    ? promo.headline.split('—').map(p => p.trim()) 
    : [promo.headline];
    
  // Time formatting
  const mins = Math.floor(timeLeft / 60)
  const secs = String(timeLeft % 60).padStart(2, '0')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-hidden">
      {/* Modal Backdrop Overlay */}
      <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-40" onClick={handleClose}></div>
      
      {/* Main Modal Container */}
      <div className="relative z-50 w-full max-w-lg bg-white rounded-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] overflow-hidden font-body text-zinc-900">
        
        {/* Urgent Top Banner */}
        <div className="bg-[#a3ffb3]/40 px-6 py-2 flex justify-center items-center gap-2">
          <Timer size={16} className="text-[#026d32]" />
          <span className="text-xs font-bold tracking-[0.05em] uppercase text-[#19793c] leading-none">
            {promo.exitIntentTimerSeconds > 0 ? `Offer expires in ${mins}:${secs}` : 'Limited time offer'}
          </span>
        </div>
        
        {/* Content Area */}
        <div className="p-8 md:p-10 relative bg-white">
          {/* Close Button */}
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-800 transition-colors"
          >
            <X size={24} />
          </button>
          
          {/* Brand text */}
          <div className="mb-8">
            <span className="text-zinc-900 font-extrabold text-lg tracking-tighter">Rezoomed</span>
          </div>
          
          {/* Header Section */}
          <div className="space-y-4 mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 leading-[1.1]">
              {headlineParts.length > 1 ? (
                <>
                  {headlineParts[0]} — <br />
                  <span className="text-[#80da92]">{headlineParts[1]}</span>
                </>
              ) : (
                promo.headline
              )}
            </h1>
            <p className="text-zinc-600 text-lg font-medium max-w-sm">
              We&apos;d love for you to experience the full power of Rezoomed.
            </p>
          </div>
          
          {/* Pricing Section (Asymmetric Bento Style) */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 mb-8">
            <div className="sm:col-span-3 bg-zinc-50 rounded-xl p-6 flex flex-col justify-center">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-extrabold tracking-tighter text-zinc-900">{formatted.main}</span>
                {formatted.actual && (
                  <span className="text-xl text-zinc-400 line-through font-medium">{formatted.actual}</span>
                )}
              </div>
              <p className="mt-2 text-zinc-600 text-sm font-semibold leading-snug">
                {promo.subheadline}
              </p>
            </div>
            
            <div className="sm:col-span-2 space-y-4 py-2">
              {PRO_PLAN.features.slice(0, 3).map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-[#026d32] shrink-0" />
                  <span className="text-sm font-medium text-zinc-900 leading-tight">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="space-y-4 text-center sm:text-left relative z-20">
            <button 
              onClick={handleClaim}
              disabled={isLoading}
              className="w-full py-4 px-8 bg-[#a3ffb3] hover:bg-[#9bf7ac] transition-all duration-200 text-[#19793c] font-bold text-lg rounded-full flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Redirecting...' : promo.ctaLabel}
              {!isLoading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </button>
            <div className="flex justify-center">
              <button 
                onClick={handleClose}
                className="text-zinc-500 hover:text-zinc-700 text-sm font-semibold transition-colors"
              >
                No thanks, I&apos;ll pay full price later
              </button>
            </div>
          </div>
          
          {/* Background Aesthetic Texture (Subtle Glass Bleed) */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#a3ffb3]/20 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#80da92]/10 rounded-full blur-[80px] pointer-events-none"></div>
        </div>
      </div>
    </div>
  )
}
