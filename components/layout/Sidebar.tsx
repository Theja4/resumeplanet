'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  BarChart2,
  Layout,
  ShoppingBag,
  CreditCard,
  LogOut,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { logout } from '@/app/dashboard/(shell)/actions'
import type { Profile } from '@/types'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/resumes', label: 'Resumes', icon: FileText },
  { href: '/dashboard/ats-checker', label: 'ATS Checker', icon: BarChart2 },
  { href: '/dashboard/templates', label: 'Templates', icon: Layout },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
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

interface SidebarProps {
  profile: Profile
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen bg-white border-r border-gray-100 fixed left-0 top-0 z-30">
      {/* Wordmark */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white text-xs font-bold">
          R
        </div>
        <span className="text-lg font-bold tracking-tight text-gray-900">
          Resum<span className="text-indigo-600">AI</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive(href)
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon
              size={18}
              className={isActive(href) ? 'text-indigo-600' : 'text-gray-400'}
            />
            {label}
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name ?? ''} />
            <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
              {getInitials(profile.full_name, profile.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile.full_name ?? profile.email}
            </p>
            <Badge
              variant="secondary"
              className={`text-xs mt-0.5 ${
                profile.plan === 'pro'
                  ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {profile.plan === 'pro' ? 'Pro' : 'Free'}
            </Badge>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <LogOut size={15} />
            Log out
          </button>
        </form>
      </div>
    </aside>
  )
}
