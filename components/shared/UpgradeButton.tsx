'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PRO_PLAN, getActivePromotion, getEffectiveDisplay, formatPriceDisplay } from '@/lib/pricing'

interface UpgradeButtonProps {
  label?: string
  variant?: 'button' | 'banner' | 'inline'
  className?: string
}

export default function UpgradeButton({
  variant = 'button',
  className,
  label: labelProp,
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activePromo = getActivePromotion()
  const priceOption = PRO_PLAN.defaultPrice
  const display = getEffectiveDisplay(priceOption, activePromo)
  const formatted = formatPriceDisplay(display, priceOption)

  const label = labelProp ?? `Upgrade to Pro — ${formatted.main}/mo`

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'subscription', priceId: priceOption.id }),
      })
      const json = await res.json()
      const url = json.data?.checkoutUrl
      if (url) {
        window.location.href = url
      } else {
        setError('Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (variant === 'banner') {
    return (
      <div className={cn('bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between gap-4', className)}>
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-600 shrink-0" />
          <span className="text-sm text-indigo-800 font-medium">{label}</span>
        </div>
        <button
          onClick={handleClick}
          disabled={loading}
          className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading…' : `Upgrade — ${formatted.main}/mo`}
        </button>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className={cn('text-indigo-600 hover:text-indigo-800 text-sm font-medium underline-offset-2 hover:underline transition-colors disabled:opacity-50', className)}
      >
        {loading ? 'Loading…' : label}
      </button>
    )
  }

  // Default 'button' variant
  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-2 text-center">{error}</p>}
      <button
        onClick={handleClick}
        disabled={loading}
        className={cn(
          'flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
      >
        <Sparkles size={16} />
        {loading ? 'Redirecting to checkout…' : label}
      </button>
    </div>
  )
}
