'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, FileText, Plus, Sparkles, BriefcaseBusiness, type LucideIcon } from 'lucide-react'

const TABS: { href: string; label: string; Icon: LucideIcon; isCenter?: boolean }[] = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutGrid },
  { href: '/dashboard/resumes', label: 'Files', Icon: FileText },
  { href: '/dashboard/builder/new', label: 'Create', Icon: Plus, isCenter: true },
  { href: '/dashboard/ats-checker', label: 'ATS', Icon: Sparkles },
  { href: '/dashboard/job-board', label: 'Jobs', Icon: BriefcaseBusiness },
]

export default function BottomNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-[max(0.5rem,env(safe-area-inset-bottom,0px))] left-3 right-3 z-50 flex items-center justify-between rounded-[1.45rem] border border-white/75 bg-white/90 px-4 py-2.5 shadow-[0_20px_40px_rgba(25,28,29,0.12)] backdrop-blur-2xl md:hidden">
      {TABS.map(({ href, label, Icon, isCenter }) => {
        if (isCenter) {
          return (
            <div key={href} className="relative -top-5">
              <Link
                href={href}
                prefetch
                className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full bg-zinc-950 text-white shadow-[0_18px_34px_rgba(24,24,27,0.24)] transition-transform hover:scale-110 active:scale-95"
              >
                <Icon size={24} />
              </Link>
            </div>
          )
        }

        return (
          <Link
            key={href}
            href={href}
            prefetch
            className={`flex flex-col items-center gap-0.5 rounded-xl px-1.5 py-1 transition-colors ${
              isActive(href) ? 'text-primary font-bold' : 'text-on-surface-variant'
            }`}
          >
            <Icon size={20} strokeWidth={isActive(href) ? 2.4 : 1.75} />
            <span className={`text-[10px] ${isActive(href) ? 'font-bold' : 'font-medium'}`}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
