'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { logout } from '@/app/dashboard/(shell)/actions'
import { Analytics } from '@/lib/analytics'
import { HUMAN_WRITTEN_SERVICE_ENABLED } from '@/lib/featureFlags'
import { clearWorkspaceSessionDrafts } from '@/lib/sessionDrafts'
import { isPro as checkIsPro } from '@/lib/planUtils'
import { getAvatarColor, getInitials } from '@/lib/avatar'
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
  CircleHelp,
  LogOut,
  Wand2,
  Handshake,
  Globe2,
  Puzzle,
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
      </nav>

      {/* Bottom section */}
      <div className="mt-2 border-t border-outline-variant/10 pt-2">
        <div className="flex items-center gap-1.5 rounded-[1.1rem] bg-surface-container-low/70 px-2 py-2">
          <Link
            href="/dashboard/account"
            prefetch
            title="Account & billing"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-[0.9rem] px-1 py-0.5 transition hover:bg-white"
          >
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
          </Link>
          <Link
            href="/dashboard/contact"
            prefetch
            title="Help"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-white hover:text-on-surface"
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
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-white hover:text-on-surface"
            >
              <LogOut size={14} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
