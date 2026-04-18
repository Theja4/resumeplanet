'use client'

import Link from 'next/link'
import { Analytics } from '@/lib/analytics'

interface Props {
  fromSlug: string
  toSlug: string
  href: string
  className: string
  style?: React.CSSProperties
  children: React.ReactNode
}

export default function BlogRelatedPostLink({
  fromSlug,
  toSlug,
  href,
  className,
  style,
  children,
}: Props) {
  return (
    <Link
      href={href}
      className={className}
      style={style}
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
