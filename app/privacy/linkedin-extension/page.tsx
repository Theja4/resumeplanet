import Link from 'next/link'
import type { Metadata } from 'next'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'

export const metadata: Metadata = {
  title: 'Privacy Policy — LinkedIn Profile Optimizer Extension',
  description:
    'How the Rezoomed: LinkedIn Profile Optimizer Chrome extension handles your data. The free scan runs entirely on your device — nothing about your profile content leaves your browser.',
  alternates: { canonical: '/privacy/linkedin-extension' },
  robots: { index: true, follow: true },
}

export const revalidate = 3600

const LAST_UPDATED = 'May 26, 2026'

const collectSections = [
  {
    title: 'Free scan — no sign-in required',
    tone: 'good' as const,
    points: [
      'The free scan runs entirely on your device. The extension reads visible profile fields (headline, about, experience, skills, education, photo/banner presence, custom URL, recommendation count) from the page DOM you are already viewing.',
      'The scan result is stored locally in chrome.storage.local so the sidebar can re-open without re-scanning.',
      'Nothing about your profile content leaves your device for the free scan.',
    ],
  },
  {
    title: 'Anonymous analytics',
    tone: 'neutral' as const,
    points: [
      'We send fire-and-forget events to PostHog (us.i.posthog.com) to measure aggregate usage and detect when LinkedIn DOM changes break extraction. These events contain no profile content.',
      'Events: scan_run (a scan happened + duration), score_shown (the numeric score, count of readable checks, signed-in flag), extraction_health / extraction_empty (which fields were readable), and sign-in / Pro-CTA-click events (surface name only).',
      'Each install is identified by a random UUID stored in chrome.storage.local. We never collect IP-based identifiers ourselves; PostHog may log the request IP per its own policy.',
    ],
  },
  {
    title: 'Sign-in (optional)',
    tone: 'neutral' as const,
    points: [
      'If you click "Sign in", the extension opens a Rezoomed login tab. After you authenticate, our website sends a short-lived JWT back to the extension service worker via Chrome’s externally_connectable channel.',
      'The token is stored in chrome.storage.local and is used only to authorize requests to *.rezoomed.com.',
    ],
  },
  {
    title: 'Pro features (signed-in only)',
    tone: 'neutral' as const,
    points: [
      'When you run an AI rewrite or a resume-to-LinkedIn consistency check, the extension sends the specific section text you want rewritten (e.g. your About paragraph), plus the target role/JD if you provided one, to rezoomed.com/api/linkedin/*.',
      'The request is processed statelessly — we do not retain the section text after the response is returned, we do not train models on it, and we do not sell or transfer it.',
    ],
  },
]

const doNotItems = [
  'We do not read or transmit any page on any site other than the LinkedIn profile DOM you are actively viewing.',
  'We do not collect your name, email, photo, or any PII from the LinkedIn DOM.',
  'We do not read your browsing history, tabs, cookies, passwords, or page contents on other sites.',
  'We do not inject ads, run third-party tracking pixels, or sell data to brokers.',
  'We do not execute remote code. Selector strategies come from a remote JSON file (/api/linkedin/adapter-config) that is strictly validated — selector and pattern strings only.',
]

const retentionItems = [
  'Local data (chrome.storage.local) lives until you uninstall the extension or clear extension storage.',
  'Anonymous PostHog events are retained per PostHog’s standard retention.',
  'Pro-feature requests are not persisted on our side beyond the response cycle.',
]

const controlItems = [
  'Uninstall the extension to delete all locally stored data.',
  'Sign out from the sidebar’s profile menu to clear the stored auth token.',
  'Email privacy@rezoomed.com to request deletion of any account-level data on the Rezoomed web app side.',
]

const toneStyles = {
  good: 'border-[#008f44]/15 bg-[#008f44]/5',
  neutral: 'border-zinc-100 bg-zinc-50/70',
} as const

export default function LinkedInExtensionPrivacyPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbf8_0%,#ffffff_52%,#f2f7f3_100%)] text-zinc-900">
      <PublicSiteHeader />

      <main className="px-6 py-16 pt-28">
        <div className="mx-auto max-w-4xl space-y-10">
          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-10">
            <p className="inline-flex rounded-full bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#008f44]">
              Chrome Extension Privacy Policy
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              How the LinkedIn Profile Optimizer handles your data
            </h1>
            <p className="mt-5 text-base leading-8 text-zinc-600 sm:text-lg">
              This policy covers the Rezoomed: LinkedIn Profile Optimizer Chrome extension (&ldquo;the
              extension&rdquo;). The Rezoomed web application at rezoomed.com has its own broader{' '}
              <Link href="/privacy-policy" className="font-semibold text-[#026d32] underline underline-offset-4">
                privacy policy
              </Link>
              ; this document covers only the extension.
            </p>
            <p className="mt-4 text-sm font-medium text-zinc-500">Last updated: {LAST_UPDATED}</p>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight">What the extension does</h2>
            <p className="mt-5 text-sm leading-7 text-zinc-600 sm:text-base">
              The extension renders a sidebar on the LinkedIn profile pages you visit. It reads the
              page&rsquo;s DOM to compute a profile score and surface fixes. It does not click, type, edit,
              post, message, or navigate on your behalf.
            </p>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight">What we collect</h2>
            <div className="mt-6 space-y-5">
              {collectSections.map((section) => (
                <div key={section.title} className={`rounded-[1.4rem] border p-5 ${toneStyles[section.tone]}`}>
                  <h3 className="text-sm font-black uppercase tracking-[0.14em] text-zinc-800">
                    {section.title}
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-zinc-600">
                    {section.points.map((point) => (
                      <li key={point} className="flex gap-2">
                        <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#026d32]/50" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight">What we do not do</h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-zinc-600">
              {doNotItems.map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden className="mt-0.5 font-black text-[#026d32]">
                    &times;
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
              <h2 className="text-2xl font-black tracking-tight">Data retention</h2>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-zinc-600">
                {retentionItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#026d32]/50" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
              <h2 className="text-2xl font-black tracking-tight">Your controls</h2>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-zinc-600">
                {controlItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#026d32]/50" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight">Trademarks</h2>
            <p className="mt-5 text-sm leading-7 text-zinc-600">
              &ldquo;LinkedIn&rdquo; is a trademark of LinkedIn Corporation. This extension is independent and is
              not affiliated with, endorsed by, or sponsored by LinkedIn Corporation.
            </p>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight">Contact</h2>
            <p className="mt-5 text-sm leading-7 text-zinc-600">
              Questions about this policy? Email{' '}
              <a className="font-semibold text-[#026d32]" href="mailto:privacy@rezoomed.com">
                privacy@rezoomed.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  )
}
