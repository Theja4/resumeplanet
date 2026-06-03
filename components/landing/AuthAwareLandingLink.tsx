'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { useClientAuthStatus } from '@/components/auth/useClientAuthStatus'

type AuthAwareLandingLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  anonymousHref: string
  authenticatedHref?: string
}

export default function AuthAwareLandingLink({
  anonymousHref,
  authenticatedHref = '/dashboard',
  ...props
}: AuthAwareLandingLinkProps) {
  const isAuthenticated = useClientAuthStatus()

  return (
    <Link
      {...props}
      href={isAuthenticated ? authenticatedHref : anonymousHref}
    />
  )
}
