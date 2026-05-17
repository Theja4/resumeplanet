'use client'

import { useEffect, useState, type ComponentType } from 'react'
import type { PromoConfig } from '@/lib/pricing'
import AffiliateReferralTracker from '@/components/providers/AffiliateReferralTracker'
import GoogleAnalyticsProvider from '@/components/providers/GoogleAnalyticsProvider'
import PostHogProvider from '@/components/providers/PostHogProvider'

type CookieConsentBannerComponent = ComponentType
type PromoBannerComponent = ComponentType<{ promo: PromoConfig }>
type PendingJobApplyPromptComponent = ComponentType

function scheduleOptionalImport(callback: () => void) {
  if ('requestIdleCallback' in window) {
    const idleId = window.requestIdleCallback(callback, { timeout: 4000 })
    return () => window.cancelIdleCallback(idleId)
  }

  const timeoutId = globalThis.setTimeout(callback, 2500)
  return () => globalThis.clearTimeout(timeoutId)
}

export default function PublicRuntime({
  analyticsEnabled,
  bannerPromo,
  jobBoardEnabled,
  showCookieConsentBanner,
}: {
  analyticsEnabled: boolean
  bannerPromo: PromoConfig | null
  jobBoardEnabled: boolean
  showCookieConsentBanner: boolean
}) {
  const [CookieConsentBanner, setCookieConsentBanner] =
    useState<CookieConsentBannerComponent | null>(null)
  const [PromoBanner, setPromoBanner] = useState<PromoBannerComponent | null>(null)
  const [PendingJobApplyPrompt, setPendingJobApplyPrompt] =
    useState<PendingJobApplyPromptComponent | null>(null)

  useEffect(() => {
    if (!showCookieConsentBanner) return

    let isMounted = true
    void import('@/components/shared/CookieConsentBanner').then(module => {
      if (isMounted) setCookieConsentBanner(() => module.default)
    })

    return () => {
      isMounted = false
    }
  }, [showCookieConsentBanner])

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
      <PostHogProvider enabled={analyticsEnabled} />
      <GoogleAnalyticsProvider enabled={analyticsEnabled} />
      {bannerPromo && PromoBanner ? <PromoBanner promo={bannerPromo} /> : null}
      {PendingJobApplyPrompt ? <PendingJobApplyPrompt /> : null}
    </>
  )
}
