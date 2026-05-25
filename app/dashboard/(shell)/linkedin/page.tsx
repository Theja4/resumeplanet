import Link from 'next/link'
import { ArrowRight, ExternalLink, Download, User } from 'lucide-react'

import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import { getAuthenticatedUserContext } from '@/lib/authenticated-user'

interface LinkedInScan {
  id: string
  profile_url: string
  score: number
  scanned_at: string
  sections: unknown
}

function scoreBadgeClass(score: number) {
  if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (score >= 60) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-rose-50 text-rose-700 border-rose-200'
}

function formatScannedAt(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function profileSlug(url: string) {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    const idx = parts.indexOf('in')
    return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : u.hostname
  } catch {
    return url
  }
}

export default async function DashboardLinkedInPage() {
  const { userId, supabase } = await getAuthenticatedUserContext()

  const { data, error } = await supabase
    .from('linkedin_scans')
    .select('id, profile_url, score, scanned_at, sections')
    .eq('user_id', userId)
    .order('scanned_at', { ascending: false })
    .limit(50)

  const scans = (data ?? []) as LinkedInScan[]

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <DashboardPageIntro
        kicker="LinkedIn Profile Optimizer"
        title="Your LinkedIn scan history"
        description="Every time the Rezoomed Chrome extension scans a profile while you're signed in, the score lands here. Use it to track progress on your own profile or audits you're running for others."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/linkedin-optimizer"
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5"
            >
              <Download size={16} />
              Install extension
              <ArrowRight size={14} />
            </Link>
          </div>
        }
      />

      {error ? (
        <DashboardSurface className="p-6">
          <p className="text-sm text-rose-700">
            Couldn't load your scan history. Refresh, and if it keeps failing, contact
            support.
          </p>
        </DashboardSurface>
      ) : scans.length === 0 ? (
        <DashboardSurface className="p-10 text-center">
          <User className="mx-auto h-10 w-10 text-on-surface-variant/50" />
          <h2 className="mt-4 text-lg font-bold text-on-background">No scans yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
            Install the Rezoomed extension, then open any LinkedIn profile while signed in
            to Rezoomed. Your scan history will appear here automatically.
          </p>
          <Link
            href="/linkedin-optimizer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Download size={16} />
            Install the extension
          </Link>
        </DashboardSurface>
      ) : (
        <DashboardSurface className="overflow-hidden p-0">
          <ul className="divide-y divide-black/5">
            {scans.map((scan) => (
              <li key={scan.id} className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-on-background">
                    linkedin.com/in/{profileSlug(scan.profile_url)}
                  </p>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    Scanned {formatScannedAt(scan.scanned_at)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${scoreBadgeClass(scan.score)}`}
                >
                  {scan.score}/100
                </span>
                <a
                  className="shrink-0 rounded-full border border-black/10 bg-white p-2 text-on-surface-variant transition hover:bg-neutral-50"
                  href={scan.profile_url}
                  rel="noreferrer noopener"
                  target="_blank"
                  title="Open profile in a new tab"
                >
                  <ExternalLink size={14} />
                </a>
              </li>
            ))}
          </ul>
        </DashboardSurface>
      )}
    </div>
  )
}
