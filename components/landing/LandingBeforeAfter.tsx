'use client'

import Link from 'next/link'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, Sparkles, XCircle } from 'lucide-react'

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold }
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, visible }
}

const BEFORE_ISSUES = [
  {
    title: 'Experience reads like tasks',
    detail: 'The strongest engineering work is buried under generic wording.',
  },
  {
    title: 'Impact is left for the recruiter to infer',
    detail: 'Numbers, scale, systems, and ownership are not doing enough work.',
  },
  {
    title: 'Keyword match is too accidental',
    detail: 'Relevant tools are present, but not tied to the role evidence.',
  },
]

const AFTER_SIGNALS = [
  {
    label: 'System ownership',
    copy: 'Architecture, deployment, throughput, and uptime show up in the first bullet.',
  },
  {
    label: 'Senior engineer tone',
    copy: 'Sounds like a senior engineer, not an AI chatbot: specific, technical, and accountable.',
  },
  {
    label: 'Honest optimization',
    copy: 'Same facts, stronger framing. No fake tools, titles, or outcomes.',
  },
]

const MARK_TONES = {
  yellow: 'bg-amber-100 text-amber-950 ring-amber-200/70',
  green: 'bg-emerald-100 text-emerald-950 ring-emerald-200/80',
  violet: 'bg-violet-100 text-violet-950 ring-violet-200/75',
}

function TextMark({
  children,
  tone = 'green',
}: {
  children: ReactNode
  tone?: keyof typeof MARK_TONES
}) {
  return (
    <span className={`rounded-[0.22rem] px-0.5 ring-1 ${MARK_TONES[tone]}`}>
      {children}
    </span>
  )
}

function ScoreBadge({
  value,
  tone,
  delay = '0s',
}: {
  value: string
  tone: 'red' | 'green'
  delay?: string
}) {
  const isGreen = tone === 'green'

  return (
    <div
      className={`absolute right-4 top-4 z-20 rounded-[1rem] px-3.5 py-2 shadow-xl ${
        isGreen
          ? 'badge-drift-up bg-[#00a84d] shadow-emerald-950/15'
          : 'bg-red-500 shadow-red-950/10'
      }`}
      style={{ animationDelay: delay }}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/78">ATS score</p>
      <p className="mt-0.5 text-2xl font-black leading-none text-white">{value}</p>
    </div>
  )
}

function BeforeResume({ visible }: { visible: boolean }) {
  return (
    <div
      className="relative flex h-full min-w-0 flex-col 2xl:overflow-visible"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-34px)',
        transition: 'opacity 0.75s cubic-bezier(0.22,1,0.36,1), transform 0.75s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      <div className="mb-3 flex min-h-8 items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-black text-red-500">
          <XCircle size={13} /> Before: weak signal
        </span>
      </div>

      <div className="relative min-h-[610px] flex-1 overflow-hidden rounded-[1.35rem] border border-red-100 bg-white shadow-[0_24px_70px_-30px_rgba(220,38,38,0.22)] lg:min-h-[640px]">
        <ScoreBadge value="32%" tone="red" />
        <div className="pointer-events-none absolute inset-0 bg-red-500/[0.025]" />

        <div className="relative px-6 pb-6 pt-7 text-zinc-800 md:px-7">
          <div className="max-w-[78%] border-b border-zinc-200 pb-4">
            <h3 className="text-2xl font-black tracking-tight text-zinc-900 md:text-3xl">Michael Rodriguez</h3>
            <p className="mt-1 text-sm text-zinc-500">~ Full Stack Developer ~</p>
            <p className="mt-3 text-xs text-zinc-500">michael.rodriguez@email.com · 650-555-0789</p>
          </div>

          <section className="mt-5 rounded-[1rem] bg-zinc-100/70 p-4">
            <h4 className="text-lg font-black underline decoration-zinc-400 decoration-2 underline-offset-4">Objective</h4>
            <p className="mt-3 text-[13px] leading-6 text-zinc-600">
              Seeking a challenging software engineering position where I can use my skills and contribute to company success.
            </p>
          </section>

          <section className="mt-5">
            <h4 className="text-xl font-black tracking-tight text-zinc-900">Work Experience</h4>
            <div className="mt-3 border-l-4 border-zinc-300 pl-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-sm font-black text-zinc-900">Software Engineer Intern</p>
                <p className="text-xs font-semibold text-zinc-500">May 2021 - Aug 2021</p>
              </div>
              <p className="mt-0.5 text-sm italic text-zinc-500">Stripe, Inc.</p>
              <ul className="mt-3 space-y-2 text-[13px] leading-6 text-zinc-600">
                <li>· Worked on payment APIs and helped improve backend performance.</li>
                <li>· Built dashboards using React and TypeScript for internal teams.</li>
                <li>· Used Kafka, Redis, and SQL while collaborating with senior engineers.</li>
                <li>· Improved frontend bundle size by 15%.</li>
              </ul>
            </div>
          </section>

          <section className="mt-5">
            <h4 className="text-lg font-black tracking-tight text-zinc-900">Education Background</h4>
            <div className="mt-3 rounded-xl border border-zinc-200 px-4 py-3">
              <p className="text-sm font-black text-zinc-800">University of California, Berkeley</p>
              <p className="mt-1 text-xs text-zinc-500">B.S. Computer Science · GPA: 3.92/4.0</p>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-4 grid min-h-[138px] gap-2.5">
        {BEFORE_ISSUES.map(issue => (
          <div key={issue.title} className="flex gap-2.5 text-left">
            <XCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
            <div>
              <p className="text-[12px] font-black text-zinc-700">{issue.title}</p>
              <p className="mt-0.5 text-[12px] leading-5 text-zinc-500">{issue.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AfterResume({ visible }: { visible: boolean }) {
  return (
    <div
      className="relative flex h-full min-w-0 flex-col"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(34px)',
        transition: 'opacity 0.75s 0.15s cubic-bezier(0.22,1,0.36,1), transform 0.75s 0.15s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      <div className="mb-3 flex min-h-8 flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00a84d]/20 bg-[#edfff3] px-3 py-1 text-xs font-black text-[#00a84d]">
          <CheckCircle2 size={13} /> After Rezoomed
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-bold text-zinc-600 shadow-sm">
          <Sparkles size={13} className="text-[#00a84d]" /> Real resume language
        </span>
      </div>

      <div className="relative flex-1 2xl:overflow-visible">
        <div className="shimmer-effect relative min-h-[610px] overflow-hidden rounded-[1.35rem] border border-[#00a84d]/25 bg-white shadow-[0_28px_80px_-28px_rgba(0,168,77,0.28)] lg:min-h-[640px]">
          <ScoreBadge value="98%" tone="green" delay="0.4s" />
          <div className="pointer-events-none absolute inset-0 bg-[#00a84d]/[0.025]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00a84d] to-transparent opacity-80" />

          <div className="relative px-6 pb-6 pt-7 text-zinc-950 md:px-7">
            <div className="max-w-[76%] border-b-2 border-zinc-900 pb-3">
            <h3 className="text-2xl font-black uppercase tracking-[0.08em] md:text-3xl">Michael Rodriguez</h3>
            <p className="mt-2 text-xs font-semibold text-zinc-700">
              michael.rodriguez@email.com · github.com/mrodriguez · San Francisco, CA
            </p>
          </div>

          <section className="mt-5">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-900 pb-1.5">
              <h4 className="text-[13px] font-black uppercase tracking-[0.14em]">Professional Experience</h4>
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#00a84d]">moved to top</span>
            </div>

            <div className="mt-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-sm font-black">Software Engineer Intern</p>
                <p className="text-xs font-bold">May 2021 - Aug 2021</p>
              </div>
              <p className="mt-0.5 text-sm italic text-zinc-700">Stripe, Inc. · Payments Platform</p>
              <ul className="mt-3 space-y-2.5 text-[13px] leading-6">
                <li>
                  · <TextMark tone="yellow">Architected and deployed</TextMark> a <TextMark tone="violet">real-time fraud detection pipeline</TextMark> using Apache Kafka and Flink, processing <TextMark>50,000+ events/second</TextMark> with <TextMark>99.9% uptime</TextMark>.
                </li>
                <li>
                  · <TextMark tone="yellow">Optimized payment API endpoints</TextMark>, reducing P99 latency by <TextMark>42% (220ms -&gt; 128ms)</TextMark> through SQL query tuning and Redis caching.
                </li>
                <li>
                  · Built a React/TypeScript observability dashboard used by <TextMark>12 operations analysts</TextMark> to triage payment anomalies <TextMark>31% faster</TextMark>.
                </li>
              </ul>
            </div>
          </section>

          <section className="mt-5">
            <div className="border-b border-zinc-900 pb-1.5">
              <h4 className="text-[13px] font-black uppercase tracking-[0.14em]">Projects</h4>
            </div>
            <p className="mt-3 text-[13px] leading-6">
              <span className="font-black">Distributed Job Queue:</span> Built a Redis-backed worker system with retries, dead-letter handling, and dashboard visibility for failed jobs.
            </p>
          </section>

          <section className="mt-5">
            <div className="border-b border-zinc-900 pb-1.5">
              <h4 className="text-[13px] font-black uppercase tracking-[0.14em]">Technical Skills</h4>
            </div>
            <p className="mt-3 text-[12px] leading-6 text-zinc-700">
              <span className="font-black text-zinc-950">Languages:</span> TypeScript, Python, SQL · <span className="font-black text-zinc-950">Systems:</span> Kafka, Redis, PostgreSQL, Docker · <span className="font-black text-zinc-950">Frontend:</span> React, Node.js
            </p>
          </section>
        </div>

        </div>

        <aside className="mt-4 rounded-[1.25rem] border border-[#00a84d]/18 bg-[linear-gradient(180deg,#f3fff7_0%,#ffffff_100%)] p-4 shadow-[0_18px_50px_-28px_rgba(0,168,77,0.45)] 2xl:absolute 2xl:left-[calc(100%+1rem)] 2xl:top-28 2xl:mt-0 2xl:w-[14.25rem]">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#00a84d]">The upgrade</p>
          <h4 className="mt-2 text-lg font-black leading-tight tracking-tight text-zinc-950">
            Sounds like a senior engineer, not an AI chatbot.
          </h4>
          <p className="mt-3 text-[13px] leading-6 text-zinc-600">
            Rezoomed keeps the facts honest, then raises the signal: ownership, system, scale, stack, and measurable outcome.
          </p>
        </aside>
      </div>

      <div className="mt-4 grid min-h-[138px] gap-2.5">
        {AFTER_SIGNALS.map(signal => (
          <div key={signal.label} className="flex gap-2.5 text-left">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#00a84d]" />
            <div>
              <p className="text-[12px] font-black text-zinc-700">{signal.label}</p>
              <p className="mt-0.5 text-[12px] leading-5 text-zinc-500">{signal.copy}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LandingBeforeAfter() {
  const { ref, visible } = useReveal()

  return (
    <section className="relative overflow-hidden bg-white px-5 py-24 md:px-6 md:py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(2,109,50,0.42) 1px, transparent 1px), linear-gradient(90deg, rgba(2,109,50,0.42) 1px, transparent 1px)',
          backgroundSize: '54px 54px',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />

      <div ref={ref} className="relative mx-auto max-w-7xl">
        <div
          className="mx-auto mb-12 max-w-3xl text-center"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#00a84d]">The transformation</p>
          <h2 className="mt-3 text-4xl font-black leading-[1.06] tracking-tighter text-zinc-950 md:text-6xl">
            Your resume, <span className="landing-italic-safe italic bg-gradient-to-r from-[#00a84d] to-[#026d32] bg-clip-text text-transparent">before and after</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-zinc-500 md:text-lg">
            Not vague AI polish. Real resume rewrites that make the best evidence obvious in the first few seconds.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] lg:items-stretch">
          <BeforeResume visible={visible} />

          <div
            className="flex items-center justify-center lg:h-full"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'scale(1)' : 'scale(0.85)',
              transition: 'opacity 0.45s 0.35s ease, transform 0.45s 0.35s ease',
            }}
          >
            <div className="ring-expand relative flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 shadow-[0_20px_45px_rgba(9,9,11,0.22)]">
              <ArrowRight size={22} className="hidden text-white lg:block" />
              <ArrowRight size={22} className="rotate-90 text-white lg:hidden" />
            </div>
          </div>

          <AfterResume visible={visible} />
        </div>

        <div
          className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-between gap-4 rounded-[1.35rem] border border-zinc-200 bg-white/90 p-4 text-center shadow-[0_20px_70px_-42px_rgba(0,0,0,0.28)] md:flex-row md:text-left"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(18px)',
            transition: 'opacity 0.65s 0.45s ease, transform 0.65s 0.45s ease',
          }}
        >
          <p className="text-sm font-semibold leading-6 text-zinc-700">
            Pro turns raw resume facts into recruiter-ready proof without inventing experience.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white shadow-[0_16px_32px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#00a84d]"
          >
            Upgrade my resume
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
