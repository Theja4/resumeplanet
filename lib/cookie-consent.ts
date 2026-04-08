export const COOKIE_CONSENT_COOKIE = 'rezoomed_cookie_consent'

export type CookieConsentPreference = 'all' | 'essential'

const STRICT_COOKIE_REGION_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO',
  'SK', 'SI', 'ES', 'SE', 'GB', 'CH',
])

function normalizeCountryCode(value: string | null | undefined) {
  if (!value) return null

  const normalized = value.trim().toUpperCase()

  if (!normalized || normalized === 'XX' || normalized === 'T1') {
    return null
  }

  return normalized
}

export function parseCookieConsentPreference(
  value: string | null | undefined
): CookieConsentPreference | null {
  if (value === 'all' || value === 'essential') {
    return value
  }

  return null
}

export function detectRequestCountry(
  headerStore: Headers | { get(name: string): string | null }
) {
  return (
    normalizeCountryCode(headerStore.get('x-vercel-ip-country')) ??
    normalizeCountryCode(headerStore.get('cf-ipcountry')) ??
    normalizeCountryCode(headerStore.get('x-country-code'))
  )
}

export function isStrictCookieRegion(countryCode: string | null | undefined) {
  const normalized = normalizeCountryCode(countryCode)
  return normalized ? STRICT_COOKIE_REGION_COUNTRIES.has(normalized) : false
}

export function shouldEnableAnalyticsForRequest({
  countryCode,
  consentPreference,
}: {
  countryCode: string | null
  consentPreference: CookieConsentPreference | null
}) {
  if (consentPreference === 'all') return true
  if (consentPreference === 'essential') return false

  return !isStrictCookieRegion(countryCode)
}

export function shouldShowCookieConsentBanner({
  countryCode,
  consentPreference,
}: {
  countryCode: string | null
  consentPreference: CookieConsentPreference | null
}) {
  return isStrictCookieRegion(countryCode) && consentPreference === null
}
