'use client'

import type { ReactNode } from 'react'
import { startTransition, useEffect, useState } from 'react'
import Link from 'next/link'
import { BriefcaseBusiness, ClipboardCheck, Search, Upload, Wallet } from 'lucide-react'
import AdBanner from '@/components/shared/AdBanner'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import type { DashboardOverview, Profile } from '@/types'

function scoreTone(score: number | null) {
  if (score === null) {
    return {
      valueClass: 'text-on-surface',
      pillClass: 'text-on-surface-variant',
      label: 'Run your first scan',
    }
  }

  if (score < 50) {
    return {
      valueClass: 'text-red-600',
      pillClass: 'text-red-700',
      label: 'Needs attention',
    }
  }

  if (score < 70) {
    return {
      valueClass: 'text-amber-600',
      pillClass: 'text-amber-700',
      label: 'Keep improving',
    }
  }

  return {
    valueClass: 'text-emerald-700',
    pillClass: 'text-emerald-700',
    label: 'Top range',
  }
}

function ActionCard({
  href,
  title,
  description,
  icon,
  badge,
}: {
  href: string
  title: string
  description: string
  icon: ReactNode
  badge?: ReactNode
}) {
  return (
    <Link
      href={href}
      className="dashboard-card-hover group relative overflow-hidden rounded-[1.4rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.9))] p-5 shadow-[0_16px_36px_rgba(25,28,29,0.06)] transition-all duration-300 hover:-translate-y-1 sm:rounded-[1.75rem] sm:p-8 sm:shadow-[0_20px_50px_rgba(25,28,29,0.06)]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-container/0 to-primary-container/10 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative z-10 text-left">
        {badge ? <div className="mb-4 flex items-center gap-3 sm:mb-6">{badge}</div> : null}
        {!badge ? icon : null}
        <h4 className="mb-1.5 text-lg font-bold sm:mb-2 sm:text-xl">{title}</h4>
        <p className="text-[13px] leading-relaxed text-on-surface-variant sm:text-sm">{description}</p>
      </div>
    </Link>
  )
}

function StatCard({
  label,
  value,
  helper,
  accent = false,
  loading = false,
  valueClassName,
  helperClassName,
}: {
  label: string
  value: string
  helper: string
  accent?: boolean
  loading?: boolean
  valueClassName?: string
  helperClassName?: string
}) {
  return (
    <DashboardSurface
      variant={accent ? 'dark' : 'subtle'}
      className="dashboard-card-hover p-5 sm:p-6"
    >
      <p className={`text-xs font-bold uppercase tracking-widest ${accent ? 'text-primary-container' : 'text-on-surface-variant/60'}`}>
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={`text-2xl font-black sm:text-3xl ${accent ? 'text-white' : 'text-on-surface'} ${valueClassName ?? ''} ${loading ? 'opacity-60' : ''}`.trim()}
        >
          {value}
        </span>
        <span className={`text-xs font-semibold ${accent ? 'text-primary-container' : helperClassName ?? 'text-primary'}`}>
          {helper}
        </span>
      </div>
    </DashboardSurface>
  )
}

export default function DashboardHomeClient({
  profile,
}: {
  profile: Profile
}) {
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [overviewError, setOverviewError] = useState<string | null>(null)
  const [isLoadingOverview, setIsLoadingOverview] = useState(true)

  const isPro = profile.plan === 'pro'
  const firstName = profile.full_name?.split(' ')[0] ?? 'there'
  const lastScore = overview?.lastScore ?? null
  const lastScoreTone = scoreTone(lastScore)
  const resumeCount = overview?.resumeCount ?? null
  const affiliateStatus = overview?.hasAffiliate
  const remainingResumeSlots =
    resumeCount === null ? null : Math.max(0, 3 - resumeCount)

  useEffect(() => {
    const controller = new AbortController()

    async function loadOverview() {
      try {
        const response = await fetch('/api/dashboard/overview', {
          cache: 'no-store',
          signal: controller.signal,
        })
        const payload = (await response.json().catch(() => null)) as
          | (DashboardOverview & { success?: boolean; error?: string })
          | null

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error ?? 'Could not load dashboard overview')
        }

        startTransition(() => {
          setOverview({
            resumeCount: payload.resumeCount,
            lastScore: payload.lastScore,
            hasAffiliate: payload.hasAffiliate,
          })
          setOverviewError(null)
        })
      } catch (error) {
        if (!controller.signal.aborted) {
          setOverviewError(error instanceof Error ? error.message : 'Could not load dashboard overview')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingOverview(false)
        }
      }
    }

    void loadOverview()

    return () => {
      controller.abort()
    }
  }, [])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 md:space-y-8">
      <DashboardPageIntro
        kicker="Workspace Overview"
        title={`Welcome back, ${firstName}.`}
        description="Keep the momentum from landing page to dashboard. Track resume versions, latest ATS momentum, and the next highest-value action from one calmer control room."
        actions={
          <>
            <Link
              href="/dashboard/resumes"
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-zinc-900 sm:px-6 sm:py-3 sm:text-sm sm:tracking-[0.16em]"
            >
              Open Library
            </Link>
            <Link
              href="/dashboard/ats-checker"
              className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/86 px-5 py-2.5 text-xs font-bold text-on-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white sm:px-6 sm:py-3 sm:text-sm"
            >
              Run ATS Scan
            </Link>
          </>
        }
        aside={
          <div className="space-y-2.5">
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isPro ? 'text-primary' : 'text-primary/80'}`}>
              {isPro ? 'Pro access active' : 'Free plan active'}
            </p>
            <p className="text-2xl font-black tracking-tight text-on-background">
              {isPro
                ? 'Unlimited scans'
                : remainingResumeSlots === null
                ? 'Resume usage loading'
                : `${remainingResumeSlots} resume slots left`}
            </p>
            <p className="text-sm leading-6 text-on-surface-variant">
              {isPro
                ? 'Your premium workspace is unlocked across ATS analysis, exports, and tailoring tools.'
                : 'Upgrade when you want unlimited resume storage, scans, and advanced AI analysis.'}
            </p>
            {overviewError ? (
              <p className="text-xs font-medium text-amber-700">
                Recent dashboard stats will appear once the connection settles.
              </p>
            ) : null}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard
          label="Total Resumes"
          value={resumeCount === null ? '—' : String(resumeCount)}
          helper={
            isLoadingOverview
              ? 'Loading saved resumes'
              : overviewError
              ? 'Temporarily unavailable'
              : 'Across your workspace'
          }
          loading={isLoadingOverview}
        />

        <StatCard
          label="Last ATS Score"
          value={lastScore !== null ? `${lastScore}%` : '—'}
          helper={
            isLoadingOverview
              ? 'Checking latest scan'
              : overviewError
              ? 'Temporarily unavailable'
              : lastScoreTone.label
          }
          valueClassName={lastScore !== null ? lastScoreTone.valueClass : undefined}
          helperClassName={lastScore !== null ? lastScoreTone.pillClass : 'text-on-surface-variant'}
          loading={isLoadingOverview}
        />

        <StatCard
          label="Your Plan"
          value={profile.plan}
          helper={isPro ? 'Premium workspace unlocked' : 'Upgrade for unlimited access'}
          accent
        />
      </div>

      <div>
        <h3 className="mb-3 text-base font-bold text-on-surface sm:mb-4 sm:text-lg">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <ActionCard
            href="/dashboard/resumes"
            title="Upload Resume"
            description="Instantly analyze your current resume with our advanced AI engine."
            icon={
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-container/50 text-primary transition-transform group-hover:scale-110 sm:mb-6 sm:h-12 sm:w-12">
                <Upload size={22} strokeWidth={1.75} />
              </div>
            }
          />

          <ActionCard
            href="/dashboard/ats-checker"
            title="Check ATS Score"
            description="See how well your document parses through standard recruiting software."
            icon={
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-container/50 text-primary transition-transform group-hover:scale-110 sm:mb-6 sm:h-12 sm:w-12">
                <ClipboardCheck size={22} strokeWidth={1.75} />
              </div>
            }
          />

          <ActionCard
            href="/dashboard/jobs"
            title="Open Job Tracker"
            description="Move saved applications through your pipeline and keep every role tied back to your resume workflow."
            icon={
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-container/50 text-primary transition-transform group-hover:scale-110 sm:mb-6 sm:h-12 sm:w-12">
                <BriefcaseBusiness size={22} strokeWidth={1.75} />
              </div>
            }
          />

          <ActionCard
            href="/dashboard/job-board"
            title="Browse Job Board"
            description="Search live openings from connected sources and push the best ones straight into your tracker."
            icon={
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-container/50 text-primary transition-transform group-hover:scale-110 sm:h-12 sm:w-12">
                <Search size={22} strokeWidth={1.75} />
              </div>
            }
            badge={
              <>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-container/50 text-primary transition-transform group-hover:scale-110 sm:h-12 sm:w-12">
                  <Search size={22} strokeWidth={1.75} />
                </div>
                <span className="inline-flex rounded-full border border-[#008f44]/16 bg-[#008f44]/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#008f44]">
                  Beta
                </span>
              </>
            }
          />

          <ActionCard
            href="/affiliate/dashboard"
            title={
              affiliateStatus === true
                ? 'Affiliate Dashboard'
                : affiliateStatus === false
                ? 'Activate Affiliate'
                : 'Affiliate Program'
            }
            description={
              affiliateStatus === true
                ? 'Review referrals, copy your code, and request payouts from the same workspace shell.'
                : affiliateStatus === false
                ? 'Create your code once, unlock the affiliate area, and start tracking referrals and earnings.'
                : 'Open your referral workspace and finish setup once the latest account state loads.'
            }
            icon={
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-container/50 text-primary transition-transform group-hover:scale-110 sm:mb-6 sm:h-12 sm:w-12">
                <Wallet size={22} strokeWidth={1.75} />
              </div>
            }
          />
        </div>
      </div>

      {!isPro ? <AdBanner size="leaderboard" className="mx-auto" /> : null}
    </div>
  )
}
