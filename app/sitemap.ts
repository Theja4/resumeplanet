import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site'

const PUBLIC_ROUTES = [
  '/',
  '/blog',
  '/jobs',
  '/ats-checker',
  '/match-score',
  '/cookie-policy',
  '/privacy-policy',
  '/terms',
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const now = new Date()

  return PUBLIC_ROUTES.map(route => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : 0.7,
  }))
}
