'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, Sparkles, Zap } from 'lucide-react'

const ROTATING_WORDS = ['land interviews', 'beat the ATS', 'get you hired', 'tailor in seconds']
const INITIAL_WORD_INDEX = 2

export default function LandingHeroV2() {
  const mascotRef = useRef<HTMLDivElement>(null)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const [activeWordIndex, setActiveWordIndex] = useState(INITIAL_WORD_INDEX)
  const [typedWord, setTypedWord] = useState(ROTATING_WORDS[INITIAL_WORD_INDEX])
  const [isHoldingWord, setIsHoldingWord] = useState(true)

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

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const timer = window.setTimeout(() => {
      if (isHoldingWord) {
        setActiveWordIndex((index) => (index + 1) % ROTATING_WORDS.length)
        setTypedWord('')
        setIsHoldingWord(false)
        return
      }

      const activeWord = ROTATING_WORDS[activeWordIndex]
      if (typedWord.length >= activeWord.length) {
        setIsHoldingWord(true)
        return
      }

      setTypedWord(activeWord.slice(0, typedWord.length + 1))
    }, isHoldingWord ? 1400 : 54)

    return () => window.clearTimeout(timer)
  }, [activeWordIndex, isHoldingWord, typedWord])

  return (
    <section className="relative overflow-hidden landing-v2-hero-bg">
      <div className="absolute inset-0 landing-v2-grid pointer-events-none" />

      {/* Soft ambient washes */}
      <div
        className="pointer-events-none absolute -left-32 top-24 h-[460px] w-[460px] rounded-full blur-3xl opacity-25"
        style={{ background: 'radial-gradient(circle, rgba(163,255,179,0.6) 0%, transparent 65%)' }}
      />
      <div
        className="pointer-events-none absolute -right-32 top-48 h-[400px] w-[400px] rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(123,211,252,0.55) 0%, transparent 65%)' }}
      />
      <div
        className="pointer-events-none absolute left-1/2 bottom-0 h-[320px] w-[680px] -translate-x-1/2 rounded-full blur-3xl opacity-[0.22]"
        style={{ background: 'radial-gradient(circle, rgba(163,255,179,0.5) 0%, transparent 70%)' }}
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

      <div className="relative mx-auto max-w-7xl px-6 pt-28 pb-20 md:pt-36 md:pb-24">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)]">
          {/* ── Left: copy ─────────────────────────────────────────── */}
          <div className="relative z-20 min-w-0 text-center lg:text-left">
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
              aria-label="Resumes that get you hired"
              className="hero-headline hero-text-rise mx-auto mt-6 font-extrabold tracking-normal leading-[0.95] text-zinc-950 text-[2.6rem] sm:text-5xl md:text-6xl lg:mx-0 lg:text-[4.8rem] xl:text-[5.5rem]"
              style={{ animationDelay: '0.15s' }}
            >
              <span className="block">Resumes that</span>
              <span className="hero-typewriter hero-typewriter-line text-[#00a84d]" aria-hidden="true">
                <span className="hero-typewriter-live">
                  <span className="hero-typewriter-text italic landing-italic-safe">{typedWord}</span>
                  <span className="hero-typewriter-cursor" />
                </span>
              </span>
            </h1>

            <p
              className="hero-text-rise mt-6 text-lg md:text-xl text-zinc-600 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              style={{ animationDelay: '0.3s' }}
            >
              Build ATS-ready resumes, tailor them to any job in seconds, and catch every missing keyword —{' '}
              <strong className="text-zinc-900 font-extrabold">we&apos;re serious about your career.</strong>
            </p>

            <div
              className="hero-text-rise mt-8 flex flex-col sm:flex-row items-center lg:items-start gap-3 justify-center lg:justify-start"
              style={{ animationDelay: '0.45s' }}
            >
              <Link href="/auth/register" className="group">
                <button className="relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-[#00a84d] via-[#019a47] to-[#026d32] px-8 py-4 text-base font-black text-white shadow-[0_20px_48px_-12px_rgba(2,109,50,0.6)] transition-all hover:shadow-[0_28px_58px_-12px_rgba(2,109,50,0.75)] hover:scale-[1.02] cursor-pointer">
                  <Sparkles size={18} className="transition-transform group-hover:rotate-12" />
                  <span className="tracking-wide">Get started</span>
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>
              </Link>
              <Link href="/ats-checker">
                <button className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-200 bg-black px-7 py-3.5 text-base font-bold text-white transition-all hover:bg-zinc-900 cursor-pointer">
                  <Zap size={16} />
                  Try ATS scan
                </button>
              </Link>
            </div>

            {/* Social proof metric */}
            <p
              className="hero-text-rise mt-3 text-center lg:text-left text-[12px] text-zinc-500"
              style={{ animationDelay: '0.5s' }}
            >
              <span className="font-black text-zinc-800">1,000,000+</span> resumes optimized and counting
            </p>

            {/* Powered-by strip */}
            <div
              className="hero-text-rise mt-8 flex flex-col items-center gap-2.5 lg:flex-row lg:items-center lg:gap-4"
              style={{ animationDelay: '0.6s' }}
            >
              {/* Label */}
              <p className="text-[12px] font-semibold text-zinc-500 tracking-wide">
                Resume intelligence, powered by
              </p>

              {/* Logos — flat, no button styling */}
              <div className="flex flex-wrap items-center justify-center gap-5 lg:justify-start">

                {/* OpenAI */}
                <div className="flex items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="shrink-0 text-zinc-800">
                    <path d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835 9.964 9.964 0 0 0-6.525-3.499 10.079 10.079 0 0 0-10.42 4.958 9.964 9.964 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 6.526 3.499 10.079 10.079 0 0 0 10.42-4.958 9.965 9.965 0 0 0 6.664-4.834 10.079 10.079 0 0 0-1.243-11.817zm-17.477 24.021a7.482 7.482 0 0 1-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.502zM4.392 33.64a7.448 7.448 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103L14.57 36.85a7.504 7.504 0 0 1-10.178-3.21zM2.932 14.197a7.447 7.447 0 0 1 3.904-3.276l-.009.274v9.201a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.012L5.802 24.71a7.505 7.505 0 0 1-2.87-10.513zm27.658 6.437l-9.724-5.615 3.367-1.943a.121.121 0 0 1 .114-.012l7.922 4.577a7.504 7.504 0 0 1-1.158 13.528v-9.476a1.293 1.293 0 0 0-.521-1.059zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l7.921-4.561a7.504 7.504 0 0 1 11.263 7.679zm-21.063 6.929l-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.504 7.504 0 0 1 12.293-5.756 6.94 6.94 0 0 0-.236.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.006 11.225zm1.829-3.943l4.33-2.501 4.332 2.498v4.996l-4.331 2.5-4.331-2.5V18.577z" fill="currentColor"/>
                  </svg>
                  <span className="text-[12px] font-semibold text-zinc-600">OpenAI</span>
                </div>

                <span className="h-3 w-px bg-zinc-300" />

                {/* Claude — Anthropic mark */}
                <div className="flex items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="shrink-0">
                    <path d="M13.827 3.52h3.603L24 20.39h-3.603l-6.57-16.87zM6.396 3.52H10l6.57 16.87h-3.604L6.396 3.52z" fill="#D97757"/>
                  </svg>
                  <span className="text-[12px] font-semibold text-zinc-600">Claude</span>
                </div>

                <span className="h-3 w-px bg-zinc-300" />

                {/* Gemini */}
                <div className="flex items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="shrink-0">
                    <path d="M14 2.625C14 9.434 9.434 14 2.625 14 9.434 14 14 18.566 14 25.375 14 18.566 18.566 14 25.375 14 18.566 14 14 9.434 14 2.625z" fill="url(#gem-g2)"/>
                    <defs>
                      <linearGradient id="gem-g2" x1="2.625" y1="2.625" x2="25.375" y2="25.375" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#4285F4"/>
                        <stop offset="0.5" stopColor="#9B72CB"/>
                        <stop offset="1" stopColor="#EA4335"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="text-[12px] font-semibold text-zinc-600">Gemini</span>
                </div>

              </div>
            </div>
          </div>

          {/* ── Right: mascot stage ───────────────────────────────── */}
          <div className="relative z-0 mx-auto h-[430px] w-full max-w-[560px] min-w-0 md:h-[540px] lg:h-[590px] lg:max-w-[680px]">
            {/* Resume preview surface */}
            <div className="absolute inset-x-[5%] bottom-[8%] top-[18%] z-0 overflow-visible rounded-[2rem] border border-[#00a84d]/15 bg-white/70 shadow-[0_30px_80px_-40px_rgba(2,109,50,0.45)] backdrop-blur-sm">
              <div className="scan-pulse opacity-70" />
              <div className="absolute left-7 right-7 top-7 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#A3FFB3]" />
                  <span className="h-3 w-3 rounded-full bg-[#7bd3fc]" />
                  <span className="h-3 w-3 rounded-full bg-[#ffe8bd]" />
                </div>
                <span className="h-2.5 w-24 rounded-full bg-[#00a84d]/20" />
              </div>
              <Link
                href="/auth/register"
                className="absolute left-1/2 top-[43%] z-30 h-[440px] w-[440px] md:h-[540px] md:w-[540px] lg:h-[600px] lg:w-[600px] cursor-pointer"
                style={{
                  transform: `translate(calc(-50% + ${parallax.x}px), calc(-50% + ${parallax.y}px))`,
                  transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <div ref={mascotRef} className="mascot-bob relative h-full w-full">
                  <div className="absolute left-[7%] top-[13%] text-[#00a84d] sparkle-twinkle z-10" style={{ animationDelay: '0s' }}>
                    <Sparkles size={22} />
                  </div>
                  <div className="absolute right-[10%] top-[20%] text-[#7bd3fc] sparkle-twinkle z-10" style={{ animationDelay: '0.8s' }}>
                    <Sparkles size={16} />
                  </div>
                  <Image
                    src="/Brands/mascot-hero-pink.png"
                    alt="Rezoomed mascot hero"
                    width={700}
                    height={700}
                    priority
                    fetchPriority="high"
                    sizes="(max-width: 768px) 440px, (max-width: 1024px) 540px, 600px"
                    className="relative h-full w-full object-contain"
                    style={{
                      filter:
                        'drop-shadow(0 20px 26px rgba(2,109,50,0.16)) drop-shadow(0 0 14px rgba(163,255,179,0.14))',
                    }}
                  />
                </div>
              </Link>
              <div className="absolute left-7 right-7 top-[86px] space-y-4">
                <span className="block h-4 w-3/5 rounded-full bg-zinc-900/10" />
                <span className="block h-3 w-4/5 rounded-full bg-[#00a84d]/15" />
                <span className="block h-3 w-2/3 rounded-full bg-zinc-900/10" />
                <span className="block h-3 w-5/6 rounded-full bg-zinc-900/10" />
              </div>
              <div className="absolute bottom-8 left-7 right-7 grid grid-cols-3 gap-3">
                {[0, 1, 2].map((item) => (
                  <span key={item} className="h-16 rounded-2xl border border-[#00a84d]/10 bg-white/60" />
                ))}
              </div>
            </div>

            {/* Centered glowing rings */}
            <div className="absolute left-1/2 top-[45%] z-0 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#00a84d]/20 md:h-[430px] md:w-[430px]" />
            <div className="absolute left-1/2 top-[45%] z-0 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#00a84d]/10 md:h-[330px] md:w-[330px]" />

            {/* Floating badge: ATS Score */}
            <div className="absolute left-[1%] top-[18%] z-20 hidden md:block badge-drift-up">
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
            <div className="absolute right-[1%] top-[30%] z-20 hidden md:block badge-drift-down">
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
              className="absolute right-[3%] bottom-[13%] z-20 hidden lg:block badge-drift-up"
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
            <div className="absolute left-[10%] bottom-[10%] z-20 hidden lg:block badge-drift-down" style={{ animationDelay: '0.5s' }}>
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
