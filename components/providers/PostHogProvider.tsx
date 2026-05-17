'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import {
  Analytics,
  getBlogAttributionEvent,
  persistAnalyticsAttribution,
} from '@/lib/analytics'

function RouteAnalyticsTracker() {
  const pathname = usePathname()
  const lastTrackedPathRef = useRef<string>('')

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
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

    const blogAttributionEvent = getBlogAttributionEvent(pathname, attribution)
    if (blogAttributionEvent) {
      Analytics.capture(blogAttributionEvent.event, blogAttributionEvent.properties)
    }
  }, [pathname])

  return null
}

export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode
  enabled?: boolean
}) {
  return (
    <>
      <RouteAnalyticsTracker />
      {children}
    </>
  )
}
