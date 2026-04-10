'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { logout } from '@/app/dashboard/(shell)/actions'
import { Analytics } from '@/lib/analytics'
import { clearWorkspaceSessionDrafts } from '@/lib/sessionDrafts'
import type { Profile } from '@/types'
import {
  LayoutGrid,
  Search,
  BriefcaseBusiness,
  FileText,
  FileUser,
  Sparkles,
  Pencil,
  Target,
  ShoppingBag,
  CreditCard,
  CircleHelp,
  ReceiptText,
  LogOut,
  type LucideIcon,
} from 'lucide-react'

type NavItem = {
  href: string
  label: string
  Icon: LucideIcon
  badge?: string
  builderMode?: 'tailor'
}

const NAV_SECTIONS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Workspace',
    items: [
      { href: '/dashboard', label: 'Dashboard', Icon: LayoutGrid },
      { href: '/dashboard/job-board', label: 'Job Board', Icon: Search, badge: 'Beta' },
      { href: '/dashboard/jobs', label: 'Job Tracker', Icon: BriefcaseBusiness },
    ],
  },
  {
    title: 'Resume Tools',
    items: [
      { href: '/dashboard/resumes', label: 'Your Library', Icon: FileText },
      { href: '/dashboard/builder', label: 'Resume Builder', Icon: Pencil },
      { href: '/dashboard/ats-checker', label: 'ATS Checker', Icon: Sparkles },
      {
        href: '/dashboard/builder?mode=tailor',
        label: 'Tailor Mode',
        Icon: Sparkles,
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
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/dashboard/orders', label: 'Orders', Icon: ShoppingBag },
      { href: '/dashboard/pricing', label: 'Pricing', Icon: CreditCard },
    ],
  },
]

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
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

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
    <aside className="dashboard-card-hover fixed left-4 top-4 z-30 hidden h-[calc(100vh-2rem)] w-[17rem] flex-col rounded-[2rem] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.92),rgba(243,247,244,0.88))] p-6 shadow-[0_28px_70px_rgba(25,28,29,0.08)] backdrop-blur-2xl md:flex">
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.2),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(2,109,50,0.07),transparent_30%)]" />
      {/* Branding */}
      <div className="relative mb-10 flex items-center gap-3 px-2">
        <Image src="/icon.png" alt="Rezoomed logo" width={28} height={28} className="rounded-md" />
        <span className="text-xl font-black tracking-tighter text-primary">Rezoomed</span>
      </div>

      {/* Nav */}
      <nav className="relative flex flex-grow flex-col gap-5">
        {NAV_SECTIONS.map(section => (
          <div key={section.title} className="space-y-2">
            <p className="px-3 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/55">
              {section.title}
            </p>
            <div className="space-y-1.5">
              {section.items.map((item) => {
                const { href, label, Icon, badge } = item
                const active = isActive(item)
                const itemClassName = `dashboard-card-hover flex w-full items-center gap-3 rounded-[1rem] px-3.5 py-3 text-left transition-all duration-200 ${
                  active
                    ? 'bg-[linear-gradient(145deg,rgba(163,255,179,0.45),rgba(255,255,255,0.96))] font-semibold text-on-primary-container shadow-[0_14px_32px_rgba(2,109,50,0.08)]'
                    : 'text-on-surface-variant hover:bg-white/78 hover:text-on-surface'
                }`

                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch
                    className={itemClassName}
                  >
                    <Icon size={18} strokeWidth={active ? 2.5 : 1.75} />
                    <span className="text-sm">{label}</span>
                    {badge ? (
                      <span className="ml-auto rounded-full border border-[#008f44]/16 bg-[#008f44]/8 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#008f44]">
                        {badge}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="relative mt-auto space-y-1.5 pt-2">
        <Link
          href="/dashboard/contact"
          prefetch
          className="flex w-full items-center gap-3 rounded-[1rem] px-2.5 py-2 text-on-surface-variant transition-all duration-200 hover:bg-white/78 hover:text-on-surface"
        >
          <CircleHelp size={16} />
          <span className="text-sm font-medium">Help</span>
        </Link>
        <Link
          href="/refund-policy"
          prefetch
          className="flex w-full items-center gap-3 rounded-[1rem] px-2.5 py-2 text-on-surface-variant transition-all duration-200 hover:bg-white/78 hover:text-on-surface"
        >
          <ReceiptText size={16} />
          <span className="text-sm font-medium">Refund Policy</span>
        </Link>

        <form
          action={logout}
          className="border-t border-outline-variant/10 pt-2"
          onSubmit={() => {
            clearWorkspaceSessionDrafts()
            Analytics.reset()
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-[1rem] px-2.5 py-2 text-on-surface-variant transition-all duration-200 hover:bg-white/78 hover:text-on-surface"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">Log out</span>
          </button>
        </form>

        <div className="border-t border-outline-variant/10 px-2 pt-3">
          <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold uppercase ${getAvatarColor(profile.full_name, profile.email)}`}>
            {getInitials(profile.full_name, profile.email)}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold text-on-surface">
              {profile.full_name ?? profile.email.split('@')[0]}
            </span>
            <span className="mt-1 inline-flex w-fit items-center rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium capitalize text-on-surface-variant ring-1 ring-black/5">
              {profile.plan}
            </span>
          </div>
        </div>
        </div>
      </div>
    </aside>
  )
}
