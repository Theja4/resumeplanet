'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, FileText, Plus, Sparkles, User, type LucideIcon } from 'lucide-react'

const TABS: { href: string; label: string; Icon: LucideIcon; isCenter?: boolean }[] = [
  { href: '/dashboard', label: 'Home', Icon: LayoutGrid },
  { href: '/dashboard/resumes', label: 'Files', Icon: FileText },
  { href: '/dashboard/builder/new', label: 'Create', Icon: Plus, isCenter: true },
  { href: '/dashboard/ats-checker', label: 'AI Tools', Icon: Sparkles },
  { href: '/dashboard/pricing', label: 'Profile', Icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-xl border-t border-outline-variant/10 px-6 py-3 flex justify-between items-center z-50">
      {TABS.map(({ href, label, Icon, isCenter }) => {
        if (isCenter) {
          return (
            <div key={href} className="relative -top-6">
              <Link
                href={href}
                className="w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
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
            className={`flex flex-col items-center gap-1 transition-colors ${
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
