import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ATSCheckerClient from '@/app/dashboard/(shell)/ats-checker/ATSCheckerClient'

function PublicATSPreview() {
  const checks = [
    { label: 'ATS parse rate', tone: 'bg-emerald-500' },
    { label: 'Keyword coverage', tone: 'bg-emerald-500' },
    { label: 'Formatting', tone: 'bg-amber-400' },
    { label: 'Section order', tone: 'bg-red-400' },
  ]

  return (
    <div className="relative mx-auto w-full max-w-[34rem] lg:mx-0">
      <div className="absolute -left-8 top-10 h-44 w-44 rounded-full bg-[#A3FFB3]/40 blur-3xl" />
      <div className="absolute -bottom-10 right-6 h-52 w-52 rounded-full bg-[#7dd3fc]/20 blur-3xl" />
      <div className="absolute inset-x-8 -bottom-8 h-16 rounded-full bg-[#026d32]/10 blur-2xl" />

      <div className="float-animation relative overflow-hidden rounded-[2rem] border border-white/75 bg-[linear-gradient(160deg,rgba(255,255,255,0.94),rgba(245,249,246,0.88))] p-4 shadow-[0_34px_80px_rgba(18,24,21,0.12)] backdrop-blur-2xl sm:p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.22),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(2,109,50,0.08),transparent_42%)]" />
        <div className="relative flex items-center justify-between border-b border-black/6 pb-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-container/35 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-on-primary-container">
            Live ATS preview
          </div>
          <div className="rounded-full border border-black/8 bg-white/86 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
            6 issues found
          </div>
        </div>

        <div className="relative mt-4 grid gap-4 md:grid-cols-[9.5rem_minmax(0,1fr)]">
          <div className="rounded-[1.5rem] border border-black/6 bg-white/88 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.8)]">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Resume score</p>
            <div className="relative mx-auto mt-4 flex h-24 w-24 items-center justify-center">
              <div className="ring-animation absolute inset-0 rounded-full border-4 border-[#A3FFB3]/60" />
              <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(2,109,50,0.1)" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke="#14b86b"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="289"
                  strokeDashoffset="49"
                />
              </svg>
              <div className="relative text-center">
                <div className="text-3xl font-black tracking-tight text-[#026d32]">92</div>
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">of 100</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {checks.map(check => (
                <div key={check.label} className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${check.tone} animate-pulse`} />
                  <span className="text-[11px] font-semibold text-on-surface-variant">{check.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.6rem] border border-[#dbe6dc] bg-[#edf3f3] p-4">
            <div className="scanning-animation" />
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-[#5d6f66]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#7ca6ff] shadow-[0_0_0_4px_rgba(124,166,255,0.12)]" />
                Content
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant shadow-sm">
                recruiter ready
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-[1.2rem] border border-[#d9e2dd] bg-white/92 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6b7d74]">ATS parse rate</span>
                  <span className="text-[11px] font-bold text-[#026d32]">95%</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#dfe5e4]">
                    <div className="shimmer-effect h-full w-[95%] rounded-full bg-[linear-gradient(90deg,#1fc47a,#7be7ac)]" />
                  </div>
                  <div className="h-2.5 rounded-full bg-[#e7ecea]" />
                  <div className="h-2.5 w-[82%] rounded-full bg-[#e7ecea]" />
                </div>
              </div>

              <div className="rounded-[1.2rem] border border-[#d9e2dd] bg-white/92 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6b7d74]">Keyword strength</span>
                  <span className="rounded-full bg-[#ecfff3] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#026d32]">
                    strong
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl bg-[#f5f8f7] px-3 py-2 text-xs font-semibold text-on-surface-variant">product strategy</div>
                  <div className="rounded-xl bg-[#f5f8f7] px-3 py-2 text-xs font-semibold text-on-surface-variant">stakeholder management</div>
                  <div className="rounded-xl bg-[#fff6e7] px-3 py-2 text-xs font-semibold text-[#946200]">missing metrics</div>
                  <div className="rounded-xl bg-[#fef0f0] px-3 py-2 text-xs font-semibold text-[#b33b3b]">summary too vague</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function PublicATSCheckerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard/ats-checker')
  }

  return (
    <div className="min-h-screen bg-background-landing text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
      <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-white/70 px-8 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl font-['Plus_Jakarta_Sans'] tracking-tight">
        <Link href="/" className="text-xl font-bold tracking-tighter text-zinc-900">
          Rezoomed
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-full border-2 border-transparent px-6 py-2 text-sm font-bold text-zinc-500 transition-all hover:bg-black hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center rounded-full border-2 border-primary-container bg-primary-container/10 px-6 py-2 text-sm font-bold text-primary-landing transition-all hover:bg-primary-container/20"
          >
            Create Account
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-28">
        <section className="relative overflow-hidden rounded-[2.75rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(241,247,243,0.88))] px-8 py-10 shadow-[0_32px_80px_rgba(18,24,21,0.08)] backdrop-blur-2xl sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.26),transparent_40%),radial-gradient(circle_at_center,rgba(123,211,252,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(2,109,50,0.08),transparent_36%)]" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(26rem,34rem)] lg:gap-14">
            <div className="max-w-2xl space-y-6">
              <span className="inline-flex items-center rounded-full border border-primary-container/50 bg-primary-container/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
                Resume checker
              </span>
              <div className="space-y-4">
                <h1 className="text-4xl font-black tracking-tight text-on-background sm:text-5xl lg:text-6xl">
                  Is your resume good enough?
                </h1>
                <p className="max-w-xl text-base leading-8 text-on-surface-variant sm:text-lg">
                  A free ATS score checker that catches parsing, keyword, structure, and recruiter-readability issues before your resume ever hits a rejection filter.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-on-surface-variant">
                <span className="rounded-full border border-black/8 bg-white/86 px-4 py-2 font-semibold">Free before signup</span>
                <span className="rounded-full border border-black/8 bg-white/86 px-4 py-2 font-semibold">PDF and DOCX supported</span>
                <span className="rounded-full border border-black/8 bg-white/86 px-4 py-2 font-semibold">Instant ATS feedback</span>
              </div>
            </div>

            <PublicATSPreview />
          </div>
        </section>

        <section className="mt-10">
          <ATSCheckerClient resumes={[]} profile={null} publicMode mode="ats" showIntro={false} />
        </section>
      </main>
    </div>
  )
}
