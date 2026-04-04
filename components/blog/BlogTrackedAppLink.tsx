'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import {
  Analytics,
  buildBlogAttributionHref,
  type BlogCtaType,
} from '@/lib/analytics'

export default function BlogTrackedAppLink({
  slug,
  ctaType,
  ctaText,
  position,
  href,
  className,
  children,
}: {
  slug: string
  ctaType: BlogCtaType
  ctaText: string
  position: number
  href: string
  className: string
  children: React.ReactNode
}) {
  const trackedHref = buildBlogAttributionHref(href, slug, ctaType)

  useEffect(() => {
    Analytics.blogCtaShown({
      slug,
      ctaType,
      ctaText,
      position,
    })
  }, [ctaText, ctaType, position, slug])

  return (
    <Link
      href={trackedHref}
      className={className}
      onClick={() => {
        Analytics.blogCtaClicked({
          slug,
          ctaType,
          ctaText,
          destination: trackedHref,
        })
      }}
    >
      {children}
    </Link>
  )
}
