import Link from 'next/link'
import { ArrowRight, BriefcaseBusiness, MapPin } from 'lucide-react'
import JobTrackerButton from '@/components/jobs/JobTrackerButton'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import { formatJobDate, formatJobSource } from '@/lib/jobs/shared'
import type { Job, JobSourceProvider } from '@/types'

export const SOURCE_FILTERS: Array<{ label: string; value: JobSourceProvider | 'all' }> = [
  { label: 'All sources', value: 'all' },
  { label: 'Greenhouse', value: 'greenhouse' },
  { label: 'Lever', value: 'lever' },
  { label: 'Remotive', value: 'remotive' },
]

export const REMOTE_FILTERS = [
  { label: 'All workplaces', value: 'all' },
  { label: 'Remote', value: 'remote' },
  { label: 'Hybrid', value: 'hybrid' },
  { label: 'On-site', value: 'on_site' },
] as const

type JobsBoardSearchParams = {
  q?: string
  source?: JobSourceProvider | 'all'
  remote?: 'remote' | 'hybrid' | 'on_site' | 'all'
}

function SearchPanel({
  params,
}: {
  params: JobsBoardSearchParams
}) {
  return (
    <form className="grid gap-3 rounded-[2rem] border border-white/70 bg-white/86 p-5 shadow-[0_18px_42px_rgba(25,28,29,0.05)]">
      <input
        type="search"
        name="q"
        defaultValue={params.q ?? ''}
        placeholder="Search title, company, or location"
        className="rounded-full border border-black/8 bg-white px-4 py-3 text-sm font-medium text-on-background outline-none transition focus:border-[#008f44]/30"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          name="source"
          defaultValue={params.source ?? 'all'}
          className="rounded-full border border-black/8 bg-white px-4 py-3 text-sm font-medium text-on-background outline-none transition focus:border-[#008f44]/30"
        >
          {SOURCE_FILTERS.map(filter => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
        <select
          name="remote"
          defaultValue={params.remote ?? 'all'}
          className="rounded-full border border-black/8 bg-white px-4 py-3 text-sm font-medium text-on-background outline-none transition focus:border-[#008f44]/30"
        >
          {REMOTE_FILTERS.map(filter => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
      >
        Search jobs
      </button>
    </form>
  )
}

function JobCard({ job }: { job: Job }) {
  return (
    <article className="flex h-full flex-col rounded-[2rem] border border-white/70 bg-white/88 p-6 shadow-[0_18px_42px_rgba(25,28,29,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#008f44]">
            {formatJobSource(job.source_provider)}
          </span>
          <span className="rounded-full border border-black/8 bg-black/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
            Beta board
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
          {formatJobDate(job.posted_at)}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <Link
          href={`/jobs/${job.slug}`}
          className="text-2xl font-black leading-tight tracking-tight text-on-background transition-colors hover:text-[#008f44]"
        >
          {job.title}
        </Link>
        <p className="text-sm font-semibold text-on-surface-variant">{job.company_name}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-on-surface-variant">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} strokeWidth={2.2} />
            {job.location_text}
          </span>
          {job.employment_type ? <span>{job.employment_type}</span> : null}
        </div>
        <p className="line-clamp-4 text-sm leading-7 text-on-surface-variant">{job.description_text}</p>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
        <Link
          href={`/jobs/${job.slug}`}
          className="inline-flex items-center justify-center rounded-full border border-[#008f44]/16 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#008f44] transition-all hover:-translate-y-0.5 hover:bg-[#008f44]/6"
        >
          View role
        </Link>
        <Link
          href={`/jobs/${job.slug}/apply`}
          className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
        >
          Apply
          <ArrowRight size={14} strokeWidth={2.4} />
        </Link>
        <JobTrackerButton jobId={job.id} />
      </div>
    </article>
  )
}

function EmptyBoardState() {
  return (
    <section className="rounded-[2.2rem] border border-white/70 bg-white/88 px-8 py-14 text-center shadow-[0_22px_60px_rgba(25,28,29,0.06)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#008f44]/10 text-[#008f44]">
        <BriefcaseBusiness size={28} strokeWidth={2.1} />
      </div>
      <h2 className="mt-6 text-2xl font-black tracking-tight text-on-background">
        No jobs matched that filter yet.
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
        This beta board fills from your connected Greenhouse, Lever, and Remotive sources. Adjust
        the filters or run another sync.
      </p>
    </section>
  )
}

export default function JobsBoardDirectory({
  jobs,
  params,
  variant = 'public',
}: {
  jobs: Job[]
  params: JobsBoardSearchParams
  variant?: 'public' | 'dashboard'
}) {
  const totalJobs = jobs.length
  const remoteJobs = jobs.filter(job => job.remote_type === 'remote').length

  if (variant === 'dashboard') {
    return (
      <div className="mx-auto max-w-7xl space-y-8">
        <DashboardPageIntro
          kicker="Job Board Beta"
          title="Explore roles without leaving your workspace."
          description="The board is still in beta, but it already plugs directly into your tracker and resume workflow. Search openings, save promising roles, and push the best ones into your pipeline."
          actions={
            <>
              <Link
                href="/dashboard/jobs"
                className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
              >
                Open tracker
              </Link>
              <Link
                href="/dashboard/ats-checker"
                className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/86 px-6 py-3 text-sm font-bold text-on-surface transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white"
              >
                Tailor for a role
              </Link>
            </>
          }
          aside={
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Live search pulse</p>
              <p className="text-2xl font-black tracking-tight text-on-background">{totalJobs} visible roles</p>
              <p className="text-sm leading-6 text-on-surface-variant">
                {remoteJobs} remote opportunities in the current result set. Beta means source
                coverage and freshness will improve as you expand feeds.
              </p>
            </div>
          }
        />

        <DashboardSurface variant="subtle" className="p-5 sm:p-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] xl:items-end">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-[#008f44]/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#008f44]">
                  Search board
                </span>
                <span className="inline-flex rounded-full border border-black/8 bg-black/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
                  Beta
                </span>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
                Keep the board inside the dashboard while the public beta matures. Saved jobs drop
                directly into the tracker without breaking your session flow.
              </p>
            </div>
            <SearchPanel params={params} />
          </div>
        </DashboardSurface>

        {jobs.length === 0 ? (
          <EmptyBoardState />
        ) : (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </section>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <section className="rounded-[2.8rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.9))] px-8 py-10 shadow-[0_24px_60px_rgba(25,28,29,0.08)] sm:px-12 sm:py-12">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] xl:items-end">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-[#008f44]/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#008f44]">
                Job Board
              </span>
              <span className="inline-flex rounded-full border border-black/8 bg-black/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
                Beta
              </span>
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-on-background sm:text-5xl lg:text-6xl">
                Search roles, apply cleanly, and keep every application tracked.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-on-surface-variant sm:text-lg">
                Rezoomed pulls jobs from Greenhouse, Lever, and Remotive, then folds the roles back
                into your resume workflow and tracker.
              </p>
            </div>
          </div>

          <SearchPanel params={params} />
        </div>
      </section>

      {jobs.length === 0 ? (
        <EmptyBoardState />
      ) : (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </section>
      )}
    </div>
  )
}
