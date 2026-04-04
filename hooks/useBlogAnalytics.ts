'use client'

import { useCallback, useEffect, useRef } from 'react'
import {
  Analytics,
  getBlogTrafficSource,
  type BlogCtaType,
  type BlogScrollDepth,
  type SharePlatform,
} from '@/lib/analytics'

interface UseBlogAnalyticsOptions {
  slug: string
  title: string
  category?: string
  readTimeMinutes: number
}

export function useBlogAnalytics({
  slug,
  title,
  category,
  readTimeMinutes,
}: UseBlogAnalyticsOptions) {
  const startedAtRef = useRef(0)
  const completedRef = useRef(false)
  const trackedDepthsRef = useRef<Set<BlogScrollDepth>>(new Set())

  const maybeTrackReadComplete = useCallback(
    (depth: number) => {
      if (completedRef.current || depth < 75) return

      const actualReadTimeSeconds = Math.round((Date.now() - startedAtRef.current) / 1000)
      const minimumReadTimeSeconds = Math.max(30, Math.round(readTimeMinutes * 60 * 0.3))

      if (actualReadTimeSeconds < minimumReadTimeSeconds) return

      completedRef.current = true
      Analytics.blogPostReadCompleted({
        slug,
        actualReadTimeSeconds,
        readTimeMinutes,
      })
    },
    [readTimeMinutes, slug]
  )

  useEffect(() => {
    startedAtRef.current = Date.now()
    const params = new URLSearchParams(window.location.search)
    const utmSource = params.get('utm_source') ?? undefined
    const utmMedium = params.get('utm_medium') ?? undefined
    const utmCampaign = params.get('utm_campaign') ?? undefined

    Analytics.blogPostViewed({
      slug,
      title,
      category,
      readTimeMinutes,
      source: getBlogTrafficSource(document.referrer, utmSource, utmMedium),
      utmSource,
      utmMedium,
      utmCampaign,
    })

    function handleScroll() {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollableHeight <= 0) return

      const depth = Math.min(100, Math.round((window.scrollY / scrollableHeight) * 100))
      const thresholds: BlogScrollDepth[] = [25, 50, 75, 100]

      thresholds.forEach(threshold => {
        if (depth < threshold || trackedDepthsRef.current.has(threshold)) return
        trackedDepthsRef.current.add(threshold)
        Analytics.blogPostScrollDepth({
          slug,
          depth: threshold,
        })
        maybeTrackReadComplete(threshold)
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      maybeTrackReadComplete(100)
    }
  }, [category, maybeTrackReadComplete, readTimeMinutes, slug, title])

  const trackCtaClick = useCallback(
    (ctaType: BlogCtaType, ctaText: string, destination: string) => {
      Analytics.blogCtaClicked({
        slug,
        ctaType,
        ctaText,
        destination,
      })
    },
    [slug]
  )

  const trackShareClick = useCallback(
    (platform: SharePlatform) => {
      Analytics.blogShareClicked({
        slug,
        platform,
      })
    },
    [slug]
  )

  const trackRelatedPostClick = useCallback(
    (toSlug: string) => {
      Analytics.blogRelatedPostClicked({
        fromSlug: slug,
        toSlug,
      })
    },
    [slug]
  )

  return {
    trackCtaClick,
    trackShareClick,
    trackRelatedPostClick,
  }
}
