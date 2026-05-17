'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export default function PostHogProvider({
  enabled = true,
}: {
  enabled?: boolean
}) {
  const pathname = usePathname()
  const lastTrackedPathRef = useRef<string>('')

  useEffect(() => {
    if (!enabled) return

    const searchParams = new URLSearchParams(window.location.search)
    const search = searchParams.toString()
    const trackedPath = search ? `${pathname}?${search}` : pathname

    if (lastTrackedPathRef.current === trackedPath) {
      return
    }

    lastTrackedPathRef.current = trackedPath

    const referrer = document.referrer || undefined

    void import('@/lib/analytics').then(({
      Analytics,
      getBlogAttributionEvent,
      persistAnalyticsAttribution,
    }) => {
      const attribution = persistAnalyticsAttribution(searchParams, trackedPath, referrer)

      Analytics.pageViewed({
        path: trackedPath,
        referrer,
      })

      const blogAttributionEvent = getBlogAttributionEvent(pathname, attribution)
      if (blogAttributionEvent) {
        Analytics.capture(blogAttributionEvent.event, blogAttributionEvent.properties)
      }
    })
  }, [enabled, pathname])

  return null
}
