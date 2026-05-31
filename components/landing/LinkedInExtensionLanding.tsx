'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useInView,
  AnimatePresence,
} from 'framer-motion'
import {
  Download, Eye, Search, FileCheck2, ShieldCheck,
  Target, Wand2, ArrowRight, Check, ChevronRight, Lock,
} from 'lucide-react'
import LinkedInFeatureShowcase from './LinkedInFeatureShowcase'

// ── Shared easing ─────────────────────────────────────────────────────────
const ease = [0.16, 1, 0.3, 1] as const

// ── Chrome logo (tri-color wedges + blue center) ────────────────────────────
function ChromeLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#ea4335" d="M24 24 L3.22 12 A24 24 0 0 1 44.78 12 Z" />
      <path fill="#fbbc04" d="M24 24 L44.78 12 A24 24 0 0 1 24 48 Z" />
      <path fill="#34a853" d="M24 24 L24 48 A24 24 0 0 1 3.22 12 Z" />
      <circle cx="24" cy="24" r="11" fill="#fff" />
      <circle cx="24" cy="24" r="9.2" fill="#4285f4" />
    </svg>
  )
}

// ── Scroll-reveal wrapper ───────────────────────────────────────────────────
function Reveal({
  children,
  className = '',
  delay = 0,
  y = 48,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.8, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

// ── Magnetic button wrapper ─────────────────────────────────────────────────
function Magnetic({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 300, damping: 20 })
  const sy = useSpring(y, { stiffness: 300, damping: 20 })
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        x.set((e.clientX - r.left - r.width / 2) * 0.18)
        y.set((e.clientY - r.top - r.height / 2) * 0.18)
      }}
      onMouseLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}

// ── Animated score ring (count up + draw) ───────────────────────────────────
function ScoreRing({ to = 67 }: { to?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    let cancelled = false
    const start = performance.now()
    const tick = (now: number) => {
      if (cancelled) return
      const p = Math.min((now - start) / 1600, 1)
      const eased = 1 - Math.pow(1 - p, 4)
      setVal(Math.round(eased * to))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    return () => {
      cancelled = true
    }
  }, [inView, to])

  const R = 52
  const C = 2 * Math.PI * R
  const pct = val / 100

  return (
    <div ref={ref} className="relative h-36 w-36">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(2,109,50,0.10)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A3FFB3" />
            <stop offset="100%" stopColor="#026d32" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black tabular-nums tracking-tight text-zinc-950">{val}</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">/ 100</span>
      </div>
    </div>
  )
}

// ── Parallax image (subtle float on scroll) ─────────────────────────────────
function ParallaxImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
}: {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
}) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [40, -40])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.96, 1, 0.98])
  return (
    <motion.div ref={ref} style={{ y, scale }} className={className}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes="(max-width: 768px) 100vw, 1100px"
        className="h-auto w-full"
      />
    </motion.div>
  )
}

// ── Top scroll-progress bar (green → LinkedIn blue) ─────────────────────────
function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed left-0 top-0 z-[60] h-1 w-full origin-left bg-gradient-to-r from-[#026d32] via-[#30c06b] to-[#0A66C2]"
    />
  )
}

// ── LinkedIn-style "recruiter search" marquee ───────────────────────────────
const SEARCH_TERMS = [
  'Senior Product Manager', 'React · TypeScript', '#OpenToWork', 'Growth Marketing',
  '5+ yrs SaaS', 'Data Scientist', 'Remote · EMEA', 'Design Systems',
  'Series B startup', 'Go-to-market', 'Kubernetes', 'Headline keyword match',
]

function SearchMarquee() {
  return (
    <section className="relative overflow-hidden border-y border-zinc-100 bg-white py-7">
      <Reveal className="mb-5 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-400">
          The searches recruiters actually run
        </p>
      </Reveal>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white to-transparent sm:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white to-transparent sm:w-32" />
        <motion.div
          aria-hidden
          className="flex w-max gap-3"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          {[...SEARCH_TERMS, ...SEARCH_TERMS].map((term, i) => (
            <motion.span
              key={i}
              whileHover={{ y: -3, scale: 1.04 }}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold ${
                i % 2 === 0
                  ? 'border-[#0A66C2]/15 bg-[#0A66C2]/[0.06] text-[#0A66C2]'
                  : 'border-[#026d32]/15 bg-[#026d32]/[0.06] text-[#026d32]'
              }`}
            >
              <Search className="h-3.5 w-3.5 opacity-60" aria-hidden />
              {term}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/PLACEHOLDER_EXTENSION_ID'

// ══ HERO ════════════════════════════════════════════════════════════════════
function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 120])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-[linear-gradient(180deg,#f7fbf8_0%,#ffffff_60%,#f2f7f3_100%)] px-6 pb-20 pt-28 sm:pt-36"
    >
      {/* layered aurora — stacked radial fields for depth */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_72%_-5%,rgba(163,255,179,0.55),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_88%_42%,rgba(10,102,194,0.16),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_8%_75%,rgba(2,109,50,0.14),transparent_55%)]" />
      </div>
      {/* dot grid (fades toward edges) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(2,109,50,0.16) 1px, transparent 0)',
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(ellipse 80% 75% at 50% 25%, #000 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 75% at 50% 25%, #000 30%, transparent 80%)',
        }}
      />
      {/* animated orbs */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -right-20 -top-24 h-[520px] w-[520px] rounded-full bg-[#A3FFB3]/40 blur-3xl"
          animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.75, 0.5] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute left-[55%] top-24 h-[420px] w-[420px] rounded-full bg-[#0A66C2]/14 blur-3xl"
          animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.6, 0.4], x: [0, 26, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className="absolute -left-28 bottom-0 h-[400px] w-[400px] rounded-full bg-[#026d32]/12 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      <motion.div
        style={{ y, opacity }}
        className="relative mx-auto grid max-w-[80rem] items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]"
      >
        {/* copy */}
        <div className="space-y-7">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="inline-flex items-center gap-2 rounded-full border border-[#026d32]/15 bg-[#026d32]/8 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#026d32]"
          >
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-[#026d32]"
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Free Chrome extension
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
            className="text-4xl font-black leading-[1.04] tracking-tight text-zinc-950 sm:text-5xl lg:text-[3.6rem]"
          >
            Score your LinkedIn profile the way{' '}
            <span className="bg-gradient-to-r from-[#026d32] via-[#30c06b] to-[#0A66C2] bg-clip-text text-transparent">
              recruiters actually search.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            className="max-w-xl text-base leading-7 text-zinc-600 sm:text-lg"
          >
            Open your profile and get an instant recruiter-search score, section-by-section fixes, and a
            resume&#8596;LinkedIn consistency check — without ever handing over your password.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease }}
            className="flex flex-wrap items-center gap-3"
          >
            <Magnetic>
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="group inline-flex items-center gap-2.5 rounded-full bg-zinc-950 px-8 py-4 text-base font-bold text-white shadow-xl shadow-zinc-950/25 transition hover:bg-zinc-800"
              >
                <ChromeLogo className="h-6 w-6" />
                Add to Chrome — free
                <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </motion.span>
              </a>
            </Magnetic>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap gap-2 pt-1"
          >
            {['Never asks for your password', 'Teaser score, no signup', 'Runs in your browser'].map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-zinc-500"
              >
                <Check className="h-3 w-3 text-[#026d32]" aria-hidden />
                {t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* visual: product scene + floating score panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.4, ease }}
          className="relative mx-auto w-full max-w-md"
        >
          {/* grounding glow behind the product scene */}
          <div className="absolute left-1/2 top-1/2 -z-0 h-[115%] w-[115%] -translate-x-1/2 -translate-y-1/2 rounded-[40%] bg-[radial-gradient(circle,rgba(2,109,50,0.30),rgba(10,102,194,0.12)_45%,transparent_70%)] blur-2xl" />

          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative mx-auto w-64 sm:w-80"
          >
            <Image
              src="/linkedin-extension/recruiter-search.webp"
              alt="Rezoomed mascot scanning candidate profiles with a magnifying glass, one highlighted as a strong match"
              width={1024}
              height={1536}
              priority
              sizes="(max-width: 768px) 16rem, 20rem"
              className="relative z-10 h-auto w-full overflow-hidden rounded-[2rem] shadow-[0_40px_90px_rgba(2,30,15,0.30)] ring-1 ring-black/5"
            />
          </motion.div>

          {/* floating score card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease }}
            className="absolute -bottom-6 -left-2 z-20 w-60 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_24px_60px_rgba(18,24,21,0.14)] backdrop-blur-md sm:-left-6"
          >
            <div className="flex items-center gap-3">
              <div className="-my-2 scale-[0.62]">
                <ScoreRing to={67} />
              </div>
              <div className="-ml-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                  Recruiter score
                </p>
                <p className="text-sm font-black text-zinc-900">Needs work</p>
                <p className="mt-0.5 text-[11px] text-[#026d32]">+23 pts available</p>
              </div>
            </div>
          </motion.div>

          {/* floating chip (LinkedIn blue accent) */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1, ease }}
            whileHover={{ y: -4, rotate: -2 }}
            className="absolute -right-2 top-6 z-20 rounded-xl border border-[#0A66C2]/20 bg-white/90 px-3 py-2 shadow-lg shadow-[#0A66C2]/10 backdrop-blur-md"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700">
              <Eye className="h-3.5 w-3.5 text-[#0A66C2]" aria-hidden />
              14 checks
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* stat band — grounds the hero */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7, ease }}
        className="relative mx-auto mt-16 max-w-[80rem] border-t border-zinc-200/70 pt-8"
      >
        <dl className="grid grid-cols-2 gap-y-6 sm:grid-cols-4">
          {[
            { v: '0–100', l: 'Recruiter-search score' },
            { v: '14', l: 'Profile checks' },
            { v: '5', l: 'Score categories' },
            { v: '100%', l: 'On-device free scan' },
          ].map((s) => (
            <div key={s.l} className="px-2 text-center sm:border-r sm:border-zinc-200/70 sm:last:border-r-0">
              <dt className="bg-gradient-to-r from-[#026d32] to-[#0A66C2] bg-clip-text text-3xl font-black tabular-nums tracking-tight text-transparent sm:text-4xl">
                {s.v}
              </dt>
              <dd className="mt-1 text-xs font-semibold text-zinc-500">{s.l}</dd>
            </div>
          ))}
        </dl>
      </motion.div>
    </section>
  )
}

// ══ DIFFERENTIATORS ═══════════════════════════════════════════════════════════
const DIFFERENTIATORS = [
  {
    Icon: Search,
    title: 'Recruiter-search simulation',
    body: 'We grade how findable you are — keyword density, headline match, signal strength — not just how complete your profile looks.',
  },
  {
    Icon: Target,
    title: 'Real-hired-profile framing',
    body: 'Checks are calibrated against people recently hired into your target role. Pass = "looks like who got the job."',
  },
  {
    Icon: FileCheck2,
    title: 'Resume↔LinkedIn consistency',
    body: 'Spot where your profile drifts from the resume you sent — headline, title, skills — before recruiters do.',
  },
]

function Differentiators() {
  return (
    <section className="relative overflow-hidden bg-[#f7f9f8] px-6 py-24">
      <div className="absolute -left-32 top-1/3 h-[360px] w-[360px] rounded-full bg-[#A3FFB3]/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        {/* image */}
        <Reveal>
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-4 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(2,109,50,0.18),transparent_70%)] blur-xl" />
            <ParallaxImage
              src="/linkedin-extension/showcase.webp"
              alt="Rezoomed optimizer panel docked beside a LinkedIn-style profile, showing a recruiter-readiness score ring and section checks"
              width={1536}
              height={1024}
              className="relative overflow-hidden rounded-[2rem] shadow-[0_40px_90px_rgba(2,30,15,0.30)] ring-1 ring-black/5"
            />
          </div>
        </Reveal>

        {/* copy */}
        <div>
          <Reveal className="mb-8 max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#026d32]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#026d32]">
              Why it&rsquo;s different
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
              Built on what gets people hired, not what fills the form
            </h2>
          </Reveal>
          <div className="space-y-3">
            {DIFFERENTIATORS.map((d, i) => (
              <Reveal key={d.title} delay={i * 0.1}>
                <motion.div
                  whileHover={{ x: 6 }}
                  transition={{ duration: 0.3, ease }}
                  className="group flex gap-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-[0_12px_30px_rgba(18,24,21,0.04)] transition-colors duration-300 hover:border-[#0A66C2]/25 hover:shadow-[0_20px_45px_rgba(10,102,194,0.10)]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#026d32] to-[#30c06b] shadow-lg shadow-[#026d32]/20 transition-all duration-300 group-hover:from-[#0A66C2] group-hover:to-[#378FE9] group-hover:shadow-[#0A66C2]/25">
                    <d.Icon className="h-5 w-5 text-white" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-950">{d.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">{d.body}</p>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ══ HOW IT WORKS ══════════════════════════════════════════════════════════════
const STEPS = [
  { n: '01', Icon: Download, title: 'Install in one click', body: 'Add Rezoomed to Chrome. No account required to see your first teaser score.' },
  { n: '02', Icon: Eye, title: 'Open your LinkedIn profile', body: 'The panel appears in the corner with your recruiter-search score and the two biggest issues holding you back.' },
  { n: '03', Icon: Wand2, title: 'Sign in to unlock the full breakdown', body: 'A free Rezoomed account unlocks every section check plus the resume consistency gap. Pro adds per-section AI fixes.' },
]

function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-white px-6 py-24">
      <div className="absolute left-1/2 top-0 h-72 w-[700px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(163,255,179,0.12),transparent)]" />
      <div className="relative mx-auto max-w-6xl">
        <Reveal className="mb-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#026d32]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#026d32]">
            How it works
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
            Three steps to a recruiter-ready profile
          </h2>
        </Reveal>
        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.12}>
              <div className="group relative text-center">
                {i < STEPS.length - 1 && (
                  <div className="absolute left-[62%] top-10 hidden h-px w-[76%] bg-gradient-to-r from-[#0A66C2]/30 to-transparent md:block" />
                )}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -4 }}
                  transition={{ duration: 0.3 }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#A3FFB3]/40 bg-gradient-to-br from-[#f0fdf4] to-white shadow-[0_20px_50px_rgba(2,109,50,0.08)] transition-colors duration-300 group-hover:border-[#0A66C2]/30 group-hover:from-[#eff6ff]"
                >
                  <s.Icon className="h-7 w-7 text-[#026d32] transition-colors duration-300 group-hover:text-[#0A66C2]" aria-hidden />
                </motion.div>
                <div className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-[#026d32]/40">{s.n}</div>
                <h3 className="text-lg font-black text-zinc-950">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-7 text-zinc-500">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ══ PRIVACY STRIP ═════════════════════════════════════════════════════════════
function PrivacyStrip() {
  const items = [
    { Icon: Lock, t: 'Free scan stays on-device', d: 'Profile parsing happens entirely in your browser. Nothing about your content leaves the device for the free scan.' },
    { Icon: ShieldCheck, t: 'No password, ever', d: 'The extension never asks for your LinkedIn credentials. It only reads the page you are already viewing.' },
    { Icon: FileCheck2, t: 'No data brokerage', d: 'No ads, no third-party tracking pixels, no selling data. Pro rewrites are processed statelessly.' },
  ]
  return (
    <section className="relative overflow-hidden bg-[#020a06] px-6 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(2,109,50,0.28),transparent)]" />
      <div className="relative mx-auto max-w-6xl">
        <Reveal className="mb-12 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
            Privacy first
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Your profile stays yours
          </h2>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.t} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3, ease }}
                className="group h-full rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-7 backdrop-blur-sm transition-colors duration-300 hover:border-[#A3FFB3]/30 hover:bg-white/[0.06]"
              >
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#A3FFB3]/15 transition-transform duration-300 group-hover:scale-110">
                  <it.Icon className="h-5 w-5 text-[#A3FFB3]" aria-hidden />
                </div>
                <h3 className="text-base font-black text-white">{it.t}</h3>
                <p className="mt-2 text-sm leading-7 text-white/40">{it.d}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.3}>
          <Link
            href="/privacy/linkedin-extension"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-bold text-[#A3FFB3] transition hover:text-white"
          >
            Read the full extension privacy policy <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

// ══ FAQ ═══════════════════════════════════════════════════════════════════════
function FAQ({ faqs }: { faqs: ReadonlyArray<{ question: string; answer: string }> }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="relative overflow-hidden bg-[#f7f9f8] px-6 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_0%,rgba(163,255,179,0.08),transparent)]" />
      <div className="relative mx-auto max-w-3xl">
        <Reveal className="mb-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#026d32]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#026d32]">
            FAQ
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">Frequently asked</h2>
        </Reveal>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <Reveal key={f.question} delay={i * 0.05}>
              <motion.div layout className="overflow-hidden rounded-[1.5rem] border border-zinc-100 bg-white shadow-[0_12px_30px_rgba(18,24,21,0.03)] transition-colors duration-300 hover:border-[#0A66C2]/25">
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  className="flex w-full cursor-pointer items-center justify-between px-6 py-5 text-left"
                >
                  <span className="pr-4 text-base font-black tracking-tight text-zinc-950">{f.question}</span>
                  <motion.span
                    animate={{ rotate: open === i ? 45 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg font-bold text-zinc-600"
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease }}
                    >
                      <p className="px-6 pb-5 text-sm leading-7 text-zinc-500">{f.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ══ CTA ═══════════════════════════════════════════════════════════════════════
function CTA() {
  return (
    <section className="relative overflow-hidden bg-[#020a06] px-6 py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(2,109,50,0.30),transparent)]" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-[#A3FFB3]/10"
            style={{ width: 220 + i * 200, height: 220 + i * 200 }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <Reveal>
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="mx-auto mb-8 w-28"
          >
            <Image
              src="/Brands/mascot-hero-pink.webp"
              alt="Rezoomed mascot celebrating an optimized profile"
              width={240}
              height={290}
              className="h-auto w-full drop-shadow-[0_20px_40px_rgba(163,255,179,0.3)]"
            />
          </motion.div>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
            Stop guessing what&rsquo;s wrong with your{' '}
            <span className="bg-gradient-to-r from-[#A3FFB3] to-[#30c06b] bg-clip-text text-transparent italic">
              LinkedIn.
            </span>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/40">
            Install the extension, open your profile, and see what recruiters see — in under 30 seconds.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Magnetic>
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-9 py-4 text-base font-black text-[#026d32] transition hover:bg-[#A3FFB3]"
              >
                <ChromeLogo className="h-5 w-5" />
                Add to Chrome — free
              </a>
            </Magnetic>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-9 py-4 text-base font-bold text-white/80 transition hover:border-[#A3FFB3]/40 hover:text-white"
            >
              See Pro pricing
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.4}>
          <p className="mt-6 text-sm text-white/20">No credit card · Free teaser score · No password required</p>
        </Reveal>
      </div>
    </section>
  )
}

export default function LinkedInExtensionLanding({
  faqs,
}: {
  faqs: ReadonlyArray<{ question: string; answer: string }>
}) {
  return (
    <>
      <ScrollProgress />
      <Hero />
      <SearchMarquee />
      <LinkedInFeatureShowcase />
      <Differentiators />
      <HowItWorks />
      <PrivacyStrip />
      <FAQ faqs={faqs} />
      <CTA />
    </>
  )
}
