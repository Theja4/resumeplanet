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
  Sparkles, BarChart3, Target, FileText, Wand2, Shield,
  FileUser, BriefcaseBusiness, Check, ArrowRight, Star,
  ChevronRight, Zap, TrendingUp, Users,
} from 'lucide-react'

// ── Easing ──────────────────────────────────────────────────────────────────
const ease = [0.16, 1, 0.3, 1] as const

// ── Deterministic pseudo-random based on seed ─────────────────────────────
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

// ── Floating particles ──────────────────────────────────────────────────────
// Mount-gated so framer-motion's runtime style serialization can't disagree
// with the server-rendered HTML (numeric vs "Npx" mismatch in inline style).
function FloatingParticles() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden />
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: seededRandom(i * 4) * 4 + 2,
            height: seededRandom(i * 4 + 1) * 4 + 2,
            left: `${seededRandom(i * 4 + 2) * 100}%`,
            top: `${seededRandom(i * 4 + 3) * 100}%`,
            background: i % 3 === 0
              ? 'rgba(163, 255, 179, 0.6)'
              : i % 3 === 1
              ? 'rgba(2, 109, 50, 0.4)'
              : 'rgba(255, 255, 255, 0.3)',
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, seededRandom(i * 4 + 5) * 20 - 10, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: seededRandom(i * 4 + 6) * 4 + 4,
            repeat: Infinity,
            delay: seededRandom(i * 4 + 7) * 3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ── Gradient orbs ───────────────────────────────────────────────────────────
function GradientOrb({
  className,
  delay = 0,
}: {
  className: string
  delay?: number
}) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      animate={{
        scale: [1, 1.15, 1],
        opacity: [0.4, 0.7, 0.4],
        x: [0, 30, 0],
        y: [0, -20, 0],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
    />
  )
}

// ── Scroll reveal wrapper ───────────────────────────────────────────────────
function Reveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 60 : direction === 'down' ? -60 : 0,
      x: direction === 'left' ? -60 : direction === 'right' ? 60 : 0,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
    },
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      transition={{ duration: 0.9, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

// ── Magnetic hover ──────────────────────────────────────────────────────────
function MagneticButton({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 300, damping: 20 })
  const springY = useSpring(y, { stiffness: 300, damping: 20 })

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        x.set((e.clientX - rect.left - rect.width / 2) * 0.15)
        y.set((e.clientY - rect.top - rect.height / 2) * 0.15)
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

// ── Animated counter ────────────────────────────────────────────────────────
function Counter({ to, suffix = '', duration = 2 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    let cancelled = false
    const start = performance.now()
    const raf = (now: number) => {
      if (cancelled) return
      const p = Math.min((now - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - p, 4)
      setCount(Math.round(eased * to))
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => { cancelled = true }
  }, [isInView, to, duration])

  return <span ref={ref}>{count}{suffix}</span>
}

// ── Glowing card ────────────────────────────────────────────────────────────
function GlowCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      ref={ref}
      className={`relative group ${className}`}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.4, ease }}
    >
      <div
        className="absolute -inset-px rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: isHovered
            ? `radial-gradient(400px at ${mousePos.x}px ${mousePos.y}px, rgba(163,255,179,0.25), transparent 60%)`
            : undefined,
        }}
      />
      {children}
    </motion.div>
  )
}

// ── Text reveal ─────────────────────────────────────────────────────────────
function TextReveal({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const words = text.split(' ')

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.3em]">
          <motion.span
            className="inline-block"
            initial={{ y: '110%', rotate: 5 }}
            animate={isInView ? { y: 0, rotate: 0 } : {}}
            transition={{
              duration: 0.7,
              delay: delay + i * 0.06,
              ease,
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

// ── Typewriter ──────────────────────────────────────────────────────────────
function Typewriter({ words, className = '' }: { words: string[]; className?: string }) {
  const [idx, setIdx] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    setHasAnimated(true)
    const timer = setInterval(() => {
      setIdx(i => (i + 1) % words.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [words.length])

  return (
    <span className={`inline-block relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={hasAnimated ? { y: 30, opacity: 0, filter: 'blur(8px)' } : false}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -30, opacity: 0, filter: 'blur(8px)' }}
          transition={{ duration: 0.5, ease }}
          className="inline-block"
        >
          {words[idx]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ── HERO ────────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function HeroSection() {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9])

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#020a06]">
      {/* Mesh gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(2,109,50,0.35),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,rgba(163,255,179,0.08),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_20%_80%,rgba(0,143,68,0.12),transparent)]" />
      </div>

      {/* Animated grid */}
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: 'linear-gradient(rgba(163,255,179,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(163,255,179,0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <FloatingParticles />

      <GradientOrb className="w-[600px] h-[600px] bg-[#026d32]/30 top-[-200px] right-[-100px]" />
      <GradientOrb className="w-[400px] h-[400px] bg-[#A3FFB3]/15 bottom-[-100px] left-[-100px]" delay={3} />
      <GradientOrb className="w-[300px] h-[300px] bg-[#008f44]/20 top-[40%] left-[60%]" delay={5} />

      {/* Horizontal light sweep */}
      <motion.div
        className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#A3FFB3]/60 to-transparent"
        animate={{ y: ['0vh', '100vh'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-6 w-full"
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
      >
        <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-center">
          <div className="space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease }}
            >
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <motion.span
                  className="h-2 w-2 rounded-full bg-[#A3FFB3]"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">AI-Powered Resume Platform</span>
              </div>
            </motion.div>

            {/* Headline */}
            <div>
              <h1 className="font-extrabold tracking-[-0.04em] text-white leading-[0.95]">
                <span className="block text-5xl md:text-7xl lg:text-[5.5rem]">
                  <TextReveal text="Resumes that" delay={0.4} />
                </span>
                <span className="block text-5xl md:text-7xl lg:text-[5.5rem] mt-2">
                  <TextReveal text="actually" delay={0.7} />
                  <span className="ml-3">
                    <Typewriter
                      words={['land jobs.', 'beat ATS.', 'get callbacks.', 'open doors.']}
                      className="bg-gradient-to-r from-[#A3FFB3] via-[#80da92] to-[#30c06b] bg-clip-text text-transparent"
                    />
                  </span>
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <motion.p
              className="text-lg md:text-xl text-white/45 max-w-xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2, ease }}
            >
              Stop gambling with your career. Rezoomed scans, scores, and tailors your resume so every application is optimized before you hit send.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              className="flex flex-wrap items-center gap-4 pt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.5, ease }}
            >
              <MagneticButton>
                <Link href="/auth/register">
                  <motion.button
                    className="group relative px-8 py-4 bg-white text-[#020a06] text-base font-black rounded-full overflow-hidden cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Get Started Free
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight size={16} />
                      </motion.span>
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-[#A3FFB3] to-[#80da92]"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.4 }}
                    />
                  </motion.button>
                </Link>
              </MagneticButton>

              <MagneticButton>
                <Link href="/ats-checker">
                  <motion.button
                    className="px-8 py-4 text-base font-bold rounded-full border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition-all backdrop-blur-sm cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Check ATS Score
                  </motion.button>
                </Link>
              </MagneticButton>
            </motion.div>

            <motion.p
              className="text-sm text-white/25"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
            >
              No credit card required · Free plan available
            </motion.p>
          </div>

          {/* Mascot */}
          <motion.div
            className="hidden lg:block relative"
            initial={{ opacity: 0, x: 100, rotate: -10 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 1.2, delay: 0.8, ease }}
          >
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              {/* Glow behind mascot */}
              <div className="absolute inset-0 blur-[80px] bg-[#A3FFB3]/20 rounded-full scale-125" />
              <Image
                src="/ats-mascot.png"
                alt="Rezoomed mascot"
                width={380}
                height={460}
                priority
                className="relative z-10 drop-shadow-[0_30px_60px_rgba(163,255,179,0.25)]"
              />
              {/* Floating badges around mascot */}
              <motion.div
                className="absolute -left-12 top-1/4 px-3 py-2 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md"
                animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#A3FFB3] font-black text-lg">98%</span>
                  <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider">ATS</span>
                </div>
              </motion.div>
              <motion.div
                className="absolute -right-8 bottom-1/3 px-3 py-2 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md"
                animate={{ y: [0, 8, 0], rotate: [2, -2, 2] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-[#A3FFB3]" />
                  <span className="text-white/70 text-xs font-bold">Optimized</span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/25 font-bold">Scroll</span>
        <motion.div
          className="w-5 h-8 rounded-full border border-white/15 flex justify-center pt-1.5"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-2 rounded-full bg-[#A3FFB3]"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ── STATS SECTION ───────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function StatsSection() {
  const stats = [
    { value: 5, suffix: '×', label: 'More callbacks', icon: TrendingUp },
    { value: 200, suffix: '+', label: 'ATS systems tested', icon: Shield },
    { value: 50, suffix: 'K+', label: 'Resumes optimized', icon: FileText },
    { value: 94, suffix: '%', label: 'Avg ATS improvement', icon: Zap },
  ]

  return (
    <section className="relative py-20 px-6 bg-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(163,255,179,0.12),transparent)]" />
      <div className="relative max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.1}>
            <div className="text-center space-y-3 group">
              <motion.div
                className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-[#026d32] to-[#30c06b] flex items-center justify-center shadow-lg shadow-[#026d32]/20"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <stat.icon size={24} className="text-white" />
              </motion.div>
              <div className="text-4xl font-black tracking-tight bg-gradient-to-br from-[#026d32] to-[#30c06b] bg-clip-text text-transparent">
                <Counter to={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-zinc-500 font-medium">{stat.label}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ── PRODUCT SHOWCASE ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function ProductShowcase() {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const imgScale = useTransform(scrollYProgress, [0, 0.5], [0.85, 1])
  const imgY = useTransform(scrollYProgress, [0, 0.5], [80, 0])

  return (
    <section ref={sectionRef} className="relative py-28 px-6 bg-[#f7f9f8] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_100%,rgba(163,255,179,0.15),transparent)]" />

      <div className="relative max-w-7xl mx-auto">
        <Reveal className="text-center space-y-4 mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#026d32]/10 text-[#026d32] text-xs font-bold uppercase tracking-[0.2em]">
            <Sparkles size={12} /> See It In Action
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-zinc-950">
            One platform.<br />
            <span className="bg-gradient-to-r from-[#026d32] to-[#30c06b] bg-clip-text text-transparent">
              Every advantage.
            </span>
          </h2>
        </Reveal>

        <motion.div
          className="relative rounded-[2rem] overflow-hidden border border-black/5 shadow-[0_60px_140px_rgba(0,0,0,0.12)]"
          style={{ scale: imgScale, y: imgY }}
        >
          <Image
            src="/product-hero-v2.png"
            alt="Rezoomed product screenshot"
            width={1792}
            height={1024}
            className="w-full h-auto"
          />
          {/* Glare overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        </motion.div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ── FEATURES BENTO ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const FEATURES = [
  {
    Icon: BarChart3,
    title: 'ATS Scanner',
    desc: 'Scan against 200+ enterprise ATS systems. Get a section-by-section breakdown with plain-English fixes.',
    gradient: 'from-emerald-500 to-green-600',
    glow: 'rgba(16,185,129,0.3)',
    span: 'md:col-span-2',
    href: '/ats-checker',
  },
  {
    Icon: Target,
    title: 'Match Score',
    desc: 'Requirement-by-requirement fit analysis for any job description.',
    gradient: 'from-sky-500 to-blue-600',
    glow: 'rgba(14,165,233,0.3)',
    span: '',
    href: '/match-score',
  },
  {
    Icon: Wand2,
    title: 'AI Tailor',
    desc: 'Paste any JD. AI rewrites your bullets — stronger verbs, better keywords, higher match.',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'rgba(139,92,246,0.3)',
    span: '',
    href: '/resume-tailoring',
  },
  {
    Icon: FileText,
    title: 'Resume Builder',
    desc: 'Build from scratch or import. Live preview with professional templates.',
    gradient: 'from-blue-500 to-indigo-600',
    glow: 'rgba(99,102,241,0.3)',
    span: '',
    href: '/resume-builder',
  },
  {
    Icon: Shield,
    title: 'Metadata Optimizer',
    desc: 'Fix hidden PDF fields ATS systems read before your actual content.',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'rgba(245,158,11,0.3)',
    span: '',
    href: '/metadata-enhancer',
  },
  {
    Icon: FileUser,
    title: 'Cover Letters',
    desc: 'Role-specific cover letters from your resume + JD in seconds.',
    gradient: 'from-rose-500 to-pink-500',
    glow: 'rgba(244,63,94,0.3)',
    span: 'md:col-span-2',
    href: '/cover-letter-generator',
  },
]

function FeaturesBento() {
  return (
    <section className="relative py-28 px-6 overflow-hidden bg-[#020a06]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_0%,rgba(2,109,50,0.20),transparent)]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, #A3FFB3 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
      </div>

      <FloatingParticles />

      <div className="relative max-w-7xl mx-auto">
        <Reveal className="text-center space-y-4 mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs font-bold uppercase tracking-[0.2em]">
            Everything included
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white">
            The complete{' '}
            <span className="bg-gradient-to-r from-[#A3FFB3] to-[#30c06b] bg-clip-text text-transparent">
              career toolkit.
            </span>
          </h2>
          <p className="text-lg text-white/30 max-w-lg mx-auto">
            Every tool you need — from first draft to final offer.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((feat, i) => (
            <Reveal key={feat.title} delay={i * 0.08} className={feat.span}>
              <Link href={feat.href}>
                <GlowCard className="h-full">
                  <div className="relative h-full rounded-[1.5rem] border border-white/8 bg-white/[0.03] backdrop-blur-sm p-7 overflow-hidden cursor-pointer">
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                      style={{ background: `radial-gradient(circle, ${feat.glow}, transparent 70%)` }} />
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feat.gradient} shadow-lg mb-5`}>
                      <feat.Icon size={22} className="text-white" />
                    </div>
                    <h3 className="text-lg font-black text-white mb-2">{feat.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{feat.desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#A3FFB3]/70 group-hover:text-[#A3FFB3] transition-colors">
                      Learn more <ChevronRight size={12} />
                    </div>
                  </div>
                </GlowCard>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ── HOW IT WORKS ────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function HowItWorks() {
  const steps = [
    { num: '01', title: 'Upload or build', desc: 'Import your existing resume or create from scratch with our AI-powered builder.', icon: FileText },
    { num: '02', title: 'Scan & score', desc: 'Get instant ATS compatibility scores and a breakdown of what to fix.', icon: BarChart3 },
    { num: '03', title: 'Tailor & optimize', desc: 'Paste any job description. AI rewrites your resume to match.', icon: Wand2 },
    { num: '04', title: 'Apply with confidence', desc: 'Export polished, ATS-ready files. Track every application.', icon: ArrowRight },
  ]

  return (
    <section className="relative py-28 px-6 bg-white overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,rgba(163,255,179,0.10),transparent)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <Reveal className="text-center space-y-4 mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#026d32]/10 text-[#026d32] text-xs font-bold uppercase tracking-[0.2em]">
            How it works
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-zinc-950">
            Four steps to your<br />
            <span className="bg-gradient-to-r from-[#026d32] to-[#30c06b] bg-clip-text text-transparent">
              dream interview.
            </span>
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <Reveal key={step.num} delay={i * 0.15}>
              <div className="relative text-center group">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[1px] bg-gradient-to-r from-zinc-200 to-transparent" />
                )}
                <motion.div
                  className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-[#f0fdf4] to-white border border-[#A3FFB3]/30 flex items-center justify-center shadow-[0_20px_50px_rgba(2,109,50,0.08)] mb-6"
                  whileHover={{ scale: 1.1, rotate: -5, borderColor: 'rgba(2,109,50,0.3)' }}
                  transition={{ duration: 0.3 }}
                >
                  <step.icon size={28} className="text-[#026d32]" />
                </motion.div>
                <div className="text-xs font-black uppercase tracking-[0.3em] text-[#026d32]/40 mb-2">{step.num}</div>
                <h3 className="text-xl font-black text-zinc-950 mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ── TESTIMONIALS ────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const TESTIMONIALS = [
  {
    quote: "I applied to 8 companies and got 6 callbacks. The tailoring feature alone is worth it — it's like having a career coach on demand.",
    name: 'Priya Sharma', role: 'Data scientist', initials: 'PS', featured: true,
  },
  {
    quote: "The AI identified achievements I hadn't even thought to include. ATS score jumped from 62% to 94% on my first try.",
    name: 'Marcus Kane', role: 'Marketing lead', initials: 'MK', featured: false,
  },
  {
    quote: "Rezoomed didn't just fix my resume — it helped me understand my own worth. I landed a Senior Role within two weeks.",
    name: 'Sarah Jenkins', role: 'Product designer', initials: 'SJ', featured: false,
  },
  {
    quote: "Switched from Jobscan. Night and day difference. Rezoomed actually shows you what to fix, not just a score.",
    name: "James O'Brien", role: 'Engineering manager', initials: 'JO', featured: false,
  },
  {
    quote: "I was skeptical about AI resume tools, but Rezoomed surfaced keywords I'd never have thought to include. Got an offer 3 weeks later.",
    name: 'Aisha Thompson', role: 'UX researcher', initials: 'AT', featured: false,
  },
  {
    quote: "Applied to 12 roles, heard back from 9. My recruiter actually complimented my resume format — that's never happened before.",
    name: 'Daniel Park', role: 'Software engineer', initials: 'DP', featured: false,
  },
]

function TestimonialsSection() {
  return (
    <section className="relative py-28 overflow-hidden bg-[#f7f9f8]">
      <div className="absolute inset-0">
        <GradientOrb className="w-[500px] h-[500px] bg-green-200/30 top-0 left-[10%]" delay={2} />
        <GradientOrb className="w-[400px] h-[400px] bg-blue-100/20 bottom-0 right-[10%]" delay={5} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <Reveal className="text-center space-y-4 mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#026d32]/10 text-[#026d32] text-xs font-bold uppercase tracking-[0.2em]">
            <Star size={12} /> User Feedback
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-zinc-950">
            Real results from<br />
            <span className="bg-gradient-to-r from-[#026d32] to-[#30c06b] bg-clip-text text-transparent">
              real job seekers.
            </span>
          </h2>
        </Reveal>
      </div>

      {/* Scrolling testimonials */}
      <div className="testimonial-mask">
        <div className="testimonial-track flex w-max gap-5 px-6">
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
            <motion.div
              key={`${t.name}-${i}`}
              className={`w-[360px] shrink-0 rounded-[1.75rem] p-7 flex flex-col justify-between space-y-5 ${
                t.featured
                  ? 'bg-gradient-to-br from-[#026d32] to-[#019a47] border border-[#A3FFB3]/20'
                  : 'bg-white border border-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)]'
              }`}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              <div>
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={14} className={t.featured ? 'text-[#A3FFB3] fill-[#A3FFB3]' : 'text-amber-400 fill-amber-400'} />
                  ))}
                </div>
                <p className={`text-[15px] leading-7 ${t.featured ? 'text-white/90' : 'text-zinc-600'}`}>
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
              <div className={`flex items-center gap-3 pt-4 border-t ${t.featured ? 'border-white/15' : 'border-zinc-100'}`}>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-black ${
                  t.featured ? 'bg-white/15 text-white' : 'bg-gradient-to-br from-[#A3FFB3] to-[#80da92] text-[#026d32]'
                }`}>
                  {t.initials}
                </div>
                <div>
                  <p className={`text-sm font-black ${t.featured ? 'text-white' : 'text-zinc-900'}`}>{t.name}</p>
                  <p className={`text-xs ${t.featured ? 'text-white/50' : 'text-zinc-400'}`}>{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ── WHY SECTION ─────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function WhySection() {
  const items = [
    {
      title: 'ATS resume optimization',
      body: 'Improve keyword coverage, section structure, parsing, and formatting before your resume reaches an applicant tracking system.',
      href: '/ats-checker',
    },
    {
      title: 'Job description matching',
      body: 'See where your resume fits a job, what is missing, and how to tailor bullets and summaries around real role requirements.',
      href: '/match-score',
    },
    {
      title: 'Resume metadata cleanup',
      body: 'Improve PDF title, author, keywords, and other hidden fields so your resume file looks more polished and searchable.',
      href: '/metadata-enhancer',
    },
    {
      title: 'AI resume builder workflow',
      body: 'Build, edit, and export role-targeted resumes without switching across multiple tools or losing version control.',
      href: '/resume-builder',
    },
    {
      title: 'Resume tailoring workflow',
      body: 'Tailor your resume to a real job description and focus edits on the sections that change fit most.',
      href: '/resume-tailoring',
    },
    {
      title: 'Cover letter generation',
      body: 'Create a faster first draft from your resume and the target role when an application needs a tailored note.',
      href: '/cover-letter-generator',
    },
    {
      title: 'Resume strategy and job search advice',
      body: 'Use the Rezoomed blog for resume tips, ATS guidance, and job-search playbooks that support your application strategy.',
      href: '/blog',
    },
  ]

  return (
    <section className="relative py-28 px-6 overflow-hidden bg-white">
      <GradientOrb className="w-[600px] h-[600px] bg-green-100/40 top-0 left-[10%]" />
      <GradientOrb className="w-[500px] h-[500px] bg-sky-100/30 bottom-0 right-[5%]" delay={4} />
      <GradientOrb className="w-[400px] h-[400px] bg-yellow-100/30 top-[30%] left-[40%]" delay={7} />

      <div className="relative max-w-6xl mx-auto">
        <Reveal className="max-w-3xl space-y-3 mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#026d32]/10 text-[#026d32] text-xs font-bold uppercase tracking-[0.2em]">
            End-to-End Optimization
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-950">
            Why job seekers choose{' '}
            <span className="bg-gradient-to-r from-[#026d32] to-[#30c06b] bg-clip-text text-transparent">
              Rezoomed
            </span>
          </h2>
          <p className="text-base text-zinc-500 leading-relaxed">
            Rezoomed combines ATS resume checks, job-match analysis, bullet rewrites, metadata cleanup, and resume exports
            in one workflow built for faster applications and stronger interview odds.
          </p>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.07}>
              <Link href={item.href}>
                <GlowCard className="h-full">
                  <div className="h-full rounded-[1.5rem] border border-zinc-100 bg-white p-6 shadow-[0_14px_34px_rgba(18,24,21,0.04)] cursor-pointer">
                    <h3 className="text-lg font-black tracking-tight text-zinc-950 group-hover:text-[#026d32] transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-zinc-500">{item.body}</p>
                  </div>
                </GlowCard>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ── FAQ ─────────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const FAQS = [
  { q: 'What is Rezoomed?', a: 'Rezoomed is an AI resume builder and ATS checker that helps job seekers optimize resumes, match job descriptions, and export recruiter-ready files faster.' },
  { q: 'How does the ATS resume checker work?', a: 'You upload a resume and Rezoomed analyzes parseability, keyword alignment, formatting, and recruiter readability so you can fix issues before applying.' },
  { q: 'Can Rezoomed tailor my resume to a job description?', a: 'Yes. Rezoomed can compare your resume to a target job description, surface gaps, and help rewrite bullets and summaries around role-specific keywords.' },
  { q: 'Does Rezoomed include more than a resume builder?', a: 'Yes. Rezoomed also includes ATS checking, resume match score, resume tailoring, metadata enhancement, and export workflows for job seekers.' },
  { q: 'Is Rezoomed useful for ATS resume optimization?', a: 'Yes. Rezoomed is designed to improve ATS resume performance with clearer structure, stronger keyword coverage, and better formatting for applicant tracking systems.' },
]

function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <section className="relative py-28 px-6 bg-[#f7f9f8] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_0%,rgba(163,255,179,0.08),transparent)]" />

      <div className="relative max-w-4xl mx-auto">
        <Reveal className="space-y-3 mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#026d32]/10 text-[#026d32] text-xs font-bold uppercase tracking-[0.2em]">
            FAQ
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-950">
            Frequently asked questions
          </h2>
        </Reveal>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 0.06}>
              <motion.div
                className="rounded-[1.5rem] border border-zinc-100 bg-white overflow-hidden shadow-[0_12px_30px_rgba(18,24,21,0.03)]"
                layout
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full text-left px-6 py-5 cursor-pointer flex items-center justify-between"
                >
                  <span className="text-lg font-black tracking-tight text-zinc-950 pr-4">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: openIdx === i ? 45 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center"
                  >
                    <span className="text-lg font-bold text-zinc-600">+</span>
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openIdx === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease }}
                    >
                      <p className="px-6 pb-5 text-sm leading-7 text-zinc-500">{faq.a}</p>
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

// ══════════════════════════════════════════════════════════════════════════════
// ── CTA ─────────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function CTASection() {
  return (
    <section className="relative py-32 px-6 overflow-hidden bg-[#020a06]">
      {/* Gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(2,109,50,0.30),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_80%_20%,rgba(163,255,179,0.08),transparent)]" />
      </div>

      <FloatingParticles />

      {/* Animated rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-[#A3FFB3]/10"
            style={{ width: 200 + i * 200, height: 200 + i * 200 }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        <Reveal>
          <motion.div
            className="inline-block mb-8"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Image
              src="/ats-mascot.png"
              alt="Rezoomed mascot"
              width={120}
              height={145}
              className="drop-shadow-[0_20px_40px_rgba(163,255,179,0.3)]"
            />
          </motion.div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
            Ready to get{' '}
            <span className="bg-gradient-to-r from-[#A3FFB3] to-[#30c06b] bg-clip-text text-transparent italic">
              hired faster?
            </span>
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="text-lg text-white/40 mb-10 max-w-xl mx-auto">
            Join thousands of job seekers who use Rezoomed to build stronger resumes, improve ATS fit, and get more callbacks.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <MagneticButton>
              <Link href="/auth/register">
                <motion.button
                  className="group relative px-10 py-4 bg-white text-[#026d32] text-base font-black rounded-full cursor-pointer overflow-hidden"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="relative z-10">Start for free</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-[#A3FFB3] to-[#80da92]"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                </motion.button>
              </Link>
            </MagneticButton>

            <MagneticButton>
              <Link href="/ats-checker">
                <motion.button
                  className="px-10 py-4 text-base font-bold rounded-full border border-white/15 text-white/80 hover:text-white hover:border-[#A3FFB3]/40 transition-all cursor-pointer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Check my ATS score
                </motion.button>
              </Link>
            </MagneticButton>
          </div>
        </Reveal>

        <Reveal delay={0.4}>
          <p className="mt-6 text-sm text-white/20">No credit card · Free plan</p>
        </Reveal>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MAIN EXPORT ─────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export default function AnimatedLanding() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <ProductShowcase />
      <HowItWorks />
      <FeaturesBento />
      <WhySection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </>
  )
}
