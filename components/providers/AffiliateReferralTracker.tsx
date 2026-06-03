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

  let decodedValue: string | null = null

  try {
    decodedValue = cookieValue ? decodeURIComponent(cookieValue) : null
  } catch {
    decodedValue = null
  }

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

    let isMounted = true
    let unsubscribeFromAuth: (() => void) | null = null

    function buildSyncKey(userId: string, code: string | null) {
      return code
        ? `rezoomed_affiliate_source_synced:${userId}:${code}`
        : `rezoomed_affiliate_source_synced:${userId}:server-cookie`
    }

    async function persistAffiliateSource(userId: string, code: string | null) {
      if (!isMounted) {
        return
      }

      const syncKey = buildSyncKey(userId, code)

      if (window.sessionStorage.getItem(syncKey) === '1') {
        return
      }

      const response = await fetch('/api/affiliate/source', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(code ? { code } : {}),
        }),
      })

      if (!isMounted || !response.ok) {
        return
      }

      const payload = (await response.json().catch(() => null)) as
        | { sourceCode?: string | null }
        | null

      if (payload?.sourceCode) {
        window.sessionStorage.setItem(syncKey, '1')
      }
    }

    function scheduleAffiliateSourceSync(userId: string | null | undefined) {
      if (!userId) {
        return
      }

      const latestReferralCode =
        normalizedRef ?? readAffiliateReferralCodeFromDocumentCookie()

      window.setTimeout(() => {
        void persistAffiliateSource(userId, latestReferralCode)
      }, 0)
    }

    async function initializeAffiliateSourceSync() {
      const { createClient } = await import('@/lib/supabase/client')

      if (!isMounted) {
        return
      }

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      scheduleAffiliateSourceSync(user?.id)

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        scheduleAffiliateSourceSync(session?.user?.id)
      })

      unsubscribeFromAuth = () => data.subscription.unsubscribe()
    }

    void initializeAffiliateSourceSync()

    return () => {
      isMounted = false
      unsubscribeFromAuth?.()
    }
  }, [])

  return null
}
