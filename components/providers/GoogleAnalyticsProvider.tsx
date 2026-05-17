'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
    __rezoomedGaInitialized?: boolean
    __rezoomedGaScriptLoading?: boolean
  }
}

const GA_LOAD_DELAY_MS = 12_000

function scheduleAnalyticsScriptLoad(callback: () => void) {
  let didRun = false
  let timeoutId: ReturnType<typeof globalThis.setTimeout> | null = null

  const cleanup = () => {
    window.removeEventListener('pointerdown', run)
    window.removeEventListener('keydown', run)
    window.removeEventListener('touchstart', run)
    window.removeEventListener('scroll', run)
    if (timeoutId !== null) {
      globalThis.clearTimeout(timeoutId)
    }
  }

  const run = () => {
    if (didRun) return
    didRun = true
    cleanup()
    callback()
  }

  window.addEventListener('pointerdown', run, { once: true, passive: true })
  window.addEventListener('keydown', run, { once: true })
  window.addEventListener('touchstart', run, { once: true, passive: true })
  window.addEventListener('scroll', run, { once: true, passive: true })
  timeoutId = globalThis.setTimeout(run, GA_LOAD_DELAY_MS)

  return cleanup
}

export default function GoogleAnalyticsProvider({
  enabled = true,
}: {
  enabled?: boolean
}) {
  const gaId = process.env.NEXT_PUBLIC_GA4_ID

  useEffect(() => {
    if (!enabled || !gaId) return

    window.dataLayer = window.dataLayer || []
    window.gtag ??= (...args: unknown[]) => {
      window.dataLayer.push(args)
    }

    if (!window.__rezoomedGaInitialized) {
      window.gtag('js', new Date())
      window.gtag('config', gaId, { send_page_view: false })
      window.__rezoomedGaInitialized = true
    }

    return scheduleAnalyticsScriptLoad(() => {
      if (window.__rezoomedGaScriptLoading) return
      if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${gaId}"]`)) return

      window.__rezoomedGaScriptLoading = true
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`
      document.head.appendChild(script)
    })
  }, [enabled, gaId])

  return null
}
