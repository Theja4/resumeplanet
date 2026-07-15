'use client'

import { useActionState, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  CreditCard,
  KeyRound,
  LifeBuoy,
  Loader2,
  LogOut,
  Mail,
  Sparkles,
} from 'lucide-react'
import { logout } from '@/app/dashboard/(shell)/actions'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import CancelSubscriptionButton from '@/components/billing/CancelSubscriptionButton'
import ManageSubscriptionButton from '@/components/billing/ManageSubscriptionButton'
import { Analytics } from '@/lib/analytics'
import { getAvatarColor, getInitials } from '@/lib/avatar'
import { clearWorkspaceSessionDrafts } from '@/lib/sessionDrafts'
import { updateProfileName, type UpdateNameState } from './actions'

interface AccountProfile {
  email: string
  full_name: string | null
  plan: 'free' | 'pro'
  payment_provider: string | null
  subscription_interval: 'monthly' | 'annual' | null
  current_period_end: string | null
  created_at: string
}

const INITIAL_NAME_STATE: UpdateNameState = { status: 'idle' }
const JOBPOSTED_ACCOUNT_URL =
  process.env.NEXT_PUBLIC_JOBPOSTED_ACCOUNT_URL || 'https://jobposted.app/dashboard/account'

function isJobPostedManagedProvider(provider: string | null) {
  return provider === 'jobposted' || provider?.startsWith('jobposted_') === true
}

function formatDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <DashboardSurface variant="default" className="p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-container/45 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-black tracking-tight text-on-background">{title}</h2>
          <p className="mt-0.5 text-sm text-on-surface-variant">{description}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </DashboardSurface>
  )
}

export default function AccountClient({
  profile,
  isPro,
}: {
  profile: AccountProfile
  isPro: boolean
}) {
  const [nameState, formAction, isSaving] = useActionState(updateProfileName, INITIAL_NAME_STATE)
  const [name, setName] = useState(profile.full_name ?? '')
  const [showRocket, setShowRocket] = useState(true)

  // The last successfully-saved value wins as the baseline; until then the
  // server-provided name is the source of truth.
  const savedName =
    nameState.status === 'success' && nameState.name ? nameState.name : profile.full_name ?? ''

  const displayName = savedName || profile.email.split('@')[0]
  const memberSince = formatDate(profile.created_at)
  const periodEnd = formatDate(profile.current_period_end)
  const trimmedName = name.trim()
  const isUnchanged = trimmedName === savedName.trim()

  const isJobPostedManaged = isJobPostedManagedProvider(profile.payment_provider)
  const isManualProAccess = isPro && profile.subscription_interval == null && !isJobPostedManaged
  const isRazorpay = profile.payment_provider === 'razorpay'
  const isPeriodBound = isPro && (isRazorpay || profile.payment_provider === 'polar')
  const canManagePortal = isPro && !isManualProAccess && !isRazorpay && !isJobPostedManaged
  const canCancel = isPro && !isManualProAccess && !isJobPostedManaged

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 md:space-y-7">
      <DashboardPageIntro
        kicker="Account"
        title="Account & billing"
        description="Manage your profile details, review your plan, and handle billing — all in one place."
        aside={
          <div className="flex items-center gap-4">
            <div
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border text-xl font-black uppercase ${getAvatarColor(profile.full_name, profile.email)}`}
            >
              {getInitials(profile.full_name, profile.email)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-black text-on-background">{displayName}</p>
              <p className="truncate text-sm text-on-surface-variant">{profile.email}</p>
              <span
                className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] ${
                  isPro
                    ? 'bg-primary-container/50 text-on-primary-container'
                    : 'bg-black/5 text-on-surface-variant'
                }`}
              >
                {isPro ? <Sparkles size={11} /> : null}
                {isPro ? 'Pro' : 'Free'}
              </span>
            </div>
          </div>
        }
      />

      {/* ─── Profile ─────────────────────────────────────────── */}
      <SectionCard
        icon={<Mail size={18} strokeWidth={2} />}
        title="Profile"
        description="Your name appears on your workspace and exports."
      >
        <form action={formAction} className="space-y-5">
          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant/70">
              Full name
            </span>
            <input
              name="full_name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              placeholder="Your name"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant/70">
              Email
            </span>
            <input
              value={profile.email}
              readOnly
              disabled
              className="w-full cursor-not-allowed rounded-2xl border border-black/5 bg-black/[0.03] px-4 py-3 text-sm text-on-surface-variant"
            />
            <span className="text-xs text-on-surface-variant/70">
              Email can&apos;t be changed here. Contact support to update it.
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isSaving || isUnchanged || !trimmedName}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : null}
              Save changes
            </button>
            {nameState.status === 'success' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <Check size={14} /> Saved
              </span>
            ) : null}
            {nameState.status === 'error' ? (
              <span className="text-xs font-bold text-red-600">{nameState.message}</span>
            ) : null}
          </div>
        </form>

        {memberSince ? (
          <p className="mt-5 border-t border-black/5 pt-4 text-xs text-on-surface-variant/70">
            Member since {memberSince}
          </p>
        ) : null}
      </SectionCard>

      {/* ─── Plan & billing ──────────────────────────────────── */}
      <SectionCard
        icon={<CreditCard size={18} strokeWidth={2} />}
        title="Plan & billing"
        description={isPro ? 'Your subscription and billing controls.' : 'Upgrade to unlock everything.'}
      >
        <div className="flex flex-col gap-5 rounded-[1.5rem] border border-black/5 bg-black/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-on-background">
                {isPro
                  ? `Pro ${profile.subscription_interval === 'annual' ? 'Annual' : profile.subscription_interval === 'monthly' ? 'Monthly' : ''}`.trim()
                  : 'Free plan'}
              </span>
              {isPro ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-container/50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-on-primary-container">
                  <Sparkles size={11} /> Active
                </span>
              ) : null}
            </div>
            <p className="text-sm text-on-surface-variant">
              {isJobPostedManaged
                ? 'Included through JobPosted. Manage billing from your JobPosted account.'
                : isManualProAccess
                ? 'Pro access is enabled on your account.'
                : isPro && isPeriodBound && periodEnd
                ? `Renews on ${periodEnd}.`
                : isPro
                ? 'Your Pro subscription is active.'
                : 'Limited scans and resume slots. Upgrade for unlimited access.'}
            </p>
          </div>

          {!isPro ? (
            <div className="flex shrink-0 items-center gap-4">
              {showRocket ? (
                <Image
                  src="/upgrade-pro-rocket.png"
                  alt=""
                  width={72}
                  height={96}
                  onError={() => setShowRocket(false)}
                  className="hidden h-24 w-auto object-contain sm:block"
                />
              ) : null}
              <Link
                href="/dashboard/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#026d32] px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#026d32]/20 transition-all hover:-translate-y-0.5 hover:bg-[#015623]"
              >
                <Sparkles size={14} /> Upgrade to Pro
              </Link>
            </div>
          ) : null}
        </div>

        {isPro && !isManualProAccess ? (
          <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            {isJobPostedManaged ? (
              <a
                href={JOBPOSTED_ACCOUNT_URL}
                className="flex items-center justify-center gap-2 rounded-full bg-[#026d32] px-7 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#026d32]/20 transition-all hover:-translate-y-0.5 hover:bg-[#015623]"
              >
                Open JobPosted billing <ArrowRight size={14} />
              </a>
            ) : null}
            {canManagePortal ? (
              <ManageSubscriptionButton
                provider={profile.payment_provider}
                className="flex items-center justify-center gap-2 rounded-full bg-[#026d32] px-7 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#026d32]/20 transition-all hover:-translate-y-0.5 hover:bg-[#015623]"
              />
            ) : null}
            {isRazorpay ? (
              <p className="text-xs text-on-surface-variant sm:max-w-xs">
                Plan changes aren&apos;t available here for this payment method. Use cancel to stop renewal.
              </p>
            ) : null}
            {canCancel ? (
              <div className="sm:ml-auto">
                <CancelSubscriptionButton provider={profile.payment_provider} />
              </div>
            ) : null}
          </div>
        ) : null}
      </SectionCard>

      {/* ─── Help ────────────────────────────────────────────── */}
      <SectionCard
        icon={<LifeBuoy size={18} strokeWidth={2} />}
        title="Help"
        description="Need a hand with billing, account access, or a product issue?"
      >
        <div className="flex flex-col gap-4 rounded-[1.5rem] border border-black/5 bg-white/80 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-bold text-on-background">Reach the Rezoomed team</p>
            <p className="max-w-xl text-sm leading-6 text-on-surface-variant">
              Tell us what happened and include the email on your account so we can help faster.
            </p>
          </div>
          <Link
            href="/dashboard/contact"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#026d32] px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#026d32]/20 transition-all hover:-translate-y-0.5 hover:bg-[#015623]"
          >
            Contact support
            <ArrowRight size={14} />
          </Link>
        </div>
      </SectionCard>

      {/* ─── Security ────────────────────────────────────────── */}
      <SectionCard
        icon={<KeyRound size={18} strokeWidth={2} />}
        title="Security"
        description="Update your password or securely sign out of your account."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/auth/forgot-password"
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-2.5 text-xs font-bold text-on-surface transition-all hover:-translate-y-0.5 hover:border-black/20"
          >
            Change password
            <ArrowRight size={14} />
          </Link>
          <form
            action={logout}
            onSubmit={() => {
              clearWorkspaceSessionDrafts()
              Analytics.reset()
            }}
          >
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-6 py-2.5 text-xs font-bold text-red-700 transition-all hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100"
            >
              <LogOut size={14} />
              Log out
            </button>
          </form>
        </div>
      </SectionCard>
    </div>
  )
}
