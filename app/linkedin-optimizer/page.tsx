import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Search, ShieldCheck, FileCheck2, FileText, Target, Wand2, ArrowUpRight,
} from 'lucide-react'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import LinkedInExtensionLanding from '@/components/landing/LinkedInExtensionLanding'
import { getSiteUrl, SITE_NAME } from '@/lib/site'

const PAGE_PATH = '/linkedin-optimizer'
const PAGE_TITLE = 'LinkedIn Profile Optimization — Free Chrome Extension by Rezoomed'
const PAGE_DESCRIPTION =
  'Open your LinkedIn profile and get an instant recruiter-search score, section-by-section fixes, and a resume↔LinkedIn consistency check. Free Chrome extension from Rezoomed.'
const SHOWCASE_IMAGE = '/linkedin-extension/showcase.webp'

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    'LinkedIn profile optimization',
    'LinkedIn SEO',
    'LinkedIn profile optimizer',
    'recruiter search',
    'LinkedIn profile score',
    'optimize LinkedIn headline',
    'LinkedIn keyword optimization',
    'resume LinkedIn consistency',
    'free Chrome extension',
    'LinkedIn for job seekers',
  ],
  alternates: { canonical: PAGE_PATH },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    title: 'LinkedIn Profile Optimization — Free Chrome Extension',
    description:
      'Recruiter-search score, section fixes, and resume consistency for your LinkedIn profile. Free Chrome extension.',
    url: PAGE_PATH,
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

// Single source of truth — rendered visibly in the client component AND emitted
// as FAQPage structured data below, so Google sees matching copy in both.
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

// Keyword-rich trust points (server-rendered for SEO + visual structure).
const HIGHLIGHTS = [
  {
    Icon: Search,
    title: 'Recruiter-search scoring',
    blurb: 'Graded on how findable you are in recruiter searches — not vanity completeness.',
  },
  {
    Icon: ShieldCheck,
    title: 'On-device & private',
    blurb: 'The free scan runs in your browser. Your profile content never leaves your device.',
  },
  {
    Icon: FileCheck2,
    title: 'Resume ↔ LinkedIn in sync',
    blurb: 'Flags every section that drifts from the resume you actually send recruiters.',
  },
] as const

// Server-rendered internal links — crawlable, descriptive anchors.
const RELATED_TOOLS = [
  {
    href: '/resume-builder',
    Icon: FileText,
    title: 'AI Resume Builder',
    blurb: 'Build a recruiter-ready resume that stays in sync with your optimized LinkedIn profile.',
  },
  {
    href: '/ats-checker',
    Icon: ShieldCheck,
    title: 'ATS Resume Checker',
    blurb: 'Score your resume against applicant tracking systems before you apply.',
  },
  {
    href: '/match-score',
    Icon: Target,
    title: 'Resume Match Score',
    blurb: 'See how well your resume fits a specific job description, requirement by requirement.',
  },
  {
    href: '/resume-tailoring',
    Icon: Wand2,
    title: 'Resume Tailoring',
    blurb: 'Rewrite your bullets to match a target role and the keywords recruiters search for.',
  },
] as const

export default function LinkedInOptimizerPage() {
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}${PAGE_PATH}`
  const showcaseImageUrl = `${siteUrl}${SHOWCASE_IMAGE}`

  // Consolidated structured data graph (WebPage + Breadcrumb + SoftwareApplication + FAQ).
  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        inLanguage: 'en-US',
        isPartOf: { '@id': `${siteUrl}/#website` },
        primaryImageOfPage: showcaseImageUrl,
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'LinkedIn Profile Optimizer', item: pageUrl },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${pageUrl}#software`,
        name: 'Rezoomed — Profile Optimizer for LinkedIn',
        applicationCategory: 'BrowserApplication',
        operatingSystem: 'Chrome',
        browserRequirements: 'Requires Google Chrome',
        url: pageUrl,
        description:
          'Chrome extension that scores any LinkedIn profile against recruiter-search behavior and benchmarks it to people recently hired into your target role.',
        image: showcaseImageUrl,
        screenshot: showcaseImageUrl,
        featureList: [
          'Recruiter-search profile score (0–100)',
          '14 section-level readability checks',
          'Resume↔LinkedIn consistency check',
          'Per-section AI rewrites (Pro)',
          'On-device free scan — no password required',
        ],
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: {
          '@type': 'Organization',
          '@id': `${siteUrl}/#organization`,
          name: SITE_NAME,
          url: siteUrl,
          logo: `${siteUrl}/icon.png`,
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        mainEntity: FAQS.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    ],
  }

  return (
    <div className="flex min-h-screen flex-col bg-white font-body text-zinc-900">
      <PublicSiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />

      <main className="flex-1">
        <LinkedInExtensionLanding faqs={FAQS} />

        {/* Server-rendered, crawlable SEO content + internal links */}
        <section className="relative overflow-hidden border-t border-zinc-100 bg-[linear-gradient(180deg,#ffffff_0%,#f4f8f5_100%)] px-6 py-24">
          <div className="pointer-events-none absolute -left-24 top-20 h-80 w-80 rounded-full bg-[#A3FFB3]/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-[#0A66C2]/10 blur-3xl" />

          <div className="relative mx-auto max-w-5xl">
            {/* intro */}
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#026d32]/15 bg-[#026d32]/8 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#026d32]">
                Why Rezoomed
              </span>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
                LinkedIn profile optimization that mirrors{' '}
                <span className="bg-gradient-to-r from-[#026d32] to-[#0A66C2] bg-clip-text text-transparent">
                  recruiter search
                </span>
              </h2>
              <p className="mt-5 text-base leading-7 text-zinc-600 sm:text-lg">
                Most LinkedIn profile checkers grade how complete your profile looks. Rezoomed grades how{' '}
                <strong className="font-bold text-zinc-900">findable</strong>{' '}
                you are. Recruiters
                don&rsquo;t scroll — they search, using Boolean queries built from job titles, skills, and
                keywords. Our free Chrome extension scores your profile against that real recruiter-search
                behavior, so you can fix the headline, About section, experience, and skills that decide
                whether you surface at all.
              </p>
            </div>

            {/* highlight strip */}
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {HIGHLIGHTS.map((h) => (
                <div
                  key={h.title}
                  className="rounded-2xl border border-white bg-white/80 p-6 shadow-[0_18px_45px_rgba(18,24,21,0.05)] backdrop-blur-sm"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#026d32] to-[#30c06b] shadow-lg shadow-[#026d32]/20">
                    <h.Icon className="h-5 w-5 text-white" aria-hidden />
                  </div>
                  <h3 className="text-base font-black text-zinc-950">{h.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-zinc-500">{h.blurb}</p>
                </div>
              ))}
            </div>

            <p className="mx-auto mt-10 max-w-3xl text-center text-sm leading-7 text-zinc-500 sm:text-base">
              Every check is calibrated against profiles of people recently hired into the role you want.
              Profile parsing for the free scan happens entirely in your browser — no password, no
              scraping. Pair the extension with the rest of the Rezoomed toolkit to keep your resume and
              LinkedIn telling one consistent, keyword-rich story.
            </p>

            {/* related tools */}
            <h3 className="mt-16 text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
              Explore the toolkit
            </h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {RELATED_TOOLS.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group flex items-start gap-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-[0_12px_30px_rgba(18,24,21,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#0A66C2]/25 hover:shadow-[0_22px_50px_rgba(10,102,194,0.12)]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white transition-colors duration-300 group-hover:bg-[#0A66C2]">
                    <tool.Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-black text-zinc-950 group-hover:text-[#026d32]">
                        {tool.title}
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#0A66C2]" aria-hidden />
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-zinc-500">{tool.blurb}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  )
}
