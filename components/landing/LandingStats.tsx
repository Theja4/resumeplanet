'use client'

import { useEffect, useRef, useState } from 'react'

const E = 'cubic-bezier(0.22, 1, 0.36, 1)'

function CountUp({ to, suffix = '', prefix = '', decimals = 0 }: { to: number; suffix?: string; prefix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [n, setN] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const start = performance.now()
          const dur = 1800
          const step = (now: number) => {
            const p = Math.min(1, (now - start) / dur)
            const eased = 1 - Math.pow(1 - p, 4)
            setN(to * eased)
            if (p < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
          obs.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [to])

  return (
    <span ref={ref}>
      {prefix}{n.toFixed(decimals)}{suffix}
    </span>
  )
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect() } },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: v ? 1 : 0,
        transform: v ? 'translateY(0)' : 'translateY(36px)',
        transition: `opacity 0.9s ${E} ${delay}ms, transform 0.9s ${E} ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

export default function LandingStats() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-28"
      style={{
        background: 'linear-gradient(180deg, #f8faf9 0%, #edf7f0 55%, #f8faf9 100%)',
      }}
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(ellipse, rgba(163,255,179,0.9) 0%, transparent 70%)' }} />

      <div className="relative mx-auto max-w-7xl">
        <Reveal>
          <div className="max-w-3xl mx-auto text-center mb-10">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#00a84d]">The numbers</p>
            <h2 className="mt-3 text-4xl md:text-6xl font-black tracking-tighter leading-[1.06] text-zinc-950">
              Proof that <span className="landing-italic-safe italic bg-gradient-to-r from-[#00a84d] to-[#026d32] bg-clip-text text-transparent">powerful tools</span> beat polished platitudes.
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { value: 5, suffix: '×', label: 'More callbacks on average', color: '#00a84d' },
            { value: 98, suffix: '%', label: 'Hit ATS readability', color: '#026d32' },
            { value: 42, suffix: 's', label: 'To tailor one resume', color: '#7bd3fc' },
            { value: 12, suffix: 'k+', label: 'Job seekers served', color: '#ff66c4' },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <div className="relative overflow-hidden rounded-3xl border border-zinc-100 bg-white p-6 md:p-8 shadow-[0_20px_50px_-20px_rgba(2,109,50,0.15)]">
                <div
                  className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl opacity-40"
                  style={{ background: s.color }}
                />
                <div className="relative">
                  <p
                    className="text-5xl md:text-6xl font-black tracking-tighter leading-none"
                    style={{
                      background: `linear-gradient(135deg, ${s.color} 0%, #026d32 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    <CountUp to={s.value} suffix={s.suffix} />
                  </p>
                  <p className="mt-2 text-sm font-bold text-zinc-600 leading-snug">{s.label}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
