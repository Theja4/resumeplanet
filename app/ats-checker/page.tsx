import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowRight, CheckCircle2, FileText, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ATSCheckerClient from '@/app/dashboard/(shell)/ats-checker/ATSCheckerClient'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import { getSiteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Free ATS Resume Checker & Scanner',
  description:
    'Use Rezoomed free ATS resume checker to scan for parsing issues, keyword gaps, formatting problems, and recruiter-readability weaknesses before you apply.',
  alternates: {
    canonical: '/ats-checker',
  },
  openGraph: {
    type: 'website',
    title: 'Free ATS Resume Checker & Scanner',
    description: 'Use Rezoomed free ATS resume checker to scan for parsing issues, keyword gaps, formatting problems, and recruiter-readability weaknesses before you apply.',
    url: '/ats-checker',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free ATS Resume Checker & Scanner',
    description: 'Use Rezoomed free ATS resume checker to scan for parsing issues, keyword gaps, formatting problems, and recruiter-readability weaknesses before you apply.',
  },
}

const FAQS = [
  {
    question: 'How does the ATS checker work?',
    answer:
      'Rezoomed scans your resume for ATS parsing issues, keyword gaps, structure problems, and recruiter-readability weaknesses before you apply.',
  },
  {
    question: 'Is this ATS checker free?',
    answer:
      'Yes. Rezoomed offers a free ATS checker workflow so you can test one resume before signup and see where it needs improvement.',
  },
  {
    question: 'What is the difference between ATS score and match score?',
    answer:
      'ATS score focuses on structure, formatting, and keyword coverage, while match score compares your resume against a specific job description.',
  },
  {
    question: 'Does the ATS checker help with keywords?',
    answer:
      'Yes. Rezoomed flags weak keyword coverage and missing skill signals so you can tighten the resume before applying.',
  },
  {
    question: 'What file types can I scan?',
    answer:
      'The public ATS checker accepts common resume formats including PDF and DOCX so you can test the file you actually send to employers.',
  },
] as const

const ATS_FEATURES = [
  'Scan resume structure before an ATS parses it badly.',
  'Spot keyword and skills coverage gaps that weaken fit.',
  'Catch formatting patterns that make recruiter reading slower.',
  'Turn one generic resume into a cleaner, role-ready version.',
] as const

const ATS_CHECK_AREAS = [
  {
    title: 'ATS parsing and section structure',
    description:
      'Check whether the resume is organized in a way that recruiting software and humans can both follow quickly.',
  },
  {
    title: 'Keyword and skill coverage',
    description:
      'Surface missing role language, weak keyword support, and skill areas that are underrepresented in the resume.',
  },
  {
    title: 'Formatting and readability',
    description:
      'Flag layout and wording issues that make the document harder to scan, interpret, or trust.',
  },
] as const

const NEXT_STEPS = [
  {
    title: 'Rebuild weak sections in the resume builder',
    description:
      'Use the builder when the scan shows structural or clarity problems that are easier to fix section by section.',
    href: '/resume-builder',
    cta: 'Open Resume Builder',
  },
  {
    title: 'Compare the resume to a real job description',
    description:
      'Run Match Score after ATS cleanup when you want to measure fit against one specific role.',
    href: '/match-score',
    cta: 'Try Match Score',
  },
  {
    title: 'Tailor the resume for stronger alignment',
    description:
      'Move into the tailoring workflow when the resume is ATS-safe but still needs tighter role language.',
    href: '/resume-tailoring',
    cta: 'Explore Resume Tailoring',
  },
] as const

export default async function PublicATSCheckerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard/ats-checker')
  }

  const siteUrl = getSiteUrl()
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'ATS Scanner', item: `${siteUrl}/ats-checker` },
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
  const softwareApplicationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Rezoomed ATS Resume Checker',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: `${siteUrl}/ats-checker`,
    description:
      'A web-based ATS resume checker that reviews parsing, keywords, formatting, and recruiter readability.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />

      <main className="mx-auto flex-1 max-w-[90rem] px-6 pb-20 pt-24">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(241,247,243,0.88))] px-6 py-5 shadow-[0_24px_60px_rgba(18,24,21,0.06)] backdrop-blur-2xl sm:px-8 sm:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.26),transparent_40%),radial-gradient(circle_at_center,rgba(123,211,252,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(2,109,50,0.08),transparent_36%)]" />
          <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-end">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full border border-primary-container/50 bg-primary-container/35 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
                Free ATS resume checker
              </span>
              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-on-background sm:text-4xl lg:text-[3.35rem] lg:leading-[0.98]">
                Free ATS resume checker for parsing, keywords, and formatting issues.
              </h1>
            </div>
            <div className="space-y-3 lg:max-w-[26rem] lg:justify-self-end">
              <p className="text-sm leading-6 text-on-surface-variant sm:text-[15px]">
                Scan your resume before you apply and catch the ATS issues that make strong candidates look weaker than they are.
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] text-on-surface-variant">
                <span className="rounded-full border border-black/8 bg-white/86 px-3 py-1.5 font-bold uppercase tracking-[0.16em]">1 scan before signup</span>
                <span className="rounded-full border border-black/8 bg-white/86 px-3 py-1.5 font-bold uppercase tracking-[0.16em]">PDF and DOCX</span>
                <span className="rounded-full border border-black/8 bg-white/86 px-3 py-1.5 font-bold uppercase tracking-[0.16em]">Instant feedback</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ATS_FEATURES.map((bullet) => (
            <div key={bullet} className="flex items-start gap-3 rounded-[1.35rem] border border-white/70 bg-white/86 px-4 py-4 shadow-[0_18px_45px_rgba(25,28,29,0.05)]">
              <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" strokeWidth={2} />
              <p className="text-sm leading-6 text-on-surface">{bullet}</p>
            </div>
          ))}
        </section>

        <section className="mt-6">
          <ATSCheckerClient resumes={[]} profile={null} publicMode mode="ats" showIntro={false} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
          <div className="rounded-[2rem] border border-white/70 bg-white/88 p-8 shadow-[0_18px_45px_rgba(25,28,29,0.05)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">What It Checks</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">
              What the ATS resume checker looks for
            </h2>
            <div className="mt-6 space-y-4">
              {ATS_CHECK_AREAS.map((item) => (
                <div key={item.title} className="rounded-[1.4rem] border border-black/6 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,249,0.96))] p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" />
                    <div>
                      <h3 className="text-lg font-black text-on-background">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-on-surface-variant">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.9))] p-8 shadow-[0_18px_45px_rgba(25,28,29,0.05)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">After The Scan</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">
              What to do after you get the ATS score
            </h2>
            <div className="mt-6 space-y-4">
              {NEXT_STEPS.map((item) => (
                <div key={item.title} className="rounded-[1.4rem] border border-black/6 bg-white/88 p-5">
                  <div className="flex items-start gap-3">
                    <FileText size={18} className="mt-0.5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <h3 className="text-lg font-black text-on-background">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-on-surface-variant">{item.description}</p>
                      <Link
                        href={item.href}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                      >
                        {item.cta} <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/70 bg-white/88 p-8 shadow-[0_18px_45px_rgba(25,28,29,0.05)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">FAQs</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">ATS checker questions</h2>
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
