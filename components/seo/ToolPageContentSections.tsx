import Link from 'next/link'
import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react'

export type ToolStep = {
  title: string
  description: string
}

export type ToolDifferentiator = {
  title: string
  description: string
}

export type ToolRelatedLink = {
  title: string
  description: string
  href: string
}

export type ToolPageContentSectionsProps = {
  toolName: string
  howItWorks: ToolStep[]
  differentiators: ToolDifferentiator[]
  relatedReading: ToolRelatedLink[]
}

export default function ToolPageContentSections({
  toolName,
  howItWorks,
  differentiators,
  relatedReading,
}: ToolPageContentSectionsProps) {
  return (
    <>
      <section className="mt-8 rounded-[2rem] border border-white/70 bg-white/88 p-8 shadow-[0_18px_45px_rgba(25,28,29,0.05)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">How it works</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">
          How the {toolName} works in three steps.
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {howItWorks.map((step, idx) => (
            <div
              key={step.title}
              className="rounded-[1.4rem] border border-black/6 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,249,0.96))] p-5"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-container/40 text-[12px] font-black text-on-primary-container">
                  {idx + 1}
                </span>
                <h3 className="text-base font-black text-on-background">{step.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-on-surface-variant">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.9))] p-8 shadow-[0_18px_45px_rgba(25,28,29,0.05)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Why Rezoomed</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">
          What sets the {toolName} apart.
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {differentiators.map(item => (
            <div
              key={item.title}
              className="rounded-[1.4rem] border border-black/6 bg-white/88 p-5"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <h3 className="text-base font-black text-on-background">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-on-surface-variant">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-white/70 bg-white/88 p-8 shadow-[0_18px_45px_rgba(25,28,29,0.05)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Related reading</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">
          Background on {toolName.toLowerCase()} workflow
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {relatedReading.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex h-full flex-col rounded-[1.4rem] border border-black/6 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,249,0.96))] p-5 transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <BookOpen size={18} className="text-primary" />
              <h3 className="mt-3 text-base font-black leading-snug text-on-background group-hover:text-primary">
                {item.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-on-surface-variant">
                {item.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Read article <ArrowRight size={13} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
