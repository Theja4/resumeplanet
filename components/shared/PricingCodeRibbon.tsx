'use client'

import { useState, useSyncExternalStore } from 'react'
import { Check, Copy, X } from 'lucide-react'

interface PricingCodeRibbonProps {
  code: string
  discountPercent: number
  storageKey?: string
}

// Stable subscribe (no live updates needed beyond the current tab, which we
// handle with local state). Module-level so it doesn't re-subscribe each render.
const subscribe = () => () => {}
const getServerSnapshot = () => false

export default function PricingCodeRibbon({
  code,
  discountPercent,
  storageKey = `pricing-ribbon-dismissed-${code.trim().toLowerCase()}`,
}: PricingCodeRibbonProps) {
  // Read the persisted "dismissed" flag in a hydration-safe way: the server
  // (and the first client render) always see `false`, so SSR and hydration
  // match; React then reconciles to the real localStorage value after mount.
  const persistedDismissed = useSyncExternalStore(
    subscribe,
    () => (typeof window !== 'undefined' && window.localStorage.getItem(storageKey) === 'true'),
    getServerSnapshot,
  )
  const [locallyDismissed, setLocallyDismissed] = useState(false)
  const [copied, setCopied] = useState(false)

  const dismissed = persistedDismissed || locallyDismissed

  function handleDismiss() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, 'true')
    }
    setLocallyDismissed(true)
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
    <div className="flex h-10 items-center gap-2 overflow-hidden rounded-full border border-primary/12 bg-[linear-gradient(90deg,rgba(2,109,50,0.10),rgba(2,109,50,0.05))] px-3 shadow-[0_8px_20px_rgba(2,109,50,0.06)] sm:px-4">
      <p className="min-w-0 flex-1 truncate text-[11px] font-semibold tracking-[0.01em] text-on-surface sm:text-[12px]">
        <span className="mr-1.5" aria-hidden="true">🔥</span>
        Use <span className="font-black tracking-[0.08em] text-primary">{code}</span> for {discountPercent}% OFF
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-primary/12 bg-white/90 px-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-primary transition-all hover:bg-white"
        aria-label={copied ? 'Coupon code copied' : 'Copy coupon code'}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/70 text-on-surface-variant transition-all hover:bg-white hover:text-on-background"
        aria-label="Dismiss pricing ribbon"
      >
        <X size={13} />
      </button>
    </div>
  )
}
