'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BriefcaseBusiness,
  ExternalLink,
  PencilLine,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import EmptyState from '@/components/shared/EmptyState'
import AdBanner from '@/components/shared/AdBanner'
import { DashboardSurface } from '@/components/layout/DashboardSurface'
import ManualTrackedJobDialog from '@/components/jobs/ManualTrackedJobDialog'
import {
  formatSalaryInput,
  formatJobSource,
  formatTrackerDate,
  getTodayTrackerDate,
  isValidExternalUrl,
  parseTrackerDateInput,
  salarySortValue,
  trackerDateSortValue,
} from '@/lib/jobs/shared'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { Profile, TrackedJob, TrackedJobStatus } from '@/types'

type FilterValue = 'all' | TrackedJobStatus
type SortDirection = 'asc' | 'desc'
type SortKey =
  | 'title'
  | 'company'
  | 'salary'
  | 'location'
  | 'status'
  | 'excitement'
  | 'saved'
  | 'applied'
  | 'source'

type InlineDraft = {
  salaryText: string
  savedOn: string
  appliedOn: string
}

type DrawerDraft = {
  status: TrackedJobStatus
  salaryText: string
  savedOn: string
  appliedOn: string
  jobDescription: string
  notes: string
  excitementRating: number | null
}

const STATUS_OPTIONS: Array<{
  value: TrackedJobStatus
  label: string
  tone: string
}> = [
  { value: 'saved', label: 'Saved', tone: 'bg-slate-100 text-slate-700' },
  { value: 'applied', label: 'Applied', tone: 'bg-blue-100 text-blue-700' },
  { value: 'interviewing', label: 'Interviewing', tone: 'bg-amber-100 text-amber-700' },
  { value: 'offer', label: 'Offer', tone: 'bg-emerald-100 text-emerald-700' },
  { value: 'rejected', label: 'Rejected', tone: 'bg-rose-100 text-rose-700' },
  { value: 'archived', label: 'Archived', tone: 'bg-zinc-100 text-zinc-600' },
]

const STATUS_SORT_ORDER: Record<TrackedJobStatus, number> = {
  saved: 0,
  applied: 1,
  interviewing: 2,
  offer: 3,
  rejected: 4,
  archived: 5,
}

function getStatusMeta(status: TrackedJobStatus) {
  return STATUS_OPTIONS.find(option => option.value === status) ?? STATUS_OPTIONS[0]
}

function getDisplayedSalary(trackedJob: TrackedJob) {
  return trackedJob.salary_text ?? trackedJob.job?.salary_text ?? ''
}

function getDisplayedSavedOn(trackedJob: TrackedJob) {
  return formatTrackerDate(trackedJob.saved_on ?? trackedJob.created_at)
}

function getDisplayedAppliedOn(trackedJob: TrackedJob) {
  return formatTrackerDate(trackedJob.applied_at)
}

function getDisplayedJobDescription(trackedJob: TrackedJob) {
  return trackedJob.job_description ?? trackedJob.job?.description_text ?? ''
}

function buildInlineDraft(trackedJob: TrackedJob): InlineDraft {
  return {
    salaryText: trackedJob.salary_text ?? '',
    savedOn: getDisplayedSavedOn(trackedJob),
    appliedOn: getDisplayedAppliedOn(trackedJob),
  }
}

function buildDrawerDraft(trackedJob: TrackedJob): DrawerDraft {
  return {
    status: trackedJob.status,
    salaryText: trackedJob.salary_text ?? '',
    savedOn: getDisplayedSavedOn(trackedJob),
    appliedOn: getDisplayedAppliedOn(trackedJob),
    jobDescription: getDisplayedJobDescription(trackedJob),
    notes: trackedJob.notes ?? '',
    excitementRating: trackedJob.excitement_rating,
  }
}

function buildSearchText(trackedJob: TrackedJob) {
  return [
    trackedJob.job?.title,
    trackedJob.job?.company_name,
    trackedJob.job?.location_text,
    trackedJob.job?.category,
    trackedJob.notes,
    trackedJob.job_description,
    trackedJob.job?.description_text,
    trackedJob.salary_text,
    trackedJob.job?.salary_text,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function compareValues(left: string | number, right: string | number, direction: SortDirection) {
  const multiplier = direction === 'asc' ? 1 : -1

  if (typeof left === 'number' && typeof right === 'number') {
    return (left - right) * multiplier
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: 'base',
  }) * multiplier
}

function ExcitementStars({
  value,
  onChange,
  size = 'sm',
}: {
  value: number | null
  onChange?: (nextValue: number | null) => void
  size?: 'sm' | 'md'
}) {
  const resolved = value ?? 0

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1
        const active = starValue <= resolved

        if (!onChange) {
          return (
            <span
              key={starValue}
              className={cn(
                'leading-none',
                size === 'md' ? 'text-xl' : 'text-base',
                active ? 'text-amber-500' : 'text-zinc-300'
              )}
            >
              {active ? '★' : '☆'}
            </span>
          )
        }

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange(resolved === starValue ? null : starValue)}
            className={cn(
              'leading-none transition-transform hover:scale-110',
              size === 'md' ? 'text-xl' : 'text-base',
              active ? 'text-amber-500' : 'text-zinc-300'
            )}
            aria-label={`Set excitement to ${starValue} out of 5`}
          >
            {active ? '★' : '☆'}
          </button>
        )
      })}
    </div>
  )
}

function SpreadsheetHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onClick,
  align = 'left',
}: {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  direction: SortDirection
  onClick: (key: SortKey) => void
  align?: 'left' | 'center'
}) {
  const isActive = sortKey === activeKey

  return (
    <button
      type="button"
      onClick={() => onClick(sortKey)}
      className={cn(
        'inline-flex w-full items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-on-surface-variant/75 transition-colors hover:text-on-background',
        align === 'center' ? 'justify-center' : 'justify-start'
      )}
    >
      <span>{label}</span>
      {isActive ? (
        direction === 'asc' ? <ArrowUp size={13} strokeWidth={2.6} /> : <ArrowDown size={13} strokeWidth={2.6} />
      ) : (
        <ArrowUpDown size={13} strokeWidth={2.2} />
      )}
    </button>
  )
}

export default function TrackedJobsClient({
  initialTrackedJobs,
  plan,
  initialStatusFilter = 'all',
}: {
  initialTrackedJobs: TrackedJob[]
  plan: Profile['plan']
  initialStatusFilter?: FilterValue
}) {
  const [trackedJobs, setTrackedJobs] = useState(initialTrackedJobs)
  const [filter, setFilter] = useState<FilterValue>(initialStatusFilter)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('saved')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)
  const [selectedTrackedJobId, setSelectedTrackedJobId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [inlineDrafts, setInlineDrafts] = useState<Record<string, InlineDraft>>(() =>
    Object.fromEntries(initialTrackedJobs.map(job => [job.id, buildInlineDraft(job)]))
  )
  const [drawerDraft, setDrawerDraft] = useState<DrawerDraft | null>(null)

  const selectedTrackedJob =
    selectedTrackedJobId ? trackedJobs.find(job => job.id === selectedTrackedJobId) ?? null : null
  const selectedJob = selectedTrackedJob?.job ?? null
  const selectedJobHasExternalLink = isValidExternalUrl(selectedJob?.apply_url)

  const counts = useMemo(() => {
    return trackedJobs.reduce<Record<TrackedJobStatus, number>>(
      (accumulator, job) => {
        accumulator[job.status] += 1
        return accumulator
      },
      {
        saved: 0,
        applied: 0,
        interviewing: 0,
        offer: 0,
        rejected: 0,
        archived: 0,
      }
    )
  }, [trackedJobs])

  const activeTrackedJobs = useMemo(
    () => trackedJobs.filter(job => job.status !== 'archived'),
    [trackedJobs]
  )

  const visibleTrackedJobs = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    const filtered = trackedJobs.filter(trackedJob => {
      if (filter !== 'all' && trackedJob.status !== filter) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return buildSearchText(trackedJob).includes(normalizedSearch)
    })

    const sorted = [...filtered].sort((left, right) => {
      switch (sortKey) {
        case 'title':
          return compareValues(left.job?.title ?? '', right.job?.title ?? '', sortDirection)
        case 'company':
          return compareValues(left.job?.company_name ?? '', right.job?.company_name ?? '', sortDirection)
        case 'salary':
          return compareValues(
            salarySortValue(getDisplayedSalary(left)),
            salarySortValue(getDisplayedSalary(right)),
            sortDirection
          )
        case 'location':
          return compareValues(left.job?.location_text ?? '', right.job?.location_text ?? '', sortDirection)
        case 'status':
          return compareValues(STATUS_SORT_ORDER[left.status], STATUS_SORT_ORDER[right.status], sortDirection)
        case 'excitement':
          return compareValues(left.excitement_rating ?? 0, right.excitement_rating ?? 0, sortDirection)
        case 'saved':
          return compareValues(
            trackerDateSortValue(left.saved_on ?? left.created_at),
            trackerDateSortValue(right.saved_on ?? right.created_at),
            sortDirection
          )
        case 'applied':
          return compareValues(
            trackerDateSortValue(left.applied_at),
            trackerDateSortValue(right.applied_at),
            sortDirection
          )
        case 'source':
          return compareValues(
            formatJobSource(left.job?.source_provider ?? 'manual'),
            formatJobSource(right.job?.source_provider ?? 'manual'),
            sortDirection
          )
        default:
          return 0
      }
    })

    return sorted
  }, [filter, searchQuery, sortDirection, sortKey, trackedJobs])

  const drawerTrackedJobs = useMemo(() => {
    if (!selectedTrackedJobId) {
      return visibleTrackedJobs
    }

    return visibleTrackedJobs.some(job => job.id === selectedTrackedJobId) ? visibleTrackedJobs : trackedJobs
  }, [selectedTrackedJobId, trackedJobs, visibleTrackedJobs])

  const trackerLimitLabel = plan === 'pro' ? 'Unlimited' : '5'

  function syncTrackedJobState(trackedJobId: string, patch: Partial<TrackedJob>) {
    let updatedTrackedJob: TrackedJob | null = null

    setTrackedJobs(current =>
      current.map(job => {
        if (job.id !== trackedJobId) {
          return job
        }

        updatedTrackedJob = { ...job, ...patch }
        return updatedTrackedJob
      })
    )

    if (!updatedTrackedJob) {
      return
    }

    setInlineDrafts(current => ({
      ...current,
      [trackedJobId]: buildInlineDraft(updatedTrackedJob!),
    }))

    if (selectedTrackedJobId === trackedJobId) {
      setDrawerDraft(buildDrawerDraft(updatedTrackedJob))
    }
  }

  async function patchTrackedJob(
    trackedJobId: string,
    body: Record<string, unknown>,
    nextBusyKey: string,
    fallbackMessage: string,
  ) {
    setBusyKey(nextBusyKey)
    setErrorMessage(null)

    const response = await fetch(`/api/jobs/tracker/${trackedJobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const payload = (await response.json().catch(() => null)) as
      | {
          success?: boolean
          trackedJob?: Partial<TrackedJob>
          error?: string
        }
      | null

    if (response.ok && payload?.success && payload.trackedJob) {
      syncTrackedJobState(trackedJobId, payload.trackedJob)
      setBusyKey(null)
      return true
    }

    setErrorMessage(
      payload?.error === 'TRACKER_LIMIT_REACHED'
        ? 'Your current plan has reached its tracking capacity.'
        : fallbackMessage
    )
    setBusyKey(null)
    return false
  }

  function handleManualTrackedJobCreated(trackedJob: TrackedJob) {
    setTrackedJobs(current => [trackedJob, ...current])
    setInlineDrafts(current => ({
      ...current,
      [trackedJob.id]: buildInlineDraft(trackedJob),
    }))
    setFilter('all')
    setSearchQuery('')
    setErrorMessage(null)
  }

  async function handleDelete(trackedJobId: string) {
    setBusyKey(`delete:${trackedJobId}`)
    setErrorMessage(null)

    const response = await fetch(`/api/jobs/tracker/${trackedJobId}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      setTrackedJobs(current => current.filter(job => job.id !== trackedJobId))
      setInlineDrafts(current => {
        const next = { ...current }
        delete next[trackedJobId]
        return next
      })
      if (selectedTrackedJobId === trackedJobId) {
        setSelectedTrackedJobId(null)
      }
      setBusyKey(null)
      return
    }

    setErrorMessage('We could not remove that job right now.')
    setBusyKey(null)
  }

  async function handleStatusChange(trackedJobId: string, status: TrackedJobStatus) {
    await patchTrackedJob(
      trackedJobId,
      { status },
      `status:${trackedJobId}`,
      'We could not update that status right now.'
    )
  }

  async function handleExcitementChange(trackedJobId: string, excitementRating: number | null) {
    await patchTrackedJob(
      trackedJobId,
      { excitementRating },
      `excitement:${trackedJobId}`,
      'We could not update that excitement rating right now.'
    )
  }

  async function handleInlineFieldSave(
    trackedJobId: string,
    field: keyof InlineDraft,
  ) {
    const trackedJob = trackedJobs.find(job => job.id === trackedJobId)
    const inlineDraft = inlineDrafts[trackedJobId]

    if (!trackedJob || !inlineDraft) {
      return
    }

    if (field === 'salaryText') {
      const normalized = inlineDraft.salaryText.trim() || null
      const currentValue = trackedJob.salary_text?.trim() || null

      if (normalized === currentValue) {
        return
      }

      await patchTrackedJob(
        trackedJobId,
        { salaryText: normalized },
        `salary:${trackedJobId}`,
        'We could not save that salary right now.'
      )
      return
    }

    if (field === 'savedOn') {
      const normalized = inlineDraft.savedOn.trim()
      const currentValue = getDisplayedSavedOn(trackedJob)

      if (normalized === currentValue) {
        return
      }

      if (normalized && !parseTrackerDateInput(normalized)) {
        setErrorMessage('Saved date must use DD/MM/YY format.')
        setInlineDrafts(current => ({
          ...current,
          [trackedJobId]: {
            ...current[trackedJobId],
            savedOn: currentValue,
          },
        }))
        return
      }

      await patchTrackedJob(
        trackedJobId,
        { savedOn: normalized || null },
        `saved-on:${trackedJobId}`,
        'We could not save that date right now.'
      )
      return
    }

    if (field === 'appliedOn') {
      const normalized = inlineDraft.appliedOn.trim()
      const currentValue = getDisplayedAppliedOn(trackedJob)

      if (normalized === currentValue) {
        return
      }

      if (normalized && !parseTrackerDateInput(normalized)) {
        setErrorMessage('Application date must use DD/MM/YY format.')
        setInlineDrafts(current => ({
          ...current,
          [trackedJobId]: {
            ...current[trackedJobId],
            appliedOn: currentValue,
          },
        }))
        return
      }

      await patchTrackedJob(
        trackedJobId,
        { appliedOn: normalized || null },
        `applied-on:${trackedJobId}`,
        'We could not save that application date right now.'
      )
    }
  }

  async function handleInlineAppliedToday(trackedJobId: string) {
    const trackedJob = trackedJobs.find(job => job.id === trackedJobId)

    if (!trackedJob) {
      return
    }

    const currentValue = getDisplayedAppliedOn(trackedJob)
    const today = getTodayTrackerDate()

    setInlineDrafts(current => ({
      ...current,
      [trackedJobId]: {
        ...current[trackedJobId],
        appliedOn: today,
      },
    }))

    if (today === currentValue) {
      return
    }

    const didSave = await patchTrackedJob(
      trackedJobId,
      { appliedOn: today },
      `applied-on:${trackedJobId}`,
      'We could not save that application date right now.'
    )

    if (!didSave) {
      setInlineDrafts(current => ({
        ...current,
        [trackedJobId]: {
          ...current[trackedJobId],
          appliedOn: currentValue,
        },
      }))
    }
  }

  async function handleSaveDrawer() {
    if (!selectedTrackedJobId || !drawerDraft) {
      return
    }

    if (drawerDraft.savedOn.trim() && !parseTrackerDateInput(drawerDraft.savedOn)) {
      setErrorMessage('Saved date must use DD/MM/YY format.')
      return
    }

    if (drawerDraft.appliedOn.trim() && !parseTrackerDateInput(drawerDraft.appliedOn)) {
      setErrorMessage('Application date must use DD/MM/YY format.')
      return
    }

    await patchTrackedJob(
      selectedTrackedJobId,
      {
        status: drawerDraft.status,
        salaryText: drawerDraft.salaryText.trim() || null,
        savedOn: drawerDraft.savedOn.trim() || null,
        appliedOn: drawerDraft.appliedOn.trim() || null,
        jobDescription: drawerDraft.jobDescription.trim() || null,
        notes: drawerDraft.notes.trim() || null,
        excitementRating: drawerDraft.excitementRating,
      },
      `drawer:${selectedTrackedJobId}`,
      'We could not save those job details right now.'
    )
  }

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection(current => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(nextKey)
    setSortDirection(nextKey === 'title' || nextKey === 'company' || nextKey === 'location' || nextKey === 'source' ? 'asc' : 'desc')
  }

  function openDetailsPanel(trackedJob: TrackedJob) {
    setSelectedTrackedJobId(trackedJob.id)
    setDrawerDraft(buildDrawerDraft(trackedJob))
  }

  return (
    <div className="relative left-1/2 w-full max-w-7xl -translate-x-1/2 space-y-5 xl:w-[calc(100vw-24rem)] xl:max-w-[1560px]">
      <DashboardSurface variant="subtle" className="overflow-hidden p-0">
        <div className="border-b border-black/5 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#008f44]">
                  Job Tracker
                </span>
                <span className="inline-flex rounded-full border border-black/8 bg-black/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
                  Spreadsheet workspace
                </span>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <h1 className="text-2xl font-black tracking-tight text-on-background sm:text-[2rem]">
                  Application pipeline
                </h1>
                <p className="pb-0.5 text-sm font-semibold text-on-surface-variant">
                  {plan === 'pro' ? 'Unlimited active tracking' : `${activeTrackedJobs.length}/${trackerLimitLabel} active roles`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/job-board"
                className="inline-flex items-center gap-2 rounded-full border border-[#008f44]/16 bg-white px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#008f44] transition-all hover:-translate-y-0.5 hover:bg-[#008f44]/6"
              >
                <Search size={15} strokeWidth={2.4} />
                Browse beta board
              </Link>
              <button
                type="button"
                onClick={() => setIsManualDialogOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
              >
                <Plus size={15} strokeWidth={2.6} />
                Add a new job
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-black/6 lg:grid-cols-6">
          {STATUS_OPTIONS.map(option => {
            const isActive = filter === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(current => (current === option.value ? 'all' : option.value))}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 bg-white px-4 py-4 text-center transition-colors',
                  isActive ? 'bg-[#fff7f0]' : 'hover:bg-black/[0.02]'
                )}
              >
                <span className="text-3xl font-black tracking-tight text-on-background">
                  {counts[option.value]}
                </span>
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
                  {option.label}
                </span>
              </button>
            )
          })}
        </div>
      </DashboardSurface>

      <DashboardSurface variant="default" className="overflow-hidden p-0">
        <div className="border-b border-black/5 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-xl">
              <Search
                size={16}
                strokeWidth={2.4}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70"
              />
              <input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Search job title, company, location, salary, notes, or description"
                className="w-full rounded-[1.1rem] border border-black/8 bg-white px-11 py-3 text-sm font-medium text-on-background outline-none transition focus:border-[#008f44]/30"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant">
              <span>{visibleTrackedJobs.length} rows</span>
              <span className="rounded-full border border-black/8 bg-black/[0.03] px-3 py-1.5">
                Sorted by {sortKey}
              </span>
            </div>
          </div>
          {errorMessage ? <p className="mt-4 text-sm text-red-600">{errorMessage}</p> : null}
        </div>

        {trackedJobs.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={BriefcaseBusiness}
              title="No tracked jobs yet"
              description="Add roles manually, save them from the beta board, or confirm an application after you return from an external apply flow."
            />
          </div>
        ) : (
          <div className="max-h-[72vh] overflow-auto">
            <table className="min-w-[1380px] w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-[#f8faf8]">
                <tr className="bg-[#f8faf8]">
                  <th className="border-b border-black/8 px-5 py-3 text-left sm:px-6">
                    <SpreadsheetHeader
                      label="Job position"
                      sortKey="title"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onClick={toggleSort}
                    />
                  </th>
                  <th className="border-b border-black/8 px-4 py-3 text-left">
                    <SpreadsheetHeader
                      label="Company"
                      sortKey="company"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onClick={toggleSort}
                    />
                  </th>
                  <th className="border-b border-black/8 px-4 py-3 text-left">
                    <SpreadsheetHeader
                      label="Salary"
                      sortKey="salary"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onClick={toggleSort}
                    />
                  </th>
                  <th className="border-b border-black/8 px-4 py-3 text-left">
                    <SpreadsheetHeader
                      label="Location"
                      sortKey="location"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onClick={toggleSort}
                    />
                  </th>
                  <th className="border-b border-black/8 px-4 py-3 text-left">
                    <SpreadsheetHeader
                      label="Status"
                      sortKey="status"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onClick={toggleSort}
                    />
                  </th>
                  <th className="border-b border-black/8 px-4 py-3 text-center">
                    <SpreadsheetHeader
                      label="Excitement"
                      sortKey="excitement"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onClick={toggleSort}
                      align="center"
                    />
                  </th>
                  <th className="border-b border-black/8 px-4 py-3 text-left">
                    <SpreadsheetHeader
                      label="Date saved"
                      sortKey="saved"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onClick={toggleSort}
                    />
                  </th>
                  <th className="border-b border-black/8 px-4 py-3 text-left">
                    <SpreadsheetHeader
                      label="Application date"
                      sortKey="applied"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onClick={toggleSort}
                    />
                  </th>
                  <th className="border-b border-black/8 px-4 py-3 text-left">
                    <SpreadsheetHeader
                      label="Source"
                      sortKey="source"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onClick={toggleSort}
                    />
                  </th>
                  <th className="border-b border-black/8 px-5 py-3 text-right sm:px-6">
                    <span className="text-[11px] font-black uppercase tracking-[0.16em] text-on-surface-variant/75">
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {visibleTrackedJobs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-14 text-center text-sm text-on-surface-variant">
                      No jobs match the current search or filter.
                    </td>
                  </tr>
                ) : (
                  visibleTrackedJobs.map(trackedJob => {
                    const job = trackedJob.job
                    const statusMeta = getStatusMeta(trackedJob.status)
                    const inlineDraft = inlineDrafts[trackedJob.id] ?? buildInlineDraft(trackedJob)
                    const hasExternalLink = isValidExternalUrl(job?.apply_url)

                    return (
                      <tr key={trackedJob.id} className="align-top transition-colors hover:bg-[#fbfdfb]">
                        <td className="border-b border-black/6 px-5 py-4 sm:px-6">
                          <div className="space-y-2">
                            <p className="text-base font-black leading-6 text-on-background">
                              {job?.title ?? 'Untitled role'}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs font-semibold text-on-surface-variant">
                              {job?.employment_type ? <span>{job.employment_type}</span> : null}
                              {job?.remote_type && job.remote_type !== 'unknown' ? (
                                <span>{job.remote_type.replace('_', ' ')}</span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="border-b border-black/6 px-4 py-4 text-sm font-semibold text-on-background">
                          {job?.company_name ?? 'Unknown company'}
                        </td>
                        <td className="border-b border-black/6 px-4 py-3">
                          <input
                            value={inlineDraft.salaryText}
                            onChange={event =>
                              setInlineDrafts(current => ({
                                ...current,
                                [trackedJob.id]: {
                                  ...current[trackedJob.id],
                                  salaryText: formatSalaryInput(event.target.value),
                                },
                              }))
                            }
                            onBlur={() => handleInlineFieldSave(trackedJob.id, 'salaryText')}
                            onKeyDown={event => {
                              if (event.key === 'Enter') {
                                event.currentTarget.blur()
                              }
                            }}
                            inputMode="numeric"
                            placeholder={job?.salary_text ?? '$120,000'}
                            className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-on-background outline-none transition hover:border-black/8 focus:border-[#008f44]/30 focus:bg-white"
                          />
                        </td>
                        <td className="border-b border-black/6 px-4 py-4 text-sm font-medium text-on-background">
                          {job?.location_text ?? 'Location flexible'}
                        </td>
                        <td className="border-b border-black/6 px-4 py-3">
                          <select
                            value={trackedJob.status}
                            disabled={busyKey === `status:${trackedJob.id}`}
                            onChange={event =>
                              handleStatusChange(trackedJob.id, event.target.value as TrackedJobStatus)
                            }
                            className={cn(
                              'w-full rounded-md border border-transparent px-2 py-1.5 text-sm font-semibold outline-none transition hover:border-black/8 focus:border-[#008f44]/30 focus:bg-white',
                              statusMeta.tone
                            )}
                          >
                            {STATUS_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border-b border-black/6 px-4 py-4 text-center">
                          <div className="flex justify-center">
                            <ExcitementStars
                              value={trackedJob.excitement_rating}
                              onChange={nextValue => handleExcitementChange(trackedJob.id, nextValue)}
                            />
                          </div>
                        </td>
                        <td className="border-b border-black/6 px-4 py-3">
                          <input
                            value={inlineDraft.savedOn}
                            onChange={event =>
                              setInlineDrafts(current => ({
                                ...current,
                                [trackedJob.id]: {
                                  ...current[trackedJob.id],
                                  savedOn: event.target.value,
                                },
                              }))
                            }
                            onBlur={() => handleInlineFieldSave(trackedJob.id, 'savedOn')}
                            onKeyDown={event => {
                              if (event.key === 'Enter') {
                                event.currentTarget.blur()
                              }
                            }}
                            placeholder="DD/MM/YY"
                            className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-on-background outline-none transition hover:border-black/8 focus:border-[#008f44]/30 focus:bg-white"
                          />
                        </td>
                        <td className="border-b border-black/6 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <input
                              value={inlineDraft.appliedOn}
                              onChange={event =>
                                setInlineDrafts(current => ({
                                  ...current,
                                  [trackedJob.id]: {
                                    ...current[trackedJob.id],
                                    appliedOn: event.target.value,
                                  },
                                }))
                              }
                              onBlur={() => handleInlineFieldSave(trackedJob.id, 'appliedOn')}
                              onKeyDown={event => {
                                if (event.key === 'Enter') {
                                  event.currentTarget.blur()
                                }
                              }}
                              placeholder="DD/MM/YY"
                              className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-on-background outline-none transition hover:border-black/8 focus:border-[#008f44]/30 focus:bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => void handleInlineAppliedToday(trackedJob.id)}
                              className="shrink-0 rounded-full border border-[#008f44]/18 bg-[#008f44]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#008f44] transition hover:bg-[#008f44]/16"
                            >
                              Today
                            </button>
                          </div>
                        </td>
                        <td className="border-b border-black/6 px-4 py-4 text-sm font-semibold text-on-surface-variant">
                          {job ? formatJobSource(job.source_provider) : 'Manual'}
                        </td>
                        <td className="border-b border-black/6 px-5 py-4 sm:px-6">
                          <div className="flex items-center justify-end gap-2">
                            {job && hasExternalLink ? (
                              <Link
                                href={`/jobs/${job.slug}/apply`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-[#008f44]/16 bg-white px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#008f44] transition-all hover:-translate-y-0.5 hover:bg-[#008f44]/6"
                              >
                                Open
                                <ExternalLink size={12} strokeWidth={2.4} />
                              </Link>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-black/[0.04] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-on-surface-variant/55"
                              >
                                Open
                                <ExternalLink size={12} strokeWidth={2.4} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openDetailsPanel(trackedJob)}
                              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
                            >
                              <PencilLine size={12} strokeWidth={2.6} />
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSurface>

      {plan === 'free' ? <AdBanner size="leaderboard" className="mx-auto" /> : null}

      <ManualTrackedJobDialog
        open={isManualDialogOpen}
        onOpenChange={setIsManualDialogOpen}
        onCreated={handleManualTrackedJobCreated}
      />

      <Sheet
        open={Boolean(selectedTrackedJob)}
        onOpenChange={open => {
          if (!open) {
            setSelectedTrackedJobId(null)
            setDrawerDraft(null)
          }
        }}
      >
        <SheetContent
          side="right"
          className="border-l border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,247,244,0.96))] p-0"
          style={{ width: '80vw', maxWidth: '80vw' }}
        >
          {selectedTrackedJob && drawerDraft ? (
            <div className="grid h-full min-h-0 lg:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="hidden min-h-0 border-r border-black/6 bg-white/[0.92] lg:flex lg:flex-col">
                <div className="border-b border-black/6 px-5 py-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">
                    Jobs
                  </p>
                  <p className="mt-2 text-sm font-semibold text-on-surface-variant">
                    Open a role from this rail to move through your tracker faster.
                  </p>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {drawerTrackedJobs.map(job => {
                    const isActive = job.id === selectedTrackedJob.id

                    return (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => openDetailsPanel(job)}
                        className={cn(
                          'w-full border-b border-black/6 px-5 py-4 text-left transition-colors',
                          isActive ? 'bg-[#eef6f1]' : 'hover:bg-[#f8faf8]'
                        )}
                      >
                        <p className="line-clamp-2 text-base font-black leading-6 text-on-background">
                          {job.job?.title ?? 'Untitled role'}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-on-surface-variant">
                          {job.job?.company_name ?? 'Unknown company'}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </aside>

              <div className="flex min-h-0 flex-col">
                <div className="border-b border-black/6 bg-white/90 px-6 py-6 sm:px-8">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="inline-flex rounded-full bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#008f44]">
                        Tracker menu
                      </div>
                      <SheetTitle className="mt-4 max-w-4xl text-3xl font-black tracking-tight text-on-background sm:text-[2.6rem] sm:leading-[1.02]">
                        {selectedTrackedJob.job?.title ?? 'Untitled role'}
                      </SheetTitle>
                      <SheetDescription className="mt-3 text-base font-semibold leading-7 text-on-surface-variant">
                        {selectedTrackedJob.job?.company_name ?? 'Unknown company'} · {selectedTrackedJob.job?.location_text ?? 'Location flexible'}
                      </SheetDescription>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-on-surface-variant">
                          {selectedTrackedJob.job ? formatJobSource(selectedTrackedJob.job.source_provider) : 'Manual'}
                        </span>
                        {selectedTrackedJob.job?.posted_at ? (
                          <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-on-surface-variant">
                            Posted {formatTrackerDate(selectedTrackedJob.job.posted_at)}
                          </span>
                        ) : null}
                        {selectedTrackedJob.job?.employment_type ? (
                          <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-on-surface-variant">
                            {selectedTrackedJob.job.employment_type}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 xl:items-end">
                      <p className="text-3xl font-black tracking-tight text-[#103f33] sm:text-[2.7rem]">
                        {drawerDraft.salaryText.trim() || selectedJob?.salary_text || 'Add salary'}
                      </p>
                      <ExcitementStars
                        value={drawerDraft.excitementRating}
                        onChange={nextValue =>
                          setDrawerDraft(current => (current ? { ...current, excitementRating: nextValue } : current))
                        }
                        size="md"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map(option => {
                      const isActive = drawerDraft.status === option.value

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setDrawerDraft(current =>
                              current ? { ...current, status: option.value } : current
                            )
                          }
                          className={cn(
                            'rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition-all',
                            isActive
                              ? 'border-[#0b6f4f] bg-[#0b6f4f] text-white'
                              : 'border-black/8 bg-white text-on-surface-variant hover:border-[#0b6f4f]/30 hover:text-[#0b6f4f]'
                          )}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
                  {errorMessage ? <p className="mb-5 text-sm text-red-600">{errorMessage}</p> : null}

                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                    <div className="space-y-6">
                      <section className="rounded-[1.8rem] border border-[#cde6da] bg-[#edf7f2] p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0b6f4f]/70">
                              Tracker guidance
                            </p>
                            <h3 className="mt-2 text-2xl font-black tracking-tight text-[#0f4135]">
                              Detailed role workspace
                            </h3>
                            <p className="mt-2 max-w-2xl text-sm font-medium leading-7 text-[#255446]">
                              Keep the key fields editable here, save your job description, and leave notes that help you move this role forward.
                            </p>
                          </div>

                          <div className="rounded-[1.2rem] border border-[#b9d9ca] bg-white px-4 py-3 text-sm font-semibold text-[#255446]">
                            {selectedJob?.remote_type && selectedJob.remote_type !== 'unknown'
                              ? selectedJob.remote_type.replace('_', ' ')
                              : 'Flexible location'}
                          </div>
                        </div>
                      </section>

                      <section className="rounded-[1.8rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(18,30,24,0.06)]">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">
                              Role summary
                            </p>
                            <h3 className="mt-2 text-xl font-black tracking-tight text-on-background">
                              Job description
                            </h3>
                          </div>
                          {selectedJob ? (
                            <div className="flex flex-wrap gap-2">
                              <Link
                                href={`/jobs/${selectedJob.slug}`}
                                className="inline-flex items-center justify-center rounded-full border border-[#008f44]/16 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#008f44] transition-all hover:-translate-y-0.5 hover:bg-[#008f44]/6"
                              >
                                Open listing
                              </Link>
                              {selectedJobHasExternalLink ? (
                                <Link
                                  href={`/jobs/${selectedJob.slug}/apply`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
                                >
                                  Open link
                                  <ExternalLink size={14} strokeWidth={2.4} />
                                </Link>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="inline-flex items-center justify-center gap-2 rounded-full border border-black/8 bg-black/[0.04] px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant/55"
                                >
                                  Open link
                                  <ExternalLink size={14} strokeWidth={2.4} />
                                </button>
                              )}
                            </div>
                          ) : null}
                        </div>

                        <label className="mt-5 block">
                          <textarea
                            value={drawerDraft.jobDescription}
                            onChange={event =>
                              setDrawerDraft(current =>
                                current ? { ...current, jobDescription: event.target.value } : current
                              )
                            }
                            rows={16}
                            placeholder="Paste the role summary, responsibilities, and requirements here."
                            className="min-h-[360px] w-full rounded-[1.3rem] border border-black/8 bg-[#fcfdfc] px-5 py-4 text-sm leading-7 text-on-background outline-none transition focus:border-[#008f44]/30"
                          />
                        </label>
                      </section>
                    </div>

                    <div className="space-y-6">
                      <section className="rounded-[1.8rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(18,30,24,0.06)]">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">
                          Tracker fields
                        </p>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <label className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/70">
                              Status
                            </span>
                            <select
                              value={drawerDraft.status}
                              onChange={event =>
                                setDrawerDraft(current =>
                                  current ? { ...current, status: event.target.value as TrackedJobStatus } : current
                                )
                              }
                              className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm font-semibold text-on-background outline-none transition focus:border-[#008f44]/30"
                            >
                              {STATUS_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/70">
                              Salary
                            </span>
                            <input
                              value={drawerDraft.salaryText}
                              onChange={event =>
                                setDrawerDraft(current =>
                                  current ? { ...current, salaryText: formatSalaryInput(event.target.value) } : current
                                )
                              }
                              inputMode="numeric"
                              placeholder={selectedJob?.salary_text ?? '$140,000'}
                              className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm font-medium text-on-background outline-none transition focus:border-[#008f44]/30"
                            />
                          </label>

                          <label className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/70">
                              Date saved
                            </span>
                            <input
                              value={drawerDraft.savedOn}
                              onChange={event =>
                                setDrawerDraft(current =>
                                  current ? { ...current, savedOn: event.target.value } : current
                                )
                              }
                              placeholder="DD/MM/YY"
                              className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm font-medium text-on-background outline-none transition focus:border-[#008f44]/30"
                            />
                          </label>

                          <label className="space-y-2">
                            <span className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/70">
                              <span>Application date</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setDrawerDraft(current =>
                                    current ? { ...current, appliedOn: getTodayTrackerDate() } : current
                                  )
                                }
                                className="rounded-full border border-[#008f44]/18 bg-[#008f44]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#008f44] transition hover:bg-[#008f44]/16"
                              >
                                Today
                              </button>
                            </span>
                            <input
                              value={drawerDraft.appliedOn}
                              onChange={event =>
                                setDrawerDraft(current =>
                                  current ? { ...current, appliedOn: event.target.value } : current
                                )
                              }
                              placeholder="DD/MM/YY"
                              className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm font-medium text-on-background outline-none transition focus:border-[#008f44]/30"
                            />
                          </label>
                        </div>
                      </section>

                      <section className="rounded-[1.8rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(18,30,24,0.06)]">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">
                          Notes and follow-up
                        </p>
                        <label className="mt-5 block">
                          <textarea
                            value={drawerDraft.notes}
                            onChange={event =>
                              setDrawerDraft(current =>
                                current ? { ...current, notes: event.target.value } : current
                              )
                            }
                            rows={12}
                            placeholder="Save interview prep notes, referrals, follow-ups, recruiter info, or compensation context."
                            className="min-h-[260px] w-full rounded-[1.3rem] border border-black/8 bg-[#fcfdfc] px-5 py-4 text-sm leading-7 text-on-background outline-none transition focus:border-[#008f44]/30"
                          />
                        </label>
                      </section>

                      <section className="rounded-[1.8rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(18,30,24,0.06)]">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">
                          Actions
                        </p>
                        <div className="mt-5 flex flex-col gap-3">
                          <button
                            type="button"
                            onClick={() => handleDelete(selectedTrackedJob.id)}
                            disabled={busyKey === `delete:${selectedTrackedJob.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-black/8 px-5 py-3 text-sm font-semibold text-on-surface transition-all hover:bg-black/5 disabled:opacity-60"
                          >
                            <Trash2 size={14} strokeWidth={2.1} />
                            Remove
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveDrawer}
                            disabled={busyKey === `drawer:${selectedTrackedJob.id}`}
                            className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:opacity-60"
                          >
                            {busyKey === `drawer:${selectedTrackedJob.id}` ? 'Saving…' : 'Save changes'}
                          </button>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
