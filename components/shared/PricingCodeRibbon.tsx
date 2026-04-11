'use client'

import { useState } from 'react'
import { Check, Copy, X } from 'lucide-react'

interface PricingCodeRibbonProps {
  code: string
  discountPercent: number
  storageKey?: string
}

export default function PricingCodeRibbon({
  code,
  discountPercent,
  storageKey = `pricing-ribbon-dismissed-${code.trim().toLowerCase()}`,
}: PricingCodeRibbonProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(storageKey) === 'true'
  })
  const [copied, setCopied] = useState(false)

  function handleDismiss() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, 'true')
    }
    setDismissed(true)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  if (dismissed) return null

  return (
    <div className="relative overflow-hidden rounded-[1rem] border border-primary/12 bg-[linear-gradient(90deg,rgba(2,109,50,0.12),rgba(2,109,50,0.06))] px-3 py-2 shadow-[0_10px_24px_rgba(2,109,50,0.08)] sm:px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,255,255,0.45),transparent_40%)]" />
      <div className="relative flex min-h-8 items-center justify-center gap-2 pr-12 sm:justify-between sm:pr-14">
        <p className="truncate text-center text-[11px] font-semibold tracking-[0.01em] text-on-surface sm:text-left sm:text-[12px]">
          <span className="mr-1.5" aria-hidden="true">🔥</span>
          Use <span className="font-black tracking-[0.08em] text-primary">{code}</span> for {discountPercent}% OFF
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="hidden items-center gap-1.5 rounded-full border border-primary/12 bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary transition-all hover:bg-white sm:inline-flex"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-on-surface-variant transition-all hover:bg-white hover:text-on-background"
        aria-label="Dismiss pricing ribbon"
      >
        <X size={13} />
      </button>
    </div>
  )
}
