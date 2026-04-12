'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  FileText, Wand2, BriefcaseBusiness, Shield,
  Sparkles, FileUser, Check, Users, Star, BarChart3, Target,
} from 'lucide-react'

// ─── Apple-quality animation constants ───────────────────────────────────────
// expo-out: fires immediately, decelerates smoothly toward rest.
// This is what Apple uses across apple.com for content reveals.
const E = 'cubic-bezier(0.22, 1, 0.36, 1)'

// ─── Scroll-reveal primitive ──────────────────────────────────────────────────

function Reveal({
  children, delay = 0, className = '', from = 'bottom',
}: {
  children: ReactNode; delay?: number; className?: string
  from?: 'bottom' | 'left' | 'right' | 'scale' | 'none'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect() } },
      { threshold: 0.06, rootMargin: '0px 0px -40px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const hidden =
    from === 'bottom' ? 'scale(0.97) translateY(64px)' :
    from === 'left'   ? 'scale(0.97) translateX(-52px)' :
    from === 'right'  ? 'scale(0.97) translateX(52px)' :
    from === 'scale'  ? 'scale(0.88)' : 'none'

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity:   v ? 1 : 0,
        transform: v ? 'scale(1) translate(0,0)' : hidden,
        transition: `opacity 1.0s ${E} ${delay}ms, transform 1.0s ${E} ${delay}ms`,
        willChange: 'opacity, transform',
        backfaceVisibility: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

// ─── Scroll-linked parallax hook ─────────────────────────────────────────────
// Updates style.transform directly via rAF — zero React re-renders.

function useParallax(speed = 0.12) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ticking = false
    const update = () => {
      if (!ref.current) return
      const parent = ref.current.parentElement
      if (!parent) return
      const rect   = parent.getBoundingClientRect()
      const offset = -rect.top * speed
      ref.current.style.transform = `translateY(${offset}px)`
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => window.removeEventListener('scroll', onScroll)
  }, [speed])

  return ref
}

function ParallaxBlob({ className, speed = 0.1 }: { className: string; speed?: number }) {
  const ref = useParallax(speed)
  return <div ref={ref} className={`absolute rounded-full blur-3xl pointer-events-none ${className}`} />
}

// ─── Count-up ─────────────────────────────────────────────────────────────────

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [n, setN] = useState(0)
  const [v, setV] = useState(false)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect() } },
      { threshold: 0.5 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!v) return
    let cancelled = false
    const start = performance.now(); const dur = 1600
    const raf = (t: number) => {
      if (cancelled) return
      const p = Math.min((t - start) / dur, 1)
      const e = 1 - Math.pow(1 - p, 4)
      setN(Math.round(e * to))
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => { cancelled = true }
  }, [v, to])

  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>
}

// ─── Live counter ─────────────────────────────────────────────────────────────

const LIVE_BASE = 50_000
const LIVE_RATE = 10 // +10 per minute

function getCountNow() {
  const now      = new Date()
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const mins     = Math.floor((now.getTime() - midnight.getTime()) / 60_000)
  return LIVE_BASE + mins * LIVE_RATE
}

function LiveCounter() {
  const ref = useRef<HTMLDivElement>(null)
  // Start display at current real count; roll-up animates from slightly below on visibility
  const [display,  setDisplay]  = useState(getCountNow)
  const [flash,    setFlash]    = useState(false)
  const [visible,  setVisible]  = useState(false)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.4 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Roll-up animation: animate from (current - small offset) to current on first reveal
  useEffect(() => {
    if (!visible) return
    let cancelled = false
    const target = getCountNow()
    // Always animate upward: start slightly below target, never backwards
    const startFrom = Math.min(display, target - LIVE_RATE * 2)
    const begin = performance.now(); const dur = 1200
    const raf = (t: number) => {
      if (cancelled) return
      const p = Math.min((t - begin) / dur, 1)
      const e = 1 - Math.pow(1 - p, 4)
      setDisplay(Math.round(startFrom + (target - startFrom) * e))
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  useEffect(() => {
    const id = setInterval(() => {
      setDisplay(getCountNow())
      setFlash(true)
      setTimeout(() => setFlash(false), 500)
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') setDisplay(getCountNow())
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-full px-2.5 py-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Live</span>
      </div>
      <div
        className="text-4xl font-black tracking-tight tabular-nums bg-gradient-to-br from-[#026d32] to-[#30c06b] bg-clip-text text-transparent"
        style={{ transition: `filter 0.4s ${E}`, filter: flash ? 'brightness(1.35)' : 'brightness(1)' }}
      >
        {display.toLocaleString()}+
      </div>
    </div>
  )
}

// ─── ATS Score mock ───────────────────────────────────────────────────────────

function ATSMock() {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const cats = [
    { label: 'Content Quality',   score: 24, max: 25 },
    { label: 'Formatting',        score: 19, max: 20 },
    { label: 'Keyword Match',     score: 14, max: 15 },
    { label: 'Section Structure', score: 14, max: 15 },
    { label: 'Contact Info',      score: 9,  max: 10 },
  ]
  const C = 2 * Math.PI * 38

  const enter = (delay: number, axis: 'Y' | 'X' = 'Y', dist = 24): React.CSSProperties => ({
    opacity: v ? 1 : 0,
    transform: v ? 'none' : axis === 'Y' ? `translateY(${dist}px)` : `translateX(-${dist}px)`,
    transition: `opacity 0.9s ${E} ${delay}s, transform 0.9s ${E} ${delay}s`,
  })

  return (
    <div
      ref={ref}
      style={{
        opacity: v ? 1 : 0,
        transform: v ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(56px)',
        transition: `opacity 1.1s ${E}, transform 1.1s ${E}`,
        willChange: 'opacity, transform, filter',
      }}
    >
      <div className="absolute -inset-10 rounded-full bg-[radial-gradient(ellipse,rgba(2,109,50,0.14)_0%,transparent_65%)] blur-2xl pointer-events-none" />

      <div className="relative rounded-[2.25rem] bg-white border border-zinc-100 shadow-[0_40px_100px_rgba(2,109,50,0.10),0_8px_32px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="h-1 w-full bg-[linear-gradient(90deg,#026d32,#30c06b,#A3FFB3,#30c06b,#026d32)] bg-[length:200%_100%]"
          style={{ animation: 'shimmer-flow 3s linear infinite' }} />

        <div className="px-8 pt-7 pb-5 flex items-center gap-5 border-b border-zinc-50">
          <div className="relative w-[82px] h-[82px] flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#f0f7f2" strokeWidth="10" />
              <circle cx="50" cy="50" r="38" fill="none"
                stroke="url(#ats-score-grad)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={v ? C * 0.08 : C}
                style={{ transition: `stroke-dashoffset 1.4s ${E} 0.35s` }}
              />
              <defs>
                <linearGradient id="ats-score-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#026d32" /><stop offset="100%" stopColor="#30c06b" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-zinc-900 leading-none">92</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5">Score</span>
            </div>
          </div>
          <div style={enter(0.2)}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Excellent</span>
            </div>
            <p className="text-lg font-black text-zinc-900 leading-tight">Ready to apply</p>
            <p className="text-xs text-zinc-400 mt-0.5">Top 6% of all applicants</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1.5"
            style={enter(0.55)}>
            <Star size={11} className="text-emerald-500 fill-emerald-500" />
            <span className="text-[10px] font-black text-emerald-700">Top Score</span>
          </div>
        </div>

        <div className="px-8 py-5 space-y-4">
          {cats.map((c, i) => (
            <div key={c.label} style={enter(0.3 + i * 0.08, 'X')}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-zinc-600">{c.label}</span>
                <span className="font-black text-zinc-900 tabular-nums">
                  {c.score}<span className="text-zinc-300 font-normal">/{c.max}</span>
                </span>
              </div>
              <div className="h-[5px] rounded-full bg-zinc-100 overflow-hidden">
                <div className="h-full rounded-full"
                  style={{
                    width: v ? `${(c.score / c.max) * 100}%` : '0%',
                    background: 'linear-gradient(90deg,#026d32,#A3FFB3)',
                    transition: `width 1.0s ${E} ${0.42 + i * 0.08}s`,
                  }} />
              </div>
            </div>
          ))}
        </div>

        <div className="px-8 pb-7" style={enter(0.72)}>
          <div className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 px-4 py-3">
            <Sparkles size={13} className="text-emerald-600 flex-shrink-0" strokeWidth={2.5} />
            <span className="text-[11px] font-semibold text-emerald-700">Checked against 200+ enterprise ATS systems</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Match Score mock ─────────────────────────────────────────────────────────

function MatchMock() {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const rows = [
    { label: 'Must-Have Skills',  tag: '6/7 matched',           strong: true  },
    { label: 'Experience Level',  tag: 'Senior — direct match', strong: true  },
    { label: 'Domain Alignment',  tag: 'SaaS B2B confirmed',    strong: true  },
    { label: 'Technical Stack',   tag: '4/6 — close match',     strong: false },
    { label: 'Leadership Scope',  tag: 'Cross-functional ✓',    strong: true  },
  ]

  return (
    <div
      ref={ref}
      style={{
        opacity: v ? 1 : 0,
        transform: v ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(56px)',
        transition: `opacity 1.1s ${E}, transform 1.1s ${E}`,
        willChange: 'opacity, transform',
      }}
    >
      {/* Giant % with gradient text */}
      <div className="text-center mb-7" style={{
        opacity: v ? 1 : 0,
        transform: v ? 'scale(1)' : 'scale(0.78)',
        transition: `opacity 0.9s ${E} 0.15s, transform 0.9s ${E} 0.15s`,
      }}>
        <div className="font-black leading-none tracking-tighter"
          style={{
            fontSize: 'clamp(80px,13vw,116px)',
            background: 'linear-gradient(135deg,#A3FFB3 0%,#30c06b 40%,#ffffff 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
          84%
        </div>
        <p className="text-white/35 text-sm font-medium tracking-widest uppercase mt-2">
          Resume match · Senior PM at Stripe
        </p>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/6 backdrop-blur-md p-5 space-y-2">
        {rows.map((row, i) => (
          <div key={row.label} style={{
            opacity: v ? 1 : 0,
            transform: v ? 'none' : 'translateX(-20px)',
            transition: `opacity 0.7s ${E} ${0.35 + i * 0.07}s, transform 0.7s ${E} ${0.35 + i * 0.07}s`,
          }}
            className="flex items-center justify-between gap-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors px-4 py-2.5"
          >
            <span className="text-xs font-medium text-white/55 leading-none">{row.label}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[11px] font-semibold text-white/70">{row.tag}</span>
              <div className={`h-2 w-2 rounded-full flex-shrink-0 ${row.strong ? 'bg-[#A3FFB3] shadow-[0_0_6px_rgba(163,255,179,0.8)]' : 'bg-amber-400'}`} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-[10px] text-white/20 mt-4 uppercase tracking-widest">
        Based on real requirements · Not generic advice
      </p>
    </div>
  )
}

// ─── Tailor Mode mock ─────────────────────────────────────────────────────────

function TailorMock() {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const card = (delay: number): React.CSSProperties => ({
    opacity: v ? 1 : 0,
    transform: v ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity 0.85s ${E} ${delay}s, transform 0.85s ${E} ${delay}s`,
  })

  return (
    <div ref={ref} className="space-y-3" style={{
      opacity: v ? 1 : 0,
      transform: v ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(56px)',
      transition: `opacity 1.1s ${E}, transform 1.1s ${E}`,
    }}>
      <div className="rounded-[1.5rem] border border-zinc-200/80 bg-white p-5 shadow-sm" style={card(0.15)}>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Original</span>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed line-through decoration-zinc-200">
          Responsible for managing cross-functional teams and helping with product development processes.
        </p>
      </div>

      <div className="flex justify-center" style={card(0.38)}>
        <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-zinc-900 to-zinc-800 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#A3FFB3] animate-pulse" />
          <span className="text-[11px] font-bold text-white tracking-wide">AI rewriting for this role</span>
          <Wand2 size={12} className="text-[#A3FFB3]" />
        </div>
      </div>

      <div className="rounded-[1.5rem] border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-5 shadow-[0_8px_32px_rgba(2,109,50,0.10)]" style={card(0.62)}>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">Optimized</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full">
            <Sparkles size={9} /> +41% keyword match
          </span>
        </div>
        <p className="text-sm text-zinc-800 leading-relaxed font-medium">
          Led 4 cross-functional teams (18 people) to ship 3 product lines ahead of schedule, reducing time-to-market by{' '}
          <strong className="text-emerald-700 font-black">34%</strong> and driving{' '}
          <strong className="text-emerald-700 font-black">$2.1M</strong> in new ARR.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2" style={card(0.84)}>
        {[
          { val: '92%', label: 'ATS Score',   color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { val: '+8',  label: 'Power Words', color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-100' },
          { val: 'A+',  label: 'Strength',    color: 'text-violet-600',  bg: 'bg-violet-50 border-violet-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-3.5 text-center ${s.bg}`}>
            <div className={`text-base font-black ${s.color}`}>{s.val}</div>
            <div className="text-[10px] text-zinc-400 mt-0.5 font-medium">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Bento data ───────────────────────────────────────────────────────────────

// 4-col desktop grid — 3 rows, same vertical footprint as the old 3-col/6-card layout
// Row 1: ATS(2) + Match(1) + Builder(1) = 4
// Row 2: Metadata(1) + Tailor(2) + Cover(1) = 4
// Row 3: Job Tracker(2) + Expert Writing(2) = 4
const BENTO = [
  {
    Icon: BarChart3, label: 'ATS Checker',
    desc: 'Scan your resume against 200+ ATS systems. Score every section, fix the gaps.',
    gradient: 'from-emerald-500/10 to-green-500/5',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
    glow: 'hover:shadow-[0_24px_64px_rgba(16,185,129,0.22)]',
    size: 'lg:col-span-2',
  },
  {
    Icon: Target, label: 'Match Score AI',
    desc: 'Real fit against any job — requirement by requirement.',
    gradient: 'from-sky-500/10 to-blue-500/5',
    iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600',
    glow: 'hover:shadow-[0_24px_64px_rgba(14,165,233,0.22)]',
    size: 'lg:col-span-1',
  },
  {
    Icon: FileText, label: 'Resume Builder',
    desc: 'Build from scratch or import. Live preview, multiple templates.',
    gradient: 'from-blue-500/10 to-indigo-500/5',
    iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    glow: 'hover:shadow-[0_24px_64px_rgba(99,102,241,0.22)]',
    size: 'lg:col-span-1',
  },
  {
    Icon: Shield, label: 'Metadata Optimizer',
    desc: 'Fix hidden PDF metadata ATS systems read before your content.',
    gradient: 'from-violet-500/10 to-purple-500/5',
    iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    glow: 'hover:shadow-[0_24px_64px_rgba(139,92,246,0.22)]',
    size: 'lg:col-span-1',
  },
  {
    Icon: Wand2, label: 'Tailor AI',
    desc: 'Paste any job description. AI rewrites your bullets to match — stronger verbs, better keywords.',
    gradient: 'from-rose-500/10 to-pink-500/5',
    iconBg: 'bg-gradient-to-br from-rose-500 to-pink-500',
    glow: 'hover:shadow-[0_24px_64px_rgba(244,63,94,0.22)]',
    size: 'lg:col-span-2',
  },
  {
    Icon: FileUser, label: 'Cover Letter',
    desc: 'Role-specific cover letters in seconds. Never generic.',
    gradient: 'from-orange-500/10 to-amber-500/5',
    iconBg: 'bg-gradient-to-br from-orange-500 to-amber-500',
    glow: 'hover:shadow-[0_24px_64px_rgba(249,115,22,0.22)]',
    size: 'lg:col-span-1',
  },
  {
    Icon: BriefcaseBusiness, label: 'Job Tracker',
    desc: 'Every application tracked — status, contacts, follow-ups.',
    gradient: 'from-teal-500/10 to-cyan-500/5',
    iconBg: 'bg-gradient-to-br from-teal-500 to-cyan-500',
    glow: 'hover:shadow-[0_24px_64px_rgba(20,184,166,0.22)]',
    size: 'lg:col-span-2',
  },
  {
    Icon: Users, label: 'Expert Resume Writing',
    desc: 'Hire a professional writer from top tech companies. Human-crafted, ATS-ready.',
    gradient: 'from-amber-500/10 to-yellow-500/5',
    iconBg: 'bg-gradient-to-br from-amber-500 to-yellow-400',
    glow: 'hover:shadow-[0_24px_64px_rgba(245,158,11,0.22)]',
    size: 'lg:col-span-2',
  },
] as const

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LandingFeatures() {
  return (
    <div>

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <section className="relative py-14 px-6 overflow-hidden bg-gradient-to-b from-white via-[#f0fdf4] to-white border-y border-green-100/60">
        <ParallaxBlob className="w-96 h-48 bg-green-300/20 top-0 left-1/4 -translate-y-1/2" speed={0.08} />
        <ParallaxBlob className="w-72 h-40 bg-emerald-200/20 bottom-0 right-1/4 translate-y-1/2" speed={0.12} />
        <div className="relative max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 items-start">
          <Reveal className="text-center space-y-1">
            <LiveCounter />
            <div className="text-xs text-zinc-500 font-semibold leading-snug max-w-[130px] mx-auto">
              resumes optimized today
            </div>
          </Reveal>
          {[
            { to: 5,   suffix: '×', label: 'more interview callbacks' },
            { to: 200, suffix: '+', label: 'ATS systems tested' },
            { to: 6,   suffix: '',  label: 'AI-powered tools' },
          ].map((s, i) => (
            <Reveal key={s.label} delay={(i + 1) * 120} className="text-center space-y-1">
              <div className="text-4xl font-black tracking-tight bg-gradient-to-br from-[#026d32] to-[#30c06b] bg-clip-text text-transparent">
                <CountUp to={s.to} suffix={s.suffix} />
              </div>
              <div className="text-xs text-zinc-500 font-semibold leading-snug max-w-[110px] mx-auto">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── ATS Checker ─────────────────────────────────────────────────────── */}
      <section className="relative py-28 lg:py-36 px-6 overflow-hidden bg-[#f7f9f8]">
        <ParallaxBlob className="w-[520px] h-[420px] bg-green-200/28 -top-24 -right-24" speed={0.14} />
        <ParallaxBlob className="w-64 h-64 bg-emerald-300/14 bottom-0 left-0" speed={0.07} />

        <div className="relative max-w-7xl mx-auto grid md:grid-cols-2 gap-14 lg:gap-20 items-center">
          <div className="space-y-7 order-2 md:order-1">
            <Reveal>
              <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                <Sparkles size={11} /> ATS Scanner
              </span>
            </Reveal>
            <Reveal delay={150}>
              <h2 className="text-5xl lg:text-[3.6rem] font-black tracking-tight text-zinc-950 leading-[1.06]">
                Know your score<br />before they do.
              </h2>
            </Reveal>
            <Reveal delay={280}>
              <p className="text-lg text-zinc-500 leading-relaxed max-w-[420px]">
                Get a detailed ATS breakdown across every section — before your resume ever reaches a recruiter's desk.
              </p>
            </Reveal>
            <Reveal delay={400}>
              <ul className="space-y-3">
                {[
                  'Instant score across 5 critical categories',
                  'Plain-English fixes, not just a number',
                  'Checked against 200+ enterprise ATS systems',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-[15px] text-zinc-600">
                    <span className="mt-[3px] flex-shrink-0 h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Check size={10} className="text-emerald-600" strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <div className="order-1 md:order-2 relative">
            <ATSMock />
          </div>
        </div>
      </section>

      {/* ── Match Score (dark) ───────────────────────────────────────────────── */}
      <section className="relative py-28 lg:py-36 px-6 overflow-hidden bg-[#040e08]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[radial-gradient(ellipse,rgba(2,109,50,0.20)_0%,transparent_65%)] pointer-events-none" />
        <ParallaxBlob className="w-72 h-72 bg-green-900/35 top-0 right-0 translate-x-1/3 -translate-y-1/3" speed={0.16} />
        <ParallaxBlob className="w-52 h-52 bg-emerald-900/28 bottom-0 left-0 -translate-x-1/4 translate-y-1/4" speed={0.09} />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #A3FFB3 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative max-w-7xl mx-auto grid md:grid-cols-2 gap-14 lg:gap-20 items-center">
          <div className="order-2 md:order-1"><MatchMock /></div>
          <div className="space-y-7 order-1 md:order-2">
            <Reveal>
              <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#A3FFB3] bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-[#A3FFB3]" /> Job Match
              </span>
            </Reveal>
            <Reveal delay={150}>
              <h2 className="text-5xl lg:text-[3.6rem] font-black tracking-tight text-white leading-[1.06]">
                See your real fit.<br />Not your gut feel.
              </h2>
            </Reveal>
            <Reveal delay={280}>
              <p className="text-lg text-white/40 leading-relaxed max-w-[420px]">
                Paste any job description and get a requirement-by-requirement analysis. Know what's missing before you apply.
              </p>
            </Reveal>
            <Reveal delay={400}>
              <ul className="space-y-3">
                {[
                  'Requirement-by-requirement breakdown',
                  'Honest gaps — no inflated scores',
                  'Know what to fix before submitting',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-[15px] text-white/55">
                    <span className="mt-[3px] flex-shrink-0 h-4 w-4 rounded-full bg-white/8 flex items-center justify-center">
                      <Check size={10} className="text-[#A3FFB3]" strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Tailor Mode ──────────────────────────────────────────────────────── */}
      <section className="relative py-28 lg:py-36 px-6 overflow-hidden bg-white">
        <ParallaxBlob className="w-[450px] h-[350px] bg-violet-100/45 -top-20 -left-20" speed={0.12} />
        <ParallaxBlob className="w-80 h-80 bg-green-100/55 bottom-0 right-0 translate-x-1/4 translate-y-1/4" speed={0.08} />

        <div className="relative max-w-7xl mx-auto grid md:grid-cols-2 gap-14 lg:gap-20 items-center">
          <div className="space-y-7 order-2 md:order-1">
            <Reveal>
              <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-violet-700 bg-violet-50 border border-violet-100 px-3 py-1.5 rounded-full">
                <Wand2 size={11} /> AI Rewrites
              </span>
            </Reveal>
            <Reveal delay={150}>
              <h2 className="text-5xl lg:text-[3.6rem] font-black tracking-tight text-zinc-950 leading-[1.06]">
                Your resume,<br />rewritten for<br />every role.
              </h2>
            </Reveal>
            <Reveal delay={280}>
              <p className="text-lg text-zinc-500 leading-relaxed max-w-[420px]">
                Paste a job description. Frontier AI rewrites your bullets around it — stronger verbs, sharper impact, higher keyword coverage.
              </p>
            </Reveal>
            <Reveal delay={400}>
              <ul className="space-y-3">
                {[
                  'Impact-first bullet rewrites, not just paraphrasing',
                  'Keyword coverage analysis in real time',
                  'Every change explained, nothing invented',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-[15px] text-zinc-600">
                    <span className="mt-[3px] flex-shrink-0 h-4 w-4 rounded-full bg-violet-100 flex items-center justify-center">
                      <Check size={10} className="text-violet-600" strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <div className="order-1 md:order-2"><TailorMock /></div>
        </div>
      </section>

      {/* ── Bento grid ───────────────────────────────────────────────────────── */}
      <section className="relative py-28 lg:py-36 px-6 overflow-hidden bg-zinc-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[radial-gradient(ellipse,rgba(2,109,50,0.14)_0%,transparent_65%)] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse,rgba(99,102,241,0.10)_0%,transparent_65%)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <Reveal>
              <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/40 border border-white/10 px-3 py-1.5 rounded-full">
                Everything included
              </span>
            </Reveal>
            <Reveal delay={150}>
              <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.08]">
                The complete{' '}
                <span className="bg-gradient-to-r from-[#A3FFB3] to-[#30c06b] bg-clip-text text-transparent">
                  career toolkit.
                </span>
              </h2>
            </Reveal>
            <Reveal delay={260}>
              <p className="text-lg text-white/35 max-w-lg mx-auto">
                Every tool you need — from first draft to final offer.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BENTO.map((feat, i) => (
              <Reveal key={feat.label} delay={i * 70} className={`sm:col-span-1 ${feat.size} h-full`}>
                <div className={`
                  group relative h-full rounded-[1.75rem] border border-white/8
                  bg-gradient-to-br ${feat.gradient} backdrop-blur-sm
                  transition-all duration-500 ${feat.glow}
                  hover:-translate-y-1.5 hover:scale-[1.01]
                  p-7 flex flex-col gap-5 overflow-hidden cursor-default min-h-[180px]
                `}
                  style={{ transition: `transform 0.5s ${E}, box-shadow 0.5s ${E}` }}
                >
                  <div className="absolute inset-0 rounded-[1.75rem] opacity-0 group-hover:opacity-100"
                    style={{ background: 'radial-gradient(ellipse at top left, rgba(255,255,255,0.05), transparent 60%)', transition: `opacity 0.4s ${E}` }} />
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-[0.875rem] ${feat.iconBg} shadow-lg flex-shrink-0`}>
                    <feat.Icon size={20} strokeWidth={2} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-white text-[15px] mb-2">{feat.label}</h3>
                    <p className="text-sm text-white/45 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
