import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AdBanner from '@/components/shared/AdBanner'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import type { Profile } from '@/types'
import { Upload, ClipboardCheck, BriefcaseBusiness, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

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

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [profileResult, resumesResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('resumes')
      .select('id, ats_score, updated_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
  ])

  const profile = profileResult.data as Profile | null
  const resumeCount = resumesResult.count ?? 0
  const lastScore =
    resumesResult.data?.find(resume => typeof resume.ats_score === 'number')?.ats_score ?? null
  const lastScoreTone = scoreTone(lastScore)

  const isPro = profile?.plan === 'pro'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-8 max-w-6xl mx-auto w-full">
      <DashboardPageIntro
        kicker="Workspace Overview"
        title={`Welcome back, ${firstName}.`}
        description="Keep the momentum from landing page to dashboard. Track resume versions, latest ATS momentum, and the next highest-value action from one calmer control room."
        actions={
          <>
            <Link
              href="/dashboard/resumes"
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-zinc-900"
            >
              Open Library
            </Link>
            <Link
              href="/dashboard/ats-checker"
              className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/86 px-6 py-3 text-sm font-bold text-on-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white"
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
              {isPro ? 'Unlimited scans' : `${Math.max(0, 3 - resumeCount)} resume slots left`}
            </p>
            <p className="text-sm leading-6 text-on-surface-variant">
              {isPro
                ? 'Your premium workspace is unlocked across ATS analysis, exports, and tailoring tools.'
                : 'Upgrade when you want unlimited resume storage, scans, and advanced AI analysis.'}
            </p>
          </div>
        }
      />

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Resumes */}
        <DashboardSurface variant="subtle" className="dashboard-card-hover p-6">
          <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">Total Resumes</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-on-surface">{resumeCount}</span>
            <span className="text-xs text-primary font-bold">+1 this week</span>
          </div>
        </DashboardSurface>

        {/* Last ATS Score */}
        <DashboardSurface variant="subtle" className="dashboard-card-hover p-6">
          <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">Last ATS Score</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${lastScoreTone.valueClass}`}>{lastScore !== null ? `${lastScore}%` : '—'}</span>
            <span className={`text-xs font-semibold ${lastScoreTone.pillClass}`}>
              {lastScoreTone.label}
            </span>
          </div>
        </DashboardSurface>

        {/* Your Plan Card */}
        <DashboardSurface variant="dark" className="dashboard-card-hover p-6 text-white/90">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
          <p className="text-xs font-bold text-primary-container uppercase tracking-widest">Your Plan</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-black text-white capitalize">{profile?.plan ?? 'Free'}</span>
            {!isPro && (
              <Link
                href="/dashboard/pricing"
                className="px-3 py-1 bg-white text-primary text-xs font-bold rounded-lg hover:scale-105 active:scale-95 transition-transform"
              >
                Upgrade
              </Link>
            )}
          </div>
        </DashboardSurface>
      </div>

      {/* Quick Actions Bento */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-on-surface">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Action Card 1: Upload */}
          <Link href="/dashboard/resumes" className="dashboard-card-hover group relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.9))] p-8 shadow-[0_20px_50px_rgba(25,28,29,0.06)] transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container/0 to-primary-container/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 text-left">
              <div className="w-12 h-12 bg-primary-container/50 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <Upload size={22} strokeWidth={1.75} />
              </div>
              <h4 className="text-xl font-bold mb-2">Upload Resume</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">Instantly analyze your current resume with our advanced AI engine.</p>
            </div>
          </Link>

          {/* Action Card 2: ATS */}
          <Link href="/dashboard/ats-checker" className="dashboard-card-hover group relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.9))] p-8 shadow-[0_20px_50px_rgba(25,28,29,0.06)] transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container/0 to-primary-container/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 text-left">
              <div className="w-12 h-12 bg-primary-container/50 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <ClipboardCheck size={22} strokeWidth={1.75} />
              </div>
              <h4 className="text-xl font-bold mb-2">Check ATS Score</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">See how well your document parses through standard recruiting software.</p>
            </div>
          </Link>

          {/* Action Card 3: Job Tracker */}
          <Link href="/dashboard/jobs" className="dashboard-card-hover group relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.9))] p-8 shadow-[0_20px_50px_rgba(25,28,29,0.06)] transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container/0 to-primary-container/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 text-left">
              <div className="w-12 h-12 bg-primary-container/50 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <BriefcaseBusiness size={22} strokeWidth={1.75} />
              </div>
              <h4 className="text-xl font-bold mb-2">Open Job Tracker</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">Move saved applications through your pipeline and keep every role tied back to your resume workflow.</p>
            </div>
          </Link>

          {/* Action Card 4: Job Board */}
          <Link href="/dashboard/job-board" className="dashboard-card-hover group relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.9))] p-8 shadow-[0_20px_50px_rgba(25,28,29,0.06)] transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container/0 to-primary-container/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 text-left">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container/50 text-primary group-hover:scale-110 transition-transform">
                  <Search size={22} strokeWidth={1.75} />
                </div>
                <span className="inline-flex rounded-full border border-[#008f44]/16 bg-[#008f44]/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#008f44]">
                  Beta
                </span>
              </div>
              <h4 className="text-xl font-bold mb-2">Browse Job Board</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">Search live openings from connected sources and push the best ones straight into your tracker.</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Ad banner — free users only */}
      {!isPro && <AdBanner size="leaderboard" className="mx-auto" />}
    </div>
  )
}
