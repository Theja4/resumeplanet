import { getRemotiveFetchLimit } from '@/lib/jobs/config'
import type { ConfiguredJobSource, NormalizedJob } from '@/lib/jobs/types'
import { normalizeTimestamp, stripHtml } from '@/lib/jobs/shared'

interface RemotiveJob {
  id: number
  url: string
  title: string
  company_name: string
  company_logo?: string | null
  category?: string | null
  job_type?: string | null
  publication_date?: string | null
  candidate_required_location?: string | null
  salary?: string | null
  description?: string | null
}

interface RemotiveResponse {
  jobs: RemotiveJob[]
}

export async function fetchRemotiveJobs(source: ConfiguredJobSource): Promise<NormalizedJob[]> {
  const response = await fetch(
    `https://remotive.com/api/remote-jobs?limit=${getRemotiveFetchLimit()}`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Rezoomed Jobs Sync/1.0',
      },
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    throw new Error(`Remotive sync failed: ${response.status}`)
  }

  const payload = (await response.json()) as RemotiveResponse

  return (payload.jobs ?? []).map(job => ({
    provider: source.provider,
    sourceKey: source.sourceKey,
    externalId: String(job.id),
    title: job.title?.trim() || 'Untitled role',
    companyName: job.company_name?.trim() || 'Remotive company',
    locationText: job.candidate_required_location?.trim() || 'Worldwide',
    remoteType: 'remote',
    employmentType: job.job_type?.trim() || null,
    salaryText: job.salary?.trim() || null,
    descriptionText: stripHtml(job.description),
    applyUrl: job.url,
    sourceUrl: job.url,
    companyLogoUrl: job.company_logo ?? null,
    category: job.category?.trim() || null,
    tags: [job.category, job.job_type].filter((value): value is string => Boolean(value && value.trim())),
    postedAt: normalizeTimestamp(job.publication_date),
    metadata: {
      remotiveUrl: job.url,
    },
  }))
}
