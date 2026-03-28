'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, BarChart2, Layout, ShoppingBag } from 'lucide-react'

const TABS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/resumes', label: 'Resumes', icon: FileText },
  { href: '/dashboard/ats-checker', label: 'ATS', icon: BarChart2 },
  { href: '/dashboard/templates', label: 'Templates', icon: Layout },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
]

export default function BottomNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 flex">
      {TABS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 text-[10px] font-medium transition-colors ${
            isActive(href) ? 'text-indigo-600' : 'text-gray-400'
          }`}
        >
          <Icon size={20} />
          {label}
        </Link>
      ))}
    </nav>
  )
}
