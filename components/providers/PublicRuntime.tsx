'use client'

import { useEffect, useState, type ComponentType } from 'react'
import type { PromoConfig } from '@/lib/pricing'
import AffiliateReferralTracker from '@/components/providers/AffiliateReferralTracker'
import GoogleAnalyticsProvider from '@/components/providers/GoogleAnalyticsProvider'
import PostHogProvider from '@/components/providers/PostHogProvider'

type CookieConsentBannerComponent = ComponentType
type PromoBannerComponent = ComponentType<{ promo: PromoConfig }>
type PendingJobApplyPromptComponent = ComponentType

type RuntimeConfig = {
  analyticsEnabled: boolean
  showCookieConsentBanner: boolean
}

function scheduleOptionalImport(callback: () => void) {
  if ('requestIdleCallback' in window) {
    const idleId = window.requestIdleCallback(callback, { timeout: 4000 })
    return () => window.cancelIdleCallback(idleId)
  }

  const timeoutId = globalThis.setTimeout(callback, 2500)
  return () => globalThis.clearTimeout(timeoutId)
}

export default function PublicRuntime({
  bannerPromo,
  jobBoardEnabled,
}: {
  bannerPromo: PromoConfig | null
  jobBoardEnabled: boolean
}) {
  // analyticsEnabled and showCookieConsentBanner depend on per-request cookie
  // state and IP-derived country. Fetching them client-side keeps RootLayout
  // static-shape so marketing pages can be edge-cached via next.config.ts.
  // Default to analytics disabled until we hear back — fail-closed for privacy.
  const [runtime, setRuntime] = useState<RuntimeConfig>({
    analyticsEnabled: false,
    showCookieConsentBanner: false,
  })

  const [CookieConsentBanner, setCookieConsentBanner] =
    useState<CookieConsentBannerComponent | null>(null)
  const [PromoBanner, setPromoBanner] = useState<PromoBannerComponent | null>(null)
  const [PendingJobApplyPrompt, setPendingJobApplyPrompt] =
    useState<PendingJobApplyPromptComponent | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/runtime-config', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then((data: RuntimeConfig | null) => {
        if (!cancelled && data) setRuntime(data)
      })
      .catch(() => {
        // Network error — keep defaults (analytics off, no banner).
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!runtime.showCookieConsentBanner) return

    let isMounted = true
    void import('@/components/shared/CookieConsentBanner').then(module => {
      if (isMounted) setCookieConsentBanner(() => module.default)
    })

    return () => {
      isMounted = false
    }
  }, [runtime.showCookieConsentBanner])

  useEffect(() => {
    if (!bannerPromo) return

    let isMounted = true
    void import('@/components/shared/PromoBanner').then(module => {
      if (isMounted) setPromoBanner(() => module.default)
    })

    return () => {
      isMounted = false
    }
  }, [bannerPromo])

  useEffect(() => {
    if (!jobBoardEnabled) return

    let isMounted = true
    const cleanup = scheduleOptionalImport(() => {
      void import('@/components/jobs/PendingJobApplyPrompt').then(module => {
        if (isMounted) setPendingJobApplyPrompt(() => module.default)
      })
    })

    return () => {
      isMounted = false
      cleanup()
    }
  }, [jobBoardEnabled])

  return (
    <>
      {CookieConsentBanner ? <CookieConsentBanner /> : null}
      <AffiliateReferralTracker />
      <PostHogProvider enabled={runtime.analyticsEnabled} />
      <GoogleAnalyticsProvider enabled={runtime.analyticsEnabled} />
      {bannerPromo && PromoBanner ? <PromoBanner promo={bannerPromo} /> : null}
      {PendingJobApplyPrompt ? <PendingJobApplyPrompt /> : null}
    </>
  )
}
