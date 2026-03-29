'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import type { DiscountType } from '@/lib/pricing'

export interface PromoValidationResult {
  valid: boolean
  couponId?: string
  stripePromoCodeId?: string
  discountType?: DiscountType
  discountValue?: number
  displayLabel?: string
  errorMessage?: string
}

interface Props {
  onApply: (result: PromoValidationResult) => void
  autoFillCode?: string
}

export default function PromoCodeInput({ onApply, autoFillCode }: Props) {
  const [code, setCode] = useState(autoFillCode ?? '')
  const [isValidating, setIsValidating] = useState(false)
  const [result, setResult] = useState<PromoValidationResult | null>(null)

  // Auto-apply when autoFillCode is provided
  useEffect(() => {
    if (autoFillCode && autoFillCode.trim()) {
      handleApply(autoFillCode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFillCode])

  async function handleApply(codeToApply?: string) {
    const target = (codeToApply ?? code).trim()
    if (!target) return

    setIsValidating(true)
    setResult(null)

    try {
      const res = await fetch('/api/stripe/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: target }),
      })
      const data: PromoValidationResult = await res.json()
      setResult(data)
      if (data.valid) {
        onApply(data)
      }
    } catch {
      const errorResult: PromoValidationResult = {
        valid: false,
        errorMessage: 'Something went wrong. Please try again.',
      }
      setResult(errorResult)
    } finally {
      setIsValidating(false)
    }
  }

  function clearPromo() {
    setCode('')
    setResult(null)
    onApply({ valid: false })
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={e => {
            setCode(e.target.value.toUpperCase())
            if (result) setResult(null) // clear result when user types
          }}
          onKeyDown={e => e.key === 'Enter' && handleApply()}
          placeholder="Promo code"
          disabled={result?.valid === true}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
        />
        {result?.valid !== true && (
          <button
            onClick={() => handleApply()}
            disabled={!code.trim() || isValidating}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            {isValidating ? 'Checking…' : 'Apply'}
          </button>
        )}
      </div>

      {/* Success state */}
      {result?.valid === true && (
        <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
          <CheckCircle size={16} className="shrink-0" />
          <span>{result.displayLabel}</span>
          <button
            onClick={clearPromo}
            className="ml-auto text-gray-400 hover:text-gray-600 text-xs"
          >
            Remove
          </button>
        </div>
      )}

      {/* Error state */}
      {result?.valid === false && result.errorMessage && (
        <p className="mt-2 text-sm text-red-500 flex items-center gap-1.5">
          <XCircle size={14} className="shrink-0" />
          {result.errorMessage}
        </p>
      )}
    </div>
  )
}
