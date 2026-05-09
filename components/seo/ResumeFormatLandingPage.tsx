import Link from 'next/link'
import { ArrowRight, CheckCircle2, FileText, LayoutTemplate, SearchCheck } from 'lucide-react'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import { getSiteUrl } from '@/lib/site'
import type { ResumeFormatPage } from '@/lib/seo/resume-format-pages'

function ResumeFormatPreview({ page }: { page: ResumeFormatPage }) {
  return (
    <div className="rounded-[1.7rem] border border-black/8 bg-white p-4 shadow-[0_24px_70px_rgba(18,24,21,0.08)]">
      <div className="rounded-[1.25rem] border border-zinc-200 bg-[#f7faf7] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 pb-4">
          <div>
            <div className="h-4 w-44 rounded-full bg-zinc-950" />
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="h-2.5 w-24 rounded-full bg-zinc-300" />
              <span className="h-2.5 w-28 rounded-full bg-zinc-300" />
              <span className="h-2.5 w-20 rounded-full bg-zinc-300" />
            </div>
          </div>
          <span className="rounded-full bg-[#A3FFB3]/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#062313]">
            ATS safe
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {page.sectionOrder.slice(0, 5).map((section, index) => (
            <div key={section} className="rounded-[1rem] border border-zinc-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#026d32]/10 text-[11px] font-black text-[#026d32]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">{section}</p>
                  <div className="mt-2 grid gap-1.5">
                    <span className="h-2 rounded-full bg-zinc-200" />
                    <span className="h-2 w-4/5 rounded-full bg-zinc-100" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm font-black text-zinc-950">{page.screenshotTitle}</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">{page.screenshotSubtitle}</p>
      </div>
    </div>
  )
}

export default function ResumeFormatLandingPage({ page }: { page: ResumeFormatPage }) {
  const siteUrl = getSiteUrl()
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: page.heading, item: `${siteUrl}${page.path}` },
    ],
  }
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: page.title,
    description: page.description,
    step: page.sectionOrder.map((section, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: section,
      text: `Add a clear ${section.toLowerCase()} section using searchable text and role-relevant proof.`,
    })),
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-landing font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container">
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      <main className="mx-auto flex-1 max-w-[88rem] px-6 pb-24 pt-24">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(241,247,243,0.9))] p-6 shadow-[0_24px_70px_rgba(18,24,21,0.08)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(2,109,50,0.08),transparent_30%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.75fr)] lg:items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-container/50 bg-primary-container/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
                <LayoutTemplate size={14} strokeWidth={2.2} />
                {page.eyebrow}
              </span>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-black tracking-tight text-on-background sm:text-5xl lg:text-[3.7rem] lg:leading-[0.98]">
                  {page.heading}
                </h1>
                <p className="max-w-2xl text-base leading-8 text-on-surface-variant">
                  {page.intro}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/resume-builder"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
                >
                  Use this format in builder <ArrowRight size={16} strokeWidth={2.4} />
                </Link>
                <Link
                  href="/ats-checker"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-black/8 bg-white px-6 py-3 text-sm font-bold text-on-surface transition-all hover:-translate-y-0.5"
                >
                  Test my resume format
                </Link>
              </div>
              <p className="text-sm font-semibold text-on-surface-variant">{page.intent}</p>
            </div>
            <ResumeFormatPreview page={page} />
          </div>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {page.quickWins.map(win => (
            <div key={win} className="flex items-start gap-3 rounded-[1.25rem] border border-white/70 bg-white/88 px-4 py-4 shadow-[0_16px_40px_rgba(18,24,21,0.04)]">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-primary" />
              <p className="text-sm leading-6 text-on-surface">{win}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-7 shadow-[0_18px_45px_rgba(18,24,21,0.05)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Section order</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">Use this order first.</h2>
            <div className="mt-6 space-y-3">
              {page.sectionOrder.map((section, index) => (
                <div key={section} className="flex items-center gap-3 border-b border-black/5 pb-3 last:border-b-0 last:pb-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#026d32]/10 text-sm font-black text-[#026d32]">
                    {index + 1}
                  </span>
                  <p className="text-sm font-bold text-on-background">{section}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-[#07110b] p-7 text-white shadow-[0_18px_45px_rgba(18,24,21,0.08)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#A3FFB3]">Builder template</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">{page.template.name}</h2>
            <p className="mt-4 rounded-[1.2rem] border border-white/10 bg-white/6 p-4 text-sm leading-7 text-white/76">
              {page.template.summary}
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-[0.82fr_1.18fr]">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/42">Skills</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {page.template.skills.map(skill => (
                    <span key={skill} className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/82">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/42">Bullet formulas</p>
                <div className="mt-3 space-y-2">
                  {page.template.bullets.map(bullet => (
                    <p key={bullet} className="rounded-[1rem] border border-white/8 bg-white/6 px-4 py-3 text-sm leading-6 text-white/80">
                      {bullet}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-7 shadow-[0_18px_45px_rgba(18,24,21,0.05)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Before and after</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">Rewrite weak lines into proof.</h2>
            <div className="mt-6 space-y-4">
              {page.beforeAfter.map(item => (
                <div key={item.before} className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1.2rem] border border-red-100 bg-red-50/70 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Before</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-700">{item.before}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-emerald-100 bg-emerald-50/80 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">After</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-800">{item.after}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-7 shadow-[0_18px_45px_rgba(18,24,21,0.05)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">ATS-safe rules</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">Format rules worth keeping.</h2>
            <div className="mt-6 space-y-3">
              {page.atsRules.map(rule => (
                <div key={rule} className="flex items-start gap-3 rounded-[1.1rem] border border-black/6 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,249,0.96))] p-4">
                  <SearchCheck size={17} className="mt-0.5 shrink-0 text-primary" />
                  <p className="text-sm leading-6 text-on-surface">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {page.roleLinks ? (
          <section className="mt-8 rounded-[2rem] border border-white/70 bg-white/90 p-7 shadow-[0_18px_45px_rgba(18,24,21,0.05)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Role examples</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">Pick the closest resume format.</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {page.roleLinks.map(link => (
                <Link key={link.href} href={link.href} className="group rounded-[1.35rem] border border-black/6 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,249,0.96))] p-5 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_18px_45px_rgba(18,24,21,0.07)]">
                  <FileText size={18} className="text-primary" />
                  <h3 className="mt-3 text-lg font-black tracking-tight text-on-background">{link.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">{link.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary transition-all group-hover:gap-2">
                    Open example <ArrowRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)]">
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-7 shadow-[0_18px_45px_rgba(18,24,21,0.05)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">FAQs</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">Resume format questions</h2>
            <div className="mt-6 space-y-4">
              {page.faqs.map(faq => (
                <div key={faq.question} className="rounded-[1.2rem] border border-black/6 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,249,0.96))] p-5">
                  <h3 className="text-lg font-black text-on-background">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-on-surface-variant">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.9))] p-7 shadow-[0_18px_45px_rgba(18,24,21,0.05)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Next tools</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-on-background">Keep going in Rezoomed.</h2>
            <div className="mt-5 space-y-4">
              {page.related.map(link => (
                <Link key={link.href} href={link.href} className="block rounded-[1.2rem] border border-black/6 bg-white/88 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/25">
                  <p className="text-sm font-black text-on-background">{link.label}</p>
                  <p className="mt-1 text-xs leading-5 text-on-surface-variant">{link.description}</p>
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
