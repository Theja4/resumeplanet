'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { logout } from '@/app/dashboard/(shell)/actions'
import { Analytics } from '@/lib/analytics'
import { HUMAN_WRITTEN_SERVICE_ENABLED } from '@/lib/featureFlags'
import { clearWorkspaceSessionDrafts } from '@/lib/sessionDrafts'
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
  CreditCard,
  CircleHelp,
  LogOut,
  ChevronDown,
  Wand2,
  Handshake,
  Globe2,
  Puzzle,
  type LucideIcon,
} from 'lucide-react'
import { CHROME_STORE_URL } from '@/lib/site'

type NavItem = {
  href: string
  label: string
  Icon: LucideIcon
  badge?: string
  builderMode?: 'tailor'
  external?: boolean
}

function buildNavSections(showAffiliate: boolean, isPro: boolean): Array<{ title: string; collapsible?: boolean; items: NavItem[] }> {
  return [
    {
      title: 'Workspace',
      items: [
        { href: '/dashboard', label: 'Dashboard', Icon: LayoutGrid },
      ],
    },
    {
      title: 'Resume Tools',
      collapsible: true,
      items: [
        { href: '/dashboard/resumes', label: 'Your Library', Icon: FileText },
        { href: '/dashboard/builder', label: 'Resume Builder', Icon: Pencil },
        { href: '/dashboard/ats-checker', label: 'ATS Checker', Icon: BarChart3 },
        {
          href: CHROME_STORE_URL,
          label: 'LinkedIn Optimizer',
          Icon: Puzzle,
          badge: 'New',
          external: true,
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
          href: '/dashboard/resume-lio',
          label: 'Personal Website',
          Icon: Globe2,
          badge: isPro ? 'Pro' : 'New',
        },
        {
          href: '/dashboard/cv-generator',
          label: 'Cover Letter',
          Icon: FileUser,
          badge: 'Pro',
        },
        {
          href: '/dashboard/metadata-enhancer',
          label: 'Metadata Enhancer',
          Icon: FilePenLine,
          badge: 'Pro',
        },
        ...(HUMAN_WRITTEN_SERVICE_ENABLED
          ? [{ href: '/dashboard/orders', label: 'Human-Written', Icon: UserRound }]
          : []),
      ],
    },
    {
      title: 'Account',
      items: [
        { href: '/dashboard/pricing', label: 'Pricing', Icon: CreditCard },
        ...(showAffiliate
          ? [{ href: '/affiliate/dashboard', label: 'Affiliate', Icon: Handshake }]
          : []),
      ],
    },
  ]
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email[0].toUpperCase()
}

const AVATAR_COLORS = [
  'bg-pink-100 text-pink-600 border-pink-200',
  'bg-violet-100 text-violet-600 border-violet-200',
  'bg-sky-100 text-sky-600 border-sky-200',
  'bg-emerald-100 text-emerald-600 border-emerald-200',
  'bg-amber-100 text-amber-600 border-amber-200',
  'bg-rose-100 text-rose-600 border-rose-200',
  'bg-teal-100 text-teal-600 border-teal-200',
  'bg-indigo-100 text-indigo-600 border-indigo-200',
]

function getAvatarColor(name: string | null, email: string): string {
  const char = (name?.[0] ?? email[0]).toUpperCase()
  const index = char.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

interface SidebarProps {
  profile: Profile
  isAffiliate?: boolean
}

export default function Sidebar({ profile, isAffiliate }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const navSections = buildNavSections(Boolean(isAffiliate), checkIsPro(profile))

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

  function sectionHasActiveItem(items: NavItem[]) {
    return items.some(isActive)
  }

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    // Default: collapse Resume Tools only if not currently inside it
    return {}
  })

  function toggleSection(title: string, items: NavItem[]) {
    setCollapsed(prev => {
      const current = prev[title] ?? false
      // Never collapse a section that has the active page
      if (!current && sectionHasActiveItem(items)) return prev
      return { ...prev, [title]: !current }
    })
  }

  function isSectionCollapsed(title: string, items: NavItem[]) {
    // Force open if an item in this section is active
    if (sectionHasActiveItem(items)) return false
    return collapsed[title] ?? false
  }

  return (
    <aside className="dashboard-card-hover fixed left-4 top-4 z-30 hidden h-[calc(100vh-2rem)] w-[17rem] flex-col rounded-[2rem] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.92),rgba(243,247,244,0.88))] p-6 shadow-[0_28px_70px_rgba(25,28,29,0.08)] backdrop-blur-2xl md:flex">
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.2),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(2,109,50,0.07),transparent_30%)]" />
      {/* Branding */}
      <div className="relative mb-10 flex items-center gap-3 px-2">
        <Image src="/auth-login-logo.png" alt="Rezoomed logo" width={32} height={32} className="h-8 w-8 object-contain" />
        <span className="text-xl font-black tracking-tighter text-primary">Rezoomed</span>
      </div>

      {/* Nav */}
      <nav className="relative flex flex-grow flex-col gap-5 overflow-y-auto">
        {navSections.map(section => {
          const isCollapsed = section.collapsible
            ? isSectionCollapsed(section.title, section.items)
            : false

          return (
            <div key={section.title} className="space-y-2">
              {section.collapsible ? (
                <button
                  onClick={() => toggleSection(section.title, section.items)}
                  className="flex w-full items-center gap-1 px-3 text-left transition-colors hover:text-on-surface-variant"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/55">
                    {section.title}
                  </span>
                  <ChevronDown
                    size={11}
                    strokeWidth={2.5}
                    className={`ml-auto text-on-surface-variant/40 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                  />
                </button>
              ) : (
                <p className="px-3 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/55">
                  {section.title}
                </p>
              )}

              <div
                className={`space-y-1.5 overflow-hidden transition-all duration-200 ${
                  isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[600px] opacity-100'
                }`}
              >
                {section.items.map((item) => {
                  const { href, label, Icon, badge, external } = item
                  const active = isActive(item)
                  const isNew = badge === 'New'
                  const itemClassName = `dashboard-card-hover flex w-full items-center gap-3 rounded-[1rem] px-3.5 py-3 text-left transition-all duration-200 ${
                    active
                      ? 'bg-[linear-gradient(145deg,rgba(163,255,179,0.45),rgba(255,255,255,0.96))] font-semibold text-on-primary-container shadow-[0_14px_32px_rgba(2,109,50,0.08)]'
                      : 'text-on-surface-variant hover:bg-white/78 hover:text-on-surface'
                  }`

                  const inner = (
                    <>
                      <Icon size={18} strokeWidth={active ? 2.5 : 1.75} />
                      <span className="text-sm">{label}</span>
                      {badge ? (
                        <span className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] ${isNew ? 'bg-amber-400 text-black' : 'border border-[#008f44]/16 bg-[#008f44]/8 text-[#008f44]'}`}>
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
              </div>
            </div>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="relative mt-auto pt-2">
        <div className="border-t border-outline-variant/10 pt-2">
          <div className="flex items-center gap-2 rounded-[1.25rem] bg-white/50 px-2.5 py-2">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold uppercase ${getAvatarColor(profile.full_name, profile.email)}`}>
              {getInitials(profile.full_name, profile.email)}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-bold text-on-surface">
                {profile.full_name ?? profile.email.split('@')[0]}
              </span>
              <span className="inline-flex w-fit items-center rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-medium capitalize text-on-surface-variant ring-1 ring-black/5">
                {profile.plan}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-0.5">
              <Link
                href="/dashboard/contact"
                prefetch
                title="Help"
                className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-black/8 hover:text-on-surface"
              >
                <CircleHelp size={14} />
              </Link>
              <form
                action={logout}
                onSubmit={() => {
                  clearWorkspaceSessionDrafts()
                  Analytics.reset()
                }}
              >
                <button
                  type="submit"
                  title="Log out"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-black/8 hover:text-on-surface"
                >
                  <LogOut size={14} />
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </aside>
  )
}
