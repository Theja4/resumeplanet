import type { Metadata } from 'next'
import LogoMarqueeSection from '@/components/landing/LogoMarquee'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import LandingHeroV2 from '@/components/landing/LandingHeroV2'
import LandingBento from '@/components/landing/LandingBento'
import LandingStats from '@/components/landing/LandingStats'
import LandingWorkflow from '@/components/landing/LandingWorkflow'
import LandingFinalCTA from '@/components/landing/LandingFinalCTA'
import { buildPublicMetadata, getAbsoluteUrl, toJsonLd } from '@/lib/seo'

export const metadata: Metadata = buildPublicMetadata({
  title: 'Free AI Resume Builder & ATS Checker | Rezoomed',
  description:
    'Build ATS-friendly resumes, check ATS score, match job descriptions, and tailor applications faster with Rezoomed.',
  path: '/',
  keywords: [
    'ai resume builder',
    'ats checker',
    'resume optimization',
    'ats resume checker',
    'resume builder',
    'resume match score',
    'job description match',
    'metadata enhancer',
    'job matching',
    'resume tailoring',
    'resume keyword optimization',
    'Rezoomed',
  ],
})

const FAQS = [
  {
    question: 'What is Rezoomed?',
    answer:
      'Rezoomed is an AI resume builder and ATS checker that helps job seekers optimize resumes, match job descriptions, and export recruiter-ready files faster.',
  },
  {
    question: 'How does the ATS resume checker work?',
    answer:
      'You upload a resume and Rezoomed analyzes parseability, keyword alignment, formatting, and recruiter readability so you can fix issues before applying.',
  },
  {
    question: 'Can Rezoomed tailor my resume to a job description?',
    answer:
      'Yes. Rezoomed can compare your resume to a target job description, surface gaps, and help rewrite bullets and summaries around role-specific keywords.',
  },
  {
    question: 'Does Rezoomed include more than a resume builder?',
    answer:
      'Yes. Rezoomed also includes ATS checking, resume match score, resume tailoring, metadata enhancement, and export workflows for job seekers.',
  },
  {
    question: 'Is Rezoomed useful for ATS resume optimization?',
    answer:
      'Yes. Rezoomed is designed to improve ATS resume performance with clearer structure, stronger keyword coverage, and better formatting for applicant tracking systems.',
  },
] as const

type Testimonial = {
  quote: string
  name: string
  role: string
  initials: string
  color: string
  featured: boolean
  proof: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "I applied to 8 companies and got 6 callbacks. The tailoring feature alone is worth it — it's like having a career coach on demand.",
    name: 'Priya Sharma',
    role: 'Data scientist',
    initials: 'PS',
    color: 'from-[#dbeafe] to-[#93c5fd]',
    featured: true,
    proof: 'Shared after resume tailoring + ATS scan',
  },
  {
    quote: "The AI identified achievements I hadn't even thought to include. The ATS score jumped from 62% to 94% on my first try.",
    name: 'Marcus Kane',
    role: 'Marketing lead',
    initials: 'MK',
    color: 'from-[#ffe8bd] to-[#f5c87a]',
    featured: false,
    proof: 'Shared after first resume upload',
  },
  {
    quote: "Rezoomed didn't just fix my resume — it helped me understand my own worth. I landed a Senior Role within two weeks.",
    name: 'Sarah Jenkins',
    role: 'Product designer',
    initials: 'SJ',
    color: 'from-[#A3FFB3] to-[#80da92]',
    featured: false,
    proof: 'Shared after resume rewrite',
  },
  {
    quote: "Switched from Jobscan. Night and day difference. Rezoomed actually shows you what to fix, not just a score.",
    name: "James O'Brien",
    role: 'Engineering manager',
    initials: 'JO',
    color: 'from-[#fce7f3] to-[#f9a8d4]',
    featured: false,
    proof: 'Compared after ATS review',
  },
  {
    quote: "I was skeptical about AI resume tools, but Rezoomed surfaced keywords I'd never have thought to include. Got an offer 3 weeks later.",
    name: 'Aisha Thompson',
    role: 'UX researcher',
    initials: 'AT',
    color: 'from-[#d1fae5] to-[#6ee7b7]',
    featured: false,
    proof: 'Shared after job-description tailoring',
  },
  {
    quote: "Applied to 12 roles, heard back from 9. My recruiter actually complimented my resume format — that's never happened before.",
    name: 'Daniel Park',
    role: 'Software engineer',
    initials: 'DP',
    color: 'from-[#ede9fe] to-[#c4b5fd]',
    featured: false,
    proof: 'Shared after export + submit workflow',
  },
  {
    quote: "The tailor feature is insane. I paste a job description and it tells me exactly what's missing. Interviews went from 10% to 60% callback rate.",
    name: 'Leila Nasser',
    role: 'Product manager',
    initials: 'LN',
    color: 'from-[#fff7ed] to-[#fed7aa]',
    featured: false,
    proof: 'Shared after repeated ATS checks',
  },
  {
    quote: "I used three other tools before this. Rezoomed is the only one that felt like it actually understood what recruiters are looking for.",
    name: 'Ryan Okafor',
    role: 'Operations lead',
    initials: 'RO',
    color: 'from-[#fef9c3] to-[#fde047]',
    featured: false,
    proof: 'Shared after resume review + export',
  },
]

export default async function LandingPage() {
  const siteUrl = getAbsoluteUrl('/')
  const homepageJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${siteUrl}/#webpage`,
        url: siteUrl,
        name: 'Free AI Resume Builder & ATS Checker | Rezoomed',
        description:
          'Build ATS-friendly resumes, check ATS score, match job descriptions, and tailor applications faster with Rezoomed.',
        isPartOf: {
          '@id': `${siteUrl}/#website`,
        },
        about: {
          '@id': `${siteUrl}/#software`,
        },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: getAbsoluteUrl('/product-hero-v2.png'),
          width: 1792,
          height: 1024,
        },
        inLanguage: 'en-US',
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${siteUrl}/#software`,
        name: 'Rezoomed',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description:
          'AI resume builder, ATS checker, match score, and resume tailoring platform for job seekers.',
        url: siteUrl,
        image: getAbsoluteUrl('/product-hero-v2.png'),
        publisher: {
          '@id': `${siteUrl}/#organization`,
        },
        brand: {
          '@type': 'Brand',
          name: 'Rezoomed',
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: getAbsoluteUrl('/pricing'),
        },
        featureList: [
          'AI resume builder',
          'ATS checker',
          'Resume match score',
          'Resume tailoring',
          'PDF metadata enhancer',
          'Cover letter generator',
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${siteUrl}/#faq`,
        mainEntity: FAQS.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  }

  return (
    <div className="bg-white text-zinc-950 font-body selection:bg-[#A3FFB3] selection:text-[#022c14]">
      <PublicSiteHeader active="home" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(homepageJsonLd) }}
      />

      <main className="pt-16">
        <LandingHeroV2 />

        <LogoMarqueeSection />

        <LandingBento />

        <LandingStats />

        <LandingWorkflow />

        {/* ── Testimonials ───────────────────────────────────────────────── */}
        <section className="py-24 md:py-32 overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8faf9 100%)' }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center space-y-4 mb-16">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#00a84d]">User feedback</p>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.98] text-zinc-950">
                Quiet wins from <span className="italic bg-gradient-to-r from-[#00a84d] to-[#026d32] bg-clip-text text-transparent">real job seekers.</span>
              </h2>
              <p className="mx-auto max-w-2xl text-base text-zinc-600 leading-relaxed">
                Feedback shared after uploads, ATS scans, and tailoring flows. Identity kept light on the public page.
              </p>
            </div>
          </div>

          <div className="testimonial-mask">
            <div className="testimonial-track flex w-max gap-6 px-6">
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                <div
                  key={`${t.name}-${i}`}
                  className={`w-[340px] shrink-0 rounded-3xl p-7 flex flex-col justify-between space-y-5 ${
                    t.featured
                      ? 'bg-gradient-to-br from-[#00a84d] via-[#019a47] to-[#026d32] border border-[#026d32] shadow-[0_30px_60px_-20px_rgba(2,109,50,0.5)]'
                      : 'bg-white border border-zinc-100 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.08)]'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                        t.featured ? 'bg-white/20 text-white' : 'bg-[#A3FFB3]/30 text-[#026d32]'
                      }`}>
                        Early user
                      </span>
                    </div>
                    <p className={`text-base leading-7 ${t.featured ? 'text-white/95' : 'text-zinc-700'}`}>
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>
                  <div className={`flex items-center gap-3 pt-2 border-t ${t.featured ? 'border-white/20' : 'border-zinc-100'}`}>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${t.featured ? 'bg-white/20 text-white' : `bg-gradient-to-br ${t.color} text-zinc-800`}`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className={`text-sm font-black ${t.featured ? 'text-white' : 'text-zinc-900'}`}>{t.name}</p>
                      <p className={`text-xs ${t.featured ? 'text-white/70' : 'text-zinc-500'}`}>{t.role}</p>
                      <p className={`mt-1 text-[11px] ${t.featured ? 'text-white/70' : 'text-zinc-400'}`}>{t.proof}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────── */}
        <section className="bg-[#f8faf9] px-6 py-24 md:py-32">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="space-y-3 text-center md:text-left">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#00a84d]">FAQ</p>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.98] text-zinc-950">
                Quick <span className="italic bg-gradient-to-r from-[#00a84d] to-[#026d32] bg-clip-text text-transparent">answers.</span>
              </h2>
            </div>

            <div className="space-y-4">
              {FAQS.map(faq => (
                <details
                  key={faq.question}
                  className="group rounded-[1.75rem] border border-zinc-100 bg-white p-6 md:p-7 shadow-[0_12px_30px_rgba(18,24,21,0.04)] transition-all hover:border-[#A3FFB3] hover:shadow-[0_18px_40px_rgba(2,109,50,0.08)]"
                >
                  <summary className="cursor-pointer list-none text-lg md:text-xl font-black tracking-tight text-zinc-950 flex items-center justify-between">
                    {faq.question}
                    <span className="text-[#00a84d] transition-transform group-open:rotate-45 text-2xl font-light">+</span>
                  </summary>
                  <p className="mt-4 text-sm leading-7 text-zinc-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <LandingFinalCTA />
      </main>

      <PublicSiteFooter />
    </div>
  )
}
