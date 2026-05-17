'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Sparkles, ArrowRight, TrendingUp, Layers } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const SCENE_DURATION = 4600
const CIRC = 2 * Math.PI * 42 // r=42 in 100×100 viewBox → ≈ 263.9

const JD_KEYWORDS = ['Python', 'React', 'AWS', 'Leadership', 'Agile']

const SKILLS: { name: string; match: boolean }[] = [
  { name: 'Python',     match: true  },
  { name: 'React',      match: true  },
  { name: 'AWS',        match: true  },
  { name: 'Leadership', match: true  },
  { name: 'SQL',        match: false },
  { name: 'Docker',     match: false },
]

const SCENES = [
  { id: 'tailor', label: 'Tailoring',     Icon: Layers     },
  { id: 'score',  label: 'Match Score',   Icon: TrendingUp },
  { id: 'site',   label: 'Personal Site', Icon: Globe      },
] as const

// ─── Scene 1 · Resume Tailoring ───────────────────────────────────────────────

function TailoringScene() {
  const [lit, setLit] = useState(0)

  useEffect(() => {
    const timers = JD_KEYWORDS.map((_, i) =>
      setTimeout(() => setLit(i + 1), 350 + i * 440)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="flex h-full gap-2 p-3">
      {/* Job description */}
      <div className="flex-1 rounded-xl border border-zinc-100 bg-zinc-50 p-3 overflow-hidden">
        <p className="mb-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">
          Job Description
        </p>
        <p className="mb-0.5 text-[10px] font-bold text-zinc-800">Software Engineer · Google</p>
        <p className="mb-2.5 text-[9px] leading-relaxed text-zinc-400">
          Seeking an experienced engineer to build scalable, reliable systems…
        </p>
        <p className="mb-1.5 text-[9px] font-bold text-zinc-500">Required skills</p>
        <div className="flex flex-wrap gap-1">
          {JD_KEYWORDS.map((kw, i) => (
            <motion.span
              key={kw}
              animate={
                i < lit
                  ? { backgroundColor: '#A3FFB3', color: '#026d32' }
                  : { backgroundColor: '#e4e4e7', color: '#71717a' }
              }
              transition={{ duration: 0.3 }}
              className="rounded-full px-2 py-0.5 text-[9px] font-bold"
            >
              {kw}
            </motion.span>
          ))}
        </div>
        <div className="mt-2.5 space-y-1">
          {[0.85, 0.65, 0.75, 0.55].map((w, i) => (
            <span key={i} className="block h-1 rounded-full bg-zinc-200" style={{ width: `${w * 100}%` }} />
          ))}
        </div>
      </div>

      {/* Resume */}
      <div className="flex-1 rounded-xl border border-zinc-100 bg-white p-3 shadow-sm overflow-hidden">
        <p className="mb-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">
          Your Resume
        </p>
        <div className="mb-2 flex items-center gap-2">
          <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-[#A3FFB3] to-[#026d32]" />
          <div>
            <p className="text-[10px] font-black leading-tight text-zinc-900">Alex Johnson</p>
            <p className="text-[9px] text-zinc-400">Sr. Developer · 5 yr exp</p>
          </div>
        </div>
        <p className="mb-1.5 text-[9px] font-bold text-zinc-500">Skills matched</p>
        <div className="mb-2.5 flex flex-wrap gap-1">
          {JD_KEYWORDS.map((kw, i) => (
            <motion.span
              key={kw}
              animate={
                i < lit
                  ? { backgroundColor: '#dcfce7', color: '#16a34a' }
                  : { backgroundColor: '#f4f4f5', color: '#a1a1aa' }
              }
              transition={{ duration: 0.3, delay: 0.12 }}
              className="rounded-full px-2 py-0.5 text-[9px] font-bold"
            >
              {kw}
            </motion.span>
          ))}
        </div>
        <div className="space-y-1">
          {[0.95, 0.7, 0.85, 0.6].map((w, i) => (
            <span key={i} className="block h-1 rounded-full bg-zinc-100" style={{ width: `${w * 100}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Scene 2 · Match Score ─────────────────────────────────────────────────────

function ScoreScene() {
  const [score, setScore] = useState(38)
  const [shownSkills, setShownSkills] = useState(0)

  useEffect(() => {
    let cancelled = false
    const delay = setTimeout(() => {
      const from = 38, to = 91, dur = 1350
      const t0 = performance.now()
      const tick = (now: number) => {
        if (cancelled) return
        const p = Math.min((now - t0) / dur, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setScore(Math.round(from + (to - from) * eased))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, 300)

    const skillTimers = SKILLS.map((_, i) =>
      setTimeout(() => { if (!cancelled) setShownSkills(i + 1) }, 350 + i * 380)
    )

    return () => {
      cancelled = true
      clearTimeout(delay)
      skillTimers.forEach(clearTimeout)
    }
  }, [])

  const strokeColor = score > 80 ? '#00a84d' : score > 55 ? '#f59e0b' : '#ef4444'
  const dashOffset = CIRC * (1 - score / 100)

  return (
    <div className="flex h-full items-center gap-4 px-4 py-3">
      {/* Gauge */}
      <div className="flex shrink-0 flex-col items-center gap-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Match Score</p>
        <div className="relative h-[100px] w-[100px]">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e4e4e7" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              stroke={strokeColor}
              style={{
                transition: 'stroke-dashoffset 1.35s cubic-bezier(0.22,1,0.36,1), stroke 0.4s ease',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[27px] font-black leading-none tabular-nums text-zinc-950">
              {score}
            </span>
            <span className="text-[9px] font-bold text-zinc-400">/ 100</span>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-3 py-1 text-[9px] font-black text-[#16a34a]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#16a34a]" />
          Strong Match
        </span>
      </div>

      {/* Keywords */}
      <div className="min-w-0 flex-1">
        <p className="mb-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">
          Keyword Analysis
        </p>
        <div className="space-y-2">
          {SKILLS.map((skill, i) => (
            <motion.div
              key={skill.name}
              initial={{ opacity: 0, x: 8 }}
              animate={i < shownSkills ? { opacity: 1, x: 0 } : { opacity: 0, x: 8 }}
              transition={{ duration: 0.22 }}
              className="flex items-center gap-2"
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-black ${
                  skill.match ? 'bg-[#A3FFB3] text-[#026d32]' : 'bg-red-100 text-red-500'
                }`}
              >
                {skill.match ? '✓' : '✗'}
              </span>
              <span className="flex-1 text-[10px] font-semibold text-zinc-700">{skill.name}</span>
              <span className={`text-[9px] font-bold ${skill.match ? 'text-[#16a34a]' : 'text-red-400'}`}>
                {skill.match ? 'Found' : 'Missing'}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Scene 3 · Resume → Personal Site ────────────────────────────────────────

function WebsiteScene() {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex h-full items-center gap-2 p-3">
      {/* Resume mini-card */}
      <motion.div
        animate={{ scale: revealed ? 0.87 : 1, opacity: revealed ? 0.6 : 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-[105px] shrink-0 rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm"
      >
        <p className="mb-1.5 text-[8px] font-black uppercase tracking-widest text-zinc-400">Resume</p>
        <div className="mb-1.5 h-7 w-7 rounded-full bg-gradient-to-br from-[#A3FFB3] to-[#026d32]" />
        <p className="text-[10px] font-black leading-tight text-zinc-900">Alex Johnson</p>
        <p className="mb-2 text-[8px] text-zinc-400">Software Engineer</p>
        <div className="space-y-1">
          {[0.9, 0.7, 0.8, 0.6, 0.75, 0.5].map((w, i) => (
            <span key={i} className="block h-1 rounded-full bg-zinc-100" style={{ width: `${w * 100}%` }} />
          ))}
        </div>
      </motion.div>

      {/* Arrow */}
      <div className="flex shrink-0 flex-col items-center gap-0.5">
        <Sparkles size={10} className="text-[#00a84d]" />
        <ArrowRight size={16} className="text-[#026d32]" />
        <span className="text-[7px] font-black uppercase tracking-wider text-[#026d32]">AI</span>
      </div>

      {/* Website preview */}
      <motion.div
        initial={{ opacity: 0.15, scale: 0.93, x: 10 }}
        animate={revealed ? { opacity: 1, scale: 1, x: 0 } : { opacity: 0.15, scale: 0.93, x: 10 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 overflow-hidden rounded-xl border border-[#00a84d]/20 shadow-[0_4px_20px_-6px_rgba(2,109,50,0.22)]"
      >
        {/* Browser bar */}
        <div className="flex items-center justify-between bg-zinc-900 px-2.5 py-1.5">
          <div className="flex items-center gap-1">
            <Globe size={8} className="text-[#A3FFB3]" />
            <span className="text-[8px] font-semibold text-zinc-400">alexjohnson.dev</span>
          </div>
          <div className="flex gap-2">
            {['About', 'Work', 'Contact'].map(s => (
              <span key={s} className="text-[7px] text-zinc-500">{s}</span>
            ))}
          </div>
        </div>
        {/* Site hero */}
        <div className="bg-gradient-to-br from-[#f0fdf4] to-white p-2.5">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-[#A3FFB3] to-[#026d32]" />
            <div>
              <p className="text-[10px] font-black leading-tight text-zinc-900">Alex Johnson</p>
              <p className="text-[8px] font-semibold text-[#00a84d]">Software Engineer</p>
            </div>
          </div>
          <div className="mb-2 space-y-1">
            {[0.9, 0.7, 0.8].map((w, i) => (
              <span key={i} className="block h-1 rounded-full bg-zinc-200" style={{ width: `${w * 100}%` }} />
            ))}
          </div>
          <div className="mb-2 flex gap-1">
            <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[8px] font-bold text-white">
              Contact
            </span>
            <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-[8px] font-bold text-zinc-600">
              Projects →
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[0, 1, 2].map(i => (
              <span key={i} className="h-7 rounded-md border border-zinc-100 bg-white shadow-sm" />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HeroProductAnimation() {
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    const timer = setTimeout(
      () => setActiveIdx(i => (i + 1) % SCENES.length),
      SCENE_DURATION
    )
    return () => clearTimeout(timer)
  }, [activeIdx])

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_24px_64px_-16px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.04)]">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        <div className="ml-3 flex-1 rounded-full bg-zinc-800 px-3 py-1 text-center">
          <span className="text-[10px] text-zinc-500">app.rezoomed.com</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 bg-zinc-50 px-3">
        {SCENES.map(({ id, label, Icon }, i) => (
          <button
            key={id}
            onClick={() => setActiveIdx(i)}
            className={`flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2 text-[10px] font-bold transition-colors ${
              i === activeIdx
                ? 'border-[#00a84d] text-[#00a84d]'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Icon size={11} />
            {label}
          </button>
        ))}
      </div>

      {/* Scene content */}
      <div className="relative h-[232px] overflow-hidden bg-white sm:h-[258px] md:h-[272px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
            className="h-full"
          >
            {activeIdx === 0 && <TailoringScene />}
            {activeIdx === 1 && <ScoreScene />}
            {activeIdx === 2 && <WebsiteScene />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Scene dots */}
      <div className="flex items-center justify-center gap-1.5 bg-zinc-50 py-2.5">
        {SCENES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              i === activeIdx ? 'w-5 bg-[#00a84d]' : 'w-1.5 bg-zinc-300 hover:bg-zinc-400'
            }`}
            aria-label={`Scene ${i + 1}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-[3px] bg-zinc-100">
        <motion.div
          key={activeIdx}
          className="h-full bg-gradient-to-r from-[#A3FFB3] to-[#00a84d]"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: SCENE_DURATION / 1000, ease: 'linear' }}
        />
      </div>
    </div>
  )
}
