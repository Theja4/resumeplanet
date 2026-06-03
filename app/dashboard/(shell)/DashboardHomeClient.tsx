'use client'

import { startTransition, useEffect, useMemo, useState, type SVGProps } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Loader2,
  Puzzle,
  Send,
  Sparkles,
  Target,
  Upload,
  Wand2,
  type LucideIcon,
} from 'lucide-react'
import AdBanner from '@/components/shared/AdBanner'
import { DashboardSurface } from '@/components/layout/DashboardSurface'
import { ADS_ENABLED } from '@/lib/ads'
import { getAvatarColor, getInitials } from '@/lib/avatar'
import { CHROME_STORE_URL } from '@/lib/site'
import type { DashboardOverview, Profile } from '@/types'

type DashboardAction = {
  href: string
  label: string
  title: string
  description: string
  Icon: LucideIcon
}

type ToolCardItem = {
  href: string
  title: string
  description: string
  icon: ToolIconKind
  badge?: string
  external?: boolean
}

type ToolIconKind =
  | 'library'
  | 'ats'
  | 'linkedin'
  | 'tailor'
  | 'match'
  | 'cover'
  | 'metadata'
  | 'site'

function CrownUpgradeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5.7 22.7 4.3 9.2l6.7 5.5L16 5l5 9.7 6.7-5.5-1.4 13.5H5.7Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M5.7 22.7 4.3 9.2l6.7 5.5L16 5l5 9.7 6.7-5.5-1.4 13.5H5.7Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M7.4 27h17.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12.4 19h7.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}

function LaunchpadIcon({
  kind,
  className,
}: {
  kind: ToolIconKind
  className?: string
}) {
  if (kind === 'library') {
    return (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
        <path className="fill-current opacity-10 transition-all duration-500 group-hover/tool:fill-sky-300 group-hover/tool:opacity-70" d="M12 9h18l8 8v30H12z" />
        <path d="M12 9h18l8 8v30H12zM30 9v9h8" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" />
        <path className="stroke-current opacity-65 transition-all duration-500 group-hover/tool:stroke-white group-hover/tool:opacity-100" d="M18 24h14M18 30h12M18 36h8" strokeWidth="2.6" strokeLinecap="round" />
        <path className="origin-center fill-amber-300 opacity-0 transition-all duration-500 [transform-box:fill-box] group-hover/tool:-translate-y-1 group-hover/tool:rotate-12 group-hover/tool:opacity-100" d="M11 5l1.5 3.5 3.8.8-2.8 2.5.4 3.8-3.3-1.9-3.5 1.5.8-3.7-2.5-2.9 3.8-.4L11 5z" />
        <path className="stroke-white opacity-0 transition-opacity duration-500 group-hover/tool:opacity-100" d="M19 24h9M19 30h7" strokeWidth="2.1" strokeLinecap="round" />
      </svg>
    )
  }

  if (kind === 'ats') {
    return (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
        <path className="fill-current opacity-10 transition-all duration-500 group-hover/tool:fill-emerald-300 group-hover/tool:opacity-70" d="M13 10h26v34H13z" />
        <path d="M13 10h26v34H13zM19 10a5 5 0 0010 0" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" />
        <path className="origin-center stroke-current transition-all duration-500 [transform-box:fill-box] group-hover/tool:scale-110 group-hover/tool:stroke-white" d="M19 25l4 4 9-10" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        <path className="stroke-current opacity-65 transition-all duration-500 group-hover/tool:stroke-sky-300 group-hover/tool:opacity-100 group-hover/tool:-translate-y-1" d="M20 36h3M27 36h3M34 36h3" strokeWidth="3" strokeLinecap="round" />
        <circle className="fill-rose-300 opacity-0 transition-all duration-500 group-hover/tool:translate-x-1 group-hover/tool:-translate-y-1 group-hover/tool:opacity-100" cx="37" cy="15" r="3" />
      </svg>
    )
  }

  if (kind === 'linkedin') {
    return (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
        <path className="fill-current opacity-10 transition-all duration-500 group-hover/tool:fill-[#0a66c2] group-hover/tool:opacity-100" d="M11 13a5 5 0 015-5h17a5 5 0 015 5v21a5 5 0 01-5 5H16a5 5 0 01-5-5z" />
        <path className="transition-all duration-500 group-hover/tool:stroke-white" d="M17 22v13M17 16v.2M23.5 35V22.4M23.5 27c1.4-3 3.3-4.5 5.8-4.5 3.6 0 5.4 2.4 5.4 6.3V35" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path className="stroke-current opacity-75 transition-all duration-500 group-hover/tool:stroke-amber-300 group-hover/tool:rotate-45 [transform-box:fill-box] [transform-origin:center]" d="M38 7.5v6M35 10.5h6" strokeWidth="2.6" strokeLinecap="round" />
        <path className="stroke-white opacity-0 transition-all duration-500 group-hover/tool:translate-x-1 group-hover/tool:opacity-100" d="M29 14l2 2 4.2-4.7" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (kind === 'tailor') {
    return (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
        <path className="fill-current opacity-10 transition-all duration-500 group-hover/tool:fill-[#087f3f] group-hover/tool:opacity-100" d="M10 8h21l7 7v32H10z" />
        <path className="transition-all duration-500 group-hover/tool:stroke-white" d="M10 8h21l7 7v32H10zM31 8v8h7" stroke="currentColor" strokeWidth="2.7" strokeLinejoin="round" />
        <path className="stroke-current opacity-65 transition-all duration-500 group-hover/tool:stroke-white group-hover/tool:opacity-100" d="M16 20h12M16 26h16M16 32h9" strokeWidth="2.5" strokeLinecap="round" />
        <path className="fill-current opacity-[0.12] transition-all duration-500 group-hover/tool:translate-x-1 group-hover/tool:-translate-y-1 group-hover/tool:fill-sky-400 group-hover/tool:opacity-100" d="M26.5 35.5 36.8 25.2a3.2 3.2 0 014.5 4.5L31 40l-8 2.4z" />
        <path className="transition-all duration-500 group-hover/tool:translate-x-1 group-hover/tool:-translate-y-1 group-hover/tool:stroke-white" d="m34 26 4.2 4.2M25.2 39.8l2.2-6.1 6.1 6.1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path className="origin-center fill-amber-300 opacity-0 transition-all duration-500 [transform-box:fill-box] group-hover/tool:-translate-y-1 group-hover/tool:rotate-12 group-hover/tool:opacity-100" d="M38 5.5 40 10l4.7 1-3.5 3.1.5 4.8-4.2-2.5-4.4 1.9 1-4.7-3.2-3.6 4.8-.4z" />
        <path className="stroke-fuchsia-300 opacity-0 transition-all duration-500 group-hover/tool:opacity-100" d="M8 16v4M6 18h4M42 35v5M39.5 37.5h5" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    )
  }

  if (kind === 'match') {
    return (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
        <circle className="stroke-current opacity-35 transition-all duration-500 group-hover/tool:stroke-amber-300 group-hover/tool:opacity-100 group-hover/tool:scale-110 [transform-box:fill-box] [transform-origin:center]" cx="24" cy="24" r="15" strokeWidth="3" />
        <circle cx="24" cy="24" r="8.5" stroke="currentColor" strokeWidth="3" />
        <circle className="fill-current transition-all duration-500 group-hover/tool:fill-white group-hover/tool:scale-125 [transform-box:fill-box] [transform-origin:center]" cx="24" cy="24" r="3.5" />
        <path className="origin-center transition-transform duration-700 [transform-box:fill-box] group-hover/tool:rotate-45" d="M24 5v5M24 38v5M5 24h5M38 24h5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle className="fill-sky-300 opacity-0 transition-all duration-500 group-hover/tool:translate-x-1 group-hover/tool:-translate-y-1 group-hover/tool:opacity-100" cx="36" cy="13" r="3" />
      </svg>
    )
  }

  if (kind === 'cover') {
    return (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
        <path className="fill-current opacity-10 transition-all duration-500 group-hover/tool:fill-rose-300 group-hover/tool:opacity-80" d="M9 15h30v25H9z" />
        <path d="M9 15h30v25H9zM10 16l14 13 14-13" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" />
        <path className="origin-center fill-current opacity-80 transition-all duration-500 [transform-box:fill-box] group-hover/tool:-translate-y-1 group-hover/tool:scale-110 group-hover/tool:fill-amber-300 group-hover/tool:opacity-100" d="M24 36l-1.8-1.6c-3.4-2.9-5.3-4.5-5.3-7 0-2 1.5-3.5 3.5-3.5 1.2 0 2.3.6 3 1.5.7-.9 1.8-1.5 3-1.5 2 0 3.5 1.5 3.5 3.5 0 2.5-1.9 4.1-5.3 7z" />
        <path className="stroke-white opacity-0 transition-opacity duration-500 group-hover/tool:opacity-100" d="M16 20l8 7 8-7" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (kind === 'metadata') {
    return (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
        <path className="fill-current opacity-10 transition-all duration-500 group-hover/tool:fill-orange-300 group-hover/tool:opacity-75" d="M13 8h17l7 7v32H13z" />
        <path d="M13 8h17l7 7v32H13zM30 8v8h7" stroke="currentColor" strokeWidth="2.7" strokeLinejoin="round" />
        <path className="stroke-current opacity-65 transition-all duration-500 group-hover/tool:stroke-white group-hover/tool:opacity-100" d="M18 24h11M18 30h15" strokeWidth="2.4" strokeLinecap="round" />
        <rect className="fill-current opacity-15 transition-all duration-500 group-hover/tool:fill-sky-300 group-hover/tool:opacity-100 group-hover/tool:-translate-y-1" x="18" y="35" width="16" height="7" rx="3.5" />
        <path className="stroke-current transition-all duration-500 group-hover/tool:stroke-white" d="M22 38.5h7" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
      <circle className="fill-current opacity-10 transition-all duration-500 group-hover/tool:fill-sky-300 group-hover/tool:opacity-70" cx="23" cy="23" r="15" />
      <circle cx="23" cy="23" r="15" stroke="currentColor" strokeWidth="2.7" />
      <path d="M8 23h30M23 8c4.2 4.2 6.3 9 6.3 15S27.2 33.8 23 38M23 8c-4.2 4.2-6.3 9-6.3 15s2.1 10.8 6.3 15" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" />
      <path className="origin-center fill-current stroke-current opacity-90 transition-all duration-500 [transform-box:fill-box] group-hover/tool:translate-x-2 group-hover/tool:-translate-y-2 group-hover/tool:rotate-6 group-hover/tool:fill-amber-300 group-hover/tool:stroke-white" d="M30.5 30.5l10 4-4.5 2-2 4.5-4-10z" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function scoreTone(score: number | null) {
  if (score === null) {
    return {
      label: 'Not scanned yet',
      valueClass: 'text-slate-400',
      accent: '#94a3b8',
      bg: 'bg-slate-100 text-slate-500',
    }
  }

  if (score < 50) {
    return {
      label: 'Needs repair',
      valueClass: 'text-red-600',
      accent: '#dc2626',
      bg: 'bg-red-50 text-red-700',
    }
  }

  if (score < 70) {
    return {
      label: 'Improve before applying',
      valueClass: 'text-amber-600',
      accent: '#d97706',
      bg: 'bg-amber-50 text-amber-700',
    }
  }

  if (score < 85) {
    return {
      label: 'Interview ready',
      valueClass: 'text-emerald-700',
      accent: '#059669',
      bg: 'bg-emerald-50 text-emerald-700',
    }
  }

  return {
    label: 'Strong position',
    valueClass: 'text-[#087f3f]',
    accent: '#087f3f',
    bg: 'bg-emerald-100 text-emerald-800',
  }
}

function getPrimaryAction(resumeCount: number | null, lastScore: number | null): DashboardAction {
  if ((resumeCount ?? 0) === 0) {
    return {
      href: '/dashboard/resumes',
      label: 'Start here',
      title: 'Upload your first resume',
      description: 'Get your base resume into Rezoomed so every scan, rewrite, and export has a source of truth.',
      Icon: Upload,
    }
  }

  if (lastScore === null) {
    return {
      href: '/dashboard/ats-checker',
      label: 'Next best move',
      title: 'Run an ATS scan',
      description: 'Find parsing issues, weak section evidence, and recruiter-readability gaps before you tailor for jobs.',
      Icon: ClipboardCheck,
    }
  }

  if (lastScore < 70) {
    return {
      href: '/dashboard/ats-checker',
      label: 'Needs focus',
      title: 'Fix the highest-impact gaps',
      description: 'Start with the scan results, then push a stronger draft into the builder when the fundamentals are clean.',
      Icon: BarChart3,
    }
  }

  return {
    href: '/dashboard/match-score',
    label: 'Ready to target',
    title: 'Match this resume to a real job',
    description: 'Paste a job description and see the role-specific gaps before sending another application.',
    Icon: Target,
  }
}

function ReadinessRing({
  score,
  loading,
}: {
  score: number | null
  loading: boolean
}) {
  const tone = scoreTone(score)
  const value = score ?? 0

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(${tone.accent} ${value * 3.6}deg, rgba(15,23,42,0.08) 0deg)`,
        }}
      >
        <div className="flex h-[4.9rem] w-[4.9rem] items-center justify-center rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)]">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          ) : (
            <span className={`text-2xl font-black tracking-tight ${tone.valueClass}`}>
              {score === null ? '--' : score}
            </span>
          )}
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
          ATS readiness
        </p>
        <p className="mt-1 text-sm font-black text-slate-950">{tone.label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {score === null
            ? 'Run a scan to turn this into a live quality signal.'
            : 'Use this as the checkpoint before tailoring or exporting.'}
        </p>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  helper,
  Icon,
  loading = false,
  arrow = false,
}: {
  label: string
  value: string
  helper: string
  Icon: LucideIcon
  loading?: boolean
  arrow?: boolean
}) {
  return (
    <DashboardSurface variant="subtle" className="p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#087f3f]">
          <Icon size={18} strokeWidth={2.1} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-2xl font-black tracking-tight text-slate-950 ${loading ? 'opacity-50' : ''}`}>
              {value}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">{helper}</p>
        </div>
        {arrow ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-[0_6px_16px_rgba(15,23,42,0.06)] transition-all group-hover:bg-[#087f3f] group-hover:text-white">
            <ArrowRight size={16} />
          </span>
        ) : null}
      </div>
    </DashboardSurface>
  )
}

function ToolCard({
  href,
  title,
  description,
  icon,
  badge,
  external = false,
}: ToolCardItem) {
  const className =
    'group/tool relative flex min-h-[8.5rem] flex-col justify-between overflow-hidden rounded-[1.25rem] border border-black/5 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#087f3f]/20 hover:shadow-[0_20px_42px_rgba(15,23,42,0.08)]'
  const content = (
    <>
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(14,165,233,0.16),transparent_34%),radial-gradient(circle_at_85%_18%,rgba(250,204,21,0.16),transparent_30%),radial-gradient(circle_at_72%_88%,rgba(236,72,153,0.12),transparent_34%)] opacity-0 transition-opacity duration-300 group-hover/tool:opacity-100" />
      <span className="pointer-events-none absolute inset-y-0 -left-24 w-20 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.82),transparent)] opacity-0 transition-all duration-700 group-hover/tool:left-full group-hover/tool:opacity-100" />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#087f3f] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_24px_rgba(15,23,42,0.06)] transition-all duration-300 group-hover/tool:-rotate-2 group-hover/tool:scale-105 group-hover/tool:bg-[linear-gradient(135deg,#0ea5e9,#10b981,#fbbf24)] group-hover/tool:text-white group-hover/tool:shadow-[0_16px_36px_rgba(15,23,42,0.18)]">
          <LaunchpadIcon kind={icon} className="h-10 w-10 overflow-visible transition-transform duration-300 group-hover/tool:scale-110" />
        </span>
        <div className="flex items-center gap-1.5">
          {badge ? (
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.13em] ${
              badge === 'New' ? 'bg-amber-400 text-black' : 'bg-emerald-50 text-[#087f3f]'
            }`}>
              {badge}
            </span>
          ) : null}
          {external ? <ExternalLink size={13} className="text-slate-400" /> : null}
        </div>
      </div>
      <div className="relative z-10">
        <h3 className="text-sm font-black tracking-tight text-slate-950">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </>
  )

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    )
  }

  return (
    <Link href={href} prefetch className={className}>
      {content}
    </Link>
  )
}

function JourneyPathway({
  resumeCount,
  lastScore,
}: {
  resumeCount: number | null
  lastScore: number | null
}) {
  const steps = [
    { title: 'Build resume', sub: 'Upload or create', Icon: Upload, href: '/dashboard/resumes', done: (resumeCount ?? 0) > 0 },
    { title: 'ATS readiness', sub: 'Scan & fix', Icon: BarChart3, href: '/dashboard/ats-checker', done: lastScore !== null },
    { title: 'Tailor to job', sub: 'Rewrite per role', Icon: Wand2, href: '/dashboard/builder?mode=tailor', done: false },
    { title: 'Match score', sub: 'Check the fit', Icon: Target, href: '/dashboard/match-score', done: false },
    { title: 'Apply', sub: 'Send with confidence', Icon: Send, href: '/dashboard/jobs', done: false },
  ]
  const firstIncomplete = steps.findIndex(s => !s.done)
  const activeIndex = firstIncomplete === -1 ? steps.length - 1 : firstIncomplete

  return (
    <DashboardSurface variant="default" className="p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#087f3f]">Your path to hired</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">From blank page to sent application</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
          Step {activeIndex + 1} of {steps.length}
        </span>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:gap-0 sm:overflow-visible">
        {steps.map((s, i) => {
          const done = s.done
          const active = i === activeIndex
          return (
            <Link
              key={s.title}
              href={s.href}
              prefetch
              className="group relative flex min-w-[6.5rem] flex-col items-center px-1 text-center sm:min-w-0"
            >
              {i < steps.length - 1 ? (
                <span
                  className={`absolute left-[calc(50%+1.5rem)] right-[calc(-50%+1.5rem)] top-6 hidden h-[3px] rounded-full sm:block ${
                    done ? 'bg-[#087f3f]' : 'bg-slate-200'
                  }`}
                />
              ) : null}
              <span
                className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:-translate-y-0.5 ${
                  done
                    ? 'bg-[#087f3f] text-white shadow-[0_12px_26px_rgba(2,109,50,0.22)]'
                    : active
                      ? 'bg-amber-400 text-black shadow-[0_12px_26px_rgba(245,158,11,0.28)] ring-4 ring-amber-100'
                      : 'bg-white text-slate-400 ring-1 ring-slate-200'
                }`}
              >
                {done ? <BadgeCheck size={20} /> : <s.Icon size={18} strokeWidth={2.2} />}
              </span>
              <p className="mt-2 text-[13px] font-black leading-tight text-slate-900">{s.title}</p>
              <p className="text-[11px] leading-4 text-slate-500">{s.sub}</p>
            </Link>
          )
        })}
      </div>
    </DashboardSurface>
  )
}

function LinkedInExtensionCard() {
  const [imgOk, setImgOk] = useState(true)
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-[linear-gradient(155deg,#0a66c2_0%,#06335f_100%)] p-5 text-white shadow-[0_24px_60px_rgba(8,60,120,0.32)]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-sky-300/25 blur-2xl" />
      <div className="relative">
        <div className="flex items-start gap-3.5">
          {imgOk ? (
            <Image
              src="/linkedin-extension.png"
              alt="Rezoomed LinkedIn extension"
              width={56}
              height={56}
              onError={() => setImgOk(false)}
              className="h-14 w-14 shrink-0 rounded-2xl object-contain shadow-[0_10px_24px_rgba(0,0,0,0.22)]"
            />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0a66c2] shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
              <Puzzle size={24} />
            </span>
          )}
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-white">
              Free · Chrome
            </span>
            <h3 className="mt-2 text-base font-black leading-tight">Make your LinkedIn recruiter-ready</h3>
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-sky-50/85">
          Audit your profile and fix what recruiters filter on — right inside LinkedIn.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <a
            href={CHROME_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#0a66c2] transition-all hover:-translate-y-0.5 hover:bg-sky-50"
          >
            Add to Chrome
            <ExternalLink size={14} />
          </a>
          <Link
            href="/linkedin-optimizer"
            prefetch
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-white/20"
          >
            Learn more
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}

function UpgradeNudge({ slotsLeft }: { slotsLeft: number | null }) {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-[linear-gradient(155deg,#0b7a3d_0%,#063d22_100%)] p-5 text-white shadow-[0_24px_60px_rgba(2,80,40,0.3)]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/20 blur-2xl" />
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]">
          <CrownUpgradeIcon className="h-3.5 w-3.5" /> Rezoomed Pro
        </span>
        <h3 className="mt-3 text-xl font-black leading-tight">Stop getting filtered out</h3>
        <p className="mt-1.5 text-sm leading-6 text-emerald-50/85">
          {slotsLeft !== null && slotsLeft <= 1
            ? 'You’re almost out of free resume slots. Other applicants are tailoring every application — keep up.'
            : 'Other applicants are tailoring every application with AI. Unlock the full arsenal.'}
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-emerald-50/90">
          {['Unlimited resumes & cover letters', 'AI tailoring + Match Score', 'Advanced ATS with Claude'].map(f => (
            <li key={f} className="flex items-start gap-2">
              <BadgeCheck size={15} className="mt-0.5 shrink-0 text-emerald-300" /> {f}
            </li>
          ))}
        </ul>
        <Link
          href="/dashboard/pricing?source=dashboard_nudge"
          prefetch
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#026d32] transition-all hover:-translate-y-0.5 hover:bg-emerald-50"
        >
          <CrownUpgradeIcon className="h-4 w-4" /> Upgrade to Pro <ArrowRight size={16} />
        </Link>
        <p className="mt-2 text-center text-[11px] text-emerald-100/70">Cancel anytime</p>
      </div>
    </div>
  )
}

function EmptyPreviewGraphic() {
  return (
    <div className="relative h-full min-h-[17rem] overflow-hidden rounded-[1.6rem] bg-[linear-gradient(160deg,#0b1220_0%,#0f1f17_100%)] p-6 text-white shadow-[0_28px_60px_rgba(8,15,12,0.4)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(16,185,129,0.32),transparent_40%),radial-gradient(circle_at_88%_82%,rgba(250,204,21,0.15),transparent_44%)]" />
      <div className="relative flex h-full flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100 ring-1 ring-white/10">
            <Sparkles size={11} className="text-amber-300" /> Resume signal
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200 ring-1 ring-emerald-300/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Live
          </span>
        </div>

        <div className="mx-auto w-full max-w-[16.5rem] rounded-2xl bg-white p-4 text-slate-900 shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-full bg-[linear-gradient(145deg,#34d399,#059669)]" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-2.5 w-24 rounded-full bg-slate-900" />
              <div className="h-2 w-16 rounded-full bg-slate-200" />
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[11px] font-black text-[#087f3f]">
              92
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="h-2 w-full rounded-full bg-slate-100" />
            <div className="h-2 w-5/6 rounded-full bg-slate-100" />
            <div className="h-2 w-2/3 rounded-full bg-slate-100" />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              'bg-emerald-50 ring-emerald-100',
              'bg-amber-50 ring-amber-100',
              'bg-sky-50 ring-sky-100',
            ].map((c, i) => (
              <div key={i} className={`flex h-12 flex-col justify-between rounded-xl p-2 ring-1 ${c}`}>
                <div className="h-1.5 w-5 rounded-full bg-slate-300/70" />
                <div className="h-2 w-9 rounded-full bg-slate-400/50" />
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
            <div className="flex items-center justify-between">
              <div className="h-2 w-16 rounded-full bg-emerald-500" />
              <div className="h-2 w-8 rounded-full bg-emerald-300" />
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
              <div className="h-full w-[82%] rounded-full bg-[#087f3f]" />
            </div>
          </div>
        </div>

        <p className="text-xs leading-5 text-white/65">
          Every resume becomes a live work item — scan it, improve it, then target it.
        </p>
      </div>
    </div>
  )
}

const toolCards: ToolCardItem[] = [
  {
    href: '/dashboard/resumes',
    title: 'Resume Library',
    description: 'Upload, rename, and manage every version before you apply.',
    icon: 'library',
  },
  {
    href: '/dashboard/ats-checker',
    title: 'ATS Checker',
    description: 'Catch parser, keyword, and readability issues before sending.',
    icon: 'ats',
  },
  {
    href: '/linkedin-optimizer',
    title: 'LinkedIn Review',
    description: 'Audit profile visibility and polish your recruiter-facing story.',
    icon: 'linkedin',
    badge: 'New',
  },
  {
    href: '/dashboard/builder?mode=tailor',
    title: 'Tailor Resume',
    description: 'Rewrite your resume around a specific job description.',
    icon: 'tailor',
    badge: 'Pro',
  },
  {
    href: '/dashboard/match-score',
    title: 'Match Score',
    description: 'Measure resume-to-role fit before spending time applying.',
    icon: 'match',
    badge: 'Pro',
  },
  {
    href: '/dashboard/cv-generator',
    title: 'Cover Letter',
    description: 'Generate a matching letter from your resume and target role.',
    icon: 'cover',
    badge: 'Pro',
  },
  {
    href: '/dashboard/metadata-enhancer',
    title: 'Metadata Clean-up',
    description: 'Fix hidden PDF fields that can confuse hiring systems.',
    icon: 'metadata',
    badge: 'Pro',
  },
  {
    href: '/dashboard/resume-lio',
    title: 'Personal Site',
    description: 'Turn your resume into a shareable recruiter-ready page.',
    icon: 'site',
    badge: 'New',
  },
]

export default function DashboardHomeClient({
  profile,
}: {
  profile: Profile
}) {
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [overviewError, setOverviewError] = useState<string | null>(null)
  const [isLoadingOverview, setIsLoadingOverview] = useState(true)

  const isPro = profile.plan === 'pro'
  const firstName = profile.full_name?.split(' ')[0] ?? 'there'
  const resumeCount = overview?.resumeCount ?? null
  const lastScore = overview?.lastScore ?? null
  const lastScoreTone = scoreTone(lastScore)
  const primaryAction = useMemo(() => getPrimaryAction(resumeCount, lastScore), [resumeCount, lastScore])
  const freeResumeUsed = resumeCount === null ? 0 : Math.min(resumeCount, 3)
  const freeResumePercent = Math.min(100, (freeResumeUsed / 3) * 100)

  useEffect(() => {
    let cancelled = false

    async function loadOverview() {
      try {
        const response = await fetch('/api/dashboard/overview', {
          cache: 'no-store',
        })
        const payload = (await response.json().catch(() => null)) as
          | (DashboardOverview & { success?: boolean; error?: string })
          | null

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error ?? 'Could not load dashboard overview')
        }

        startTransition(() => {
          if (cancelled) return
          setOverview({
            resumeCount: payload.resumeCount,
            lastScore: payload.lastScore,
            hasAffiliate: payload.hasAffiliate,
          })
          setOverviewError(null)
        })
      } catch (error) {
        if (!cancelled) {
          setOverviewError(error instanceof Error ? error.message : 'Could not load dashboard overview')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOverview(false)
        }
      }
    }

    void loadOverview()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#087f3f]">
            Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Good to see you, {firstName}.
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Your workspace is organized around the next application asset worth improving.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:justify-end">
          <Link
            href={isPro ? '/dashboard/account' : '/dashboard/pricing?source=dashboard_top_cta'}
            prefetch
            className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] shadow-[0_14px_30px_rgba(2,109,50,0.16)] transition-all hover:-translate-y-0.5 ${
              isPro
                ? 'border border-emerald-200 bg-white text-[#087f3f] hover:bg-emerald-50'
                : 'bg-[#087f3f] text-white hover:bg-[#026d32]'
            }`}
          >
            <CrownUpgradeIcon className="h-4 w-4" />
            {isPro ? 'Pro Active' : 'Upgrade to Pro'}
          </Link>

          <Link
            href="/dashboard/account"
            prefetch
            title="Account & billing"
            className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-black uppercase transition-all hover:-translate-y-0.5 sm:flex ${getAvatarColor(profile.full_name, profile.email)}`}
          >
            {getInitials(profile.full_name, profile.email)}
          </Link>
        </div>
      </div>

      <JourneyPathway resumeCount={resumeCount} lastScore={lastScore} />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.42fr)_minmax(20rem,0.88fr)]">
        <DashboardSurface variant="default" className="p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.2),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.12),transparent_32%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-center">
            <div className="space-y-5">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#087f3f] ring-1 ring-emerald-100">
                {primaryAction.label}
              </span>
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#087f3f] text-white shadow-[0_16px_34px_rgba(2,109,50,0.22)]">
                    <primaryAction.Icon size={22} strokeWidth={2.2} />
                  </span>
                  <h2 className="max-w-xl text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    {primaryAction.title}
                  </h2>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  {primaryAction.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={primaryAction.href}
                  prefetch
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-[0_18px_42px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Open next step
                  <ArrowRight size={17} />
                </Link>
                <Link
                  href="/dashboard/resumes"
                  prefetch
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/8 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition-all hover:-translate-y-0.5 hover:border-[#087f3f]/30"
                >
                  View library
                </Link>
              </div>
            </div>

            <EmptyPreviewGraphic />
          </div>
        </DashboardSurface>

        <DashboardSurface variant="subtle" className="flex flex-col p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Status</p>
              <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">Workspace health</h2>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${lastScoreTone.bg}`}>
              {lastScoreTone.label}
            </span>
          </div>

          <div className="mt-5 flex flex-1 flex-col justify-between gap-5">
            <ReadinessRing score={lastScore} loading={isLoadingOverview} />

            <div className="rounded-2xl border border-black/5 bg-white p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>{isPro ? 'Pro capacity' : 'Free resume slots'}</span>
                <span>{isPro ? 'Unlimited' : `${freeResumeUsed} / 3`}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#087f3f] transition-all duration-500"
                  style={{ width: isPro ? '100%' : `${freeResumePercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {isPro
                  ? 'Unlimited resumes, scans, tailoring, and exports are active.'
                  : resumeCount === null
                    ? 'Checking your current usage.'
                    : `${Math.max(0, 3 - freeResumeUsed)} free ${Math.max(0, 3 - freeResumeUsed) === 1 ? 'slot' : 'slots'} left before Pro makes sense.`}
              </p>
            </div>

            {overviewError ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                Recent dashboard stats will appear once the connection settles.
              </p>
            ) : null}

            <Link
              href={lastScore !== null && lastScore >= 70 ? '/dashboard/builder?mode=tailor' : '/dashboard/ats-checker'}
              prefetch
              className="group flex items-center justify-between gap-3 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800"
            >
              <span className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  {lastScore === null ? (
                    <ClipboardCheck size={16} />
                  ) : lastScore < 70 ? (
                    <BarChart3 size={16} />
                  ) : (
                    <Target size={16} />
                  )}
                </span>
                {lastScore === null
                  ? 'Run your first ATS scan'
                  : lastScore < 70
                    ? 'Improve my ATS score'
                    : 'Tailor resume to a JD'}
              </span>
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </DashboardSurface>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Saved resumes"
          value={resumeCount === null ? '--' : String(resumeCount)}
          helper={isLoadingOverview ? 'Loading library' : 'Base and role-specific drafts'}
          Icon={FileText}
          loading={isLoadingOverview}
        />
        <MetricCard
          label="Latest ATS"
          value={lastScore === null ? '--' : `${lastScore}%`}
          helper={lastScoreTone.label}
          Icon={BarChart3}
          loading={isLoadingOverview}
        />
        <Link href="/dashboard/pricing?source=dashboard_plan_card" prefetch className="group block transition-transform hover:-translate-y-0.5">
          <MetricCard
            label="Current plan"
            value={isPro ? 'Pro' : 'Free'}
            helper={isPro ? 'Manage plan & billing' : 'Upgrade for unlimited workflow'}
            Icon={Sparkles}
            arrow
          />
        </Link>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <DashboardSurface variant="default" className="flex flex-col p-5 sm:p-6">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#087f3f]">Launchpad</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">Pick the tool that matches your next application</h2>
            </div>
            <p className="max-w-sm text-xs leading-5 text-slate-500">
              Arranged in the order most job seekers should use them.
            </p>
          </div>

          <div className="grid flex-1 auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {toolCards.map(tool => (
              <ToolCard key={`${tool.href}-${tool.title}`} {...tool} />
            ))}
          </div>
        </DashboardSurface>

        <div className="space-y-5">
          {!isPro ? (
            <UpgradeNudge slotsLeft={Math.max(0, 3 - freeResumeUsed)} />
          ) : null}
          <LinkedInExtensionCard />
        </div>
      </section>

      {ADS_ENABLED && !isPro ? <AdBanner size="leaderboard" className="mx-auto" /> : null}
    </div>
  )
}
