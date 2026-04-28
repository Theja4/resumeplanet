'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { HUMAN_WRITTEN_SERVICE_ENABLED } from '@/lib/featureFlags'

const PAGE_TITLES: [string, string][] = [
  ['/dashboard/ats-checker', 'ATS Checker'],
  ['/dashboard/match-score', 'Match Score'],
  ['/dashboard/resumes', 'Your Library'],
  ['/dashboard/builder', 'Resume Builder'],
  ...(HUMAN_WRITTEN_SERVICE_ENABLED ? [['/dashboard/orders', 'Human-Written'] as [string, string]] : []),
  ['/dashboard/contact', 'Contact Us'],
  ['/dashboard/pricing', 'Pricing'],
  ['/dashboard', 'Dashboard'],
]

const PAGE_SUBTITLES: [string, string][] = [
  ['/dashboard/ats-checker', 'Check resume structure, ATS readability, and keyword coverage without a job description.'],
  ['/dashboard/match-score', 'Compare your resume against a specific role and surface the biggest fit gaps fast.'],
  ['/dashboard/resumes', 'Manage every role-specific version from one polished workspace.'],
  ...(HUMAN_WRITTEN_SERVICE_ENABLED
    ? [['/dashboard/orders', 'Track every human-written resume order and delivery status in one place.'] as [string, string]]
    : []),
  ['/dashboard/contact', 'Reach the team by email for billing questions, account issues, and product support.'],
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
            <span className="inline-flex items-center gap-2.5 rounded-full border border-primary-container/50 bg-primary-container/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
              <Image src="/auth-login-logo.png" alt="Rezoomed logo" width={20} height={20} className="h-5 w-5 object-contain" />
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
