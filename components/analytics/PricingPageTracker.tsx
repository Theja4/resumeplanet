'use client'

import { useEffect } from 'react'
import { Analytics } from '@/lib/analytics'

export default function PricingPageTracker({
  source,
}: {
  source: string
}) {
  useEffect(() => {
    Analytics.pricingPageViewed({ source })
  }, [source])

  return null
}

