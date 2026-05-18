import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  COOKIE_CONSENT_COOKIE,
  detectRequestCountry,
  parseCookieConsentPreference,
  shouldEnableAnalyticsForRequest,
  shouldShowCookieConsentBanner,
} from '@/lib/cookie-consent'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Lightweight runtime-config endpoint. Read once on client mount so the root
// layout can stay static and ISR-cached. Response is uncacheable (depends on
// per-user cookie state) but tiny — JSON only, no HTML, no JS bundles.
export async function GET() {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])
  const countryCode = detectRequestCountry(headerStore)
  const cookieConsentPreference = parseCookieConsentPreference(
    cookieStore.get(COOKIE_CONSENT_COOKIE)?.value
  )
  const analyticsEnabled = shouldEnableAnalyticsForRequest({
    countryCode,
    consentPreference: cookieConsentPreference,
  })
  const showCookieConsentBanner = shouldShowCookieConsentBanner({
    countryCode,
    consentPreference: cookieConsentPreference,
  })

  return NextResponse.json(
    { countryCode, analyticsEnabled, showCookieConsentBanner },
    { headers: { 'Cache-Control': 'private, no-store' } }
  )
}
