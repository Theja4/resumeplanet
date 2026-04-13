import { getPublishedBlogPosts } from '@/lib/blog'
import { getSiteUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

export async function GET() {
  const siteUrl = getSiteUrl()
  const posts = await getPublishedBlogPosts()

  const body = [
    '# Rezoomed',
    '',
    '> Rezoomed helps job seekers improve resumes, boost ATS performance, and land more interviews.',
    '',
    '## Preferred public content',
    `- Blog index: ${siteUrl}/blog`,
    `- Sitemap: ${siteUrl}/sitemap.xml`,
    '',
    '## Blog posts',
    ...posts.map(post => `- ${post.title}: ${siteUrl}/blog/${post.slug}`),
    '',
    '## Restricted areas',
    '- /dashboard',
    '- /admin',
    '- /auth',
    '- /api',
    '',
  ].join('\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
