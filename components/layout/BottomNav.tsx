'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, FileText, Plus, Sparkles, BriefcaseBusiness, type LucideIcon } from 'lucide-react'

const TABS: { href: string; label: string; Icon: LucideIcon; isCenter?: boolean }[] = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutGrid },
  { href: '/dashboard/resumes', label: 'Files', Icon: FileText },
  { href: '/dashboard/builder/new', label: 'Create', Icon: Plus, isCenter: true },
  { href: '/dashboard/ats-checker', label: 'AI Tools', Icon: Sparkles },
  { href: '/dashboard/job-board', label: 'Jobs', Icon: BriefcaseBusiness },
]

export default function BottomNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between rounded-[1.8rem] border border-white/70 bg-white/84 px-6 py-3 shadow-[0_22px_48px_rgba(25,28,29,0.1)] backdrop-blur-2xl md:hidden">
      {TABS.map(({ href, label, Icon, isCenter }) => {
        if (isCenter) {
          return (
            <div key={href} className="relative -top-6">
              <Link
                href={href}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-950 text-white shadow-[0_18px_38px_rgba(24,24,27,0.22)] transition-transform hover:scale-110 active:scale-95"
              >
                <Icon size={28} />
              </Link>
            </div>
          )
        }

        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1 transition-colors ${
              isActive(href) ? 'text-primary font-bold' : 'text-on-surface-variant'
            }`}
          >
            <Icon size={22} strokeWidth={isActive(href) ? 2.5 : 1.75} />
            <span className={`text-[10px] ${isActive(href) ? 'font-bold' : 'font-medium'}`}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
