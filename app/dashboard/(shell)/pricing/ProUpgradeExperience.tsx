'use client'

import { useEffect, useMemo, useState, type CSSProperties, type ComponentType, type SVGProps } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowRight,
  BadgeCheck,
  Crown,
  FileText,
  Loader2,
  Rocket,
  Star,
  type LucideIcon,
} from 'lucide-react'
import {
  getEffectiveDisplay,
  formatPriceDisplay,
  promoAppliesToOption,
  type DiscountType,
  type PriceOption,
  type PromoConfig,
} from '@/lib/pricing'
import PromoCodeInput, { type PromoValidationResult } from '@/components/shared/PromoCodeInput'
import { usePaddleCheckout } from '@/hooks/usePaddleCheckout'
import { setPricingCheckoutIntent } from '@/lib/pricingCheckoutIntent'
import { COMPANIES, LogoIcon } from '@/components/landing/LogoMarquee'

// ─── Live "social proof" counter (Booking.com-style) ──────────────────────────

function useLiveCount(initial: number) {
  const [count, setCount] = useState(initial)
  useEffect(() => {
    const tick = () => setCount(c => c + Math.floor(Math.random() * 20) + 5)
    const id = window.setInterval(tick, 7000 + Math.random() * 5000)
    return () => clearInterval(id)
  }, [])
  return count
}

// ─── Benefit tiles (right column grid) ────────────────────────────────────────

type Benefit = {
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  title: string
  description: string
  badge?: string
  highlight?: boolean
  theme: {
    accent: string
    glow: string
    iconActive: string
    shadow: string
    wash: string
  }
}

function TailorBenefitIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
      <path
        className="fill-current opacity-15 transition-all duration-500 group-hover/benefit:fill-[#087f3f] group-hover/benefit:opacity-100"
        d="M10 8h21l7 7v32H10z"
      />
      <path
        className="transition-all duration-500 group-hover/benefit:stroke-white"
        d="M10 8h21l7 7v32H10zM31 8v8h7"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinejoin="round"
      />
      <path
        className="stroke-current opacity-65 transition-all duration-500 group-hover/benefit:stroke-white group-hover/benefit:opacity-100"
        d="M16 20h12M16 26h16M16 32h9"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        className="fill-current opacity-[0.12] transition-all duration-500 group-hover/benefit:translate-x-1 group-hover/benefit:-translate-y-1 group-hover/benefit:fill-sky-400 group-hover/benefit:opacity-100"
        d="M26.5 35.5 36.8 25.2a3.2 3.2 0 014.5 4.5L31 40l-8 2.4z"
      />
      <path
        className="transition-all duration-500 group-hover/benefit:translate-x-1 group-hover/benefit:-translate-y-1 group-hover/benefit:stroke-white"
        d="m34 26 4.2 4.2M25.2 39.8l2.2-6.1 6.1 6.1"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        className="origin-center fill-amber-300 opacity-0 transition-all duration-500 [transform-box:fill-box] group-hover/benefit:-translate-y-1 group-hover/benefit:rotate-12 group-hover/benefit:opacity-100"
        d="M38 5.5 40 10l4.7 1-3.5 3.1.5 4.8-4.2-2.5-4.4 1.9 1-4.7-3.2-3.6 4.8-.4z"
      />
      <path
        className="stroke-fuchsia-300 opacity-0 transition-all duration-500 group-hover/benefit:opacity-100"
        d="M8 16v4M6 18h4M42 35v5M39.5 37.5h5"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function AtsBenefitIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
      <path
        className="fill-current opacity-20 transition-all duration-500 group-hover/benefit:fill-sky-300 group-hover/benefit:opacity-70"
        d="M9 34.5V12.8a3.8 3.8 0 013.8-3.8h22.4a3.8 3.8 0 013.8 3.8v21.7a3.8 3.8 0 01-3.8 3.8H12.8A3.8 3.8 0 019 34.5z"
      />
      <path d="M14 35h22" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" />
      {[
        ['M17 31V22', 'group-hover/benefit:stroke-white', 'group-hover/benefit:-translate-y-1'],
        ['M24 31V16', 'group-hover/benefit:stroke-white', 'group-hover/benefit:-translate-y-2'],
        ['M31 31V20', 'group-hover/benefit:stroke-white', 'group-hover/benefit:-translate-y-1.5'],
      ].map(([d, color, hover]) => (
        <path
          key={d}
          className={`stroke-current opacity-80 transition-all duration-500 group-hover/benefit:opacity-100 ${color} ${hover}`}
          d={d}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      ))}
      <path
        className="stroke-current opacity-70 transition-all duration-500 group-hover/benefit:opacity-100"
        d="M14 15h6M14 19h3"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        className="origin-center stroke-white opacity-0 transition-all duration-500 [transform-box:fill-box] group-hover/benefit:translate-x-1 group-hover/benefit:opacity-90"
        d="M35.4 12.6l2.2 2.2 4.4-5"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MatchBenefitIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
      <circle
        className="origin-center stroke-current opacity-50 transition-all duration-500 [transform-box:fill-box] group-hover/benefit:scale-110 group-hover/benefit:stroke-white group-hover/benefit:opacity-100"
        cx="24"
        cy="24"
        r="14"
        strokeWidth="3"
      />
      <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="3" />
      <circle
        className="fill-current opacity-80 transition-all duration-500 group-hover/benefit:fill-white group-hover/benefit:opacity-100"
        cx="24"
        cy="24"
        r="3.2"
      />
      <g className="origin-center transition-transform duration-700 [transform-box:fill-box] group-hover/benefit:rotate-45">
        <path d="M24 7v4M24 37v4M7 24h4M37 24h4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </g>
      <circle
        className="fill-fuchsia-300 opacity-0 transition-all duration-500 group-hover/benefit:translate-x-1 group-hover/benefit:-translate-y-1 group-hover/benefit:opacity-100"
        cx="36"
        cy="14"
        r="2.3"
      />
    </svg>
  )
}

function CoverLetterBenefitIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
      <path
        className="fill-current opacity-20 transition-all duration-500 group-hover/benefit:fill-rose-300/80 group-hover/benefit:opacity-100"
        d="M14 8.5h15.2L38 17.3v24.2H14z"
      />
      <path d="M14 8.5h15.2L38 17.3v24.2H14z" stroke="currentColor" strokeWidth="2.7" strokeLinejoin="round" />
      <path d="M29 9v9h9" stroke="currentColor" strokeWidth="2.7" strokeLinejoin="round" />
      <path
        className="stroke-white/90 opacity-0 transition-all duration-500 group-hover/benefit:opacity-100"
        d="M19 23h13M19 28h8"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        className="origin-center fill-current opacity-80 transition-all duration-500 [transform-box:fill-box] group-hover/benefit:-translate-y-1 group-hover/benefit:scale-110 group-hover/benefit:fill-amber-300 group-hover/benefit:opacity-100"
        d="M24 35.7l-1.5-1.3c-3.2-2.7-5.1-4.2-5.1-6.5 0-1.8 1.4-3.2 3.2-3.2 1 0 2 .5 2.6 1.2.6-.7 1.6-1.2 2.6-1.2 1.8 0 3.2 1.4 3.2 3.2 0 2.3-1.9 3.8-5.1 6.5L24 35.7z"
      />
    </svg>
  )
}

function WebsiteBenefitIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
      <circle className="fill-current opacity-20 transition-all duration-500 group-hover/benefit:fill-sky-300/70 group-hover/benefit:opacity-100" cx="23" cy="23" r="15" />
      <circle cx="23" cy="23" r="15" stroke="currentColor" strokeWidth="2.7" />
      <path d="M8 23h30M23 8c4.2 4.2 6.2 9 6.2 15S27.2 33.8 23 38M23 8c-4.2 4.2-6.2 9-6.2 15s2 10.8 6.2 15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path
        className="origin-center fill-current stroke-current opacity-90 transition-all duration-500 [transform-box:fill-box] group-hover/benefit:translate-x-2 group-hover/benefit:-translate-y-2 group-hover/benefit:rotate-6 group-hover/benefit:fill-lime-300 group-hover/benefit:stroke-white group-hover/benefit:opacity-100"
        d="M30.5 30.5l10 4-4.5 2-2 4.5-4-10z"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LinkedinBenefitIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
      <path
        className="fill-current opacity-20 transition-all duration-500 group-hover/benefit:fill-indigo-300/80 group-hover/benefit:opacity-100"
        d="M16.5 8.5h17A5.5 5.5 0 0139 14v19.5a5.5 5.5 0 01-5.5 5.5h-17A5.5 5.5 0 0111 33.5V14a5.5 5.5 0 015.5-5.5z"
      />
      <path d="M17 21v13M17 15.2v.2M23.5 34V21.3M23.5 25.8c1.2-2.8 3.1-4.2 5.7-4.2 3.4 0 5.1 2.3 5.1 6.2V34" stroke="currentColor" strokeWidth="2.9" strokeLinecap="round" strokeLinejoin="round" />
      <path
        className="origin-center stroke-current opacity-80 transition-all duration-500 [transform-box:fill-box] group-hover/benefit:rotate-45 group-hover/benefit:scale-110 group-hover/benefit:stroke-amber-300 group-hover/benefit:opacity-100"
        d="M38.5 8.5v6M35.5 11.5h6"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        className="stroke-white/90 opacity-0 transition-all duration-500 group-hover/benefit:translate-x-1 group-hover/benefit:opacity-100"
        d="M29.8 13.6l2.1 2.1 4.2-4.7"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function UnlimitedBenefitIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
      <path
        className="fill-current opacity-20 transition-all duration-500 group-hover/benefit:-translate-y-2 group-hover/benefit:fill-lime-300 group-hover/benefit:opacity-100"
        d="M24 8l17 7-17 7-17-7 17-7z"
      />
      <path d="M24 8l17 7-17 7-17-7 17-7z" stroke="currentColor" strokeWidth="2.7" strokeLinejoin="round" />
      <path
        className="transition-transform duration-500 group-hover/benefit:-translate-y-1"
        d="M9 23l15 6 15-6M9 31l15 6 15-6"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        className="stroke-white opacity-0 transition-all duration-500 group-hover/benefit:opacity-100"
        d="M19 15l3.3 3.1L30 12.6"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MetadataAnnouncerBenefitIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
      <path
        className="fill-current opacity-20 transition-all duration-500 group-hover/benefit:fill-amber-300/85 group-hover/benefit:opacity-100"
        d="M11 8.5h19.5l6.5 6.5v25H11z"
      />
      <path
        d="M11 8.5h19.5l6.5 6.5v25H11zM30.5 8.5V16H37"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path
        className="stroke-current opacity-70 transition-all duration-500 group-hover/benefit:stroke-white group-hover/benefit:opacity-100"
        d="M17 20h10M17 26h14M17 32h8"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        className="origin-center fill-current opacity-25 transition-all duration-500 [transform-box:fill-box] group-hover/benefit:-translate-y-1 group-hover/benefit:translate-x-1 group-hover/benefit:scale-110 group-hover/benefit:fill-emerald-300 group-hover/benefit:opacity-100"
        d="M25.5 34.5h9.8l4.7 4.2v-4.2h1.4c1.4 0 2.6-1.1 2.6-2.6v-7.2c0-1.4-1.1-2.6-2.6-2.6H25.5c-1.4 0-2.6 1.1-2.6 2.6v7.2c0 1.4 1.2 2.6 2.6 2.6z"
      />
      <path
        className="transition-all duration-500 group-hover/benefit:-translate-y-1 group-hover/benefit:translate-x-1 group-hover/benefit:stroke-white"
        d="M28 27h8M28 31h5M39 24.5c1.9-1.6 1.9-4 0-5.6M42.3 27.4c3.7-3.5 3.7-8.6 0-12.1"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <circle
        className="fill-amber-300 opacity-0 transition-all duration-500 group-hover/benefit:-translate-y-1 group-hover/benefit:opacity-100"
        cx="17"
        cy="14"
        r="2.5"
      />
    </svg>
  )
}

function benefitStyle(theme: Benefit['theme']): CSSProperties {
  return {
    '--benefit-accent': theme.accent,
    '--benefit-glow': theme.glow,
    '--benefit-icon-bg': 'linear-gradient(145deg,#ecfdf5,#dcfce7)',
    '--benefit-icon-active': theme.iconActive,
    '--benefit-ink': '#0b7a3d',
    '--benefit-shadow': theme.shadow,
    '--benefit-wash': theme.wash,
  } as CSSProperties
}

const BENEFITS: Benefit[] = [
  {
    Icon: TailorBenefitIcon,
    title: 'Tailor for every job',
    description: 'Rewrite your resume to match any posting in one click with Tailor Mode.',
    theme: {
      accent: '#a855f7',
      glow: 'rgba(168,85,247,0.22)',
      iconActive: 'linear-gradient(135deg,#7c3aed,#22c55e)',
      shadow: 'rgba(124,58,237,0.22)',
      wash: 'rgba(168,85,247,0.16)',
    },
  },
  {
    Icon: AtsBenefitIcon,
    title: 'Advanced ATS analysis',
    description: 'AI scoring with Claude insights, not just keyword counting.',
    theme: {
      accent: '#06b6d4',
      glow: 'rgba(6,182,212,0.22)',
      iconActive: 'linear-gradient(135deg,#0891b2,#2563eb)',
      shadow: 'rgba(14,116,144,0.22)',
      wash: 'rgba(14,165,233,0.16)',
    },
  },
  {
    Icon: MatchBenefitIcon,
    title: 'Match Score',
    description: 'Paste a job description and see your real fit before you apply.',
    theme: {
      accent: '#f97316',
      glow: 'rgba(249,115,22,0.22)',
      iconActive: 'linear-gradient(135deg,#f97316,#e11d48)',
      shadow: 'rgba(249,115,22,0.22)',
      wash: 'rgba(251,146,60,0.16)',
    },
  },
  {
    Icon: CoverLetterBenefitIcon,
    title: 'AI cover letters',
    description: 'Generate matching, recruiter ready cover letters in seconds.',
    theme: {
      accent: '#ec4899',
      glow: 'rgba(236,72,153,0.22)',
      iconActive: 'linear-gradient(135deg,#db2777,#f59e0b)',
      shadow: 'rgba(219,39,119,0.2)',
      wash: 'rgba(236,72,153,0.15)',
    },
  },
  {
    Icon: WebsiteBenefitIcon,
    title: 'Personal website',
    description: 'Turn your resume into a shareable personal site.',
    theme: {
      accent: '#14b8a6',
      glow: 'rgba(20,184,166,0.22)',
      iconActive: 'linear-gradient(135deg,#0d9488,#2563eb)',
      shadow: 'rgba(13,148,136,0.22)',
      wash: 'rgba(45,212,191,0.15)',
    },
  },
  {
    Icon: LinkedinBenefitIcon,
    title: 'LinkedIn optimizer',
    description: 'Polish your LinkedIn profile with our Chrome extension.',
    badge: 'New',
    theme: {
      accent: '#0a66c2',
      glow: 'rgba(10,102,194,0.24)',
      iconActive: 'linear-gradient(135deg,#0a66c2,#7c3aed)',
      shadow: 'rgba(10,102,194,0.22)',
      wash: 'rgba(59,130,246,0.15)',
    },
  },
  {
    Icon: UnlimitedBenefitIcon,
    title: 'Unlimited resumes',
    description: 'Save and manage unlimited resume versions across every role.',
    theme: {
      accent: '#22c55e',
      glow: 'rgba(34,197,94,0.22)',
      iconActive: 'linear-gradient(135deg,#16a34a,#84cc16)',
      shadow: 'rgba(22,163,74,0.22)',
      wash: 'rgba(132,204,22,0.14)',
    },
  },
  {
    Icon: MetadataAnnouncerBenefitIcon,
    title: 'Metadata enhancer',
    description: 'Clean file titles, authors, and keywords before you apply.',
    theme: {
      accent: '#f59e0b',
      glow: 'rgba(245,158,11,0.22)',
      iconActive: 'linear-gradient(135deg,#f59e0b,#16a34a)',
      shadow: 'rgba(245,158,11,0.2)',
      wash: 'rgba(250,204,21,0.16)',
    },
  },
]

// ─── Plan selector card ───────────────────────────────────────────────────────

function PlanOption({
  option,
  activePromo,
  selected,
  popular,
  onSelect,
}: {
  option: PriceOption
  activePromo: PromoConfig | null
  selected: boolean
  popular: boolean
  onSelect: () => void
}) {
  const promoApplies = promoAppliesToOption(activePromo, option)
  const formatted = formatPriceDisplay(
    getEffectiveDisplay(option, promoApplies ? activePromo : null),
    option
  )
  const isAnnual = option.interval === 'year'

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative flex w-full flex-col rounded-[1.4rem] border-2 px-5 py-4 text-left transition-all ${
        selected
          ? 'border-[#026d32] bg-[#087f3f] text-white shadow-[0_22px_46px_rgba(2,109,50,0.26)]'
          : 'border-black/8 bg-white text-slate-900 hover:border-[#026d32]/40'
      }`}
    >
      {popular && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-400 px-3 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-black shadow-[0_8px_20px_rgba(245,158,11,0.28)]">
          Most Popular
        </span>
      )}
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? 'border-white bg-white' : 'border-black/20 bg-white'
          }`}
        >
          {selected ? <span className="h-2 w-2 rounded-full bg-[#026d32]" /> : null}
        </span>
        <span className={`text-sm font-bold ${selected ? 'text-white' : 'text-slate-900'}`}>
          {option.label}
        </span>
        {option.badge ? (
          <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${
            selected ? 'bg-white/20 text-white ring-1 ring-white/25' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {option.badge}
          </span>
        ) : null}
      </div>
      <div className="mt-2.5 flex items-end gap-1.5">
        <span className={`text-2xl font-black tracking-tight ${selected ? 'text-white' : 'text-slate-900'}`}>
          {formatted.main}
        </span>
        <span className={`pb-0.5 text-sm font-medium ${selected ? 'text-white/75' : 'text-slate-500'}`}>
          {isAnnual ? '/year' : '/mo'}
        </span>
        {formatted.actual ? (
          <span className={`pb-0.5 text-sm font-semibold line-through ${selected ? 'text-white/55' : 'text-slate-400'}`}>{formatted.actual}</span>
        ) : null}
      </div>
      {isAnnual && formatted.perMonth ? (
        <p className={`mt-1 text-xs font-semibold ${selected ? 'text-white/90' : 'text-[#026d32]'}`}>{formatted.perMonth} billed annually</p>
      ) : (
        <p className={`mt-1 text-xs ${selected ? 'text-white/80' : 'text-slate-500'}`}>Billed monthly · cancel anytime</p>
      )}
    </button>
  )
}

// ─── Company logo strip ───────────────────────────────────────────────────────

function HiredByStrip() {
  return (
    <div className="rounded-[1.75rem] border border-black/5 bg-white/70 px-6 py-7 text-center backdrop-blur-xl">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
        Our users have landed at companies including
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
        {COMPANIES.map(company => (
          <span key={company.name} className="flex items-center gap-2">
            <LogoIcon company={company} />
            <span className="text-sm font-semibold tracking-tight text-slate-700">{company.name}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function LiveCounterStrip({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm text-white">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </span>
      <span className="text-zinc-400">
        <strong className="text-white">{count.toLocaleString('en-US')}</strong> resumes upgraded this month
      </span>
      <span className="hidden text-zinc-600 sm:inline">•</span>
      <span className="hidden font-semibold text-amber-300 sm:inline">your competition is optimizing right now</span>
    </div>
  )
}

// ─── JobPosted promo card ─────────────────────────────────────────────────────

const JOBPOSTED_FEATURES: Array<{
  Icon: LucideIcon
  title: string
  description: string
}> = [
  {
    Icon: Rocket,
    title: 'One click autofill',
    description: 'Fill applications faster with saved details.',
  },
  {
    Icon: BadgeCheck,
    title: 'Job tracking',
    description: 'Track saved roles, status, and next steps.',
  },
  {
    Icon: FileText,
    title: 'Access to Job board',
    description: 'Top career sites gathered in one board.',
  },
]

function getMonthlyPriceLabel(monthlyOption: PriceOption | undefined) {
  if (!monthlyOption) return '$19.99'

  return formatPriceDisplay(monthlyOption.display, monthlyOption).main
}

function JobPostedCard({ monthlyOption }: { monthlyOption: PriceOption | undefined }) {
  const monthlyPrice = getMonthlyPriceLabel(monthlyOption)

  return (
    <a
      href="https://jobposted.app"
      target="_blank"
      rel="noreferrer"
      className="group relative flex h-full min-h-[300px] flex-col overflow-hidden rounded-[1.75rem] border border-blue-200/70 bg-[linear-gradient(135deg,#ffffff_0%,#f4faff_42%,#eafbf1_100%)] px-5 py-5 shadow-[0_18px_42px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/70 hover:shadow-[0_28px_62px_rgba(37,99,235,0.16)]"
      aria-label="Open JobPosted landing page"
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(59,130,246,0.18),transparent_33%),radial-gradient(circle_at_92%_100%,rgba(34,197,94,0.2),transparent_36%)]" />
      <span className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-200/28 blur-3xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-[0_14px_30px_rgba(37,99,235,0.14)]">
            <Image
              src="/jobposted-logo.jpg"
              alt="JobPosted logo"
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black tracking-tight text-slate-950">JobPosted</p>
              <span className="rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-rose-600">
                New
              </span>
            </div>
            <p className="mt-0.5 max-w-[18rem] text-xs font-semibold leading-5 text-slate-500">
              A job search command center bundled into your Pro plan.
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm font-black text-emerald-700">
            <span className="mr-1.5 text-xs font-semibold text-slate-400 line-through decoration-1">
              {monthlyPrice}/mo
            </span>
            Free
          </p>
          <p className="mt-1 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
            Included with Rezoomed Pro
          </p>
        </div>
      </div>

      <div className="relative mt-4 grid flex-1 gap-3 sm:grid-cols-3">
        {JOBPOSTED_FEATURES.map(({ Icon, title, description }) => (
          <div key={title} className="flex h-full min-h-[130px] flex-col justify-between rounded-2xl border border-white/75 bg-white/76 px-3.5 py-3.5 transition-colors group-hover:bg-white">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <Icon size={16} strokeWidth={2.3} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-black leading-tight text-slate-900">{title}</p>
              <p className="mt-1.5 text-[11px] leading-4 text-slate-500">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-4 flex items-center justify-between rounded-2xl border border-blue-100/80 bg-white/64 px-4 py-3 text-xs font-black text-blue-700 transition-colors group-hover:bg-white/82">
        <span>Open jobposted.app</span>
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </div>
    </a>
  )
}

const REVIEWS = [
  { initials: 'JF', name: 'James Fullerton', role: 'SWE at Stripe', quote: '41% to 89% in one click. Had 2 interviews within a week.' },
  { initials: 'AO', name: 'Amara Okafor', role: 'PM at Shopify', quote: 'Tailoring per role doubled my callback rate in days.' },
  { initials: 'DK', name: 'Daniel Kim', role: 'Data Analyst', quote: 'From zero replies to five interviews in two weeks.' },
]

function ReviewsCarousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setIndex(i => (i + 1) % REVIEWS.length), 5000)
    return () => clearInterval(id)
  }, [])

  const review = REVIEWS[index]

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-emerald-200/75 bg-white px-5 py-4 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
      <div key={index} className="flex w-full items-center gap-4 opacity-0 [animation:card-enter_0.5s_ease_forwards]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-200 text-[11px] font-black text-emerald-800">
          {review.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-0.5 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
            ))}
          </div>
          <p className="text-sm font-semibold italic leading-5 text-zinc-800">
            &ldquo;{review.quote}&rdquo;
          </p>
          <p className="mt-0.5 text-xs text-on-surface-variant">{review.name}, {review.role}</p>
        </div>
      </div>

      <div className="absolute bottom-2.5 right-4 flex gap-1">
        {REVIEWS.map((_, i) => (
          <span
            key={i}
            className={`h-1 w-1 rounded-full transition-colors ${i === index ? 'bg-emerald-500' : 'bg-emerald-300/50'}`}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  priceOptions: PriceOption[]
  autoFillPromo?: string
  loginRedirectPath?: string | null
  onDisplayPromoChange?: (promo: PromoConfig | null) => void
}

export default function ProUpgradeExperience({
  priceOptions,
  autoFillPromo,
  loginRedirectPath = null,
  onDisplayPromoChange,
}: Props) {
  const router = useRouter()
  const { openSubscriptionCheckout } = usePaddleCheckout()
  const liveCount = useLiveCount(284700)

  const monthlyOption = priceOptions.find(o => o.id === 'monthly') ?? priceOptions[0]
  const annualOption = priceOptions.find(o => o.id === 'annual') ?? priceOptions[1]
  const selectableOptions = useMemo(
    () => [annualOption, monthlyOption].filter((o): o is PriceOption => Boolean(o)),
    [annualOption, monthlyOption]
  )

  // Default to the annual (best value) plan, mirroring the "most popular" highlight.
  const [selectedId, setSelectedId] = useState(annualOption?.id ?? monthlyOption?.id ?? '')
  const [appliedPromotionId, setAppliedPromotionId] = useState<string | undefined>(undefined)
  const [appliedPromotionCode, setAppliedPromotionCode] = useState<string | undefined>(undefined)
  // Start with no discount applied — the real price shows until the user enters
  // (or the ribbon auto-fills) a valid promo code.
  const [activePromo, setActivePromo] = useState<PromoConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const selectedOption =
    priceOptions.find(o => o.id === selectedId) ?? annualOption ?? monthlyOption ?? null

  function buildAppliedDisplayPromo(result: PromoValidationResult): PromoConfig | null {
    if (!result.valid || !result.discountType || result.discountValue == null) {
      return null
    }
    const discountCode = result.discountCode?.trim().toUpperCase()
    return {
      id: result.promotionId ?? `applied-${discountCode ?? 'promo'}`,
      name: discountCode ?? 'Applied promotion',
      paddleDiscountId: '',
      paddleDiscountCode: discountCode,
      discountType: result.discountType as DiscountType,
      discountValue: result.discountValue,
      appliesTo: result.appliesTo ?? 'all',
      label: result.displayLabel ?? 'Applied promotion',
      badge: result.badge ?? result.displayLabel ?? 'Discount',
      headline: '',
      subheadline: '',
      ctaLabel: '',
      disclaimerText: '',
      isExitIntent: false,
      isBanner: false,
      isAutoApply: false,
      exitIntentTimerSeconds: 0,
    }
  }

  function handlePromoApply(result: PromoValidationResult) {
    setAppliedPromotionId(result.valid ? result.promotionId : undefined)
    setAppliedPromotionCode(result.valid ? result.discountCode : undefined)
    const nextPromo = buildAppliedDisplayPromo(result) ?? null
    setActivePromo(nextPromo)
    onDisplayPromoChange?.(nextPromo)
  }

  const hasAppliedPromotion = appliedPromotionId !== undefined || appliedPromotionCode !== undefined
  const effectivePromotionId = hasAppliedPromotion
    ? appliedPromotionId
    : activePromo?.isAutoApply && activePromo.paddleDiscountId
      ? activePromo.id
      : undefined
  const effectivePromotionCode = hasAppliedPromotion
    ? appliedPromotionCode
    : activePromo?.isAutoApply
      ? activePromo.paddleDiscountCode
      : undefined

  async function handleContinue() {
    if (!selectedOption || isLoading) return
    const promoApplies = promoAppliesToOption(activePromo, selectedOption)

    if (loginRedirectPath) {
      setPricingCheckoutIntent({
        priceId: selectedOption.id,
        promotionId: promoApplies ? effectivePromotionId : undefined,
        promotionCode: promoApplies ? effectivePromotionCode : undefined,
      })
      router.push(`/auth/login?next=${encodeURIComponent(loginRedirectPath)}`)
      return
    }

    setIsLoading(true)
    setCheckoutError(null)
    await openSubscriptionCheckout({
      priceId: selectedOption.id,
      promotionId: promoApplies ? effectivePromotionId : undefined,
      promotionCode: promoApplies ? effectivePromotionCode : undefined,
      onSuccess: () => setIsLoading(false),
      onError: err => {
        setIsLoading(false)
        setCheckoutError(err)
        console.error('Checkout error:', err)
      },
    })
  }

  return (
    <div className="space-y-5 pb-28 sm:pb-0">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* ─── LEFT: highlights + reviews ──────────────────────────────────── */}
        <div className="flex h-full flex-col gap-5">
          <div className="rounded-[2rem] border border-black/5 bg-white/85 p-6 shadow-[0_24px_60px_rgba(25,28,29,0.06)] backdrop-blur-xl sm:p-7">
            <div className="mb-5 flex items-center justify-center gap-2">
              <Crown size={18} className="text-amber-500" />
              <h2 className="text-center text-xl font-black tracking-tight text-slate-900">
                Highlights in Pro
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {BENEFITS.map(({ Icon, title, description, badge, theme }) => (
                <div
                  key={title}
                  style={benefitStyle(theme)}
                  className="group/benefit relative flex min-h-[92px] items-center gap-3 overflow-hidden rounded-[1.1rem] border border-black/5 bg-slate-50/70 p-3.5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--benefit-accent)] hover:bg-white hover:shadow-[0_18px_40px_var(--benefit-shadow)]"
                >
                  <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--benefit-glow),transparent_44%)] opacity-0 transition-opacity duration-300 group-hover/benefit:opacity-100" />
                  <span className="pointer-events-none absolute inset-y-0 -left-20 w-20 -skew-x-12 bg-[linear-gradient(90deg,transparent,var(--benefit-wash),transparent)] opacity-0 transition-all duration-700 group-hover/benefit:left-full group-hover/benefit:opacity-100" />

                  {badge ? (
                    <span className="absolute right-2 top-2 z-10 rotate-3 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-black shadow-sm transition-transform duration-300 group-hover/benefit:rotate-0 group-hover/benefit:scale-105">
                      {badge}
                    </span>
                  ) : null}

                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--benefit-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_7px_16px_rgba(15,23,42,0.08)] transition-all duration-300 [background:var(--benefit-icon-bg)] group-hover/benefit:-rotate-3 group-hover/benefit:scale-110 group-hover/benefit:text-white group-hover/benefit:shadow-[0_14px_28px_var(--benefit-shadow)] group-hover/benefit:[background:var(--benefit-icon-active)]">
                    <Icon className="h-7 w-7 overflow-visible transition-transform duration-300 group-hover/benefit:scale-110" />
                  </span>

                  <div className="relative min-w-0">
                    <p className="text-[13px] font-bold leading-tight text-slate-900 transition-colors duration-300 group-hover/benefit:text-[var(--benefit-ink)]">{title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500 transition-colors duration-300 group-hover/benefit:text-slate-600">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ReviewsCarousel />
        </div>

        {/* ─── RIGHT: plan selector + extras + Continue ────────────────────── */}
        <div className="flex h-full flex-col gap-5">
          <div className="space-y-3">
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              {selectableOptions.map(option => (
                <PlanOption
                  key={option.id}
                  option={option}
                  activePromo={activePromo}
                  selected={selectedId === option.id}
                  popular={option.id === (annualOption?.id ?? '')}
                  onSelect={() => {
                    if (selectedId === option.id) {
                      void handleContinue()
                      return
                    }

                    setSelectedId(option.id)
                  }}
                />
              ))}
            </div>

            <PromoCodeInput autoFillCode={autoFillPromo} onApply={handlePromoApply} compact />
          </div>

          <div>
            {checkoutError ? (
              <p className="mb-4 text-center text-sm text-red-600">{checkoutError}</p>
            ) : null}

            <button
              onClick={handleContinue}
              disabled={isLoading || !selectedOption}
              className="hidden w-full items-center justify-center gap-2 rounded-2xl bg-[#16a34a] px-6 py-4 text-base font-black text-white shadow-[0_18px_40px_rgba(22,163,74,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-60 sm:flex"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Opening checkout…
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <p className="mt-3 hidden items-center justify-center gap-1.5 text-center text-xs text-on-surface-variant sm:flex">
              <BadgeCheck size={13} className="text-[#026d32]" />
              Cancel anytime from your account page
            </p>
          </div>

          <div className="min-h-0 flex-1">
            <JobPostedCard monthlyOption={monthlyOption} />
          </div>
        </div>
      </div>

      {/* Company logos */}
      <HiredByStrip />

      {/* FOMO: live counter strip */}
      <LiveCounterStrip count={liveCount} />

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-12 sm:hidden [background:linear-gradient(180deg,rgba(248,249,250,0)_0%,rgba(248,249,250,0.96)_34%,rgba(248,249,250,1)_100%)]">
        <div className="pointer-events-auto mx-auto max-w-md">
          {checkoutError ? (
            <p className="mb-2 rounded-xl bg-white/95 px-3 py-2 text-center text-xs font-semibold text-red-600 shadow-[0_10px_24px_rgba(15,23,42,0.10)]">
              {checkoutError}
            </p>
          ) : null}

          <button
            onClick={handleContinue}
            disabled={isLoading || !selectedOption}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#16a34a] px-6 py-4 text-base font-black text-white shadow-[0_18px_40px_rgba(22,163,74,0.32)] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Opening checkout…
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-on-surface-variant">
            <BadgeCheck size={13} className="text-[#026d32]" />
            Cancel anytime from your account page
          </p>
        </div>
      </div>
    </div>
  )
}
