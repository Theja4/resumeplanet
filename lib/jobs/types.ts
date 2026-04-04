import type { JobRemoteType, JobSourceProvider } from '@/types'

export type SyncedJobSourceProvider = Exclude<JobSourceProvider, 'manual'>

export interface ConfiguredJobSource {
  provider: SyncedJobSourceProvider
  sourceKey: string
  label: string
}

export interface NormalizedJob {
  provider: SyncedJobSourceProvider
  sourceKey: string
  externalId: string
  title: string
  companyName: string
  locationText: string
  remoteType: JobRemoteType
  employmentType: string | null
  salaryText: string | null
  descriptionText: string
  applyUrl: string
  sourceUrl: string | null
  companyLogoUrl: string | null
  category: string | null
  tags: string[]
  postedAt: string | null
  metadata: Record<string, unknown>
}

export interface PendingJobApplyPayload {
  jobId: string
  slug: string
  title: string
  companyName: string
}

export interface JobsSyncSourceResult {
  provider: SyncedJobSourceProvider
  sourceKey: string
  label: string
  syncedJobs: number
  error: string | null
}

export interface JobsSyncResult {
  totalSyncedJobs: number
  sources: JobsSyncSourceResult[]
}
