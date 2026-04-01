'use client'

import { usePathname } from 'next/navigation'

const PAGE_TITLES: [string, string][] = [
  ['/dashboard/ats-checker', 'AI Optimizer'],
  ['/dashboard/resumes', 'Your Library'],
  ['/dashboard/builder', 'Resume Builder'],
  ['/dashboard/orders', 'Orders'],
  ['/dashboard/pricing', 'Pricing'],
  ['/dashboard', 'Dashboard'],
]

export default function DashboardHeader() {
  const pathname = usePathname()
  const title = PAGE_TITLES.find(([path]) => pathname.startsWith(path))?.[1] ?? 'Dashboard'

  return (
    <header className="hidden md:flex sticky top-0 z-40 bg-surface/70 backdrop-blur-lg items-center justify-between px-10 py-6 border-b border-outline-variant/10">
      {title !== 'Your Library' && (
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-on-surface">{title}</h1>
      )}
      <div className={title === 'Your Library' ? 'ml-auto' : ''}>
        {/* Placeholder for any right-side header content if added later, 
            ensuring the flex distribution remains correct */}
      </div>
    </header>
  )
}
