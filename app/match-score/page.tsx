import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Lock, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'

export default async function PublicMatchScorePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard/match-score')
  }

  return (
    <div className="min-h-screen bg-background-landing text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
      <PublicSiteHeader />

      <main className="mx-auto flex min-h-screen max-w-6xl items-center px-6 pb-20 pt-28">
        <div className="w-full rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.88))] p-8 shadow-[0_24px_60px_rgba(25,28,29,0.08)] backdrop-blur-2xl sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-container/50 bg-primary-container/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
                <Lock size={14} strokeWidth={2.2} />
                Pro workflow
              </span>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-on-background sm:text-5xl">
                  Match Score is available on Pro.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-on-surface-variant">
                  Compare your resume against a real job description, surface the biggest fit gaps, and decide whether a role is worth pursuing before you apply.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  'Measure resume-to-role fit instead of generic ATS hygiene.',
                  'See where your evidence is strong, partial, or missing.',
                  'Upgrade after signup to unlock the full workflow inside the dashboard.',
                ].map((bullet) => (
                  <div key={bullet} className="flex items-start gap-3 rounded-[1.2rem] bg-white/80 px-4 py-3">
                    <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" strokeWidth={2} />
                    <p className="text-sm leading-6 text-on-surface">{bullet}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-black/6 bg-white/84 p-5 shadow-[0_18px_45px_rgba(25,28,29,0.05)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Start here</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-on-background">Create your account first.</h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Match Score is unlocked from the dashboard after signup and Pro upgrade.
              </p>
              <div className="mt-5 space-y-3">
                <Link
                  href="/auth/register"
                  className="inline-flex w-full items-center justify-center rounded-full bg-zinc-950 px-4 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
                >
                  Create Account
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex w-full items-center justify-center rounded-full border border-black/8 bg-white px-4 py-3 text-sm font-semibold text-on-surface transition-all hover:-translate-y-0.5 hover:bg-white"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  )
}
