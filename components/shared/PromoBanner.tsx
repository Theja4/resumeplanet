'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PRO_PLAN } from '@/lib/pricing'
import type { PromoConfig } from '@/lib/pricing'

interface Props {
  promo: PromoConfig
}

export default function PromoBanner({ promo }: Props) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return !!sessionStorage.getItem(`promo-banner-dismissed-${promo.id}`)
  })

  function handleDismiss() {
    const key = `promo-banner-dismissed-${promo.id}`
    sessionStorage.setItem(key, 'true')
    setDismissed(true)
  }

  async function handleClaimClick() {
    if (promo.isAutoApply) {
      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'subscription',
            priceId: PRO_PLAN.getPriceById(promo.appliesTo)?.id ?? PRO_PLAN.defaultPrice.id,
            couponId: promo.stripeCouponId,
          }),
        })
        const json = await res.json()
        const url = json.data?.checkoutUrl
        if (url) window.location.href = url
      } catch {
        // Fall back to billing page
        window.location.href = `/dashboard/billing?promo=${promo.id}`
      }
    } else {
      window.location.href = `/dashboard/billing?promo=${promo.stripePromoCode ?? promo.id}`
    }
  }

  if (dismissed) return null

  return (
    <div
      className={cn(
        'w-full py-2 px-4 text-center text-sm flex items-center justify-center gap-3',
        promo.bannerBgColor ?? 'bg-indigo-600',
        promo.bannerTextColor ?? 'text-white'
      )}
    >
      {promo.bannerEmoji && <span>{promo.bannerEmoji}</span>}
      <span className="font-medium">{promo.headline}</span>
      <span className="opacity-80">—</span>
      <span className="hidden sm:inline">{promo.subheadline}</span>
      {promo.stripePromoCode && (
        <span className="font-mono bg-white/20 px-2 py-0.5 rounded text-xs tracking-wider">
          {promo.stripePromoCode}
        </span>
      )}
      <button
        onClick={handleClaimClick}
        className="ml-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-medium transition"
      >
        {promo.ctaLabel}
      </button>
      <button
        onClick={handleDismiss}
        className="ml-auto opacity-60 hover:opacity-100 text-base leading-none"
        aria-label="Dismiss banner"
      >
        ✕
      </button>
    </div>
  )
}
