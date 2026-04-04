import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getConfiguredJobSources } from '@/lib/jobs/config'
import { buildJobSlug } from '@/lib/jobs/shared'
import { fetchGreenhouseJobs } from '@/lib/jobs/sources/greenhouse'
import { fetchLeverJobs } from '@/lib/jobs/sources/lever'
import { fetchRemotiveJobs } from '@/lib/jobs/sources/remotive'
import type {
  ConfiguredJobSource,
  JobsSyncResult,
  JobsSyncSourceResult,
  NormalizedJob,
  SyncedJobSourceProvider,
} from '@/lib/jobs/types'

type JobsRow = {
  external_id: string
  slug: string
}

const SOURCE_FETCHERS: Record<
  SyncedJobSourceProvider,
  (source: ConfiguredJobSource) => Promise<NormalizedJob[]>
> = {
  greenhouse: fetchGreenhouseJobs,
  lever: fetchLeverJobs,
  remotive: fetchRemotiveJobs,
}

export async function syncConfiguredJobSources(): Promise<JobsSyncResult> {
  const supabase = createServiceRoleClient()
  const sources = getConfiguredJobSources()
  const results: JobsSyncSourceResult[] = []
  let totalSyncedJobs = 0

  for (const source of sources) {
    const result = await syncSingleSource(supabase, source)
    totalSyncedJobs += result.syncedJobs
    results.push(result)
  }

  return { totalSyncedJobs, sources: results }
}

async function syncSingleSource(
  supabase: ReturnType<typeof createServiceRoleClient>,
  source: ConfiguredJobSource
): Promise<JobsSyncSourceResult> {
  const now = new Date().toISOString()

  await supabase.from('job_sources').upsert(
    {
      provider: source.provider,
      source_key: source.sourceKey,
      label: source.label,
      is_active: true,
      last_error: null,
    },
    {
      onConflict: 'provider,source_key',
    }
  )

  try {
    const jobs = await SOURCE_FETCHERS[source.provider](source)
    const { data: existingJobs } = await supabase
      .from('jobs')
      .select('external_id, slug')
      .eq('source_provider', source.provider)
      .eq('source_key', source.sourceKey)

    const existingSlugByExternalId = new Map(
      ((existingJobs ?? []) as JobsRow[]).map(job => [job.external_id, job.slug])
    )

    await supabase
      .from('jobs')
      .update({ is_active: false })
      .eq('source_provider', source.provider)
      .eq('source_key', source.sourceKey)

    if (jobs.length > 0) {
      const records = jobs.map(job => ({
        source_provider: job.provider,
        source_key: job.sourceKey,
        external_id: job.externalId,
        slug:
          existingSlugByExternalId.get(job.externalId) ??
          buildJobSlug({
            title: job.title,
            companyName: job.companyName,
            provider: job.provider,
            sourceKey: job.sourceKey,
            externalId: job.externalId,
          }),
        title: job.title,
        company_name: job.companyName,
        location_text: job.locationText,
        remote_type: job.remoteType,
        employment_type: job.employmentType,
        salary_text: job.salaryText,
        description_text: job.descriptionText,
        apply_url: job.applyUrl,
        source_url: job.sourceUrl,
        company_logo_url: job.companyLogoUrl,
        category: job.category,
        tags: job.tags,
        posted_at: job.postedAt,
        metadata: job.metadata,
        is_active: true,
        last_seen_at: now,
      }))

      const { error: upsertError } = await supabase.from('jobs').upsert(records, {
        onConflict: 'source_provider,source_key,external_id',
      })

      if (upsertError) {
        throw upsertError
      }
    }

    await supabase
      .from('job_sources')
      .update({
        last_synced_at: now,
        last_error: null,
        jobs_synced: jobs.length,
      })
      .eq('provider', source.provider)
      .eq('source_key', source.sourceKey)

    return {
      provider: source.provider,
      sourceKey: source.sourceKey,
      label: source.label,
      syncedJobs: jobs.length,
      error: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown sync error'

    await supabase
      .from('job_sources')
      .update({
        last_synced_at: now,
        last_error: message,
      })
      .eq('provider', source.provider)
      .eq('source_key', source.sourceKey)

    return {
      provider: source.provider,
      sourceKey: source.sourceKey,
      label: source.label,
      syncedJobs: 0,
      error: message,
    }
  }
}
