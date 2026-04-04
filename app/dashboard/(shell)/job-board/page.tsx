import JobsBoardDirectory from '@/components/jobs/JobsBoardDirectory'
import { getPublicJobs } from '@/lib/jobs'
import type { JobSourceProvider } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DashboardJobBoardPage({
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

  return <JobsBoardDirectory jobs={jobs} params={params} variant="dashboard" />
}
