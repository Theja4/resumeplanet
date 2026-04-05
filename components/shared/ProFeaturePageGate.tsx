import Link from 'next/link'
import { ArrowRight, Lock, Sparkles } from 'lucide-react'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'

interface ProFeaturePageGateProps {
  feature: string
  title: string
  description: string
  bullets: string[]
  analyticsLocation: string
}

export default function ProFeaturePageGate({
  feature,
  title,
  description,
  bullets,
  analyticsLocation,
}: ProFeaturePageGateProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <DashboardPageIntro
        kicker="Pro Access"
        title={title}
        description={description}
        aside={
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Upgrade required</p>
            <p className="text-lg font-black leading-tight text-on-background">
              This workflow is available on Pro.
            </p>
            <p className="text-sm leading-6 text-on-surface-variant">
              Upgrade to Pro from the pricing page, then complete checkout through Paddle there.
            </p>
          </div>
        }
      />

      <DashboardSurface variant="default" className="p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-container/50 bg-primary-container/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
              <Lock size={14} strokeWidth={2.2} />
              {feature}
            </div>
            <div className="space-y-3">
              {bullets.map((bullet) => (
                <div key={bullet} className="flex items-start gap-3 rounded-[1.2rem] bg-white/78 px-4 py-3">
                  <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" strokeWidth={2} />
                  <p className="text-sm leading-6 text-on-surface">{bullet}</p>
                </div>
              ))}
            </div>
          </div>

          <DashboardSurface variant="subtle" className="p-5">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Unlock now</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-on-background">Go Pro in one step.</h2>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  Head to pricing, review the plan, and continue to Paddle checkout from there.
                </p>
              </div>
              <Link
                href={`/dashboard/pricing?source=${encodeURIComponent(analyticsLocation)}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-4 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
              >
                Upgrade to Pro
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
            </div>
          </DashboardSurface>
        </div>
      </DashboardSurface>
    </div>
  )
}
