import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Zap } from 'lucide-react'
import AuroraShader from './AuroraShader'
import RotatingHeadline from './RotatingHeadline'

const ROTATING_WORDS = ['get you hired', 'land interviews', 'beat the ATS', 'tailor in seconds']
const INITIAL_WORD_INDEX = 0

export default function LandingHeroV2() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* ── Aurora shader background (theme-aware) ──────────────── */}
      <AuroraShader speed={0.085} intensity={1} />

      {/* Subtle dotted-grid overlay for depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(15,23,42,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage:
            'radial-gradient(ellipse 80% 60% at 50% 38%, black 30%, transparent 92%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 60% at 50% 38%, black 30%, transparent 92%)',
        }}
      />

      {/* Soft top-fade so the header sits cleanly */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{
          background: 'linear-gradient(to bottom, var(--landing-bg) 0%, transparent 100%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 pt-28 pb-24 md:pt-36 md:pb-28">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          {/* ── Left: copy ──────────────────────────────────────── */}
          <div className="relative z-10 min-w-0 text-center lg:text-left">
            <div
              className="hero-text-rise inline-flex items-center gap-2 rounded-full border border-zinc-900/[0.08] bg-white/70 px-4 py-2 text-[12px] font-medium tracking-wide text-zinc-700 backdrop-blur"
              style={{ animationDelay: '0.05s' }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00a84d] opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#00a84d]" />
              </span>
              <span>AI-powered · Built for the 2026 job market</span>
            </div>

            <h1
              aria-label="Resumes that get you hired"
              className="hero-headline hero-text-rise mx-auto mt-6 font-semibold tracking-[-0.035em] leading-[0.96] text-zinc-950 text-[2.6rem] sm:text-5xl md:text-[3.6rem] lg:mx-0 lg:text-[4.4rem] xl:text-[5rem]"
              style={{ animationDelay: '0.15s' }}
            >
              <span className="block">Resumes that</span>
              {/* Space char keeps crawler/AI extraction readable as "Resumes that get you hired" */}
              <span className="sr-only"> </span>
              <span
                className="hero-typewriter hero-typewriter-line text-[#00a84d]"
                aria-hidden="true"
              >
                <span className="hero-typewriter-live">
                  <RotatingHeadline
                    words={ROTATING_WORDS}
                    initialIndex={INITIAL_WORD_INDEX}
                  />
                  <span className="hero-typewriter-cursor" />
                </span>
              </span>
            </h1>

            <p
              className="hero-text-rise mx-auto mt-6 max-w-xl text-lg md:text-xl leading-relaxed text-zinc-600 lg:mx-0"
              style={{ animationDelay: '0.3s' }}
            >
              Build ATS-ready resumes, tailor them to any job in seconds, and catch every
              missing keyword.{' '}
              <span className="text-zinc-900 font-medium">
                We&apos;re serious about your career.
              </span>
            </p>

            <div
              className="hero-text-rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start"
              style={{ animationDelay: '0.45s' }}
            >
              <Link
                href="/auth/register"
                className="landing-cta-primary group"
              >
                <span>Get started</span>
                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                />
              </Link>
              <Link href="/ats-checker" className="landing-pill-ghost">
                <Zap size={16} className="text-[#00a84d]" />
                Try the ATS scan
              </Link>
            </div>

            <p
              className="hero-text-rise mt-5 text-center text-[13px] text-zinc-500 lg:text-left"
              style={{ animationDelay: '0.55s' }}
            >
              <span className="font-semibold text-zinc-700">1,000,000+</span> resumes
              optimized · No credit card needed
            </p>

            {/* ── Powered by ─────────────────────────────────── */}
            <div
              className="hero-text-rise mt-10 flex flex-col items-center gap-3 lg:flex-row lg:items-center lg:gap-4"
              style={{ animationDelay: '0.7s' }}
            >
              <p className="text-[12px] uppercase tracking-[0.18em] font-medium text-zinc-500">
                Powered by
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start">
                {/* OpenAI */}
                <div className="flex items-center gap-1.5">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 41 41"
                    fill="none"
                    aria-hidden="true"
                    className="text-zinc-700"
                  >
                    <path
                      d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835 9.964 9.964 0 0 0-6.525-3.499 10.079 10.079 0 0 0-10.42 4.958 9.964 9.964 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 6.526 3.499 10.079 10.079 0 0 0 10.42-4.958 9.965 9.965 0 0 0 6.664-4.834 10.079 10.079 0 0 0-1.243-11.817zm-17.477 24.021a7.482 7.482 0 0 1-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.502zM4.392 33.64a7.448 7.448 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103L14.57 36.85a7.504 7.504 0 0 1-10.178-3.21zM2.932 14.197a7.447 7.447 0 0 1 3.904-3.276l-.009.274v9.201a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.012L5.802 24.71a7.505 7.505 0 0 1-2.87-10.513zm27.658 6.437l-9.724-5.615 3.367-1.943a.121.121 0 0 1 .114-.012l7.922 4.577a7.504 7.504 0 0 1-1.158 13.528v-9.476a1.293 1.293 0 0 0-.521-1.059zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l7.921-4.561a7.504 7.504 0 0 1 11.263 7.679zm-21.063 6.929l-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.504 7.504 0 0 1 12.293-5.756 6.94 6.94 0 0 0-.236.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.006 11.225zm1.829-3.943l4.33-2.501 4.332 2.498v4.996l-4.331 2.5-4.331-2.5V18.577z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="text-[13px] font-medium text-zinc-600">OpenAI</span>
                </div>
                <span className="hidden sm:inline-block h-3 w-px bg-zinc-300" />
                <div className="flex items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M13.827 3.52h3.603L24 20.39h-3.603l-6.57-16.87zM6.396 3.52H10l6.57 16.87h-3.604L6.396 3.52z"
                      fill="#D97757"
                    />
                  </svg>
                  <span className="text-[13px] font-medium text-zinc-600">Claude</span>
                </div>
                <span className="hidden sm:inline-block h-3 w-px bg-zinc-300" />
                <div className="flex items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 28 28" aria-hidden="true">
                    <path
                      d="M14 2.625C14 9.434 9.434 14 2.625 14 9.434 14 14 18.566 14 25.375 14 18.566 18.566 14 25.375 14 18.566 14 14 9.434 14 2.625z"
                      fill="url(#hero-gem-gradient)"
                    />
                    <defs>
                      <linearGradient
                        id="hero-gem-gradient"
                        x1="2.625"
                        y1="2.625"
                        x2="25.375"
                        y2="25.375"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#4285F4" />
                        <stop offset="0.5" stopColor="#9B72CB" />
                        <stop offset="1" stopColor="#EA4335" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="text-[13px] font-medium text-zinc-600">Gemini</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: mascot floating on the aurora ─────────── */}
          <div
            className="hero-text-rise relative mx-auto w-full max-w-[520px]"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="relative aspect-square">
              {/* Resume preview card — sits behind the mascot */}
              <div className="landing-resume-card hidden md:block" aria-hidden="true">
                <div className="landing-resume-card-scan" />
                {/* Header: avatar dot + name + role lines */}
                <div className="absolute left-6 right-6 top-6 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#A3FFB3] to-[#00a84d]" />
                  <div className="flex-1">
                    <div className="h-2 w-24 rounded-full bg-zinc-900/15" />
                    <div className="mt-1.5 h-2 w-32 rounded-full bg-zinc-900/8" />
                  </div>
                  <div className="h-5 w-12 rounded-full bg-[#A3FFB3]/40" />
                </div>

                {/* Section label */}
                <div className="absolute left-6 top-[88px]">
                  <div className="h-1.5 w-14 rounded-full bg-[#00a84d]/40" />
                </div>

                {/* Bullet rows */}
                <div className="absolute left-6 right-6 top-[108px] space-y-2.5">
                  <div className="h-1.5 w-[88%] rounded-full bg-zinc-900/9" />
                  <div className="h-1.5 w-[72%] rounded-full bg-zinc-900/9" />
                  <div className="h-1.5 w-[80%] rounded-full bg-zinc-900/9" />
                  <div className="h-1.5 w-[60%] rounded-full bg-zinc-900/9" />
                </div>

                {/* Second section label */}
                <div className="absolute bottom-[78px] left-6">
                  <div className="h-1.5 w-10 rounded-full bg-[#00a84d]/40" />
                </div>

                {/* Skill chips */}
                <div className="absolute bottom-7 left-6 right-6 flex flex-wrap gap-1.5">
                  {[
                    { w: 56, c: 'bg-[#A3FFB3]/45' },
                    { w: 48, c: 'bg-[#7BD3FC]/45' },
                    { w: 64, c: 'bg-[#FED7AA]/55' },
                    { w: 44, c: 'bg-[#A3FFB3]/45' },
                  ].map((chip, i) => (
                    <span
                      key={i}
                      className={`block h-4 rounded-full ${chip.c}`}
                      style={{ width: chip.w }}
                    />
                  ))}
                </div>
              </div>

              {/* Drifting particles — subtle dust around the mascot */}
              <div className="pointer-events-none absolute inset-0 z-[15] hidden md:block" aria-hidden="true">
                {[
                  { top: '12%', left: '18%', delay: '0s',   cls: 'landing-particle--mint' },
                  { top: '22%', left: '78%', delay: '1.4s', cls: 'landing-particle--sky landing-particle--lg' },
                  { top: '38%', left: '8%',  delay: '2.8s', cls: 'landing-particle--mint landing-particle--lg' },
                  { top: '46%', left: '88%', delay: '0.6s', cls: '' },
                  { top: '60%', left: '14%', delay: '3.4s', cls: 'landing-particle--sky' },
                  { top: '70%', left: '82%', delay: '1.0s', cls: 'landing-particle--mint' },
                  { top: '80%', left: '22%', delay: '2.2s', cls: 'landing-particle--lg' },
                  { top: '32%', left: '50%', delay: '4.0s', cls: 'landing-particle--mint' },
                ].map((p, i) => (
                  <span
                    key={i}
                    className={`landing-particle ${p.cls}`}
                    style={{ top: p.top, left: p.left, animationDelay: p.delay }}
                  />
                ))}
              </div>

              {/* Mascot */}
              <Link
                href="/auth/register"
                aria-label="Start building your resume"
                className="relative z-10 flex h-full w-full items-center justify-center cursor-pointer"
              >
                <div className="mascot-bob relative h-[78%] w-[78%]">
                  <Image
                    src="/Brands/mascot-hero-pink.webp"
                    alt="Rezoomed mascot"
                    width={700}
                    height={700}
                    priority
                    fetchPriority="high"
                    quality={70}
                    sizes="(max-width: 1024px) 360px, 420px"
                    className="h-full w-full object-contain drop-shadow-[0_24px_30px_rgba(15,23,42,0.16)]"
                  />
                </div>
              </Link>

              {/* Floating ATS chip — top-left */}
              <div className="absolute -left-3 top-10 z-20 hidden md:block badge-drift-up">
                <div className="landing-chip-floating">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                    ATS Score
                  </p>
                  <p className="mt-0.5 text-2xl font-semibold tracking-tight leading-none text-zinc-950">
                    98
                    <span className="ml-0.5 text-base text-[#00a84d]">%</span>
                  </p>
                </div>
              </div>

              {/* Floating tailoring chip — top-right (moved from bottom for balance) */}
              <div
                className="absolute -right-3 top-12 z-20 hidden md:block badge-drift-down"
                style={{ animationDelay: '0.5s' }}
              >
                <div className="landing-chip-floating">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00a84d] opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#00a84d]" />
                    </span>
                    <span className="text-[11px] font-medium tracking-wide text-zinc-700">
                      Tailoring live
                    </span>
                  </div>
                </div>
              </div>

              {/* Live match score widget — bottom-left */}
              <div
                className="absolute -left-4 bottom-8 z-20 hidden md:block badge-drift-up"
                style={{ animationDelay: '1.2s' }}
              >
                <div className="landing-match-widget">
                  <div className="landing-match-ring">
                    <span>94</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                      Match Score
                    </p>
                    <p className="mt-0.5 text-[13px] font-medium tracking-tight text-zinc-900 leading-tight">
                      Senior Frontend
                      <br />
                      <span className="text-zinc-500">@ Stripe</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
