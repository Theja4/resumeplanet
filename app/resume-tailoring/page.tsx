import Link from 'next/link'
import type { Metadata } from 'next'
import { Sparkles, WandSparkles } from 'lucide-react'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import ToolPageContentSections from '@/components/seo/ToolPageContentSections'
import { getSiteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Resume Tailoring Tool',
  description:
    'Tailor your resume to a job description with Rezoomed, surface fit gaps, and rewrite the strongest sections for the target role.',
  alternates: {
    canonical: '/resume-tailoring',
  },
  openGraph: {
    type: 'website',
    title: 'Resume Tailoring Tool | Rezoomed',
    description: 'Tailor your resume to a job description with Rezoomed, surface fit gaps, and rewrite the strongest sections for the target role.',
    url: '/resume-tailoring',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resume Tailoring Tool | Rezoomed',
    description: 'Tailor your resume to a job description with Rezoomed, surface fit gaps, and rewrite the strongest sections for the target role.',
    images: ['/opengraph-image'],
  },
}

// Marketing page — Vercel can serve this from the edge cache for anonymous visitors.
export const revalidate = 300

const FAQS = [
  {
    question: 'What is resume tailoring?',
    answer:
      'Resume tailoring means adjusting your summary, keywords, and top bullets so the resume clearly fits a specific target role or job description.',
  },
  {
    question: 'Is tailoring different from ATS checking?',
    answer:
      'Yes. ATS checking focuses on readability and structure, while tailoring focuses on role fit, missing signals, and stronger alignment to the job.',
  },
  {
    question: 'Can I tailor one resume for multiple roles?',
    answer:
      'You can, but the strongest workflow is to keep multiple targeted resume versions instead of forcing one file to cover every job family.',
  },
] as const

export default function PublicResumeTailoringPage() {
  const siteUrl = getSiteUrl()
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Resume Tailoring', item: `${siteUrl}/resume-tailoring` },
    ],
  }
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-landing text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
      <PublicSiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="mx-auto flex-1 max-w-6xl px-6 pb-20 pt-24">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.88))] p-8 shadow-[0_24px_60px_rgba(25,28,29,0.08)] backdrop-blur-2xl sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.22),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(2,109,50,0.08),transparent_34%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-container/50 bg-primary-container/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
                <WandSparkles size={14} strokeWidth={2.2} />
                Tailor mode
              </span>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-on-background sm:text-5xl">
                  Tailor your resume to a specific job description instead of guessing.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-on-surface-variant">
                  Rezoomed compares your saved resume with a target role, highlights where the fit is strong or weak, and helps you rewrite the highest-value sections for that exact application.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  'Paste a real job description and surface the biggest fit gaps fast.',
                  'Open the builder directly in Tailor Mode for role-specific rewrites.',
                  'Keep multiple targeted resume versions instead of forcing one generic file everywhere.',
                  'Use ATS checking and match scoring alongside the tailoring workflow.',
                ].map((bullet) => (
                  <div key={bullet} className="flex items-start gap-3 rounded-[1.2rem] bg-white/80 px-4 py-3">
                    <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" strokeWidth={2} />
                    <p className="text-sm leading-6 text-on-surface">{bullet}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-black/6 bg-white/84 p-5 shadow-[0_18px_45px_rgba(25,28,29,0.05)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Start here</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-on-background">Create your account first.</h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Resume tailoring is available inside the dashboard and unlocks on Pro.
              </p>
              <div className="mt-5 space-y-3">
                <Link
                  href="/auth/register"
                  className="inline-flex w-full items-center justify-center rounded-full bg-zinc-950 px-4 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
                >
                  Create Account
                </Link>
                <Link
                  href="/match-score"
                  className="inline-flex w-full items-center justify-center rounded-full border border-black/8 bg-white px-4 py-3 text-sm font-semibold text-on-surface transition-all hover:-translate-y-0.5 hover:bg-white"
                >
                  Explore Match Score
                </Link>
              </div>
            </div>
          </div>
        </section>

        <ToolPageContentSections
          toolName="Resume tailoring tool"
          howItWorks={[
            {
              title: 'Bring in the resume and target job',
              description:
                'Upload the resume you want to tailor and paste the job description. Rezoomed locks onto the role context before suggesting changes.',
            },
            {
              title: 'Spot fit gaps fast',
              description:
                'See exactly which experience signals are missing, weak, or buried — without losing the parts of your resume that are already working.',
            },
            {
              title: 'Rewrite the strongest sections',
              description:
                'Apply targeted bullet and summary rewrites that mirror the role language while keeping every claim truthful and verifiable.',
            },
          ]}
          differentiators={[
            {
              title: 'Tailoring without rewriting from scratch',
              description:
                'Preserve the existing structure, achievements, and tone. We change what needs to move, not the whole resume.',
            },
            {
              title: 'Honesty-first rewrites',
              description:
                'Suggested edits never invent skills or experience. The goal is sharper signal from what you already have.',
            },
            {
              title: 'Connected to match score',
              description:
                'Re-check the match score after each tailoring pass so you know the changes actually improved fit.',
            },
          ]}
          relatedReading={[
            {
              title: 'How to tailor your resume for each job',
              description: 'A practical workflow for staying tailored without restarting.',
              href: '/blog/how-to-tailor-your-resume-for-each-job-without-starting-over',
            },
            {
              title: 'Tailor your resume for software engineer roles',
              description: 'What hiring teams expect in an engineering resume in 2026.',
              href: '/blog/how-to-tailor-your-resume-for-software-engineer-jobs',
            },
            {
              title: 'Tailor your resume for product manager roles',
              description: 'How to position PM evidence so it lands with hiring teams.',
              href: '/blog/how-to-tailor-your-resume-for-product-manager-jobs',
            },
          ]}
        />

        <section className="mt-8 rounded-[2rem] border border-white/70 bg-white/88 p-8 shadow-[0_18px_45px_rgba(25,28,29,0.05)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">FAQs</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">Resume tailoring questions</h2>
          <div className="mt-6 grid gap-4">
            {FAQS.map((faq) => (
              <div key={faq.question} className="rounded-[1.4rem] border border-black/6 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,249,0.96))] p-5">
                <h3 className="text-lg font-black text-on-background">{faq.question}</h3>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  )
}
