'use client'

import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  FolderOpen,
  LayoutTemplate,
  Lock,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PRO_FEATURES } from '@/lib/proFeatures'
import { FREE_PLAN } from '@/lib/pricing'

interface FeatureSlide {
  id: string
  badge: string
  title: string
  description: string
  metricValue: string
  metricLabel: string
  icon: LucideIcon
}

const FEATURE_SLIDES = [
  {
    id: 'tailor',
    badge: 'Tailor Mode',
    title: 'Shape every resume around the exact role you want.',
    description: PRO_FEATURES.tailor.description,
    metricValue: 'Match score',
    metricLabel: 'Role-fit guidance',
    icon: WandSparkles,
  },
  {
    id: 'ats',
    badge: 'Unlimited ATS',
    title: 'Run scan after scan until the score finally looks right.',
    description: `Free plans stop at ${FREE_PLAN.limits.atsScansPerDay} ATS scans per day. Pro removes the ceiling and unlocks deeper AI analysis.`,
    metricValue: 'Unlimited',
    metricLabel: 'Daily scans',
    icon: BarChart3,
  },
  {
    id: 'exports',
    badge: 'Custom Template',
    title: 'Customize one polished template and export recruiter-ready files fast.',
    description: PRO_FEATURES.docx_download.description,
    metricValue: 'Flexible',
    metricLabel: 'Template control',
    icon: LayoutTemplate,
  },
  {
    id: 'library',
    badge: 'Resume Library',
    title: 'Keep a tailored version for every company without clutter.',
    description: PRO_FEATURES.multi_resume.description,
    metricValue: 'Unlimited',
    metricLabel: 'Saved resumes',
    icon: FolderOpen,
  },
] satisfies FeatureSlide[]

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

function RevealOnView({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const element = containerRef.current
    if (!element) {
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        const isVisible = entries.some(entry => entry.isIntersecting)
        if (!isVisible) {
          return
        }

        setIsActive(true)
        observer.disconnect()
      },
      { threshold: 0.2 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className={joinClasses('reveal-on-scroll', isActive && 'active', className)}
    >
      {children}
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] bg-white/72 px-4 py-3 shadow-[0_12px_30px_rgba(25,28,29,0.05)] backdrop-blur-xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary/60">{label}</p>
      <p className="mt-1 text-sm font-bold text-on-surface">{value}</p>
    </div>
  )
}

function PreviewValueCard({
  label,
  value,
  caption,
  dark = false,
  compact = false,
}: {
  label: string
  value: string
  caption?: string
  dark?: boolean
  compact?: boolean
}) {
  return (
    <div
      className={joinClasses(
        'flex h-full flex-col justify-between rounded-[1.35rem]',
        compact ? 'px-2.5 py-2.5' : 'px-4 py-4',
        dark
          ? 'bg-white/10 text-white shadow-[0_18px_40px_rgba(17,24,39,0.18)] backdrop-blur-sm'
          : 'bg-white text-on-background shadow-[0_12px_28px_rgba(25,28,29,0.06)]'
      )}
    >
      <p className={joinClasses('text-[10px] font-bold uppercase tracking-[0.24em]', dark ? 'text-white/55' : 'text-primary/60')}>
        {label}
      </p>
      <p
        className={joinClasses(
          compact ? 'mt-1.5 text-xl' : 'mt-3 text-3xl',
          'font-black tracking-tight leading-none',
          dark ? 'text-primary-container' : 'text-primary'
        )}
      >
        {value}
      </p>
      {caption ? (
        <p
          className={joinClasses(
            compact ? 'mt-2 text-[13px] leading-5' : 'mt-3 text-sm leading-5',
            dark ? 'text-zinc-300' : 'text-on-surface-variant'
          )}
        >
          {caption}
        </p>
      ) : null}
    </div>
  )
}

function PreviewMiniCard({
  label,
  value,
  dark = false,
  compact = false,
}: {
  label: string
  value: string
  dark?: boolean
  compact?: boolean
}) {
  return (
    <div
      className={joinClasses(
        'flex h-full flex-col justify-between rounded-[1.05rem]',
        compact ? 'px-2 py-2' : 'px-3 py-3',
        dark
          ? 'bg-white/8 text-white backdrop-blur-sm'
          : 'bg-white text-on-background shadow-[0_10px_24px_rgba(25,28,29,0.05)]'
      )}
    >
      <p
        className={joinClasses(
          'text-[9px] font-bold uppercase tracking-[0.2em]',
          dark ? 'text-white/50' : 'text-primary/55'
        )}
      >
        {label}
      </p>
      <p className={joinClasses(compact ? 'text-xs' : 'text-sm', 'font-bold leading-5', dark ? 'text-white' : 'text-on-surface')}>
        {value}
      </p>
    </div>
  )
}

function PreviewProgressCard({
  label,
  value,
  progress,
  dark = false,
  compact = false,
}: {
  label: string
  value: string
  progress: number
  dark?: boolean
  compact?: boolean
}) {
  return (
    <div
      className={joinClasses(
        'flex h-full flex-col justify-between rounded-[1.25rem]',
        compact ? 'px-2.5 py-2.5' : 'px-4 py-4',
        dark ? 'bg-white/8 text-white backdrop-blur-sm' : 'bg-white text-on-background shadow-[0_12px_28px_rgba(25,28,29,0.05)]'
      )}
    >
      <div className={joinClasses(compact ? 'mb-1.5 text-xs' : 'mb-3 text-sm', 'flex items-center justify-between gap-3')}>
        <span className={joinClasses('font-semibold', dark ? 'text-white/90' : 'text-on-surface')}>{label}</span>
        <span className={joinClasses('font-bold', dark ? 'text-primary-container' : 'text-primary')}>{value}</span>
      </div>
      <div className={joinClasses('h-2 overflow-hidden rounded-full', dark ? 'bg-white/10' : 'bg-surface-container-low')}>
        <div
          className="h-2 rounded-full"
          style={{
            width: `${progress}%`,
            backgroundImage: 'var(--signature-gradient)',
          }}
        />
      </div>
    </div>
  )
}

function PreviewTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/85">
      {children}
    </span>
  )
}

function CarouselPreview({ slideId, compact = false }: { slideId: string; compact?: boolean }) {
  const shellClassName = compact ? 'min-h-[12.75rem]' : 'h-full'
  const splitLayoutClass = compact
    ? 'grid gap-2 grid-cols-1'
    : 'grid h-full gap-3 grid-cols-[minmax(0,1fr)_9.75rem] xl:grid-cols-[minmax(0,1fr)_11rem]'
  const sideStackClass = compact
    ? 'grid grid-cols-2 gap-2'
    : 'grid h-full gap-3 grid-rows-[minmax(0,1fr)_5rem]'
  const sideMiniGridClass = compact ? 'grid grid-cols-2 gap-2' : 'grid h-full grid-cols-2 gap-3'
  const mainTailorGridClass = compact ? 'grid gap-2 grid-rows-[auto_auto_auto]' : 'grid h-full gap-3 grid-rows-[minmax(0,1fr)_auto_6rem]'
  const lightShellClass = `overflow-hidden rounded-[1.7rem] bg-white shadow-[0_24px_60px_rgba(2,109,50,0.1)] ${shellClassName} ${compact ? 'p-3' : 'p-5'}`

  if (slideId === 'tailor') {
    return (
      <div className={`relative overflow-hidden rounded-[1.7rem] bg-zinc-950 text-white shadow-[0_24px_60px_rgba(2,109,50,0.22)] ${shellClassName} ${compact ? 'p-3' : 'p-5'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(163,255,179,0.16),transparent_45%)]" />
        <div className="scanning-animation opacity-80" />
        <div className={joinClasses('relative', splitLayoutClass)}>
          <div className={mainTailorGridClass}>
            <div className={joinClasses('rounded-[1.35rem] bg-white/8 backdrop-blur-sm', compact ? 'p-2.5' : 'p-4')}>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-100/55">Target role</p>
              <p className={joinClasses(compact ? 'mt-1.5 text-sm' : 'mt-3 text-lg', 'font-bold tracking-tight')}>Senior Product Designer</p>
              {!compact ? (
                <p className="mt-1 text-sm text-zinc-300">JD focus mapped to your strongest proof points.</p>
              ) : null}
            </div>
            <div className={joinClasses('flex flex-wrap', compact ? 'gap-1.5' : 'gap-2')}>
              {(compact ? ['Leadership', 'Research'] : ['Leadership', 'Research', 'Systems']).map(tag => (
                <PreviewTag key={tag}>
                  {tag}
                </PreviewTag>
              ))}
            </div>
            <div className={joinClasses('grid h-full grid-cols-2', compact ? 'gap-2' : 'gap-3')}>
              <PreviewProgressCard label="Keyword coverage" value="91%" progress={91} dark compact={compact} />
              <PreviewProgressCard label="Impact wording" value="86%" progress={86} dark compact={compact} />
            </div>
          </div>

          <div className={sideStackClass}>
            <PreviewValueCard
              label="ATS Match"
              value="92%"
              caption="Missing skills and weak phrasing surfaced instantly."
              dark
              compact={compact}
            />
            <div className={sideMiniGridClass}>
              <PreviewMiniCard label="Tone" value="Role-fit" dark compact={compact} />
              <PreviewMiniCard label="Coverage" value="+18%" dark compact={compact} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (slideId === 'ats') {
    return (
      <div className={lightShellClass}>
        <div className={splitLayoutClass}>
          <div className="grid h-full auto-rows-fr grid-cols-2 gap-3">
            {[
              { label: 'Contact details', value: '10/10', progress: 100 },
              { label: 'Keyword coverage', value: '8.8/10', progress: 88 },
              { label: 'Impact statements', value: '9.2/10', progress: 92 },
              { label: 'Formatting safety', value: '9.6/10', progress: 96 },
            ].map(item => (
              <PreviewProgressCard
                key={item.label}
                label={item.label}
                value={item.value}
                progress={item.progress}
                compact={compact}
              />
            ))}
          </div>

          <div className={sideStackClass}>
            <PreviewValueCard
              label="Daily limit"
              value="∞"
              caption="Scan every revision until the score stabilizes."
              compact={compact}
            />
            <div className={sideMiniGridClass}>
              <PreviewMiniCard label="Free" value="3/day" compact={compact} />
              <PreviewMiniCard label="AI" value="Advanced" compact={compact} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (slideId === 'exports') {
    return (
      <div className={`overflow-hidden rounded-[1.7rem] bg-surface-container-low ${shellClassName} ${compact ? 'p-3' : 'p-5'}`}>
        <div className={splitLayoutClass}>
          <div className="relative flex h-full items-center justify-center">
            <div className={joinClasses('absolute rounded-[1.5rem] bg-zinc-900/10', compact ? 'h-28 w-20 -translate-x-5 translate-y-1' : 'h-36 w-28 -translate-x-7 translate-y-1')} />
            <div
              className={joinClasses('absolute rounded-[1.5rem] bg-zinc-900/15', compact ? 'h-32 w-24 translate-x-4 -translate-y-1' : 'h-40 w-[7.5rem] translate-x-6 -translate-y-2')}
            />
            <div
              className={joinClasses('relative rounded-[1.6rem] bg-white shadow-[0_20px_45px_rgba(17,24,39,0.1)]', compact ? 'h-36 w-24 p-3' : 'h-44 w-32 p-4')}
            >
              <div className="h-1 w-16 rounded-full bg-primary" />
              <div className="mt-4 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary-container/70" />
                <div className="space-y-1">
                  <div className="h-2 w-14 rounded-full bg-zinc-800" />
                  <div className="h-1.5 w-9 rounded-full bg-zinc-300" />
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <div className="h-1.5 rounded-full bg-zinc-100" />
                <div className="h-1.5 rounded-full bg-zinc-100" />
                <div className="h-1.5 w-4/5 rounded-full bg-zinc-100" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                <span className="rounded-lg bg-surface-container-low px-2 py-1">DOCX</span>
                <span className="rounded-lg bg-primary-container/50 px-2 py-1 text-primary">ATS</span>
              </div>
            </div>
          </div>

          <div className={sideStackClass}>
            <PreviewValueCard
              label="Primary Export"
              value="DOCX"
              caption="Editable by recruiters and easy to share."
              compact={compact}
            />
            <div className={sideMiniGridClass}>
              <PreviewMiniCard label="PDF" value="Ready" compact={compact} />
              <PreviewMiniCard label="Controls" value="Flexible" compact={compact} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={lightShellClass}>
      <div className={splitLayoutClass}>
        <div className="grid h-full grid-rows-3 gap-3">
          {[
            ['PM Resume', 'Stripe', '96 ATS'],
            ['Growth Resume', 'Notion', '94 ATS'],
            ['Design Systems', 'Figma', '91 ATS'],
          ].map(([title, company, score], index) => (
            <div
              key={title}
              className="flex items-center justify-between rounded-[1.35rem] bg-surface-container-low px-4 py-3 transition-transform hover:translate-x-1"
              style={{ transitionDelay: `${index * 40}ms` }}
            >
              <div>
                <p className="font-semibold text-on-surface">{title}</p>
                <p className="text-sm text-on-surface-variant">{company}</p>
              </div>
              <span className="rounded-full bg-primary-container/60 px-3 py-1 text-xs font-bold text-on-primary-container">
                {score}
              </span>
            </div>
          ))}
        </div>

        <div className={sideStackClass}>
          <PreviewValueCard
            label="Stored"
            value="∞"
            caption="Keep a version for every company, role, and level."
            compact={compact}
          />
          <div className={sideMiniGridClass}>
            <PreviewMiniCard label="Scores" value="Per version" compact={compact} />
            <PreviewMiniCard label="Switch" value="Instant" compact={compact} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function FeatureStatsGrid({ className }: { className?: string }) {
  return (
    <div className={joinClasses('grid gap-3 sm:grid-cols-2 xl:grid-cols-4', className)}>
      <StatPill label="Tailor Mode" value="JD-aware AI" />
      <StatPill label="ATS Scans" value="Unlimited" />
      <StatPill label="Template" value="Customizable" />
      <StatPill label="Exports" value="PDF + DOCX" />
    </div>
  )
}

export function FeatureShowcase({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isCompactViewport, setIsCompactViewport] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)')
    const updateCompactViewport = () => setIsCompactViewport(mediaQuery.matches)
    updateCompactViewport()
    mediaQuery.addEventListener('change', updateCompactViewport)
    return () => mediaQuery.removeEventListener('change', updateCompactViewport)
  }, [])

  useEffect(() => {
    if (isPaused) return

    const timer = window.setTimeout(() => {
      setActiveIndex(previousIndex => (previousIndex + 1) % FEATURE_SLIDES.length)
    }, 4800)

    return () => window.clearTimeout(timer)
  }, [activeIndex, isPaused])

  function handleFeatureSelect(index: number) {
    setActiveIndex(index)
  }

  const isCompact = compact || isCompactViewport
  const slide = FEATURE_SLIDES[activeIndex]
  const Icon = slide.icon
  const carouselCardHeightClass = isCompact ? 'min-h-[21.5rem]' : 'h-[35.5rem] xl:h-[36rem]'
  const desktopLayoutClass = 'lg:grid lg:h-full lg:grid-rows-[13.5rem_minmax(0,1fr)] lg:gap-4'

  return (
    <div
      className={joinClasses('flex flex-col gap-4', className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false)
        }
      }}
    >
      <div
        className={`relative overflow-hidden rounded-[2rem] border border-white/75 bg-white/78 backdrop-blur-2xl shadow-[0_26px_70px_rgba(25,28,29,0.08)] ${carouselCardHeightClass} ${
          isCompact ? 'p-3' : 'p-6 xl:p-7'
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(163,255,179,0.24),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(2,109,50,0.08),transparent_32%)]" />

        <div className={joinClasses('relative h-full flex flex-col gap-5 lg:gap-0', desktopLayoutClass)}>
          <div
            className={joinClasses(
              isCompact ? 'space-y-4' : 'grid min-h-[9rem] gap-5 xl:grid-cols-[minmax(0,1fr)_170px] xl:gap-5',
              'lg:h-full lg:min-h-0'
            )}
          >
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-container/55 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
                <Lock size={12} strokeWidth={2.5} />
                {slide.badge}
              </span>
              <h2
                className={`mt-4 font-black tracking-tight leading-[0.96] text-on-background ${
                  isCompact ? 'text-[clamp(1.45rem,7vw,1.9rem)]' : 'text-[clamp(2.05rem,2.75vw,2.55rem)]'
                }`}
              >
                {slide.title}
              </h2>
            </div>

            <div className={`flex ${isCompact ? 'items-center justify-between gap-3' : 'flex-row items-center justify-between gap-4 xl:flex-col xl:items-end xl:justify-start'}`}>
              <div className={joinClasses('flex shrink-0 items-center justify-center rounded-[1.2rem] bg-primary-container/75 text-on-primary-container shadow-[0_18px_40px_rgba(2,109,50,0.14)]', isCompact ? 'h-9 w-9' : 'h-12 w-12')}>
                <Icon size={isCompact ? 16 : 22} strokeWidth={2.4} />
              </div>

              <div className={joinClasses('rounded-[1.4rem] bg-zinc-950 text-white shadow-[0_18px_50px_rgba(17,24,39,0.18)]', isCompact ? 'px-3 py-2' : 'px-4 py-3')}>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">{slide.metricLabel}</p>
                <p className={joinClasses(isCompact ? 'mt-1 text-base' : 'mt-2 text-xl', 'font-black tracking-tight')}>{slide.metricValue}</p>
              </div>
            </div>
          </div>

          <div className="lg:h-full">
            <CarouselPreview slideId={slide.id} compact={isCompact} />
          </div>
        </div>
      </div>

      <div className={`grid gap-2 ${isCompact ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 xl:grid-cols-4'}`}>
        {FEATURE_SLIDES.map((item, index) => {
          const isActive = index === activeIndex

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleFeatureSelect(index)}
              aria-pressed={isActive}
              aria-label={`Feature ${index + 1}: ${item.badge}`}
              className={`group cursor-pointer rounded-[1.2rem] text-left transition-all duration-500 ${
                isActive
                  ? 'bg-zinc-950 text-white shadow-[0_20px_40px_rgba(17,24,39,0.14)]'
                  : 'bg-white/72 text-on-surface shadow-[0_12px_30px_rgba(25,28,29,0.04)] hover:-translate-y-0.5'
              } ${isCompact ? 'px-3 py-2.5' : 'px-4 py-3'}`}
            >
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">{`0${index + 1}`}</span>
              <span className={joinClasses(isCompact ? 'mt-0.5 text-[13px]' : 'mt-1 text-sm', 'block font-bold tracking-tight')}>{item.badge}</span>
              <span className={joinClasses(isCompact ? 'mt-0.5 text-[11px]' : 'mt-1 text-xs', 'block opacity-70')}>{item.metricValue}</span>
              <span className={`mt-2 block h-[3px] rounded-full ${isActive ? 'bg-white/10' : 'bg-zinc-900/6'}`}>
                {isActive ? (
                  <span
                    key={`${item.id}-progress`}
                    className="login-progress-fill block h-full rounded-full bg-primary-container"
                  />
                ) : null}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function FeatureShowcaseSection() {
  return (
    <section id="features" className="py-28 px-6 bg-surface-container-low overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-start">
          <RevealOnView className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-container/40 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container border border-primary-container/50">
              <span aria-hidden="true">✦</span>
              Premium Features
            </span>

            <div className="space-y-4">
              <h2 className="text-4xl font-extrabold tracking-tight text-on-background sm:text-5xl xl:text-6xl">
                The feature stack that turns one resume{' '}
                <em className="text-primary">into a system.</em>
              </h2>
              <p className="max-w-xl text-lg leading-8 text-on-surface-variant">
                Tailor each version for the job, run deeper ATS diagnostics, export polished files, and keep every role-specific draft organized.
              </p>
            </div>

            <FeatureStatsGrid className="pt-2 xl:grid-cols-2" />

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-zinc-900"
              >
                Get Started
                <ArrowRight size={14} strokeWidth={2.6} />
              </Link>
            </div>
          </RevealOnView>

          <RevealOnView className="stagger-2 xl:pl-4">
            <FeatureShowcase />
          </RevealOnView>
        </div>
      </div>
    </section>
  )
}
