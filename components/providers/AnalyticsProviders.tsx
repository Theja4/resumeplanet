'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'

const PostHogProvider = dynamic(() => import('@/components/providers/PostHogProvider'), { ssr: false })
const GoogleAnalyticsProvider = dynamic(() => import('@/components/providers/GoogleAnalyticsProvider'), { ssr: false })

interface Props {
  children: ReactNode
  analyticsEnabled: boolean
}

export default function AnalyticsProviders({ children, analyticsEnabled }: Props) {
  return (
    <PostHogProvider enabled={analyticsEnabled}>
      <GoogleAnalyticsProvider enabled={analyticsEnabled}>
        {children}
      </GoogleAnalyticsProvider>
    </PostHogProvider>
  )
}
