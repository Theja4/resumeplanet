import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Bell, BriefcaseBusiness, CalendarClock, Sparkles } from 'lucide-react'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'

export default function DashboardJobBoardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <DashboardPageIntro
        kicker="Job Board"
        title="Job Board is coming soon."
        description="We are rebuilding this workspace so saved roles, match scoring, and tracker updates work together cleanly before it returns."
        actions={
          <>
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
            >
              Open tracker
              <ArrowRight size={16} strokeWidth={2.2} />
            </Link>
            <Link
              href="/dashboard/match-score"
              className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/86 px-6 py-3 text-sm font-bold text-on-surface transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white"
            >
              Match Score
            </Link>
          </>
        }
        aside={
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Status</p>
            <p className="text-2xl font-black tracking-tight text-on-background">In progress</p>
            <p className="text-sm leading-6 text-on-surface-variant">
              Your tracker stays available while the board is being prepared.
            </p>
          </div>
        }
      />

      <DashboardSurface variant="default" className="p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,34rem)] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-container/50 bg-primary-container/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
              <CalendarClock size={14} strokeWidth={2.2} />
              Coming soon
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Role discovery', Icon: BriefcaseBusiness },
                { label: 'Smart alerts', Icon: Bell },
                { label: 'Resume fit', Icon: Sparkles },
              ].map(({ label, Icon }) => (
                <div key={label} className="rounded-[1.2rem] bg-white/78 px-4 py-3">
                  <Icon size={17} className="text-primary" strokeWidth={2.2} />
                  <p className="mt-3 text-sm font-bold leading-5 text-on-surface">{label}</p>
                </div>
              ))}
            </div>

            <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
              For now, use the tracker for saved applications and Match Score when you want to compare a resume against a job description.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[1.75rem] bg-primary-container/25">
            <Image
              src="/job-board-coming-soon-mascot-v2.jpg"
              alt="Rezoomed mascot exploring job opportunities"
              width={900}
              height={900}
              priority
              sizes="(min-width: 1024px) 544px, 100vw"
              className="h-auto w-full"
            />
          </div>
        </div>
      </DashboardSurface>
    </div>
  )
}
