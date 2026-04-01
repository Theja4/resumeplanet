'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/dashboard/(shell)/actions'
import type { Profile } from '@/types'
import {
  LayoutGrid,
  FileText,
  Sparkles,
  Pencil,
  ShoppingBag,
  CreditCard,
  LogOut,
  type LucideIcon,
} from 'lucide-react'

const NAV_ITEMS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutGrid },
  { href: '/dashboard/resumes', label: 'Your Library', Icon: FileText },
  { href: '/dashboard/ats-checker', label: 'AI Optimizer', Icon: Sparkles },
  { href: '/dashboard/builder', label: 'Resume Builder', Icon: Pencil },
  { href: '/dashboard/orders', label: 'Orders', Icon: ShoppingBag },
  { href: '/dashboard/pricing', label: 'Pricing', Icon: CreditCard },
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
    <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-outline-variant/10 fixed left-0 top-0 z-30 p-6 shadow-xl shadow-black/5">
      {/* Branding */}
      <div className="mb-10 flex items-center gap-3">
        <span className="text-lg font-black tracking-tighter text-primary">Rezoomed</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-grow">
        {NAV_ITEMS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
              isActive(href)
                ? 'bg-primary-container text-on-primary-container font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <Icon size={18} strokeWidth={isActive(href) ? 2.5 : 1.75} />
            <span className="text-sm">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto pt-6 space-y-4">
        {/* Current Plan Section */}
        <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/10">
          <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-2">CURRENT PLAN</p>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-on-surface">{isPro ? 'Pro Member' : 'Free Tier'}</span>
            <div className={`w-2 h-2 rounded-full ${isPro ? 'bg-primary' : 'bg-yellow-400'}`}></div>
          </div>
          {!isPro && (
            <Link
              href="/dashboard/pricing"
              className="block w-full py-2 bg-primary text-white text-center text-xs font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all"
            >
              Upgrade to Pro
            </Link>
          )}
        </div>

        {/* User Profile Info */}
        <div className="flex items-center gap-3 px-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border uppercase shrink-0 ${getAvatarColor(profile.full_name, profile.email)}`}>
            {getInitials(profile.full_name, profile.email)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-on-surface truncate">
              {profile.full_name ?? profile.email.split('@')[0]}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-container-highest text-on-surface-variant w-fit mt-1 capitalize">
              {profile.plan}
            </span>
          </div>
        </div>

        {/* Logout Action */}
        <form action={logout} className="border-t border-outline-variant/10 pt-4">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-2 py-2.5 text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface rounded-lg transition-all duration-200"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">Log out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
