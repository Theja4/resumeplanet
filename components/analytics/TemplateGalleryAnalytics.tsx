'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { Analytics } from '@/lib/analytics'

export function TemplateGalleryTracker({
  totalTemplates,
}: {
  totalTemplates: number
}) {
  const hasTrackedScrollRef = useRef(false)

  useEffect(() => {
    Analytics.templateGalleryViewed({})

    function handleScroll() {
      if (hasTrackedScrollRef.current) return
      hasTrackedScrollRef.current = true
      Analytics.templateGalleryScrolled({
        templatesViewed: totalTemplates,
        totalTemplates,
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [totalTemplates])

  return null
}

export function TemplateGalleryLink({
  href,
  templateId,
  className,
  children,
}: {
  href: string
  templateId: string
  className: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        Analytics.templateSelected({
          templateId,
          source: 'gallery',
        })
      }}
    >
      {children}
    </Link>
  )
}

