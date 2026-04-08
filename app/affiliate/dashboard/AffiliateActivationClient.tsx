'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Loader2, TicketPercent, Wallet } from 'lucide-react'
import { buildActivatedAffiliateCode } from '@/lib/affiliate'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const BASE_CODE_PATTERN = /^[A-Z0-9]{4,8}$/

export default function AffiliateActivationClient({
  displayName,
}: {
  displayName: string
}) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [baseCode, setBaseCode] = useState('')
  const [activationError, setActivationError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const normalizedBaseCode = baseCode.trim().toUpperCase()
  const finalCodePreview =
    normalizedBaseCode.length > 0 ? buildActivatedAffiliateCode(normalizedBaseCode) : 'CODE50'
  const isValidBaseCode = BASE_CODE_PATTERN.test(normalizedBaseCode)

  const activationSummary = useMemo(
    () => [
      {
        label: 'Your final code',
        value: finalCodePreview,
        helper: 'We append 50 automatically after your custom base and use it in your public link.',
        icon: TicketPercent,
      },
      {
        label: 'Customer discount',
        value: '50%',
        helper: 'Every signup using your code gets the same 50% offer.',
        icon: Check,
      },
      {
        label: 'Your commission',
        value: '50%',
        helper: 'Commission tracking starts as soon as subscriptions are attributed.',
        icon: Wallet,
      },
    ],
    [finalCodePreview]
  )

  async function handleActivate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isValidBaseCode) {
      setActivationError('Choose a 4 to 8 character code using only A-Z and 0-9.')
      return
    }

    setIsSubmitting(true)
    setActivationError(null)

    try {
      const response = await fetch('/api/affiliate/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base_code: normalizedBaseCode,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Could not activate your affiliate program.')
      }

      setIsDialogOpen(false)
      router.refresh()
    } catch (error) {
      setActivationError(
        error instanceof Error ? error.message : 'Could not activate your affiliate program.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <DashboardPageIntro
        kicker="Affiliate Program"
        title={`Activate your code, ${displayName}.`}
        description="Set your affiliate identity once, lock in your code format, and the referral dashboard will unlock immediately with the same workspace styling as the rest of your account."
        actions={
          <button
            type="button"
            onClick={() => {
              setActivationError(null)
              setIsDialogOpen(true)
            }}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-zinc-900"
          >
            Activate program
            <ArrowRight size={15} />
          </button>
        }
        aside={
          <div className="rounded-[1.35rem] border border-black/6 bg-white/78 px-4 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65">
              Code format
            </p>
            <p className="mt-2 text-2xl font-black tracking-tight text-on-background">
              BASE + 50
            </p>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Pick 4 to 8 characters in uppercase. Rezoomed appends <span className="font-black text-on-background">50</span> automatically, so your shareable URL becomes <span className="font-black text-on-background">rezoomed.com/CODE50</span>.
            </p>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {activationSummary.map(({ label, value, helper, icon: Icon }) => (
          <DashboardSurface key={label} variant="subtle" className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
                  {label}
                </p>
                <p className="mt-3 text-3xl font-black tracking-tight text-on-background">
                  {value}
                </p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  {helper}
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] bg-primary-container/45 text-primary">
                <Icon size={22} strokeWidth={2} />
              </div>
            </div>
          </DashboardSurface>
        ))}
      </div>

      <DashboardSurface variant="default" className="p-6 sm:p-7">
        <div className="max-w-3xl space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65">
            Before you activate
          </p>
          <h2 className="text-2xl font-black tracking-tight text-on-background">
            Choose a code you actually want to share.
          </h2>
          <p className="text-sm leading-7 text-on-surface-variant">
            This becomes the public code people use during checkout and the path on your shareable link. Keep it short, memorable, and brand-aligned. Once activated, the affiliate dashboard switches from setup mode into live earnings and referral reporting.
          </p>
        </div>
      </DashboardSurface>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg rounded-[2rem] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(243,247,244,0.96))] p-0 shadow-[0_28px_70px_rgba(25,28,29,0.14)]">
          <form onSubmit={handleActivate}>
            <DialogHeader className="border-b border-black/5 px-6 py-6">
              <div className="inline-flex w-fit rounded-full bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#008f44]">
                Activate affiliate program
              </div>
              <DialogTitle className="pt-3 text-2xl font-black tracking-tight text-on-background">
                Pick your base code
              </DialogTitle>
              <DialogDescription className="max-w-xl text-sm leading-7 text-on-surface-variant">
                Enter 4 to 8 uppercase characters. We will append <span className="font-black text-on-background">50</span> automatically, create the matching discount in Paddle, and unlock your affiliate dashboard.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 px-6 py-6">
              <label className="block space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/70">
                  Base code
                </span>
                <input
                  value={baseCode}
                  onChange={event => {
                    setBaseCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))
                    if (activationError) {
                      setActivationError(null)
                    }
                  }}
                  placeholder="JACK"
                  className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-on-background outline-none transition focus:border-[#008f44]/30"
                />
              </label>

              <div className="rounded-[1.35rem] border border-black/6 bg-white/82 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65">
                  Final affiliate code
                </p>
                <p className="mt-2 text-3xl font-black tracking-tight text-on-background">
                  {finalCodePreview}
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Share as `www.rezoomed.com/{finalCodePreview}`
                </p>
              </div>

              {activationError ? (
                <p className="text-sm text-rose-600">{activationError}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 border-t border-black/5 bg-white/75 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-black/8 px-5 py-2.5 text-sm font-semibold text-on-surface transition-all hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isValidBaseCode}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-black uppercase tracking-[0.14em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : null}
                {isSubmitting ? 'Activating…' : 'Activate'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
