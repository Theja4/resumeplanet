import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import JobsBoardDirectory from '@/components/jobs/JobsBoardDirectory'
import { getPublicJobs } from '@/lib/jobs'
import type { JobSourceProvider } from '@/types'

export const dynamic = 'force-dynamic'

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

  return (
    <div className="min-h-screen bg-background-landing text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
      <PublicSiteHeader active="jobs" />

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-36">
        <JobsBoardDirectory jobs={jobs} params={params} />
      </main>

      <PublicSiteFooter />
    </div>
  )
}
