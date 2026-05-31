'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'
import { Sparkles, ArrowRight, AlertTriangle, Check, Activity } from 'lucide-react'

const ease = [0.16, 1, 0.3, 1] as const

// ── count-up that fires when in view ────────────────────────────────────────
function useCountUp(to: number, run: boolean, dur = 1400) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!run) return
    let cancelled = false
    const start = performance.now()
    const tick = (now: number) => {
      if (cancelled) return
      const p = Math.min((now - start) / dur, 1)
      setV(Math.round((1 - Math.pow(1 - p, 4)) * to))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    return () => {
      cancelled = true
    }
  }, [run, to, dur])
  return v
}

// ── reveal wrapper with direction ───────────────────────────────────────────
function Reveal({
  children,
  className = '',
  delay = 0,
  x = 0,
  y = 40,
}: {
  children: ReactNode
  className?: string
  delay?: number
  x?: number
  y?: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x, y, scale: 0.97 }}
      animate={inView ? { opacity: 1, x: 0, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.8, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MOCKUP A — score + recruiter cutoff
// ════════════════════════════════════════════════════════════════════════════
function ScorePanel() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const score = useCountUp(73, inView)
  const R = 34
  const C = 2 * Math.PI * R
  const youPct = 73
  const cutoffPct = 88

  return (
    <div
      ref={ref}
      className="rounded-[1.6rem] border border-white/10 bg-gradient-to-b from-[#11161300] to-[#0c100e] p-6 shadow-[0_40px_90px_rgba(0,0,0,0.5)] ring-1 ring-white/5"
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-white/50">
        <Activity className="h-3.5 w-3.5 text-[#34d399]" aria-hidden />
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-[#34d399]"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
        Real-time <span className="font-bold text-white">LinkedIn</span> scan
      </div>

      <div className="mt-5 flex items-center gap-5">
        {/* ring */}
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
            <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
            <motion.circle
              cx="40"
              cy="40"
              r={R}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={inView ? { strokeDashoffset: C * (1 - youPct / 100) } : {}}
              transition={{ duration: 1.4, ease }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black tabular-nums text-white">{score}</span>
            <span className="text-[8px] font-bold tracking-widest text-white/40">OF 100</span>
          </div>
        </div>

        {/* potential */}
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#34d399]">Potential score</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-black text-[#f87171]">73</span>
            <ArrowRight className="h-4 w-4 text-white/40" aria-hidden />
            <span className="text-3xl font-black text-[#2dd4bf]">100</span>
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: 1, duration: 0.5, ease }}
              className="rounded-full bg-[#2dd4bf]/15 px-2 py-0.5 text-xs font-bold text-[#2dd4bf]"
            >
              ↗ +27
            </motion.span>
          </div>
        </div>
      </div>

      {/* score bar */}
      <div className="relative mt-7 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.1, duration: 0.4 }}
          className="absolute top-0 -translate-x-1/2 rounded-md bg-[#fbbf24] px-2 py-0.5 text-[10px] font-black text-black"
          style={{ left: `${youPct}%` }}
        >
          You · 73
        </motion.div>
        <div className="relative h-1.5 rounded-full bg-white/10">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#f87171] via-[#fbbf24] to-[#fbbf24]"
            initial={{ width: 0 }}
            animate={inView ? { width: `${youPct}%` } : {}}
            transition={{ duration: 1.4, ease }}
          />
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0c100e] bg-[#fbbf24]"
            style={{ left: `${youPct}%` }}
          />
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0c100e] bg-[#34d399] shadow-[0_0_0_3px_rgba(52,211,153,0.25)]"
            style={{ left: `${cutoffPct}%` }}
          />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 1.3, duration: 0.4 }}
          className="mt-2 flex justify-end"
        >
          <span className="rounded-md border border-[#34d399]/30 bg-[#34d399]/10 px-2 py-0.5 text-[10px] font-bold text-[#34d399]">
            Recruiter cutoff · 88
          </span>
        </motion.div>
      </div>

      <p className="mt-4 text-xs leading-5 text-white/45">
        You&rsquo;re 15 points short of the 88-point cutoff — where recruiters start surfacing profiles.
      </p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MOCKUP B — severity-ranked sections
// ════════════════════════════════════════════════════════════════════════════
const SECTIONS = [
  { name: 'Signals', frac: '6/13', tone: 'critical', meta: '1 check need work · 1 passing · 7 pts left' },
  { name: 'Discoverability', frac: '24/32', tone: 'warn', meta: '1 check need work · 2 passing · 8 pts left' },
  { name: 'Completeness', frac: '31/41', tone: 'warn', meta: '2 checks need work · 3 passing · 10 pts left' },
  { name: 'Content quality', frac: '18/26', tone: 'warn', meta: '2 checks need work · 4 passing · 6 pts left' },
] as const

const toneMap = {
  critical: { bar: 'bg-[#f87171]', pill: 'text-[#f87171] border-[#f87171]/30 bg-[#f87171]/10', label: 'Critical' },
  warn: { bar: 'bg-[#fbbf24]', pill: 'text-[#fbbf24] border-[#fbbf24]/30 bg-[#fbbf24]/10', label: 'Needs work' },
} as const

function SectionsPanel() {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-[#0c100e] p-5 shadow-[0_40px_90px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
      <p className="mb-3 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Sections</p>
      <div className="space-y-2.5">
        {SECTIONS.map((s, i) => {
          const t = toneMap[s.tone]
          return (
            <Reveal key={s.name} delay={i * 0.12} x={20} y={0}>
              <div className="relative overflow-hidden rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <span className={`absolute inset-y-0 left-0 w-1 ${t.bar}`} />
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-black text-white">{s.name}</span>
                    <span className="text-xs font-semibold text-white/40">{s.frac}</span>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${t.pill}`}>
                    {t.label}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-white/40">{s.meta}</p>
                {i === 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    whileInView={{ opacity: 1, height: 'auto' }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.5, ease }}
                    className="mt-3 overflow-hidden rounded-lg border border-[#fbbf24]/20 bg-[#fbbf24]/[0.06] p-3"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#fbbf24]">
                      <AlertTriangle className="h-3 w-3" aria-hidden /> To do · needs work
                    </div>
                    <p className="mt-1 text-xs font-bold text-white">Recommendations</p>
                    <p className="mt-0.5 text-[11px] leading-5 text-white/45">
                      No recommendations on your profile yet. Request 1–2 from managers or peers.
                    </p>
                  </motion.div>
                )}
              </div>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MOCKUP C — recruiter search simulation (Boolean)
// ════════════════════════════════════════════════════════════════════════════
const BOOLEAN_TOKENS = `( "Product Manager" OR PM OR "Product Lead" OR "Product Owner" ) AND ( SaaS OR B2B OR B2C OR Enterprise OR Marketplace ) AND ( mobile OR web OR platform OR API ) AND roadmap AND prioritization AND discovery`.split(' ')

function tokenClass(tok: string) {
  if (tok === 'OR') return 'text-[#fbbf24] font-bold'
  if (tok === 'AND') return 'text-[#34d399] font-bold'
  if (tok.startsWith('"') || tok.endsWith('"')) return 'text-white'
  if (tok === '(' || tok === ')') return 'text-white/40'
  return 'text-white/70'
}

function BooleanPanel() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <div
      ref={ref}
      className="rounded-[1.6rem] border border-white/10 bg-[#0c100e] p-5 shadow-[0_40px_90px_rgba(0,0,0,0.5)] ring-1 ring-white/5"
    >
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
        Recruiter search simulation
      </p>
      <h4 className="text-base font-black text-white">Recruiters running similar search would skip you.</h4>

      <div className="mt-3 rounded-xl border border-white/8 bg-black/30 p-3 font-mono text-[12px] leading-6">
        {BOOLEAN_TOKENS.map((tok, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 + i * 0.025, duration: 0.3 }}
            className={tokenClass(tok)}
          >
            {tok}{' '}
          </motion.span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-white/45">Missing required terms: prioritization, discovery.</p>
        <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#f87171]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden /> 2 missing terms
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.02] p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Missing terms by section</p>
        <div className="mt-2 space-y-2">
          {['About', 'Experience'].map((sec, i) => (
            <motion.div
              key={sec}
              initial={{ opacity: 0, x: 16 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.9 + i * 0.15, duration: 0.4, ease }}
              className="flex items-center gap-2 text-xs"
            >
              <span className="rounded-md border border-[#f87171]/30 bg-[#f87171]/10 px-2 py-0.5 font-bold text-[#f87171]">
                {sec}
              </span>
              <span className="text-white/55">prioritization, discovery</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MOCKUP D — one-click AI fixes
// ════════════════════════════════════════════════════════════════════════════
function AiFixPanel() {
  return (
    <div className="rounded-[1.6rem] border border-[#34d399]/20 bg-gradient-to-b from-[#0f1a14] to-[#0c100e] p-6 shadow-[0_40px_90px_rgba(0,0,0,0.5)] ring-1 ring-[#34d399]/10">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#34d399]/15">
          <Sparkles className="h-5 w-5 text-[#34d399]" aria-hidden />
        </div>
        <div>
          <p className="text-base font-black text-white">Fix all 3 issues with AI</p>
          <p className="mt-0.5 text-xs text-white/45">
            One-click rewrites for headline, About, experience &amp; skills.
          </p>
        </div>
      </div>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#10b981] to-[#34d399] py-3 text-sm font-black text-[#04130c] shadow-lg shadow-[#10b981]/20"
      >
        <Sparkles className="h-4 w-4" aria-hidden /> Fix with AI <ArrowRight className="h-4 w-4" aria-hidden />
      </motion.button>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {['Headline', 'About', 'Experience', 'Skills'].map((f, i) => (
          <motion.div
            key={f}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.4, ease }}
            className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.02] px-2.5 py-2 text-[11px] font-semibold text-white/60"
          >
            <Check className="h-3 w-3 text-[#34d399]" aria-hidden /> {f}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// FEATURE ROWS
// ════════════════════════════════════════════════════════════════════════════
const FEATURES = [
  {
    eyebrow: 'Recruiter-cutoff scoring',
    title: 'A score that means something to recruiters',
    body: 'Not a vanity number. We plot you against the 88-point cutoff where recruiters actually start surfacing profiles — and show exactly how many points you’re short.',
    Mockup: ScorePanel,
  },
  {
    eyebrow: 'Severity-ranked sections',
    title: 'Know what to fix first',
    body: 'Every section is graded Critical, Needs work, or Passing — with the exact checks failing and the points each one is costing you. No guessing.',
    Mockup: SectionsPanel,
  },
  {
    eyebrow: 'Recruiter search simulation',
    title: 'See the search that skips you',
    body: 'We rebuild the Boolean query a recruiter would run for your target role, then highlight the required keywords missing from your About and Experience.',
    Mockup: BooleanPanel,
  },
  {
    eyebrow: 'One-click AI fixes',
    title: 'Fix every gap in one click',
    body: 'Pro rewrites your headline, About, experience bullets, and skills — anchored to your resume — so you clear the cutoff without staring at a blank field.',
    Mockup: AiFixPanel,
  },
] as const

export default function LinkedInFeatureShowcase() {
  return (
    <section className="relative overflow-hidden bg-[#050806] px-6 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_0%,rgba(16,185,129,0.18),transparent)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(circle, #34d399 1px, transparent 1px)',
          backgroundSize: '34px 34px',
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#34d399]">
            <Activity className="h-3.5 w-3.5" /> Inside the scan
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            What the panel actually shows you
          </h2>
          <p className="mt-4 text-base leading-7 text-white/45">
            A live, recruiter-grade breakdown of your profile — scroll to see each piece.
          </p>
        </Reveal>

        <div className="space-y-20 sm:space-y-28">
          {FEATURES.map((f, i) => {
            const flipped = i % 2 === 1
            const { Mockup } = f
            return (
              <div
                key={f.title}
                className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
              >
                {/* copy */}
                <Reveal
                  x={flipped ? 40 : -40}
                  y={0}
                  className={flipped ? 'lg:order-2' : ''}
                >
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-[#34d399]">
                    {f.eyebrow}
                  </span>
                  <h3 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {f.title}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-7 text-white/50 sm:text-base">{f.body}</p>
                </Reveal>

                {/* mockup */}
                <Reveal
                  x={flipped ? -40 : 40}
                  y={0}
                  delay={0.1}
                  className={flipped ? 'lg:order-1' : ''}
                >
                  <Mockup />
                </Reveal>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
