'use client'

import { useEffect, useMemo, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import { PostHogProvider as ReactPostHogProvider } from 'posthog-js/react'
import {
  Analytics,
  getBlogAttributionEvent,
  persistAnalyticsAttribution,
  syncDistinctIdCookie,
} from '@/lib/analytics'

function RouteAnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastTrackedPathRef = useRef<string>('')

  useEffect(() => {
    const search = searchParams.toString()
    const trackedPath = search ? `${pathname}?${search}` : pathname

    if (lastTrackedPathRef.current === trackedPath) {
      return
    }

    lastTrackedPathRef.current = trackedPath

    const referrer = typeof document !== 'undefined' ? document.referrer || undefined : undefined
    const attribution = persistAnalyticsAttribution(searchParams, trackedPath, referrer)

    Analytics.pageViewed({
      path: trackedPath,
      referrer,
    })

    syncDistinctIdCookie(posthog.get_distinct_id())

    const blogAttributionEvent = getBlogAttributionEvent(pathname, attribution)
    if (blogAttributionEvent) {
      Analytics.capture(blogAttributionEvent.event, blogAttributionEvent.properties)
    }
  }, [pathname, searchParams])

  return null
}

export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

  const options = useMemo(
    () => ({
      api_host: apiHost,
      capture_pageview: false,
      capture_pageleave: true,
      loaded: (instance: typeof posthog) => {
        syncDistinctIdCookie(instance.get_distinct_id())
      },
    }),
    [apiHost]
  )

  useEffect(() => {
    if (!apiKey) return

    const posthogWithState = posthog as typeof posthog & { __loaded?: boolean }
    if (posthogWithState.__loaded) {
      syncDistinctIdCookie(posthog.get_distinct_id())
      return
    }

    posthog.init(apiKey, options as Parameters<typeof posthog.init>[1])
    posthogWithState.__loaded = true
  }, [apiKey, options])

  if (!apiKey) {
    return <>{children}</>
  }

  return (
    <ReactPostHogProvider client={posthog}>
      <RouteAnalyticsTracker />
      {children}
    </ReactPostHogProvider>
  )
}
