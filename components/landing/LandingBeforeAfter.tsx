'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

const BEFORE_ISSUES = [
  'Tables & text boxes detected',
  'Headshot image blocks parsing',
  'Non-standard fonts used',
  'Missing 18 role keywords',
]

const AFTER_WINS = [
  'ATS-safe single-column layout',
  'All sections cleanly parsed',
  '42 job keywords matched',
  'Metadata optimized',
]

function SkeletonLine({ w, dark = false, green = false }: { w: string; dark?: boolean; green?: boolean }) {
  const bg = green ? 'bg-[#00a84d]/20' : dark ? 'bg-zinc-300' : 'bg-zinc-200'
  return <span className={`block h-2 rounded-full ${bg}`} style={{ width: w }} />
}

function BeforeCard({ visible }: { visible: boolean }) {
  return (
    <div
      className="relative flex-1 min-w-0"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-32px)',
        transition: 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {/* Label */}
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500 border border-red-100">
          <XCircle size={12} /> Before
        </span>
      </div>

      {/* Resume card */}
      <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-white shadow-[0_20px_60px_-20px_rgba(220,38,38,0.15)]">
        {/* Red ATS score badge */}
        <div className="absolute right-4 top-4 z-10 rounded-xl bg-red-500 px-3 py-1.5 shadow-lg">
          <p className="text-[10px] font-black uppercase tracking-wider text-white/80">ATS Score</p>
          <p className="text-2xl font-black leading-none text-white">32<span className="text-sm">%</span></p>
        </div>

        {/* Mock resume content */}
        <div className="p-6">
          {/* Header — 2-col (bad) */}
          <div className="grid grid-cols-[1fr_1fr] gap-4 border-b border-zinc-100 pb-4">
            <div className="space-y-1.5">
              <SkeletonLine w="70%" dark />
              <SkeletonLine w="55%" />
              <SkeletonLine w="80%" />
            </div>
            {/* headshot placeholder */}
            <div className="flex justify-end">
              <div className="h-14 w-14 rounded-full bg-zinc-200 ring-2 ring-red-100 flex items-center justify-center">
                <span className="text-[9px] font-bold text-red-400">IMAGE</span>
              </div>
            </div>
          </div>

          {/* Body — 2-col table layout */}
          <div className="mt-4 grid grid-cols-[2fr_1fr] gap-4">
            <div className="space-y-4">
              <div>
                <SkeletonLine w="40%" dark />
                <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-zinc-100">
                  <SkeletonLine w="95%" />
                  <SkeletonLine w="88%" />
                  <SkeletonLine w="75%" />
                </div>
              </div>
              <div>
                <SkeletonLine w="50%" dark />
                <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-zinc-100">
                  <SkeletonLine w="90%" />
                  <SkeletonLine w="80%" />
                </div>
              </div>
            </div>
            <div className="space-y-2 border-l border-zinc-100 pl-3">
              <SkeletonLine w="70%" dark />
              <SkeletonLine w="90%" />
              <SkeletonLine w="80%" />
              <SkeletonLine w="60%" />
              <SkeletonLine w="75%" />
            </div>
          </div>
        </div>

        {/* Red tint overlay */}
        <div className="pointer-events-none absolute inset-0 bg-red-500/[0.03] rounded-2xl" />
      </div>

      {/* Issue list */}
      <ul className="mt-4 space-y-2">
        {BEFORE_ISSUES.map(issue => (
          <li key={issue} className="flex items-center gap-2 text-[12px] font-medium text-zinc-500">
            <XCircle size={14} className="shrink-0 text-red-400" />
            {issue}
          </li>
        ))}
      </ul>
    </div>
  )
}

function AfterCard({ visible }: { visible: boolean }) {
  return (
    <div
      className="relative flex-1 min-w-0"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(32px)',
        transition: 'opacity 0.7s 0.15s cubic-bezier(0.22,1,0.36,1), transform 0.7s 0.15s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {/* Label */}
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edfff3] px-3 py-1 text-xs font-bold text-[#00a84d] border border-[#00a84d]/20">
          <CheckCircle2 size={12} /> After Rezoomed
        </span>
      </div>

      {/* Resume card */}
      <div className="relative overflow-hidden rounded-2xl border border-[#00a84d]/20 bg-white shadow-[0_20px_60px_-20px_rgba(0,168,77,0.2)]">
        {/* Green ATS score badge */}
        <div className="absolute right-4 top-4 z-10 rounded-xl bg-[#00a84d] px-3 py-1.5 shadow-lg">
          <p className="text-[10px] font-black uppercase tracking-wider text-white/80">ATS Score</p>
          <p className="text-2xl font-black leading-none text-white">98<span className="text-sm">%</span></p>
        </div>

        {/* Mock resume content — clean single column */}
        <div className="p-6">
          {/* Header — clean single col */}
          <div className="border-b border-zinc-100 pb-4 space-y-1.5">
            <SkeletonLine w="55%" dark />
            <SkeletonLine w="70%" />
            <SkeletonLine w="50%" />
          </div>

          {/* Body — single column */}
          <div className="mt-4 space-y-4">
            <div>
              <SkeletonLine w="35%" dark />
              <div className="mt-2 space-y-1.5">
                <SkeletonLine w="95%" />
                <SkeletonLine w="88%" green />
                <SkeletonLine w="80%" />
                <SkeletonLine w="92%" green />
              </div>
            </div>
            <div>
              <SkeletonLine w="40%" dark />
              <div className="mt-2 space-y-1.5">
                <SkeletonLine w="90%" green />
                <SkeletonLine w="85%" />
                <SkeletonLine w="78%" green />
              </div>
            </div>
            <div>
              <SkeletonLine w="30%" dark />
              <div className="mt-2 flex flex-wrap gap-2">
                {[60, 45, 70, 55, 65, 50].map(w => (
                  <span key={w} className="h-5 rounded-full bg-[#00a84d]/10" style={{ width: `${w}px` }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Green tint overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[#00a84d]/[0.025] rounded-2xl" />
      </div>

      {/* Win list */}
      <ul className="mt-4 space-y-2">
        {AFTER_WINS.map(win => (
          <li key={win} className="flex items-center gap-2 text-[12px] font-medium text-zinc-500">
            <CheckCircle2 size={14} className="shrink-0 text-[#00a84d]" />
            {win}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function LandingBeforeAfter() {
  const { ref, visible } = useReveal()

  return (
    <section className="relative overflow-hidden bg-white px-6 py-24 md:py-28">
      {/* Faint grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div ref={ref} className="relative mx-auto max-w-5xl">
        {/* Header */}
        <div
          className="mb-12 text-center"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#00a84d]">The transformation</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-black tracking-tighter leading-[1.06] text-zinc-950">
            Your resume, <span className="landing-italic-safe italic bg-gradient-to-r from-[#00a84d] to-[#026d32] bg-clip-text text-transparent">before and after</span>
          </h2>
          <p className="mt-4 text-base text-zinc-500 max-w-xl mx-auto">
            Most resumes fail ATS before a human ever reads them. Here&apos;s what Rezoomed fixes.
          </p>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-8 md:flex-row md:gap-10 md:items-start">
          <BeforeCard visible={visible} />

          {/* Arrow divider */}
          <div
            className="flex shrink-0 items-center justify-center md:mt-16"
            style={{
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.5s 0.3s',
            }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 shadow-lg md:h-12 md:w-12">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white md:hidden" aria-hidden="true">
                <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white hidden md:block" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <AfterCard visible={visible} />
        </div>
      </div>
    </section>
  )
}
