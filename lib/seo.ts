import type { Metadata } from 'next'
import { SITE_NAME, getSiteUrl } from '@/lib/site'

export const DEFAULT_SEO_DESCRIPTION =
  'Rezoomed helps job seekers build ATS-friendly resumes, check ATS performance, match job descriptions, and land more interviews.'

export const DEFAULT_OG_IMAGE = {
  url: '/product-hero-v2.png',
  width: 1792,
  height: 1024,
  alt: 'Rezoomed product screenshot',
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

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: {
      canonical: path,
    },
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: 'en_US',
      title,
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
      title,
      description,
      images: [absoluteImageUrl],
    },
  }
}

export function toJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
