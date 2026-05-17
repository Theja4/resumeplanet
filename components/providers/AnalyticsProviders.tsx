'use client'

import type { ReactNode } from 'react'
import PostHogProvider from '@/components/providers/PostHogProvider'
import GoogleAnalyticsProvider from '@/components/providers/GoogleAnalyticsProvider'

interface Props {
  children: ReactNode
  analyticsEnabled: boolean
}

export default function AnalyticsProviders({ children, analyticsEnabled }: Props) {
  return (
    <>
      <PostHogProvider enabled={analyticsEnabled} />
      <GoogleAnalyticsProvider enabled={analyticsEnabled} />
      {children}
    </>
  )
}
