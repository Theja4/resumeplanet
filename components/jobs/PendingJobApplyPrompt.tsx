'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  PENDING_JOB_APPLY_COOKIE,
  clearCookie,
  parsePendingApplyCookie,
  readCookie,
} from '@/lib/jobs/shared'
import type { PendingJobApplyPayload } from '@/lib/jobs/types'

export default function PendingJobApplyPrompt() {
  const [pendingApply, setPendingApply] = useState<PendingJobApplyPayload | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const cookieValue = readCookie(PENDING_JOB_APPLY_COOKIE)
    const parsed = parsePendingApplyCookie(cookieValue)

    if (!parsed && cookieValue) {
      clearCookie(PENDING_JOB_APPLY_COOKIE)
      return
    }

    if (!parsed) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      setPendingApply(parsed)
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [])

  const isOpen = Boolean(pendingApply)
  const companyLabel = useMemo(() => pendingApply?.companyName ?? 'this company', [pendingApply])

  function dismissPrompt() {
    clearCookie(PENDING_JOB_APPLY_COOKIE)
    setPendingApply(null)
    setMessage(null)
  }

  async function confirmApplication() {
    if (!pendingApply) return

    setSubmitting(true)
    setMessage(null)

    const response = await fetch('/api/jobs/tracker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobId: pendingApply.jobId,
        status: 'applied',
      }),
    })

    if (response.status === 401) {
      window.location.assign('/auth/login')
      return
    }

    const payload = (await response.json().catch(() => null)) as
      | { success?: boolean; error?: string }
      | null

    if (!response.ok || !payload?.success) {
      if (payload?.error === 'TRACKER_LIMIT_REACHED') {
        setMessage('Your tracker is full on the current plan. Upgrade to keep tracking more jobs.')
      } else {
        setMessage('We could not update your tracker right now.')
      }
      setSubmitting(false)
      return
    }

    dismissPrompt()
    window.location.assign('/dashboard/jobs?status=applied')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && dismissPrompt()}>
      <DialogContent className="max-w-md rounded-[1.8rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(243,247,244,0.96))] p-0 shadow-[0_28px_70px_rgba(25,28,29,0.14)]">
        <DialogHeader className="px-6 pt-6">
          <div className="inline-flex w-fit rounded-full bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#008f44]">
            Job Tracker
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight text-on-background">
            Did you apply to {companyLabel}?
          </DialogTitle>
          <DialogDescription className="text-sm leading-7 text-on-surface-variant">
            If you already submitted the application, we can add the role straight into your tracker as
            an applied job.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-4">
          <div className="rounded-[1.4rem] border border-[#008f44]/12 bg-[#008f44]/5 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#008f44]">
              {pendingApply?.title}
            </p>
            <p className="mt-2 text-sm font-semibold text-on-background">{pendingApply?.companyName}</p>
          </div>
          {message ? <p className="mt-4 text-sm text-red-600">{message}</p> : null}
        </div>

        <DialogFooter className="border-t border-black/5 bg-white/60 px-6 py-5 sm:justify-between">
          <button
            type="button"
            onClick={dismissPrompt}
            className="inline-flex items-center justify-center rounded-full border border-black/8 px-5 py-2.5 text-sm font-semibold text-on-surface transition-all hover:bg-black/5"
          >
            Not yet
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={pendingApply ? `/jobs/${pendingApply.slug}` : '/jobs'}
              className="inline-flex items-center justify-center rounded-full border border-[#008f44]/16 px-5 py-2.5 text-sm font-semibold text-[#008f44] transition-all hover:bg-[#008f44]/6"
            >
              Review job
            </Link>
            <button
              type="button"
              onClick={confirmApplication}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-black uppercase tracking-[0.14em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:opacity-70"
            >
              {submitting ? 'Saving…' : 'Yes, add it'}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
