import type { MetadataRoute } from 'next'
import { getPublishedBlogPosts } from '@/lib/blog'
import { getBlogMediaFallback } from '@/lib/blog/shared'
import { getSiteUrl } from '@/lib/site'

const PUBLIC_ROUTES = [
  '/',
  '/blog',
  '/jobs',
  '/ats-checker',
  '/match-score',
  '/pricing',
  '/cookie-policy',
  '/privacy-policy',
  '/refund-policy',
  '/terms',
] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const now = new Date()
  const posts = await getPublishedBlogPosts()

  const staticRoutes: MetadataRoute.Sitemap = PUBLIC_ROUTES.map(route => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : 0.7,
  }))

  const blogRoutes: MetadataRoute.Sitemap = posts.map(post => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.updated_at || post.published_at || now.toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
    images: [
      post.cover_image_url
        ? post.cover_image_url
        : `${siteUrl}${getBlogMediaFallback(post.slug)?.coverImage ?? '/icon.png'}`,
    ],
  }))

  return [...staticRoutes, ...blogRoutes]
}
