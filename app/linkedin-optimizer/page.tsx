import Link from 'next/link'
import type { Metadata } from 'next'
import { Download, CheckCircle2, Eye, FileText, Sparkles } from 'lucide-react'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import { getSiteUrl } from '@/lib/site'

// Placeholder until the extension is published. Swap for the real Chrome Web
// Store URL post-listing; tests/landing copy reference this constant.
const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/PLACEHOLDER_EXTENSION_ID'

export const metadata: Metadata = {
  title: 'LinkedIn Profile Optimization — Free Chrome Extension by Rezoomed',
  description:
    'Open your LinkedIn profile and get an instant recruiter-search score, section-by-section fixes, and a resume↔LinkedIn consistency check. Free Chrome extension from Rezoomed.',
  alternates: { canonical: '/linkedin-optimizer' },
  openGraph: {
    type: 'website',
    title: 'LinkedIn Profile Optimization — Free Chrome Extension',
    description:
      'Recruiter-search score, section fixes, and resume consistency for your LinkedIn profile. Free Chrome extension.',
    url: '/linkedin-optimizer',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkedIn Profile Optimization — Free Chrome Extension',
    description:
      'Recruiter-search score, section fixes, and resume consistency for your LinkedIn profile.',
    images: ['/opengraph-image'],
  },
}

export const revalidate = 300

const FAQS = [
  {
    question: 'Do I need to give the extension my LinkedIn password?',
    answer:
      'No. The extension never asks for your LinkedIn credentials. It only reads the profile page you are already viewing in your browser, the same way you would read it yourself.',
  },
  {
    question: 'Is the extension free?',
    answer:
      'Yes. The teaser score and top issues are available with no signup. A free Rezoomed account unlocks the full section-by-section breakdown and the resume↔LinkedIn consistency check. Per-section AI fixes are part of Rezoomed Pro.',
  },
  {
    question: 'What makes this different from other LinkedIn optimizers?',
    answer:
      'Three things: it scores your profile against how recruiters actually search (not vanity counts), it benchmarks against profiles of people recently hired into your target role, and it compares your LinkedIn against your Rezoomed resume so you can spot drift recruiters notice.',
  },
  {
    question: 'Does it work on every LinkedIn profile?',
    answer:
      'It runs on any public LinkedIn profile URL (linkedin.com/in/...). The full breakdown is intended for your own profile — signing in with Rezoomed unlocks the consistency check against your resume.',
  },
  {
    question: 'Where does my data go?',
    answer:
      'Profile parsing happens entirely in your browser. We only send a scan summary (score + section status) to Rezoomed when you are signed in, so you can see your history in the dashboard. We never store your raw LinkedIn HTML.',
  },
] as const

const DIFFERENTIATORS = [
  {
    title: 'Recruiter-search simulation',
    body: 'Most tools grade you on how complete your profile is. We grade you on how findable you are — keyword density, headline match, and signal strength for the searches recruiters actually run.',
  },
  {
    title: 'Real-hired-profile framing',
    body: 'Every check is calibrated against profiles of people who were recently hired into roles like the one you want. Pass means "looks like the people who got the job," not "you filled in the field."',
  },
  {
    title: 'Resume↔LinkedIn consistency',
    body: "Recruiters cross-reference your LinkedIn against the resume you sent. We surface where they drift — headline, current title, skills — so you can align both before the next interview loop.",
  },
] as const

const HOW_IT_WORKS = [
  {
    n: '1',
    title: 'Install in one click',
    body: 'Add Rezoomed to Chrome. No account required to see your first teaser score.',
  },
  {
    n: '2',
    title: 'Open your LinkedIn profile',
    body: 'The panel appears in the corner with your recruiter-search score and the two biggest issues holding you back.',
  },
  {
    n: '3',
    title: 'Sign in to unlock the full breakdown',
    body: 'A free Rezoomed account unlocks every section check plus the resume consistency gap. Pro adds per-section AI fixes.',
  },
] as const

export default function LinkedInOptimizerPage() {
  const siteUrl = getSiteUrl()
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'LinkedIn Profile Optimizer',
        item: `${siteUrl}/linkedin-optimizer`,
      },
    ],
  }
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Rezoomed — Profile Optimizer for LinkedIn',
    applicationCategory: 'BrowserApplication',
    operatingSystem: 'Chrome',
    url: `${siteUrl}/linkedin-optimizer`,
    description:
      'Chrome extension that scores any LinkedIn profile against recruiter-search behavior and benchmarks it to people recently hired into your target role.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-landing text-on-surface font-body">
      <PublicSiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />

      <main className="mx-auto w-full max-w-[80rem] flex-1 px-6 pb-20 pt-24">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(241,247,243,0.88))] px-6 py-10 shadow-[0_24px_60px_rgba(18,24,21,0.06)] sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.26),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(2,109,50,0.08),transparent_36%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-center">
            <div className="space-y-5">
              <span className="inline-flex items-center rounded-full border border-primary-container/50 bg-primary-container/35 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
                Free Chrome extension
              </span>
              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-on-background sm:text-4xl lg:text-[3.25rem] lg:leading-[1]">
                Score your LinkedIn profile the way recruiters actually search.
              </h1>
              <p className="max-w-xl text-base leading-7 text-on-surface-variant">
                One click and a free Rezoomed account unlocks the full section-by-section
                breakdown — plus a consistency check against the resume in your account, so
                your LinkedIn and your resume don't drift apart.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  className="inline-flex items-center gap-2 rounded-full bg-on-background px-5 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-on-background/20 transition hover:bg-on-background/90"
                  href={CHROME_STORE_URL}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Add to Chrome — free
                </a>
                <Link
                  className="inline-flex items-center gap-2 rounded-full border border-on-background/10 bg-white/80 px-5 py-3 text-sm font-semibold text-on-background transition hover:bg-white"
                  href="/pricing"
                >
                  See Pro pricing
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] text-on-surface-variant">
                <span className="rounded-full border border-black/8 bg-white/86 px-3 py-1.5 font-bold uppercase tracking-[0.16em]">
                  Never asks for LinkedIn credentials
                </span>
                <span className="rounded-full border border-black/8 bg-white/86 px-3 py-1.5 font-bold uppercase tracking-[0.16em]">
                  Teaser score, no signup
                </span>
                <span className="rounded-full border border-black/8 bg-white/86 px-3 py-1.5 font-bold uppercase tracking-[0.16em]">
                  Works in browser
                </span>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/70 bg-white/86 p-6 shadow-[0_18px_45px_rgba(25,28,29,0.05)]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                What the panel shows
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface">
                <li className="flex items-start gap-2">
                  <Eye className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  Recruiter-search score (0–100)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  14 section-level readable checks
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  Resume↔LinkedIn drift highlights
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  Per-section AI rewrites (Pro)
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Differentiators */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight text-on-background sm:text-3xl">
            Built on what gets people hired, not what fills the form
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {DIFFERENTIATORS.map((d) => (
              <div
                key={d.title}
                className="rounded-2xl border border-white/70 bg-white/86 p-6 shadow-[0_18px_45px_rgba(25,28,29,0.04)]"
              >
                <h3 className="text-base font-bold text-on-background">{d.title}</h3>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{d.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight text-on-background sm:text-3xl">
            Three steps
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {HOW_IT_WORKS.map((s) => (
              <li
                key={s.n}
                className="rounded-2xl border border-white/70 bg-white/86 p-6 shadow-[0_18px_45px_rgba(25,28,29,0.04)]"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-on-primary-container">
                  {s.n}
                </span>
                <h3 className="mt-3 text-base font-bold text-on-background">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <section className="mt-12 rounded-[2rem] border border-white/70 bg-on-background px-6 py-10 text-on-primary sm:px-12">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(14rem,1fr)] lg:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Stop guessing what's wrong with your LinkedIn
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-on-primary/80">
                Install the extension, open your profile, and see what recruiters see — in
                under 30 seconds.
              </p>
            </div>
            <a
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-on-background transition hover:bg-white/90"
              href={CHROME_STORE_URL}
              rel="noreferrer noopener"
              target="_blank"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Add to Chrome — free
            </a>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight text-on-background sm:text-3xl">
            Frequently asked
          </h2>
          <dl className="mt-6 space-y-4">
            {FAQS.map((faq) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-white/70 bg-white/86 p-6 shadow-[0_18px_45px_rgba(25,28,29,0.04)]"
              >
                <dt className="text-base font-bold text-on-background">{faq.question}</dt>
                <dd className="mt-2 text-sm leading-6 text-on-surface-variant">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  )
}
