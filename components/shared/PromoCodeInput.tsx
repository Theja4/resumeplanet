'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

export interface PromoValidationResult {
  valid: boolean
  source?: 'affiliate' | 'promotion'
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

  if (result?.valid === true) {
    return (
      <div className={compact
        ? 'flex h-11 items-center gap-2 rounded-full border border-primary/15 bg-primary-container/30 px-3 text-sm text-primary shadow-[0_10px_24px_rgba(2,109,50,0.08)]'
        : 'flex h-12 items-center gap-2 rounded-[1rem] border border-primary/15 bg-primary-container/30 px-4 text-sm text-primary shadow-[0_12px_28px_rgba(25,28,29,0.04)]'
      }>
        <CheckCircle size={compact ? 17 : 18} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate font-medium">
          <span className="font-mono uppercase tracking-[0.12em]">{result.discountCode ?? code}</span>
          {result.displayLabel ? <span className="ml-2 text-primary/85">{result.displayLabel}</span> : null}
        </span>
        <button
          type="button"
          onClick={clearPromo}
          className="shrink-0 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-700"
        >
          Remove
        </button>
      </div>
    )
  }

  return (
    <div className={compact ? 'rounded-full border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(244,248,246,0.9))] p-1 shadow-[0_10px_24px_rgba(25,28,29,0.05)]' : ''}>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={e => {
            setCode(e.target.value.toUpperCase())
            if (result) setResult(null) // clear result when user types
          }}
          onKeyDown={e => e.key === 'Enter' && handleApply()}
          placeholder="Promo code"
          className={compact
            ? 'h-10 min-w-0 flex-1 rounded-full border border-black/6 bg-white/88 px-4 text-sm font-mono uppercase tracking-[0.18em] text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20'
            : 'flex-1 rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm font-mono uppercase tracking-wider text-slate-700 shadow-[0_12px_28px_rgba(25,28,29,0.04)] focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50 disabled:text-gray-500'
          }
        />
        <button
          onClick={() => handleApply()}
          disabled={!code.trim() || isValidating}
          className={compact
            ? 'h-10 min-w-[5.75rem] rounded-full bg-zinc-950 px-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-45'
            : 'rounded-[1rem] bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40'
          }
        >
          {isValidating ? 'Checking…' : 'Apply'}
        </button>
      </div>

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
