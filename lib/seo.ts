import type { Metadata } from 'next'
import { SITE_NAME, getSiteUrl } from '@/lib/site'

export const DEFAULT_SEO_DESCRIPTION =
  'Rezoomed helps job seekers build ATS-friendly resumes, check ATS performance, match job descriptions, and land more interviews.'

export const DEFAULT_OG_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'Rezoomed — AI Resume Builder & ATS Checker',
} as const

type MetadataImage = {
  url: string
  alt?: string
  width?: number
  height?: number
}

type PublicMetadataOptions = {
  title: string
  description: string
  path?: string
  /** Deprecated. `<meta name="keywords">` is ignored by Google and leaks competitive targets — kept for back-compat but no longer emitted. */
  keywords?: string[]
  image?: MetadataImage
  type?: 'website' | 'article'
}

export function getAbsoluteUrl(path = '/') {
  const siteUrl = getSiteUrl()

  if (!path || path === '/') {
    return siteUrl
  }

  return new URL(path, `${siteUrl}/`).toString()
}

const BRAND_SUFFIX = ` | ${SITE_NAME}`

function normalizeTitle(value: string) {
  let cleaned = value.trim()
  while (cleaned.toLowerCase().endsWith(BRAND_SUFFIX.toLowerCase())) {
    cleaned = cleaned.slice(0, -BRAND_SUFFIX.length).trim()
  }
  return cleaned
}

export function buildPublicMetadata({
  title,
  description,
  path = '/',
  keywords,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
}: PublicMetadataOptions): Metadata {
  const absoluteUrl = getAbsoluteUrl(path)
  const absoluteImageUrl = getAbsoluteUrl(image.url)
  const cleanTitle = normalizeTitle(title)
  const brandedTitle = `${cleanTitle}${BRAND_SUFFIX}`

  // Intentionally do NOT emit `keywords` — Google ignores it since 2009 and it advertises targets to competitors.
  void keywords
  return {
    title: { absolute: brandedTitle },
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: 'en_US',
      title: brandedTitle,
      description,
      url: absoluteUrl,
      images: [
        {
          url: absoluteImageUrl,
          ...(image.alt ? { alt: image.alt } : {}),
          ...(image.width ? { width: image.width } : {}),
          ...(image.height ? { height: image.height } : {}),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: brandedTitle,
      description,
      images: [absoluteImageUrl],
    },
  }
}

export function toJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function buildOrganizationJsonLd(sameAs: string[] = []) {
  const siteUrl = getSiteUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: SITE_NAME,
    url: siteUrl,
    logo: getAbsoluteUrl('/icon.png'),
    description: DEFAULT_SEO_DESCRIPTION,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  }
}

export function buildWebsiteJsonLd() {
  const siteUrl = getSiteUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: SITE_NAME,
    url: siteUrl,
    publisher: { '@id': `${siteUrl}/#organization` },
    inLanguage: 'en-US',
  }
}
