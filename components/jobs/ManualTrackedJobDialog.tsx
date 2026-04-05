'use client'

import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  formatSalaryInput,
  formatTrackerDate,
  getTodayTrackerDate,
  parseTrackerDateInput,
} from '@/lib/jobs/shared'
import type { TrackedJob, TrackedJobStatus } from '@/types'

const MANUAL_STATUS_OPTIONS: Array<{ value: TrackedJobStatus; label: string }> = [
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
]

function getInitialForm() {
  return {
    title: '',
    companyName: '',
    locationText: '',
    applyUrl: '',
    status: 'saved' as TrackedJobStatus,
    salaryText: '',
    savedOn: formatTrackerDate(new Date().toISOString()),
    appliedOn: '',
    excitementRating: null as number | null,
    jobDescription: '',
    notes: '',
  }
}

function ExcitementStars({
  value,
  onChange,
}: {
  value: number | null
  onChange: (nextValue: number | null) => void
}) {
  const resolved = value ?? 0

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1
        const active = starValue <= resolved

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange(resolved === starValue ? null : starValue)}
            className={active ? 'text-2xl text-amber-500' : 'text-2xl text-zinc-300'}
            aria-label={`Set excitement to ${starValue} out of 5`}
          >
            {active ? '★' : '☆'}
          </button>
        )
      })}
    </div>
  )
}

export default function ManualTrackedJobDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (trackedJob: TrackedJob) => void
}) {
  const [form, setForm] = useState(getInitialForm)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isAppliedLike = useMemo(
    () => ['applied', 'interviewing', 'offer'].includes(form.status),
    [form.status]
  )
  const hasDraft = useMemo(
    () =>
      Boolean(
        form.title ||
        form.companyName ||
        form.locationText ||
        form.applyUrl ||
        form.salaryText ||
        form.appliedOn ||
        form.jobDescription ||
        form.notes ||
        form.excitementRating !== null ||
        form.status !== 'saved'
      ),
    [form]
  )

  function updateField<Key extends keyof ReturnType<typeof getInitialForm>>(
    key: Key,
    value: ReturnType<typeof getInitialForm>[Key]
  ) {
    setForm(current => ({
      ...current,
      [key]: key === 'salaryText' ? formatSalaryInput(String(value ?? '')) : value,
    }))
  }

  function resetForm() {
    setForm(getInitialForm())
    setErrorMessage(null)
    setSubmitting(false)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage(null)

    if (form.savedOn.trim() && !parseTrackerDateInput(form.savedOn)) {
      setErrorMessage('Saved date must use DD/MM/YY format.')
      setSubmitting(false)
      return
    }

    if (form.appliedOn.trim() && !parseTrackerDateInput(form.appliedOn)) {
      setErrorMessage('Application date must use DD/MM/YY format.')
      setSubmitting(false)
      return
    }

    const response = await fetch('/api/jobs/tracker/manual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...form,
        savedOn: form.savedOn.trim() || null,
        appliedOn: form.appliedOn.trim() || null,
        salaryText: form.salaryText.trim() || null,
        jobDescription: form.jobDescription.trim() || null,
        notes: form.notes.trim() || null,
      }),
    })

    if (response.status === 401) {
      window.location.assign('/auth/login')
      return
    }

    const payload = (await response.json().catch(() => null)) as
      | {
          success?: boolean
          trackedJob?: TrackedJob
          error?: string
        }
      | null

    if (!response.ok || !payload?.success || !payload.trackedJob) {
      if (payload?.error === 'TRACKER_LIMIT_REACHED') {
        setErrorMessage('Your current plan has reached its tracking capacity.')
      } else if (payload?.error === 'Invalid payload') {
        setErrorMessage('Check the dates and required fields, then try again.')
      } else {
        setErrorMessage('We could not add that job right now.')
      }
      setSubmitting(false)
      return
    }

    onCreated(payload.trackedJob)
    onOpenChange(false)
    resetForm()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent
        className="w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(243,247,244,0.96))] p-0 shadow-[0_28px_70px_rgba(25,28,29,0.14)] sm:w-[calc(100vw-3rem)] sm:max-w-[1120px]"
      >
        <form onSubmit={handleSubmit} className="flex max-h-[calc(100vh-2rem)] flex-col">
          <DialogHeader className="border-b border-black/5 px-6 py-6">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem] md:items-start">
              <div className="space-y-3">
                <div className="inline-flex w-fit rounded-full bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#008f44]">
                  Manual Entry
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight text-on-background sm:text-3xl">
                    Add a job to the tracker
                  </DialogTitle>
                  <DialogDescription className="mt-2 max-w-2xl text-sm leading-7 text-on-surface-variant">
                    Capture the job once, keep the draft if the dialog closes, and only clear the
                    form when you explicitly reset it.
                  </DialogDescription>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
                <div className="rounded-[1.2rem] border border-black/6 bg-white/80 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65">
                    Draft State
                  </p>
                  <p className="mt-2 text-sm font-black text-on-background">
                    {hasDraft ? 'Draft saved locally' : 'Fresh entry'}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-black/6 bg-white/80 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65">
                    Date format
                  </p>
                  <p className="mt-2 text-sm font-black text-on-background">DD/MM/YY</p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
              <div className="space-y-6">
                <div className="rounded-[1.4rem] border border-black/6 bg-white/86 p-5 shadow-[0_16px_40px_rgba(25,28,29,0.04)]">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65">
                        Core Details
                      </p>
                      <p className="mt-1 text-sm font-semibold text-on-surface-variant">
                        How this role should appear in the tracker row.
                      </p>
                    </div>
                    <div className="rounded-full border border-[#008f44]/18 bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#008f44]">
                      Spreadsheet ready
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/70">
                        Job title
                      </span>
                      <input
                        value={form.title}
                        onChange={event => updateField('title', event.target.value)}
                        required
                        className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm font-medium text-on-background outline-none transition focus:border-[#008f44]/30"
                        placeholder="Senior Product Designer"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/70">
                        Company
                      </span>
                      <input
                        value={form.companyName}
                        onChange={event => updateField('companyName', event.target.value)}
                        required
                        className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm font-medium text-on-background outline-none transition focus:border-[#008f44]/30"
                        placeholder="Acme"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/70">
                        Location
                      </span>
                      <input
                        value={form.locationText}
                        onChange={event => updateField('locationText', event.target.value)}
                        className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm font-medium text-on-background outline-none transition focus:border-[#008f44]/30"
                        placeholder="Remote / New York / Hybrid"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/70">
                        Stage
                      </span>
                      <select
                        value={form.status}
                        onChange={event => updateField('status', event.target.value as TrackedJobStatus)}
                        className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm font-semibold text-on-background outline-none transition focus:border-[#008f44]/30"
                      >
                        {MANUAL_STATUS_OPTIONS.map(option => (
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
                        value={form.salaryText}
                        onChange={event => updateField('salaryText', event.target.value)}
                        inputMode="numeric"
                        className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm font-medium text-on-background outline-none transition focus:border-[#008f44]/30"
                        placeholder="$140,000"
                      />
                    </label>

                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/70">
                        Excitement
                      </span>
                      <div className="rounded-[1rem] border border-black/8 bg-white px-4 py-[0.95rem]">
                        <ExcitementStars
                          value={form.excitementRating}
                          onChange={nextValue => updateField('excitementRating', nextValue)}
                        />
                      </div>
                    </div>

                    <label className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/70">
                        Saved date
                      </span>
                      <input
                        value={form.savedOn}
                        onChange={event => updateField('savedOn', event.target.value)}
                        className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm font-medium text-on-background outline-none transition focus:border-[#008f44]/30"
                        placeholder="DD/MM/YY"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/70">
                        <span>Application date</span>
                        <button
                          type="button"
                          onClick={() => updateField('appliedOn', getTodayTrackerDate())}
                          className="rounded-full border border-[#008f44]/18 bg-[#008f44]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#008f44] transition hover:bg-[#008f44]/16"
                        >
                          Today
                        </button>
                      </span>
                      <input
                        value={form.appliedOn}
                        onChange={event => updateField('appliedOn', event.target.value)}
                        className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm font-medium text-on-background outline-none transition focus:border-[#008f44]/30"
                        placeholder={isAppliedLike ? 'DD/MM/YY' : 'Optional'}
                      />
                    </label>

                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/70">
                        Job link
                      </span>
                      <input
                        value={form.applyUrl}
                        onChange={event => updateField('applyUrl', event.target.value)}
                        className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm font-medium text-on-background outline-none transition focus:border-[#008f44]/30"
                        placeholder="https://company.com/careers/role"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-[1.4rem] border border-black/6 bg-white/86 p-5 shadow-[0_16px_40px_rgba(25,28,29,0.04)]">
                  <div className="mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65">
                      Job Description
                    </p>
                    <p className="mt-1 text-sm font-semibold text-on-surface-variant">
                      Paste the role summary, responsibilities, or the full listing.
                    </p>
                  </div>

                  <label className="block space-y-2">
                    <textarea
                      value={form.jobDescription}
                      onChange={event => updateField('jobDescription', event.target.value)}
                      rows={7}
                      className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm leading-7 text-on-background outline-none transition focus:border-[#008f44]/30"
                      placeholder="Responsibilities, requirements, recruiter context, or the full job ad."
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[1.4rem] border border-black/6 bg-[linear-gradient(180deg,rgba(235,249,239,0.95),rgba(255,255,255,0.92))] p-5 shadow-[0_16px_40px_rgba(25,28,29,0.04)]">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#026d32]/65">
                      Notes & Follow-Up
                    </p>
                    <p className="text-sm font-semibold leading-7 text-on-surface-variant">
                      Store recruiter context, prep reminders, compensation notes, or interview next
                      steps without leaving the tracker.
                    </p>
                  </div>

                  <label className="mt-4 block space-y-2">
                    <textarea
                      value={form.notes}
                      onChange={event => updateField('notes', event.target.value)}
                      rows={10}
                      className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm leading-7 text-on-background outline-none transition focus:border-[#008f44]/30"
                      placeholder="Referral plan, recruiter name, compensation context, or interview prep notes."
                    />
                  </label>
                </div>

                <div className="rounded-[1.4rem] border border-black/6 bg-white/86 p-5 shadow-[0_16px_40px_rgba(25,28,29,0.04)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65">
                    Draft Safety
                  </p>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-on-surface-variant">
                    <p>Closing the dialog will keep your current draft.</p>
                    <p>Use <span className="font-black text-on-background">Reset fields</span> only when you want to clear everything intentionally.</p>
                    <p>Date inputs accept <span className="font-black text-on-background">DD/MM/YY</span> only.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {errorMessage ? <p className="px-6 pb-2 text-sm text-red-600">{errorMessage}</p> : null}

          <div className="flex flex-col gap-3 border-t border-black/5 bg-white/75 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center justify-center rounded-full border border-black/8 px-5 py-2.5 text-sm font-semibold text-on-surface transition-all hover:bg-black/5"
              >
                Close
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 transition-all hover:bg-rose-100"
              >
                Reset fields
              </button>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-black uppercase tracking-[0.14em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:opacity-70"
            >
              {submitting ? 'Adding…' : 'Add job'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
