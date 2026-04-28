import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BellRing,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  MapPin,
  Radar,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react'
import { DashboardSurface } from '@/components/layout/DashboardSurface'

const launchItems = [
  { label: 'Curated role feed', Icon: Search, tone: 'bg-emerald-600 text-white' },
  { label: 'Fit-first ranking', Icon: Target, tone: 'bg-sky-600 text-white' },
  { label: 'Smart role alerts', Icon: BellRing, tone: 'bg-amber-500 text-white' },
]

const previewJobs = [
  {
    title: 'Product Marketing Lead',
    company: 'Northstar AI',
    location: 'Remote',
    score: '92%',
    tone: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    title: 'Frontend Engineer',
    company: 'Luma Systems',
    location: 'New York',
    score: '86%',
    tone: 'text-sky-700 bg-sky-50 border-sky-200',
  },
  {
    title: 'Operations Manager',
    company: 'Atlas Health',
    location: 'Austin',
    score: '79%',
    tone: 'text-amber-700 bg-amber-50 border-amber-200',
  },
]

const readiness = [
  { label: 'Tracker sync', value: 'Live', Icon: CheckCircle2 },
  { label: 'Match scoring', value: 'Ready', Icon: ShieldCheck },
  { label: 'Role feed', value: 'Building', Icon: Clock3 },
]

export default function DashboardJobBoardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <DashboardSurface variant="default" className="p-0">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(236,253,245,0.9),rgba(255,255,255,0.86)_42%,rgba(239,246,255,0.78)_72%,rgba(255,251,235,0.76))]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#10b981,#0ea5e9,#f59e0b)]" />

        <div className="relative flex justify-center px-5 pt-5 sm:px-8 lg:px-10">
          <div className="group inline-flex items-center gap-3 rounded-[1.35rem] border border-zinc-950/10 bg-zinc-950 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_42px_rgba(15,23,42,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_56px_rgba(15,23,42,0.25)]">
            <Clock3 size={17} className="text-emerald-300 transition-transform duration-300 group-hover:rotate-12" strokeWidth={2.3} />
            Coming Soon
          </div>
        </div>

        <div className="relative grid min-h-[34rem] gap-8 px-5 pb-5 pt-6 sm:px-8 sm:pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(26rem,35rem)] lg:items-center lg:px-10 lg:pb-10">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/82 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-900 shadow-[0_12px_28px_rgba(16,185,129,0.1)] transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white">
              <Radar size={14} strokeWidth={2.3} />
              Job Board Beta
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-on-background sm:text-5xl">
                Job Board is coming soon.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-on-surface-variant">
                We are rebuilding discovery around role quality, resume fit, and saved pipeline activity so the board feels useful from the first search.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/jobs"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-3.5 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_18px_38px_rgba(15,23,42,0.18)] transition-all duration-300 hover:-translate-y-1 hover:bg-zinc-900 hover:shadow-[0_24px_48px_rgba(15,23,42,0.24)]"
              >
                Open tracker
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.2} />
              </Link>
              <Link
                href="/dashboard/match-score"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-black/8 bg-white/86 px-6 py-3.5 text-sm font-bold text-on-surface shadow-[0_14px_32px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_20px_44px_rgba(15,23,42,0.1)]"
              >
                Check resume fit
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {launchItems.map(({ label, Icon, tone }) => (
                <div
                  key={label}
                  className="group rounded-[1.15rem] border border-white/70 bg-white/78 px-4 py-4 shadow-[0_16px_36px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white hover:bg-white hover:shadow-[0_22px_48px_rgba(15,23,42,0.11)]"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${tone}`}>
                    <Icon size={16} strokeWidth={2.3} />
                  </div>
                  <p className="mt-3 text-sm font-black leading-5 text-on-background">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="group relative min-h-[31rem]">
            <div className="absolute inset-0 rounded-[2rem] border border-white/70 bg-white/66 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur-2xl transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_34px_82px_rgba(15,23,42,0.16)]" />
            <div className="relative flex min-h-[31rem] flex-col justify-between gap-5 p-4 sm:p-5">
              <div className="rounded-[1.5rem] border border-black/5 bg-zinc-950 p-4 text-white shadow-[0_20px_48px_rgba(15,23,42,0.18)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Preview</p>
                    <p className="mt-1 text-lg font-black tracking-tight">Ranked opportunities</p>
                  </div>
                  <BriefcaseBusiness size={20} className="text-emerald-300" strokeWidth={2.2} />
                </div>

                <div className="mt-4 space-y-2.5">
                  {previewJobs.map(job => (
                    <div key={job.title} className="rounded-[1rem] border border-white/10 bg-white/9 p-3 transition-all duration-300 hover:translate-x-1 hover:border-white/20 hover:bg-white/14">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-white">{job.title}</p>
                          <p className="mt-1 truncate text-xs text-white/58">{job.company}</p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-black ${job.tone}`}>
                          {job.score}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-white/52">
                        <MapPin size={12} strokeWidth={2.2} />
                        {job.location}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {readiness.map(({ label, value, Icon }) => (
                  <div key={label} className="group/status rounded-[1rem] border border-black/5 bg-white/86 px-3 py-3 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_34px_rgba(15,23,42,0.08)]">
                    <Icon size={15} className="text-primary transition-transform duration-300 group-hover/status:scale-110" strokeWidth={2.2} />
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">{label}</p>
                    <p className="mt-1 text-sm font-black text-on-background">{value}</p>
                  </div>
                ))}
              </div>

              <Image
                src="/job-board-coming-soon-mascot-v3.png"
                alt="Rezoomed mascot holding a job briefcase"
                width={720}
                height={944}
                priority
                sizes="(min-width: 1024px) 300px, 45vw"
                className="pointer-events-none absolute bottom-2 right-0 hidden h-[19rem] w-auto drop-shadow-[0_24px_40px_rgba(15,23,42,0.12)] transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-1 md:block lg:-right-2 lg:h-[21rem]"
              />
            </div>
          </div>
        </div>
      </DashboardSurface>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardSurface variant="subtle" className="group p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(15,23,42,0.09)]">
          <TrendingUp size={18} className="text-emerald-600 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.3} />
          <p className="mt-4 text-base font-black text-on-background">Quality over volume</p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            The feed is being tuned around stronger role signals instead of a long list of noisy postings.
          </p>
        </DashboardSurface>

        <DashboardSurface variant="subtle" className="group p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(15,23,42,0.09)]">
          <Target size={18} className="text-sky-600 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.3} />
          <p className="mt-4 text-base font-black text-on-background">Built around fit</p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Match Score will sit beside jobs so each role can be judged against the resume you plan to use.
          </p>
        </DashboardSurface>

        <DashboardSurface variant="subtle" className="group p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(15,23,42,0.09)]">
          <BellRing size={18} className="text-amber-600 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.3} />
          <p className="mt-4 text-base font-black text-on-background">Tracker stays active</p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Saved applications and manual job tracking remain available while the board is rebuilt.
          </p>
        </DashboardSurface>
      </div>
    </div>
  )
}
