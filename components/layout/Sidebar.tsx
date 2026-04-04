'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/dashboard/(shell)/actions'
import { Analytics } from '@/lib/analytics'
import type { Profile } from '@/types'
import {
  LayoutGrid,
  Search,
  BriefcaseBusiness,
  FileText,
  FileUser,
  Sparkles,
  Pencil,
  ShoppingBag,
  CreditCard,
  LogOut,
  type LucideIcon,
} from 'lucide-react'

type NavItem = { href: string; label: string; Icon: LucideIcon; badge?: string }

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
      { href: '/dashboard/ats-checker', label: 'ATS Checker', Icon: Sparkles },
      { href: '/dashboard/cv-generator', label: 'CV Generator', Icon: FileUser },
      { href: '/dashboard/builder', label: 'Resume Builder', Icon: Pencil },
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

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const isPro = profile.plan === 'pro'

  return (
    <aside className="dashboard-card-hover fixed left-4 top-4 z-30 hidden h-[calc(100vh-2rem)] w-[17rem] flex-col rounded-[2rem] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.92),rgba(243,247,244,0.88))] p-6 shadow-[0_28px_70px_rgba(25,28,29,0.08)] backdrop-blur-2xl md:flex">
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.2),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(2,109,50,0.07),transparent_30%)]" />
      {/* Branding */}
      <div className="relative mb-10 flex items-center gap-3">
        <span className="text-lg font-black tracking-tighter text-primary">Rezoomed</span>
      </div>

      {/* Nav */}
      <nav className="relative flex flex-grow flex-col gap-5">
        {NAV_SECTIONS.map(section => (
          <div key={section.title} className="space-y-2">
            <p className="px-3 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/55">
              {section.title}
            </p>
            <div className="space-y-1.5">
              {section.items.map(({ href, label, Icon, badge }) => (
                <Link
                  key={href}
                  href={href}
                  className={`dashboard-card-hover flex items-center gap-3 rounded-[1rem] px-3.5 py-3 transition-all duration-200 ${
                    isActive(href)
                      ? 'bg-[linear-gradient(145deg,rgba(163,255,179,0.45),rgba(255,255,255,0.96))] font-semibold text-on-primary-container shadow-[0_14px_32px_rgba(2,109,50,0.08)]'
                      : 'text-on-surface-variant hover:bg-white/78 hover:text-on-surface'
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive(href) ? 2.5 : 1.75} />
                  <span className="text-sm">{label}</span>
                  {badge ? (
                    <span className="ml-auto rounded-full border border-[#008f44]/16 bg-[#008f44]/8 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#008f44]">
                      {badge}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="relative mt-auto space-y-4 pt-6">
        {/* Current Plan Section */}
        <div className="rounded-[1.4rem] border border-white/75 bg-white/78 p-4 shadow-[0_18px_44px_rgba(25,28,29,0.05)]">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">CURRENT PLAN</p>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-on-surface">{isPro ? 'Pro Member' : 'Free Tier'}</span>
            <div className={`w-2 h-2 rounded-full ${isPro ? 'bg-primary' : 'bg-yellow-400'}`}></div>
          </div>
          {!isPro && (
            <Link
              href="/dashboard/pricing"
              className="block w-full rounded-full bg-zinc-950 py-2.5 text-center text-xs font-bold uppercase tracking-[0.14em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
            >
              Upgrade to Pro
            </Link>
          )}
        </div>

        {/* User Profile Info */}
        <div className="flex items-center gap-3 px-2">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold uppercase ${getAvatarColor(profile.full_name, profile.email)}`}>
            {getInitials(profile.full_name, profile.email)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-on-surface truncate">
              {profile.full_name ?? profile.email.split('@')[0]}
            </span>
            <span className="mt-1 inline-flex w-fit items-center rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium capitalize text-on-surface-variant ring-1 ring-black/5">
              {profile.plan}
            </span>
          </div>
        </div>

        {/* Logout Action */}
        <form
          action={logout}
          className="border-t border-outline-variant/10 pt-4"
          onSubmit={() => Analytics.reset()}
        >
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-[1rem] px-2.5 py-2.5 text-on-surface-variant transition-all duration-200 hover:bg-white/78 hover:text-on-surface"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">Log out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
