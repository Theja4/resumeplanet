'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, Sparkles, Star, Zap } from 'lucide-react'

const ROTATING_WORDS = ['land interviews', 'beat the ATS', 'get you hired', 'tailor in seconds']

export default function LandingHeroV2() {
  const mascotRef = useRef<HTMLDivElement>(null)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })

  useEffect(() => {
    let ticking = false
    const onMove = (e: MouseEvent) => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const cx = window.innerWidth / 2
        const cy = window.innerHeight / 2
        setParallax({
          x: (e.clientX - cx) / cx * 14,
          y: (e.clientY - cy) / cy * 10,
        })
        ticking = false
      })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <section className="relative overflow-hidden landing-v2-hero-bg">
      <div className="absolute inset-0 landing-v2-grid pointer-events-none" />

      {/* Floating ambient orbs */}
      <div
        className="pointer-events-none absolute -left-32 top-24 h-[520px] w-[520px] rounded-full blur-3xl opacity-60"
        style={{ background: 'radial-gradient(circle, #A3FFB3 0%, transparent 65%)' }}
      />
      <div
        className="pointer-events-none absolute -right-32 top-48 h-[460px] w-[460px] rounded-full blur-3xl opacity-55"
        style={{ background: 'radial-gradient(circle, #7bd3fc 0%, transparent 65%)' }}
      />
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-0 h-[380px] w-[760px] rounded-full blur-3xl opacity-55"
        style={{ background: 'radial-gradient(circle, rgba(163,255,179,0.8) 0%, transparent 70%)' }}
      />

      {/* Confetti pieces */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden hidden md:block">
        {[
          { left: '12%', delay: '0s',   color: '#A3FFB3' },
          { left: '22%', delay: '1.8s', color: '#00a84d' },
          { left: '38%', delay: '0.6s', color: '#80da92' },
          { left: '55%', delay: '2.4s', color: '#A3FFB3' },
          { left: '68%', delay: '1.2s', color: '#026d32' },
          { left: '82%', delay: '3.1s', color: '#7bd3fc' },
          { left: '92%', delay: '0.9s', color: '#A3FFB3' },
        ].map((c, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{ left: c.left, animationDelay: c.delay, background: c.color }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* ── Left: copy ─────────────────────────────────────────── */}
          <div className="relative z-10 text-center lg:text-left">
            <div
              className="hero-text-rise inline-flex items-center gap-2 rounded-full border border-[#026d32]/15 bg-white/80 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#026d32] backdrop-blur"
              style={{ animationDelay: '0.05s' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00a84d] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00a84d]" />
              </span>
              AI-powered · Built for 2026 job market
            </div>

            <h1
              className="hero-text-rise mt-6 font-extrabold tracking-tighter leading-[0.95] text-zinc-950 text-5xl md:text-6xl lg:text-[5.5rem]"
              style={{ animationDelay: '0.15s' }}
            >
              Resumes that{' '}
              <span className="rotating-words-mask align-bottom text-[#00a84d]">
                <span className="rotating-words-track">
                  {[...ROTATING_WORDS, ROTATING_WORDS[0]].map((w, i) => (
                    <span key={i} className="italic">
                      {w}
                    </span>
                  ))}
                </span>
              </span>
              <span className="cursor-blink ml-1 text-[#00a84d]">|</span>
            </h1>

            <p
              className="hero-text-rise mt-6 text-lg md:text-xl text-zinc-600 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              style={{ animationDelay: '0.3s' }}
            >
              Build ATS-ready resumes, tailor them to any job in seconds, and catch every missing keyword —{' '}
              <strong className="text-zinc-900 font-bold">all in one playful workflow.</strong>
            </p>

            <div
              className="hero-text-rise mt-8 flex flex-col sm:flex-row items-center lg:items-start gap-3 justify-center lg:justify-start"
              style={{ animationDelay: '0.45s' }}
            >
              <Link href="/auth/register" className="group">
                <button className="relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-[#00a84d] via-[#019a47] to-[#026d32] px-8 py-4 text-base font-black text-white shadow-[0_20px_48px_-12px_rgba(2,109,50,0.6)] transition-all hover:shadow-[0_28px_58px_-12px_rgba(2,109,50,0.75)] hover:scale-[1.02] cursor-pointer">
                  <Sparkles size={18} className="transition-transform group-hover:rotate-12" />
                  <span className="tracking-wide">Start free — no card</span>
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>
              </Link>
              <Link href="/ats-checker">
                <button className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-200 bg-white px-7 py-3.5 text-base font-bold text-zinc-900 transition-all hover:border-[#00a84d] hover:text-[#026d32] cursor-pointer">
                  <Zap size={16} />
                  Try ATS scan
                </button>
              </Link>
            </div>

            <div
              className="hero-text-rise mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 justify-center lg:justify-start text-sm text-zinc-600"
              style={{ animationDelay: '0.6s' }}
            >
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-2">
                  {['#A3FFB3', '#7bd3fc', '#fce7f3', '#ffe8bd'].map((c, i) => (
                    <div
                      key={i}
                      className="h-7 w-7 rounded-full border-2 border-white shadow-sm"
                      style={{ background: `radial-gradient(circle at 30% 30%, ${c}, #fff 120%)` }}
                    />
                  ))}
                </div>
                <span className="font-semibold text-zinc-800 ml-1">12k+ job seekers</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="fill-[#ffb800] text-[#ffb800]" />
                ))}
                <span className="ml-1 font-semibold text-zinc-800">4.9 · loved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-[#00a84d]" />
                <span className="font-semibold text-zinc-800">Free forever plan</span>
              </div>
            </div>
          </div>

          {/* ── Right: mascot stage ───────────────────────────────── */}
          <div className="relative h-[480px] md:h-[560px] lg:h-[620px]">
            {/* Orbital glowing ring */}
            <div className="absolute left-1/2 top-1/2 h-[380px] w-[380px] md:h-[460px] md:w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#00a84d]/20" />
            <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] md:h-[360px] md:w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#00a84d]/10" />

            {/* Mascot sticker — pink container matches the mascot's source bg */}
            <div
              ref={mascotRef}
              className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
              style={{
                transform: `translate(calc(-50% + ${parallax.x}px), calc(-50% + ${parallax.y}px))`,
                transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <div className="mascot-bob relative">
                {/* Pink sticker frame matches the mascot's source bg */}
                <div
                  className="relative h-[360px] w-[360px] md:h-[440px] md:w-[440px] overflow-hidden rounded-[3rem] shadow-[0_60px_160px_-40px_rgba(216,27,147,0.45)]"
                  style={{
                    background:
                      'radial-gradient(circle at 30% 20%, #ff8acc 0%, #ff3dc0 50%, #d81b93 100%)',
                  }}
                >
                  {/* Sparkles on the card */}
                  <div className="absolute left-[12%] top-[14%] text-white sparkle-twinkle z-10" style={{ animationDelay: '0s' }}>
                    <Sparkles size={22} />
                  </div>
                  <div className="absolute right-[14%] top-[22%] text-white sparkle-twinkle z-10" style={{ animationDelay: '0.8s' }}>
                    <Sparkles size={16} />
                  </div>
                  <div className="absolute right-[22%] bottom-[16%] text-white sparkle-twinkle z-10" style={{ animationDelay: '1.6s' }}>
                    <Sparkles size={20} />
                  </div>
                  <div className="absolute left-[18%] bottom-[22%] text-white sparkle-twinkle z-10" style={{ animationDelay: '2.2s' }}>
                    <Sparkles size={14} />
                  </div>

                  {/* Mascot fills the sticker; pink bg of image blends into pink frame */}
                  <Image
                    src="/Brands/mascot-hero-pink.png"
                    alt="Rezoomed mascot hero"
                    width={600}
                    height={600}
                    priority
                    className="absolute inset-0 h-full w-full object-cover scale-[1.05]"
                  />
                </div>
              </div>
            </div>

            {/* Floating badge: ATS Score */}
            <div className="absolute left-[-8%] top-[12%] z-20 hidden md:block badge-drift-up">
              <div className="rounded-2xl border border-white/60 bg-white/95 px-4 py-3 shadow-[0_20px_50px_-12px_rgba(2,109,50,0.35)] backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#A3FFB3]">
                    <CheckCircle2 size={20} className="text-[#026d32]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">ATS Score</p>
                    <p className="text-xl font-black text-zinc-950 leading-none">98<span className="text-sm text-[#00a84d]">%</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge: Callbacks */}
            <div className="absolute right-[-2%] top-[30%] z-20 hidden md:block badge-drift-down">
              <div className="rounded-2xl border border-white/60 bg-white/95 px-4 py-3 shadow-[0_20px_50px_-12px_rgba(2,109,50,0.35)] backdrop-blur">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Callbacks</p>
                  <p className="text-xl font-black leading-none">
                    <span className="bg-gradient-to-r from-[#00a84d] to-[#026d32] bg-clip-text text-transparent">5×</span>{' '}
                    <span className="text-zinc-400 text-sm font-bold">more</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Floating badge: Keyword match */}
            <div
              className="absolute right-[6%] bottom-[10%] z-20 hidden lg:block badge-drift-up"
              style={{ animationDelay: '1s' }}
            >
              <div className="rounded-2xl border border-white/60 bg-white/95 px-4 py-3 shadow-[0_20px_50px_-12px_rgba(2,109,50,0.35)] backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7bd3fc] to-[#026d32]">
                    <Zap size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Keyword match</p>
                    <p className="text-sm font-black text-zinc-950">+42 tailored</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom left: live tailoring tag */}
            <div className="absolute left-[2%] bottom-[14%] z-20 hidden lg:block badge-drift-down" style={{ animationDelay: '0.5s' }}>
              <div className="rounded-full bg-black px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#A3FFB3] animate-pulse" />
                Tailoring live
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
