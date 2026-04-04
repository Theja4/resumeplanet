import type { ConfiguredJobSource, NormalizedJob } from '@/lib/jobs/types'
import {
  humanizeSourceKey,
  inferRemoteType,
  normalizeTimestamp,
  stripHtml,
} from '@/lib/jobs/shared'

interface GreenhouseJob {
  id: number
  internal_job_id: number | null
  title: string
  updated_at: string
  requisition_id?: string | null
  location?: { name?: string | null } | null
  absolute_url: string
  language?: string | null
  content?: string | null
  metadata?: unknown
  departments?: Array<{ id: number; name: string }>
  offices?: Array<{ id: number; name: string; location?: string | null }>
}

interface GreenhouseJobsResponse {
  jobs: GreenhouseJob[]
}

export async function fetchGreenhouseJobs(source: ConfiguredJobSource): Promise<NormalizedJob[]> {
  const response = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(source.sourceKey)}/jobs?content=true`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Rezoomed Jobs Sync/1.0',
      },
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    throw new Error(`Greenhouse sync failed for ${source.sourceKey}: ${response.status}`)
  }

  const payload = (await response.json()) as GreenhouseJobsResponse
  const companyName = humanizeSourceKey(source.sourceKey)

  return (payload.jobs ?? []).map(job => ({
    provider: source.provider,
    sourceKey: source.sourceKey,
    externalId: String(job.id),
    title: job.title?.trim() || 'Untitled role',
    companyName,
    locationText: job.location?.name?.trim() || 'Location flexible',
    remoteType: inferRemoteType(`${job.location?.name ?? ''} ${job.content ?? ''}`),
    employmentType: null,
    salaryText: null,
    descriptionText: stripHtml(job.content),
    applyUrl: job.absolute_url,
    sourceUrl: job.absolute_url,
    companyLogoUrl: null,
    category: job.departments?.[0]?.name ?? null,
    tags: [
      ...(job.departments?.map(department => department.name) ?? []),
      ...(job.offices?.map(office => office.name) ?? []),
    ].filter(Boolean),
    postedAt: normalizeTimestamp(job.updated_at),
    metadata: {
      internalJobId: job.internal_job_id,
      requisitionId: job.requisition_id ?? null,
      language: job.language ?? null,
      metadata: job.metadata ?? null,
      offices: job.offices ?? [],
      departments: job.departments ?? [],
    },
  }))
}
