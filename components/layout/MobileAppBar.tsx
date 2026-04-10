'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/dashboard/(shell)/actions'
import { Analytics } from '@/lib/analytics'
import { clearWorkspaceSessionDrafts } from '@/lib/sessionDrafts'
import {
  Menu,
  X,
  LayoutGrid,
  FileText,
  Sparkles,
  BriefcaseBusiness,
  PlusCircle,
  ShoppingBag,
  CreditCard,
  CircleHelp,
  LogOut,
  type LucideIcon,
} from 'lucide-react'

type MobileNavItem = {
  href: string
  label: string
  Icon: LucideIcon
}

const BASE_MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutGrid },
  { href: '/dashboard/resumes', label: 'Files', Icon: FileText },
  { href: '/dashboard/ats-checker', label: 'ATS Checker', Icon: Sparkles },
  { href: '/dashboard/job-board', label: 'Jobs', Icon: BriefcaseBusiness },
  { href: '/dashboard/builder/new', label: 'Create Resume', Icon: PlusCircle },
  { href: '/dashboard/orders', label: 'Orders', Icon: ShoppingBag },
  { href: '/dashboard/pricing', label: 'Pricing', Icon: CreditCard },
]

export default function MobileAppBar({ initials }: { initials: string }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-40 mx-3 mt-3 md:hidden">
      <div className="flex items-center justify-between rounded-[1.35rem] border border-white/70 bg-white/88 px-4 py-3.5 shadow-[0_16px_36px_rgba(25,28,29,0.07)] backdrop-blur-2xl">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMenuOpen(open => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary-container/60 bg-primary-container/35 text-on-primary-container"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
          <span className="text-sm font-black tracking-tighter text-primary">Rezoomed</span>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-container/60 bg-primary-container/50 font-bold text-xs uppercase text-on-primary-container shadow-[0_10px_24px_rgba(2,109,50,0.08)]">
          {initials}
        </div>
      </div>

      {menuOpen ? (
        <div className="mt-2 rounded-[1.25rem] border border-white/75 bg-white/95 p-2.5 shadow-[0_18px_40px_rgba(25,28,29,0.1)] backdrop-blur-2xl">
          <nav className="grid grid-cols-1 gap-1.5">
            {BASE_MOBILE_NAV_ITEMS.map(({ href, label, Icon }) => {
              const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                    active
                      ? 'bg-primary-container/45 font-bold text-on-primary-container'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  <Icon size={16} strokeWidth={active ? 2.4 : 1.9} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>
          <div className="mt-2 border-t border-outline-variant/20 pt-2">
            <Link
              href="/dashboard/contact"
              prefetch
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
            >
              <CircleHelp size={16} strokeWidth={1.9} />
              <span>Help</span>
            </Link>
          </div>
          <form
            action={logout}
            className="mt-2 border-t border-outline-variant/20 pt-2"
            onSubmit={() => {
              clearWorkspaceSessionDrafts()
              Analytics.reset()
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
            >
              <LogOut size={16} strokeWidth={1.9} />
              <span>Log out</span>
            </button>
          </form>
        </div>
      ) : null}
    </header>
  )
}
