import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AdBanner from '@/components/shared/AdBanner'
import { getRemainingFreeScans } from '@/lib/planUtils'
import type { Profile } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [profileResult, resumesResult, scoresResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('resumes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase
      .from('ats_scores')
      .select('score')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const profile = profileResult.data as Profile | null
  const resumeCount = resumesResult.count ?? 0
  const recentScores = scoresResult.data ?? []
  const avgScore =
    recentScores.length > 0
      ? Math.round(recentScores.reduce((sum, s) => sum + s.score, 0) / recentScores.length)
      : null

  const isPro = profile?.plan === 'pro'
  const scansLeft = getRemainingFreeScans(profile)
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {isPro ? 'Pro plan — full access enabled.' : `Free plan · ${scansLeft} ATS scan${scansLeft !== 1 ? 's' : ''} remaining today.`}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Resumes</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{resumeCount}</p>
          <Link href="/dashboard/resumes" className="mt-2 inline-block text-xs text-indigo-600 hover:underline">
            Manage →
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg ATS Score</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {avgScore !== null ? `${avgScore}` : '—'}
          </p>
          <Link href="/dashboard/ats-checker" className="mt-2 inline-block text-xs text-indigo-600 hover:underline">
            Run scan →
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Plan</p>
          <p className="text-3xl font-bold text-gray-900 mt-2 capitalize">{profile?.plan ?? 'Free'}</p>
          {!isPro && (
            <Link href="/dashboard/billing" className="mt-2 inline-block text-xs text-indigo-600 hover:underline">
              Upgrade →
            </Link>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/dashboard/resumes"
            className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <span className="text-2xl">📄</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">Upload Resume</p>
              <p className="text-xs text-gray-500">Add a new PDF or DOCX</p>
            </div>
          </Link>
          <Link
            href="/dashboard/ats-checker"
            className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <span className="text-2xl">🎯</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">Check ATS Score</p>
              <p className="text-xs text-gray-500">Analyse against a job description</p>
            </div>
          </Link>
          <Link
            href="/dashboard/templates"
            className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <span className="text-2xl">✨</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">Resume Templates</p>
              <p className="text-xs text-gray-500">{isPro ? 'Browse all templates' : 'Pro templates available'}</p>
            </div>
          </Link>
          {!isPro && (
            <Link
              href="/dashboard/billing"
              className="flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 px-5 py-4 hover:border-indigo-400 hover:shadow-sm transition-all"
            >
              <span className="text-2xl">⚡</span>
              <div>
                <p className="text-sm font-semibold text-indigo-900">Upgrade to Pro</p>
                <p className="text-xs text-indigo-600">Unlimited scans + AI optimiser</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Ad banner — free users only */}
      <AdBanner size="leaderboard" className="mx-auto" />
    </div>
  )
}
