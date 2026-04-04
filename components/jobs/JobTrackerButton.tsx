'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import type { TrackedJobStatus } from '@/types'

interface JobTrackerButtonProps {
  jobId: string
  initialStatus?: TrackedJobStatus | null
  className?: string
}

export default function JobTrackerButton({
  jobId,
  initialStatus = null,
  className,
}: JobTrackerButtonProps) {
  const [status, setStatus] = useState<TrackedJobStatus | null>(initialStatus)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleTrack() {
    if (status) {
      return
    }

    setErrorMessage(null)

    startTransition(async () => {
      const response = await fetch('/api/jobs/tracker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          status: 'saved',
        }),
      })

      if (response.status === 401) {
        window.location.assign('/auth/login')
        return
      }

      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; trackedJob?: { status: TrackedJobStatus }; error?: string }
        | null

      if (!response.ok || !payload?.success || !payload.trackedJob) {
        if (payload?.error === 'TRACKER_LIMIT_REACHED') {
          window.location.assign('/dashboard/pricing')
          return
        }

        setErrorMessage('Could not save this job right now.')
        return
      }

      setStatus(payload.trackedJob.status)
    })
  }

  const buttonLabel =
    status === 'applied' ? 'Applied' : status ? 'Saved to Tracker' : 'Save to Tracker'

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleTrack}
        disabled={isPending || Boolean(status)}
        className={cn(
          'inline-flex items-center justify-center rounded-full border px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] transition-all',
          status
            ? 'border-[#008f44]/18 bg-[#008f44]/10 text-[#008f44]'
            : 'border-white/70 bg-white/92 text-on-background hover:-translate-y-0.5 hover:border-[#008f44]/28 hover:text-[#008f44]',
          className
        )}
      >
        {isPending ? 'Saving…' : buttonLabel}
      </button>
      {errorMessage ? <p className="text-xs text-red-600">{errorMessage}</p> : null}
    </div>
  )
}
