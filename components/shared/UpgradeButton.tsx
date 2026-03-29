'use client'

import { useState } from 'react'
import { usePaddleCheckout } from '@/hooks/usePaddleCheckout'
import { PRO_PLAN } from '@/lib/pricing'

interface Props {
  label?: string
  priceId?: string
  couponId?: string
  variant?: 'button' | 'link'
  className?: string
  onSuccess?: () => void
}

export default function UpgradeButton({
  label,
  priceId,
  couponId,
  variant = 'button',
  className = '',
  onSuccess,
}: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { openSubscriptionCheckout } = usePaddleCheckout()

  const handleClick = async () => {
    setIsLoading(true)
    setError(null)
    await openSubscriptionCheckout({
      priceId: priceId ?? PRO_PLAN.defaultPrice.paddlePriceId,
      couponId,
      onSuccess: () => {
        setIsLoading(false)
        onSuccess?.()
      },
      onError: (err) => {
        setIsLoading(false)
        setError(err)
      },
    })
  }

  const displayLabel = isLoading ? 'Opening checkout…' : (label ?? 'Upgrade to Pro')

  if (variant === 'link') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`text-indigo-600 hover:text-indigo-700 font-medium text-sm disabled:opacity-50 ${className}`}
      >
        {displayLabel}
        {error && <span className="block text-red-500 text-xs mt-1">{error}</span>}
      </button>
    )
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {displayLabel}
      </button>
      {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
    </div>
  )
}
