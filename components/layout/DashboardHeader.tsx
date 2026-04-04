'use client'

import { usePathname } from 'next/navigation'
import { Sparkles } from 'lucide-react'

const PAGE_TITLES: [string, string][] = [
  ['/dashboard/ats-checker', 'ATS Checker'],
  ['/dashboard/resumes', 'Your Library'],
  ['/dashboard/builder', 'Resume Builder'],
  ['/dashboard/orders', 'Orders'],
  ['/dashboard/pricing', 'Pricing'],
  ['/dashboard', 'Dashboard'],
]

const PAGE_SUBTITLES: [string, string][] = [
  ['/dashboard/ats-checker', 'Run deeper analysis and tighten each application before it goes out.'],
  ['/dashboard/resumes', 'Manage every role-specific version from one polished workspace.'],
  ['/dashboard/orders', 'Track recruiter rewrite orders and delivery status in one place.'],
  ['/dashboard/pricing', 'Manage access, upgrades, and plan history without leaving the workspace.'],
  ['/dashboard/templates', 'Preview the customizable template system before opening the builder.'],
  ['/dashboard', 'Pick up where you left off and keep momentum across every application.'],
]

export default function DashboardHeader() {
  const pathname = usePathname()
  const title = PAGE_TITLES.find(([path]) => pathname.startsWith(path))?.[1] ?? 'Dashboard'
  const subtitle =
    PAGE_SUBTITLES.find(([path]) => pathname.startsWith(path))?.[1] ??
    'Pick up where you left off and keep momentum across every application.'

  return (
    <header className="sticky top-0 z-40 hidden px-8 pt-6 md:block xl:px-10">
      <div className="rounded-[1.8rem] border border-white/70 bg-white/80 px-7 py-5 shadow-[0_18px_44px_rgba(25,28,29,0.07)] backdrop-blur-2xl">
        <div className="flex items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-container/50 bg-primary-container/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
              <Sparkles size={14} strokeWidth={2.4} />
              Rezoomed Workspace
            </span>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-on-surface">{title}</h1>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
