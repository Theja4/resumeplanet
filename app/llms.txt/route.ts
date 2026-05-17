import { getPublishedBlogPosts } from '@/lib/blog'
import { getAllAtsTestingStaticPaths } from '@/lib/seo/ats-testing-pages'
import { getAllResumeFormatStaticPaths } from '@/lib/seo/resume-format-pages'
import { getSiteUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

const TOOL_PAGES = [
  { path: '/ats-checker', title: 'ATS Resume Checker — scan parsing, keywords, and formatting issues' },
  { path: '/resume-builder', title: 'AI Resume Builder — draft ATS-friendly resumes faster' },
  { path: '/match-score', title: 'Resume Match Score — compare a resume to any job description' },
  { path: '/resume-tailoring', title: 'Resume Tailoring — rewrite the resume for one specific role' },
  { path: '/cover-letter-generator', title: 'AI Cover Letter Generator — draft a real cover letter for one job' },
  { path: '/metadata-enhancer', title: 'Resume Metadata Enhancer — clean PDF title, author, and keywords' },
  { path: '/pricing', title: 'Pricing — Free and Pro plans' },
]

export async function GET() {
  const siteUrl = getSiteUrl()
  const [posts, formatPaths, atsPaths] = await Promise.all([
    getPublishedBlogPosts(),
    Promise.resolve(getAllResumeFormatStaticPaths()),
    Promise.resolve(getAllAtsTestingStaticPaths()),
  ])

  const body = [
    '# Rezoomed',
    '',
    '> Rezoomed helps job seekers improve resumes, boost ATS performance, and land more interviews.',
    '',
    '## Preferred public content',
    `- Site: ${siteUrl}`,
    `- Blog index: ${siteUrl}/blog`,
    `- Sitemap: ${siteUrl}/sitemap.xml`,
    '',
    '## Tools',
    ...TOOL_PAGES.map(t => `- ${t.title}: ${siteUrl}${t.path}`),
    '',
    '## Resume format guides',
    ...formatPaths.map(path => `- ${siteUrl}${path}`),
    '',
    '## ATS guides',
    ...atsPaths.map(path => `- ${siteUrl}${path}`),
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
