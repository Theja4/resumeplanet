import Link from 'next/link'
import type { Metadata } from 'next'
import { Lock, Sparkles } from 'lucide-react'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import ToolPageContentSections from '@/components/seo/ToolPageContentSections'
import { getSiteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Resume Match Score',
  description:
    'Compare your resume against a job description, spot missing skills and weak evidence, and decide how to tailor before you apply.',
  alternates: {
    canonical: '/match-score',
  },
  openGraph: {
    type: 'website',
    title: 'Resume Match Score | Rezoomed',
    description: 'Compare your resume against a job description, spot missing skills and weak evidence, and decide how to tailor before you apply.',
    url: '/match-score',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resume Match Score | Rezoomed',
    description: 'Compare your resume against a job description, spot missing skills and weak evidence, and decide how to tailor before you apply.',
    images: ['/opengraph-image'],
  },
}

// Marketing page — Vercel can serve this from the edge cache for anonymous visitors.
export const revalidate = 300

const FAQS = [
  {
    question: 'What is a resume match score?',
    answer:
      'A resume match score estimates how closely your resume aligns with a target job description based on skills, keywords, tools, and role signals.',
  },
  {
    question: 'Is match score different from ATS score?',
    answer:
      'Yes. ATS score checks structure and readability, while match score checks how well your resume fits a specific role.',
  },
  {
    question: 'Should I apply if my match score is low?',
    answer:
      'A low score usually means you should either tailor the resume more carefully or skip the role if the fit is genuinely weak.',
  },
] as const

export default function PublicMatchScorePage() {
  const siteUrl = getSiteUrl()
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Match Score', item: `${siteUrl}/match-score` },
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

      <main className="mx-auto flex flex-1 max-w-6xl items-center px-6 pb-20 pt-28">
        <div className="w-full space-y-8">
          <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.88))] p-8 shadow-[0_24px_60px_rgba(25,28,29,0.08)] backdrop-blur-2xl sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
              <div className="space-y-5">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-container/50 bg-primary-container/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
                  <Lock size={14} strokeWidth={2.2} />
                  Pro workflow
                </span>
                <div className="space-y-3">
                  <h1 className="max-w-3xl text-4xl font-black tracking-tight text-on-background sm:text-5xl">
                    Compare your resume to a real job before you apply.
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-on-surface-variant">
                    Compare your resume against a real job description, surface the biggest fit gaps, and decide whether a role is worth pursuing before you apply.
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    'Measure resume-to-role fit instead of generic ATS hygiene.',
                    'See where your evidence is strong, partial, or missing.',
                    'Use Match Score alongside ATS Checker and metadata cleanup inside the dashboard.',
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
                  Match Score lives inside the dashboard and unlocks after signup and Pro upgrade.
                </p>
                <div className="mt-5 space-y-3">
                  <Link
                    href="/auth/register"
                    className="inline-flex w-full items-center justify-center rounded-full bg-zinc-950 px-4 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
                  >
                    Create Account
                  </Link>
                  <Link
                    href="/auth/login"
                    className="inline-flex w-full items-center justify-center rounded-full border border-black/8 bg-white px-4 py-3 text-sm font-semibold text-on-surface transition-all hover:-translate-y-0.5 hover:bg-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/ats-checker"
                    className="inline-flex w-full items-center justify-center rounded-full border border-black/8 bg-white px-4 py-3 text-sm font-semibold text-on-surface transition-all hover:-translate-y-0.5 hover:bg-white"
                  >
                    Try ATS Checker First
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <ToolPageContentSections
            toolName="Match Score"
            howItWorks={[
              {
                title: 'Upload the resume and paste the JD',
                description:
                  'Drop in a PDF or DOCX resume, paste the full job description, and run the comparison. No reformatting needed.',
              },
              {
                title: 'See where the resume aligns and where it falls short',
                description:
                  'Match Score highlights missing skills, weak evidence, and keyword gaps so you know exactly what to strengthen before applying.',
              },
              {
                title: 'Tailor and re-score until the fit is real',
                description:
                  'Use the suggestions to rewrite specific bullets, then re-run Match Score to confirm the gap closed without padding or keyword stuffing.',
              },
            ]}
            differentiators={[
              {
                title: 'Real-evidence scoring, not just keyword counting',
                description:
                  'We score based on whether your resume actually supports the role, not just whether the words appear somewhere in the file.',
              },
              {
                title: 'Action-oriented gap analysis',
                description:
                  'Every missing signal comes with what to add, where to add it, and which phrasing keeps the resume honest.',
              },
              {
                title: 'Linked directly to tailoring',
                description:
                  'When the score is low, jump straight into the tailoring workflow without re-uploading or restarting from scratch.',
              },
            ]}
            relatedReading={[
              {
                title: 'Job description match score explained',
                description: 'What your score actually measures and how to read the result.',
                href: '/blog/job-description-match-score-explained',
              },
              {
                title: 'Best resume keywords to match a JD',
                description: 'How to identify the right keywords without crossing into keyword stuffing.',
                href: '/blog/best-resume-keywords-to-match-a-job-description',
              },
              {
                title: 'How to tailor your resume for each job',
                description: 'A workflow for staying tailored without rebuilding the resume every time.',
                href: '/blog/how-to-tailor-your-resume-for-each-job-without-starting-over',
              },
            ]}
          />

          <section className="rounded-[2rem] border border-white/70 bg-white/88 p-8 shadow-[0_18px_45px_rgba(25,28,29,0.05)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">FAQs</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">Match score questions</h2>
            <div className="mt-6 grid gap-4">
              {FAQS.map((faq) => (
                <div key={faq.question} className="rounded-[1.4rem] border border-black/6 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,249,0.96))] p-5">
                  <h3 className="text-lg font-black text-on-background">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-on-surface-variant">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  )
}
