'use client'

import { useBlogAnalytics } from '@/hooks/useBlogAnalytics'

export default function BlogPostAnalyticsClient({
  slug,
  title,
  category,
  readTimeMinutes,
}: {
  slug: string
  title: string
  category?: string
  readTimeMinutes: number
}) {
  useBlogAnalytics({
    slug,
    title,
    category,
    readTimeMinutes,
  })

  return null
}

