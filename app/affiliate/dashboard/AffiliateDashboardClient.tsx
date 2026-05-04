'use client'

import { useMemo, useState } from 'react'
import {
  BarChart3,
  Check,
  Copy,
  DollarSign,
  Info,
  Loader2,
  Mail,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import {
  buildAffiliateReferralLink,
  formatUsdCurrency,
} from '@/lib/affiliate'
import { maskEmailAddress } from '@/lib/utils'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type {
  Affiliate,
  AffiliateDashboardStats,
  AffiliatePayout,
} from '@/types'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function PayoutStatusBadge({ status }: { status: AffiliatePayout['status'] }) {
  const styles: Record<AffiliatePayout['status'], string> = {
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
    paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    rejected: 'border-rose-200 bg-rose-50 text-rose-700',
  }

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${styles[status]}`}>
      {status}
    </span>
  )
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  accent = false,
  labelAction,
}: {
  label: string
  value: string
  helper: string
  icon: LucideIcon
  accent?: boolean
  labelAction?: React.ReactNode
}) {
  return (
    <DashboardSurface
      variant={accent ? 'accent' : 'subtle'}
      className="dashboard-card-hover p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
              {label}
            </p>
            {labelAction}
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-on-background">
            {value}
          </p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            {helper}
          </p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] ${accent ? 'bg-white/85 text-primary shadow-[0_14px_26px_rgba(2,109,50,0.12)]' : 'bg-primary-container/45 text-primary'}`}>
          <Icon size={22} strokeWidth={2} />
        </div>
      </div>
    </DashboardSurface>
  )
}

function CopyBlock({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string
  value: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="rounded-[1.4rem] border border-black/6 bg-white/82 p-4 shadow-[0_16px_38px_rgba(25,28,29,0.04)]">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65">
        {label}
      </p>
      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1 rounded-[1rem] border border-black/6 bg-[#f9fbfa] px-4 py-3">
          <p className="truncate text-sm font-semibold text-on-background">{value}</p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-black/8 bg-white px-5 py-3 text-sm font-bold text-on-surface transition-all hover:-translate-y-0.5 hover:bg-black/[0.03]"
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

export default function AffiliateDashboardClient({
  initialAffiliate,
  initialStats,
  initialPayouts,
  appUrl,
}: {
  initialAffiliate: Affiliate
  initialStats: AffiliateDashboardStats
  initialPayouts: AffiliatePayout[]
  appUrl?: string
}) {
  const [affiliate, setAffiliate] = useState(initialAffiliate)
  const [stats, setStats] = useState(initialStats)
  const [payouts, setPayouts] = useState(initialPayouts)
  const [copiedKey, setCopiedKey] = useState<'code' | 'link' | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false)
  const [paypalEmail, setPaypalEmail] = useState(initialAffiliate.paypal_email ?? '')
  const [payoutError, setPayoutError] = useState<string | null>(null)
  const [submittingPayout, setSubmittingPayout] = useState(false)
  const [isEarningsInfoOpen, setIsEarningsInfoOpen] = useState(false)

  const referralLink = useMemo(
    () =>
      buildAffiliateReferralLink(
        typeof window === 'undefined' ? appUrl : window.location.origin,
        affiliate.discount_code
      ),
    [affiliate.discount_code, appUrl]
  )
  const pendingBelowMinimum = stats.pendingPayout < 10
  const normalizedPaypalEmail = paypalEmail.trim().toLowerCase()
  const isValidPaypalEmail = EMAIL_PATTERN.test(normalizedPaypalEmail)
  const chartMax = Math.max(...stats.monthlySignups.map(point => point.signups), 1)

  async function copyValue(value: string, key: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      window.setTimeout(() => {
        setCopiedKey(current => (current === key ? null : current))
      }, 1800)
    } catch {
      setCopiedKey(null)
    }
  }

  function openPayoutDialog() {
    setPaypalEmail(affiliate.paypal_email ?? '')
    setPayoutError(null)
    setIsPayoutDialogOpen(true)
  }

  async function submitPayoutRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isValidPaypalEmail) {
      setPayoutError('Enter a valid PayPal email address')
      return
    }

    setSubmittingPayout(true)
    setPayoutError(null)

    try {
      const response = await fetch('/api/affiliate/payout/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paypal_email: normalizedPaypalEmail,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | {
            success?: boolean
            error?: string
            message?: string
            pendingPayout?: number
            payout?: AffiliatePayout
          }
        | null

      if (!response.ok || !payload?.success || !payload.payout) {
        throw new Error(payload?.error ?? 'Could not create payout request')
      }

      setAffiliate(current => ({
        ...current,
        paypal_email: normalizedPaypalEmail,
      }))
      setStats(current => ({
        ...current,
        pendingPayout: payload.pendingPayout ?? 0,
      }))
      setPayouts(current => [payload.payout as AffiliatePayout, ...current])
      setSuccessMessage(payload.message ?? 'Payout request received.')
      setIsPayoutDialogOpen(false)
    } catch (error) {
      setPayoutError(error instanceof Error ? error.message : 'Could not create payout request')
    } finally {
      setSubmittingPayout(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <DashboardPageIntro
        kicker="Affiliate Program"
        title="See every referral, payout, and code-driven signup in one place."
        description="This workspace stays focused on attribution clarity: how many people signed up, which subscriptions are active, what your code is doing each month, and when your next payout can be requested."
        actions={
          <>
            <button
              type="button"
              onClick={() => copyValue(affiliate.discount_code, 'code')}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-zinc-900"
            >
              {affiliate.discount_code}
              {copiedKey === 'code' ? <Check size={15} /> : <Copy size={15} />}
            </button>
            <button
              type="button"
              onClick={() => copyValue(referralLink, 'link')}
              className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/86 px-6 py-3 text-sm font-bold text-on-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white"
            >
              {copiedKey === 'link' ? <Check size={15} /> : <Copy size={15} />}
              Copy referral link
            </button>
          </>
        }
        aside={
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[1.25rem] border border-black/6 bg-white/78 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65">
                Discount code
              </p>
              <p className="mt-2 text-lg font-black tracking-tight text-on-background">
                {affiliate.discount_code}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-black/6 bg-white/78 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65">
                Commission split
              </p>
              <p className="mt-2 text-lg font-black tracking-tight text-on-background">
                {affiliate.commission_percent}% commission
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {affiliate.discount_percent}% customer discount
              </p>
            </div>
          </div>
        }
      />

      {successMessage ? (
        <DashboardSurface variant="accent" className="px-5 py-4">
          <p className="text-sm font-semibold text-on-primary-container">{successMessage}</p>
        </DashboardSurface>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Signups"
          value={String(stats.totalSignups)}
          helper="Every referred subscription tied back to your code."
          icon={Users}
        />
        <StatCard
          label="Active Subscriptions"
          value={String(stats.activeSubscriptions)}
          helper="Live subscriptions currently contributing recurring revenue."
          icon={BarChart3}
        />
        <StatCard
          label="Total Earned (Approx.)"
          value={formatUsdCurrency(stats.totalEarned)}
          helper="Lifetime commissions recorded across completed billing events."
          icon={DollarSign}
          accent
          labelAction={
            <button
              type="button"
              onClick={() => setIsEarningsInfoOpen(true)}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-black/8 bg-white/75 text-on-surface-variant transition hover:bg-white"
              aria-label="Learn how approximate earnings are calculated"
            >
              <Info size={11} />
            </button>
          }
        />
        <StatCard
          label="Pending Payout"
          value={formatUsdCurrency(stats.pendingPayout)}
          helper="Commission available to request right now."
          icon={Wallet}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]">
        <DashboardSurface variant="default" className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65">
                Monthly Signups
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-on-background">
                Last 6 months
              </h2>
            </div>
            <div className="rounded-full border border-[#008f44]/16 bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#008f44]">
              Code performance
            </div>
          </div>

          <div className="mt-8 grid grid-cols-6 gap-3">
            {stats.monthlySignups.map(point => (
              <div key={point.monthKey} className="flex flex-col items-center gap-3">
                <div className="flex h-56 w-full items-end rounded-[1.35rem] border border-black/6 bg-[linear-gradient(180deg,rgba(248,249,250,0.96),rgba(236,246,240,0.92))] p-2">
                  <div
                    className="w-full rounded-[1rem] bg-[linear-gradient(180deg,#a3ffb3_0%,#026d32_100%)] shadow-[0_18px_32px_rgba(2,109,50,0.22)] transition-all"
                    style={{
                      height: `${Math.max((point.signups / chartMax) * 100, point.signups > 0 ? 16 : 6)}%`,
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-on-background">{point.signups}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant/60">
                    {point.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DashboardSurface>

        <DashboardSurface variant="default" className="space-y-4 p-5 sm:p-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65">
              Referral Assets
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-on-background">
              Share your code confidently.
            </h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Send the code on its own or share the full `rezoomed.com/CODE50` style link so attribution is captured immediately.
            </p>
          </div>

          <CopyBlock
            label="Discount code"
            value={affiliate.discount_code}
            copied={copiedKey === 'code'}
            onCopy={() => copyValue(affiliate.discount_code, 'code')}
          />

          <CopyBlock
            label="Referral link"
            value={referralLink}
            copied={copiedKey === 'link'}
            onCopy={() => copyValue(referralLink, 'link')}
          />
        </DashboardSurface>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <DashboardSurface variant="default" className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65">
                  Payouts
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-on-background">
                  {formatUsdCurrency(stats.pendingPayout)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  Available to request right now. Minimum payout is $10.00.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-primary-container/45 text-primary">
                <Wallet size={22} strokeWidth={2} />
              </div>
            </div>

            <div className="mt-5 rounded-[1.3rem] border border-black/6 bg-[linear-gradient(180deg,rgba(236,250,240,0.92),rgba(255,255,255,0.96))] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#026d32]/65">
                Saved PayPal
              </p>
              <p className="mt-2 text-sm font-semibold text-on-background">
                {affiliate.paypal_email ? maskEmailAddress(affiliate.paypal_email) : 'No PayPal email saved yet'}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={openPayoutDialog}
                disabled={pendingBelowMinimum}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-white"
              >
                <Mail size={15} />
                Request payout
              </button>
              {pendingBelowMinimum ? (
                <p className="text-sm text-amber-700">Minimum payout is $10.00</p>
              ) : (
                <p className="text-sm text-on-surface-variant">
                  Requests are processed to PayPal within 30 days.
                </p>
              )}
            </div>
          </DashboardSurface>

        <DashboardSurface variant="default" className="overflow-hidden">
          <div className="border-b border-black/5 px-5 py-5 sm:px-6">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65">
              Payout History
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-on-background">
              Requested payouts
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 bg-white/70">
                  <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65 sm:px-6">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65 sm:px-6">
                    PayPal
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65 sm:px-6">
                    Date Requested
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65 sm:px-6">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-sm text-on-surface-variant sm:px-6">
                      No payout requests yet.
                    </td>
                  </tr>
                ) : (
                  payouts.map(payout => (
                    <tr key={payout.id} className="border-b border-black/5 last:border-b-0">
                      <td className="px-5 py-4 font-semibold text-on-background sm:px-6">
                        {formatUsdCurrency(payout.amount)}
                      </td>
                      <td className="px-5 py-4 text-on-surface-variant sm:px-6">
                        {maskEmailAddress(payout.paypal_email)}
                      </td>
                      <td className="px-5 py-4 text-on-surface-variant sm:px-6">
                        {formatDate(payout.requested_at)}
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <PayoutStatusBadge status={payout.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardSurface>
      </div>

      <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
        <DialogContent className="max-w-lg rounded-[2rem] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(243,247,244,0.96))] p-0 shadow-[0_28px_70px_rgba(25,28,29,0.14)]">
          <form onSubmit={submitPayoutRequest}>
            <DialogHeader className="border-b border-black/5 px-6 py-6">
              <div className="inline-flex w-fit rounded-full bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#008f44]">
                Request payout
              </div>
              <DialogTitle className="pt-3 text-2xl font-black tracking-tight text-on-background">
                Send this payout to PayPal
              </DialogTitle>
              <DialogDescription className="max-w-xl text-sm leading-7 text-on-surface-variant">
                Your current request is for {formatUsdCurrency(stats.pendingPayout)}. Enter the PayPal email where the funds should be sent.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 px-6 py-6">
              <div className="rounded-[1.35rem] border border-black/6 bg-white/82 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65">
                  Payout amount
                </p>
                <p className="mt-2 text-3xl font-black tracking-tight text-on-background">
                  {formatUsdCurrency(stats.pendingPayout)}
                </p>
              </div>

              <label className="block space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/70">
                  PayPal email
                </span>
                <input
                  type="email"
                  value={paypalEmail}
                  onChange={event => setPaypalEmail(event.target.value)}
                  placeholder="name@paypal.com"
                  className="w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm font-medium text-on-background outline-none transition focus:border-[#008f44]/30"
                />
              </label>

              {payoutError ? (
                <p className="text-sm text-rose-600">{payoutError}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 border-t border-black/5 bg-white/75 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setIsPayoutDialogOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-black/8 px-5 py-2.5 text-sm font-semibold text-on-surface transition-all hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingPayout || !isValidPaypalEmail}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-black uppercase tracking-[0.14em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingPayout ? <Loader2 size={15} className="animate-spin" /> : null}
                {submittingPayout ? 'Submitting…' : 'Confirm request'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEarningsInfoOpen} onOpenChange={setIsEarningsInfoOpen}>
        <DialogContent className="max-w-lg rounded-[2rem] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(243,247,244,0.96))] p-0 shadow-[0_28px_70px_rgba(25,28,29,0.14)]">
          <div className="p-6">
            <DialogHeader className="gap-3">
              <div className="inline-flex w-fit rounded-full bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#008f44]">
                Earnings Estimate
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight text-on-background">
                Why this is approximate
              </DialogTitle>
              <DialogDescription className="text-sm leading-7 text-on-surface-variant">
                Earnings shown here are indicative. Final payout can vary slightly based on how exchange-rate normalization is finalized for affiliate commissions.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-5 rounded-[1.2rem] border border-black/6 bg-white/80 p-4 text-sm leading-7 text-on-surface-variant">
              This dashboard is designed to give you a strong estimate of your earnings in USD. If commission records involve multiple currencies, the display amount should be treated as indicative until payout calculations are finalized.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
