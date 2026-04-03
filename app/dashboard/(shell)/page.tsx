import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AdBanner from '@/components/shared/AdBanner'
import type { Profile } from '@/types'
import { Upload, ClipboardCheck, LayoutDashboard, Rocket } from 'lucide-react'

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
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-primary font-bold text-sm tracking-widest uppercase">System Operational</span>
          <h2 className="text-4xl font-extrabold tracking-tighter text-on-surface mt-1">Welcome back, {firstName}</h2>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Resumes */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm group hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">Total Resumes</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-on-surface">{resumeCount}</span>
            <span className="text-xs text-primary font-bold">+1 this week</span>
          </div>
        </div>

        {/* Last ATS Score */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm group hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">Last ATS Score</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${lastScoreTone.valueClass}`}>{lastScore !== null ? `${lastScore}%` : '—'}</span>
            <span className={`text-xs font-semibold ${lastScoreTone.pillClass}`}>
              {lastScoreTone.label}
            </span>
          </div>
        </div>

        {/* Your Plan Card */}
        <div className="bg-primary p-6 rounded-xl shadow-lg shadow-primary/20 group relative overflow-hidden text-white/90">
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
        </div>
      </div>

      {/* Quick Actions Bento */}
      <div>
        <h3 className="text-lg font-bold text-on-surface mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Action Card 1: Upload */}
          <Link href="/dashboard/resumes" className="group relative bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
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
          <Link href="/dashboard/ats-checker" className="group relative bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container/0 to-primary-container/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 text-left">
              <div className="w-12 h-12 bg-primary-container/50 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <ClipboardCheck size={22} strokeWidth={1.75} />
              </div>
              <h4 className="text-xl font-bold mb-2">Check ATS Score</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">See how well your document parses through standard recruiting software.</p>
            </div>
          </Link>

          {/* Action Card 3: Template styling */}
          <Link href="/dashboard/templates" className="group relative bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container/0 to-primary-container/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 text-left">
              <div className="w-12 h-12 bg-primary-container/50 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <LayoutDashboard size={22} strokeWidth={1.75} />
              </div>
              <h4 className="text-xl font-bold mb-2">Customize Template</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">Fine-tune one flexible, recruiter-ready template with layout, typography, and color controls.</p>
            </div>
          </Link>

          {/* Action Card 4: Upgrade */}
          <Link href="/dashboard/pricing" className="group relative bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container/0 to-primary-container/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 text-left">
              <div className="w-12 h-12 bg-primary-container/50 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <Rocket size={22} strokeWidth={1.75} />
              </div>
              <h4 className="text-xl font-bold mb-2">Upgrade to Pro</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">Unlock unlimited AI optimization and premium export formats.</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Ad banner — free users only */}
      {!isPro && <AdBanner size="leaderboard" className="mx-auto" />}
    </div>
  )
}
