'use client'

import { useEffect } from 'react'
import {
  AFFILIATE_REFERRAL_COOKIE,
  AFFILIATE_REFERRAL_COOKIE_MAX_AGE,
  isAffiliateReferralCode,
  normalizeAffiliateCode,
} from '@/lib/affiliate'

const COOKIE_ATTRIBUTES = `; Max-Age=${AFFILIATE_REFERRAL_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`

function readAffiliateReferralCodeFromDocumentCookie() {
  const cookiePrefix = `${AFFILIATE_REFERRAL_COOKIE}=`
  const cookieValue = document.cookie
    .split('; ')
    .find(cookie => cookie.startsWith(cookiePrefix))
    ?.slice(cookiePrefix.length)

  const decodedValue = cookieValue ? decodeURIComponent(cookieValue) : null
  return isAffiliateReferralCode(decodedValue) ? normalizeAffiliateCode(decodedValue) : null
}

export default function AffiliateReferralTracker() {
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const ref = searchParams.get('ref')
    const normalizedRef = isAffiliateReferralCode(ref) ? normalizeAffiliateCode(ref) : null

    if (normalizedRef) {
      document.cookie = `${AFFILIATE_REFERRAL_COOKIE}=${encodeURIComponent(normalizedRef)}${COOKIE_ATTRIBUTES}`
    }

    const referralCode = normalizedRef ?? readAffiliateReferralCodeFromDocumentCookie()

    if (!referralCode) {
      return
    }

    let isMounted = true

    async function persistAffiliateSource() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!isMounted || !user?.id) {
        return
      }

      const syncKey = `rezoomed_affiliate_source_synced:${user.id}:${referralCode}`

      if (window.sessionStorage.getItem(syncKey) === '1') {
        return
      }

      const response = await fetch('/api/affiliate/source', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: referralCode,
        }),
      })

      if (!isMounted || !response.ok) {
        return
      }

      window.sessionStorage.setItem(syncKey, '1')
    }

    void persistAffiliateSource()

    return () => {
      isMounted = false
    }
  }, [])

  return null
}
