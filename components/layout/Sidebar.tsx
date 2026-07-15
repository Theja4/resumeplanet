'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { HUMAN_WRITTEN_SERVICE_ENABLED } from '@/lib/featureFlags'
import { isPro as checkIsPro } from '@/lib/planUtils'
import type { Profile } from '@/types'
import {
  LayoutGrid,
  BarChart3,
  FileText,
  FilePenLine,
  FileUser,
  Pencil,
  Target,
  UserRound,
  Wand2,
  Handshake,
  Globe2,
  Puzzle,
  ClipboardList,
  Briefcase,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'

type NavItem = {
  href: string
  label: string
  Icon: LucideIcon
  badge?: string
  builderMode?: 'tailor'
  external?: boolean
}

// JobPosted lives at a separate app. Point at each destination directly so an
// existing JobPosted session opens the selected page; its app handles sign-in.
const JOBPOSTED_URL = (process.env.NEXT_PUBLIC_JOBPOSTED_URL || 'https://jobposted.app').replace(/\/$/, '')

function jobPostedHref(path: string): string {
  return `${JOBPOSTED_URL}${path}`
}

type JobPostedItem = {
  label: string
  Icon: LucideIcon
  path: string
}

const JOBPOSTED_ITEMS: JobPostedItem[] = [
  { label: 'Autofill', Icon: Wand2, path: '/autofill' },
  { label: 'Job Board', Icon: Briefcase, path: '/dashboard/jobs' },
  { label: 'Job Tracker', Icon: ClipboardList, path: '/dashboard/tracker' },
]

function buildNavItems(showAffiliate: boolean, isPro: boolean): NavItem[] {
  return [
    { href: '/dashboard', label: 'Dashboard', Icon: LayoutGrid },
    { href: '/dashboard/resumes', label: 'Library', Icon: FileText },
    { href: '/dashboard/builder', label: 'Builder', Icon: Pencil },
    { href: '/dashboard/ats-checker', label: 'ATS Checker', Icon: BarChart3 },
    {
      href: '/linkedin-optimizer',
      label: 'LinkedIn Review',
      Icon: Puzzle,
      badge: 'New',
    },
    {
      href: '/dashboard/builder?mode=tailor',
      label: 'Tailor Resume',
      Icon: Wand2,
      badge: 'Pro',
      builderMode: 'tailor',
    },
    {
      href: '/dashboard/match-score',
      label: 'Match Score',
      Icon: Target,
      badge: 'Pro',
    },
    {
      href: '/dashboard/cv-generator',
      label: 'Cover Letter',
      Icon: FileUser,
      badge: 'Pro',
    },
    {
      href: '/dashboard/resume-lio',
      label: 'Personal Site',
      Icon: Globe2,
      badge: isPro ? 'Pro' : 'New',
    },
    {
      href: '/dashboard/metadata-enhancer',
      label: 'Metadata',
      Icon: FilePenLine,
      badge: 'Pro',
    },
    ...(HUMAN_WRITTEN_SERVICE_ENABLED
      ? [{ href: '/dashboard/orders', label: 'Human-Written', Icon: UserRound }]
      : []),
    ...(showAffiliate
      ? [{ href: '/affiliate/dashboard', label: 'Affiliate', Icon: Handshake }]
      : []),
  ]
}

interface SidebarProps {
  profile: Profile
  isAffiliate?: boolean
}

export default function Sidebar({ profile, isAffiliate }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const navItems = buildNavItems(Boolean(isAffiliate), checkIsPro(profile))

  function isActive(item: NavItem) {
    if (item.builderMode === 'tailor') {
      return pathname.startsWith('/dashboard/builder') && searchParams.get('mode') === 'tailor'
    }
    if (item.href === '/dashboard/builder') {
      return pathname.startsWith('/dashboard/builder') && searchParams.get('mode') !== 'tailor'
    }
    const href = item.href
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="dashboard-card-hover fixed left-3 top-3 z-30 hidden h-[calc(100vh-1.5rem)] w-[15.75rem] flex-col rounded-[1.55rem] border border-white/80 bg-white/92 p-3 shadow-[0_24px_56px_rgba(25,28,29,0.08)] backdrop-blur-2xl md:flex">
      {/* Branding */}
      <div className="mb-2 flex items-center gap-2.5 px-2 py-1.5">
        <Image src="/auth-login-logo.png" alt="Rezoomed logo" width={32} height={32} className="h-8 w-8 object-contain" />
        <div className="min-w-0">
          <span className="block text-lg font-black leading-none tracking-tighter text-primary">Rezoomed</span>
          <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant/45">Workspace</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => {
          const { href, label, Icon, badge, external } = item
          const active = isActive(item)
          const isNew = badge === 'New'
          const itemClassName = `group flex w-full items-center gap-2.5 rounded-[1rem] px-2.5 py-2 text-left transition-all duration-200 ${
            active
              ? 'bg-[#087f3f] font-bold text-white shadow-[0_12px_28px_rgba(2,109,50,0.18)]'
              : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
          }`

          const inner = (
            <>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
                active
                  ? 'bg-white/16 text-white'
                  : 'bg-white text-[#0b7a3d] shadow-[0_8px_18px_rgba(15,23,42,0.06)] group-hover:bg-[#e8f8ee]'
              }`}>
                <Icon size={16} strokeWidth={active ? 2.5 : 1.9} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px]">{label}</span>
              {badge ? (
                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] ${
                  active
                    ? 'bg-white/18 text-white'
                    : isNew
                      ? 'bg-amber-400 text-black'
                      : 'border border-[#008f44]/16 bg-[#008f44]/8 text-[#008f44]'
                }`}>
                  {badge}
                </span>
              ) : null}
            </>
          )

          if (external) {
            return (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={itemClassName}
              >
                {inner}
              </a>
            )
          }

          return (
            <Link key={href} href={href} prefetch className={itemClassName}>
              {inner}
            </Link>
          )
        })}

        {/* JobPosted — separate app */}
        <a
          href={JOBPOSTED_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open the Job Posted home page"
          className="group mt-3 mb-1 flex items-center gap-2 rounded-xl px-2.5 py-1 transition-colors hover:bg-[#f2f6ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d5fe0]/35"
        >
          <Image
            src="/jobposted-logo.jpg"
            alt="Job Posted logo"
            width={22}
            height={22}
            className="h-[22px] w-[22px] rounded-md object-contain ring-1 ring-[#1d5fe0]/15"
          />
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d5fe0]">Job Posted</span>
          <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full text-[#1d5fe0] transition-transform group-hover:translate-x-0.5" aria-hidden="true">
            <ArrowRight size={14} strokeWidth={2.2} />
          </span>
        </a>
        {JOBPOSTED_ITEMS.map(({ label, Icon, path }) => (
          <a
            key={label}
            href={jobPostedHref(path)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${label} in Job Posted`}
            className="group flex w-full items-center gap-2.5 rounded-[1rem] border border-[#1d5fe0]/10 bg-[#f2f6ff] px-2.5 py-2 text-left text-[#24436f] transition-all duration-200 hover:border-[#1d5fe0]/20 hover:bg-[#e8f0ff] hover:text-[#1d5fe0]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e4edff] text-[#1d5fe0] shadow-[0_8px_18px_rgba(29,95,224,0.08)] transition-colors group-hover:bg-white">
              <Icon size={16} strokeWidth={1.9} />
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px]">{label}</span>
          </a>
        ))}
      </nav>

    </aside>
  )
}
