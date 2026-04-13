import type { Metadata } from 'next'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import JobsBoardDirectory from '@/components/jobs/JobsBoardDirectory'
import { getPublicJobs } from '@/lib/jobs'
import { getSiteUrl } from '@/lib/site'
import type { JobSourceProvider } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Remote Jobs & Resume-Matched Roles | Rezoomed',
  description:
    'Browse public job openings and find roles you can target with a stronger ATS-optimized resume and job-match workflow.',
  keywords: [
    'remote jobs',
    'job board',
    'resume matched jobs',
    'job search tools',
    'resume optimization for jobs',
  ],
  alternates: {
    canonical: '/jobs',
  },
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    source?: JobSourceProvider | 'all'
    remote?: 'remote' | 'hybrid' | 'on_site' | 'all'
  }>
}) {
  const params = await searchParams
  const jobs = await getPublicJobs({
    q: params.q,
    source: params.source,
    remoteType: params.remote,
  })
  const siteUrl = getSiteUrl()
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Jobs', item: `${siteUrl}/jobs` },
    ],
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-landing text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
      <PublicSiteHeader active="jobs" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="mx-auto flex-1 max-w-7xl px-6 pb-24 pt-36">
        <JobsBoardDirectory jobs={jobs} params={params} />
      </main>

      <PublicSiteFooter />
    </div>
  )
}
