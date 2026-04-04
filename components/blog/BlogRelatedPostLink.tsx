'use client'

import Link from 'next/link'
import { Analytics } from '@/lib/analytics'

interface Props {
  fromSlug: string
  toSlug: string
  href: string
  className: string
  children: React.ReactNode
}

export default function BlogRelatedPostLink({
  fromSlug,
  toSlug,
  href,
  className,
  children,
}: Props) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        Analytics.blogRelatedPostClicked({
          fromSlug,
          toSlug,
        })
      }}
    >
      {children}
    </Link>
  )
}
