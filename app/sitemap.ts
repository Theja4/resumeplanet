import type { MetadataRoute } from 'next'
import { getPublishedBlogPosts } from '@/lib/blog'
import { getBlogMediaFallback } from '@/lib/blog/shared'
import { getAllAtsTestingStaticPaths } from '@/lib/seo/ats-testing-pages'
import { getAllResumeFormatStaticPaths } from '@/lib/seo/resume-format-pages'
import { getSiteUrl } from '@/lib/site'

type SitemapChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>

const PUBLIC_ROUTES = [
  '/',
  '/blog',
  '/ats-checker',
  '/ats-resume-test',
  '/resume-scanner',
  '/match-score',
  '/metadata-enhancer',
  '/resume-builder',
  '/resume-format',
  '/us-resume-format',
  '/ats-resume-format',
  '/resume-format-for-job-applications',
  '/resume-tailoring',
  '/amazon-ats-resume-guide',
  '/what-ats-does-amazon-use',
  '/cover-letter-generator',
  '/pricing',
  '/cookie-policy',
  '/privacy-policy',
  '/refund-policy',
  '/terms',
] as const

function getRoutePriority(route: string) {
  if (route === '/') return 1.0
  if (
    [
      '/resume-builder',
      '/ats-checker',
      '/resume-scanner',
      '/ats-resume-test',
      '/resume-format',
      '/us-resume-format',
      '/ats-resume-format',
      '/resume-format-for-job-applications',
      '/resume-tailoring',
      '/match-score',
    ].includes(route)
  ) return 0.9
  if (route.startsWith('/resume-format/')) return 0.85
  if (['/amazon-ats-resume-guide', '/what-ats-does-amazon-use'].includes(route)) return 0.85
  if (['/cover-letter-generator', '/metadata-enhancer', '/pricing', '/blog'].includes(route)) return 0.8
  return 0.5
}

function getRouteChangeFrequency(route: string): SitemapChangeFrequency {
  if (route === '/') return 'daily'
  return 'weekly'
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const now = new Date()
  const posts = await getPublishedBlogPosts()
  const seoRoutes = Array.from(new Set([
    ...getAllResumeFormatStaticPaths(),
    ...getAllAtsTestingStaticPaths(),
  ]))

  const staticRoutes: MetadataRoute.Sitemap = Array.from(new Set([...PUBLIC_ROUTES, ...seoRoutes])).map(route => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: getRouteChangeFrequency(route),
    priority: getRoutePriority(route),
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
