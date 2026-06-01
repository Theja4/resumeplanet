const FALLBACK_SITE_URL = 'https://www.rezoomed.com'

function normalizeUrl(value: string | undefined) {
  if (!value) {
    return FALLBACK_SITE_URL
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return FALLBACK_SITE_URL
  }

  try {
    return new URL(trimmed).toString().replace(/\/+$/, '')
  } catch {
    return FALLBACK_SITE_URL
  }
}

export function getSiteUrl() {
  return normalizeUrl(process.env.NEXT_PUBLIC_APP_URL)
}

export function getOrganizationSameAsLinks() {
  const raw = process.env.NEXT_PUBLIC_ORGANIZATION_SAME_AS

  if (!raw) {
    return []
  }

  return raw
    .split(',')
    .map(link => link.trim())
    .filter(Boolean)
}

export const SITE_NAME = 'Rezoomed'

// Chrome Web Store listing for the LinkedIn Profile Optimizer extension.
export const CHROME_STORE_URL =
  'https://chromewebstore.google.com/detail/rezoomed-linkedin-profile/coegmjilijdmbogdhgggmlmclpgiiljc'
