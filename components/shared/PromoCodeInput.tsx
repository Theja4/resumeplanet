'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

export interface PromoValidationResult {
  valid: boolean
  promotionId?: string
  discountCode?: string
  discountType?: string
  discountValue?: number
  appliesTo?: 'all' | string
  badge?: string
  displayLabel?: string
  errorMessage?: string
}

interface Props {
  onApply: (result: PromoValidationResult) => void
  autoFillCode?: string
  compact?: boolean
}

export default function PromoCodeInput({ onApply, autoFillCode, compact = false }: Props) {
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
      const res = await fetch('/api/paddle/validate-promo', {
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
    <div className={compact ? 'rounded-[1.35rem] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(244,248,246,0.9))] p-2 shadow-[0_16px_38px_rgba(25,28,29,0.06)]' : ''}>
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
          className={compact
            ? 'flex-1 rounded-[1.05rem] border border-black/6 bg-white/88 px-4 py-3 text-sm font-mono uppercase tracking-[0.18em] text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50 disabled:text-gray-500'
            : 'flex-1 rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm font-mono uppercase tracking-wider text-slate-700 shadow-[0_12px_28px_rgba(25,28,29,0.04)] focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50 disabled:text-gray-500'
          }
        />
        {result?.valid !== true && (
          <button
            onClick={() => handleApply()}
            disabled={!code.trim() || isValidating}
            className={compact
              ? 'min-w-[6.75rem] rounded-[1.05rem] bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-45'
              : 'rounded-[1rem] bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40'
            }
          >
            {isValidating ? 'Checking…' : 'Apply'}
          </button>
        )}
      </div>

      {/* Success state */}
      {result?.valid === true && (
        <div className={`${compact ? 'mt-2.5' : 'mt-3'} flex items-center gap-2 rounded-[1rem] border border-primary/12 bg-primary-container/25 px-3 py-2.5 text-sm text-primary`}>
          <CheckCircle size={16} className="shrink-0" />
          <span>{result.displayLabel}</span>
          <button
            onClick={clearPromo}
            className="ml-auto text-xs text-slate-500 transition-colors hover:text-slate-700"
          >
            Remove
          </button>
        </div>
      )}

      {/* Error state */}
      {result?.valid === false && result.errorMessage && (
        <p className={`${compact ? 'mt-2.5' : 'mt-3'} flex items-center gap-1.5 rounded-[1rem] border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-500`}>
          <XCircle size={14} className="shrink-0" />
          {result.errorMessage}
        </p>
      )}
    </div>
  )
}
