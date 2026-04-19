import Link from 'next/link'
import Image from 'next/image'
import { WandSparkles } from 'lucide-react'
import type { Metadata } from 'next'
import LandingFeatures from '@/components/landing/LandingFeatures'
import LogoMarqueeSection from '@/components/landing/LogoMarquee'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import { getSiteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Free AI Resume Builder & ATS Checker | Rezoomed',
  description:
    'Build ATS-friendly resumes, check ATS score, match job descriptions, and tailor applications faster with Rezoomed.',
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
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    title: 'Free AI Resume Builder & ATS Checker | Rezoomed',
    description: 'Build ATS-friendly resumes, check ATS score, match job descriptions, and tailor applications faster with Rezoomed.',
    url: '/',
    images: [{ url: '/product-hero-v2.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free AI Resume Builder & ATS Checker | Rezoomed',
    description: 'Build ATS-friendly resumes, check ATS score, match job descriptions, and tailor applications faster with Rezoomed.',
    images: ['/product-hero-v2.png'],
  },
}

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
  const siteUrl = getSiteUrl()
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Rezoomed',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'AI resume builder, ATS checker, match score, and resume tailoring platform for job seekers.',
    url: siteUrl,
    image: `${siteUrl}/product-hero-v2.png`,
    brand: {
      '@type': 'Brand',
      name: 'Rezoomed',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}/pricing`,
    },
    featureList: [
      'AI resume builder',
      'ATS checker',
      'Resume match score',
      'Resume tailoring',
      'PDF metadata enhancer',
      'Cover letter generator',
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
    <div className="bg-background-landing text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
      <PublicSiteHeader active="home" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-start pt-16 pb-24 px-6 overflow-hidden grid-bg gradient-glow-hero">
          {/* Green glow orb */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,rgba(163,255,179,0.25)_0%,transparent_70%)] pointer-events-none z-[1]" />
          <div className="absolute inset-0 z-0 flex justify-center items-start pointer-events-none fade-mask">
            <div className="hero-resume-animation relative w-full max-w-[98rem] translate-y-40 scale-[1.015] opacity-100">
              <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_40px_120px_rgba(15,23,18,0.18)]">
                <Image
                  src="/product-hero-v2.png"
                  alt="Rezoomed product screenshot"
                  width={1792}
                  height={1024}
                  priority
                  className="block h-auto w-full"
                />
              </div>
              <div className="absolute inset-0 rounded-[2rem] bg-[linear-gradient(180deg,rgba(248,250,249,0.94)_0%,rgba(248,250,249,0.84)_14%,rgba(248,250,249,0.64)_28%,rgba(248,250,249,0.38)_42%,rgba(248,250,249,0.14)_58%,rgba(248,250,249,0.05)_72%,rgba(248,250,249,0.03)_84%,rgba(248,250,249,0.18)_100%)]" />
              <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top_center,rgba(248,250,249,0.78)_0%,rgba(248,250,249,0.46)_26%,rgba(248,250,249,0.11)_50%,rgba(248,250,249,0.02)_72%,transparent_88%)]" />
              <div className="absolute inset-0 rounded-[2rem] bg-[linear-gradient(90deg,rgba(248,250,249,0.36)_0%,rgba(248,250,249,0.08)_16%,rgba(248,250,249,0.01)_50%,rgba(248,250,249,0.08)_84%,rgba(248,250,249,0.36)_100%)]" />
              <div className="absolute inset-x-0 top-0 h-[26rem] bg-[linear-gradient(180deg,rgba(248,250,249,0.78)_0%,rgba(248,250,249,0.42)_52%,rgba(248,250,249,0.03)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(180deg,rgba(248,250,249,0)_0%,rgba(248,250,249,0.42)_100%)]" />
            </div>
          </div>
          <div className="absolute inset-0 z-[12] pointer-events-none hidden md:block">
            <div className="absolute left-[6%] bottom-[11%] w-52 rounded-2xl border border-surface-container-highest bg-white/98 p-4 shadow-[0_28px_60px_rgba(15,23,18,0.18)] backdrop-blur-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">ATS Score</span>
                  <span className="text-sm font-black text-primary-landing">98%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-low">
                  <div className="h-full rounded-full" style={{ width: '98%', backgroundImage: 'var(--signature-gradient)' }} />
                </div>
              </div>
            </div>
            <div className="absolute left-[6%] bottom-[26%] w-44 rounded-2xl border border-surface-container-highest bg-white/98 p-4 shadow-[0_28px_60px_rgba(15,23,18,0.18)] backdrop-blur-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">More Callbacks</span>
                <p className="text-2xl font-black text-primary-landing leading-none">5×</p>
              </div>
            </div>
          </div>
          <div className="relative z-10 max-w-6xl mx-auto w-full text-center space-y-6 reveal-on-scroll active stagger-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-container/30 text-on-primary-container text-xs font-bold uppercase tracking-widest border border-primary-container/50">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <WandSparkles size={16} strokeWidth={2.5} className="opacity-90" />
              AI-Powered Career Revolution
            </div>
            <h1 className="font-extrabold tracking-tighter leading-none text-on-background max-w-5xl mx-auto text-5xl md:text-[5.5rem] lg:text-[6.5rem]">
              Build and tailor ATS-ready resumes.
              <br />
              <span className="text-[#008f44] italic">Land 5x more interviews.</span>
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              In this brutal job market, don&apos;t gamble with your career. One missed keyword could cost you the interview.
              <strong className="font-bold text-on-background"> Rezoomed</strong> helps you catch those gaps before you apply.
            </p>
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/auth/register">
                  <button className="px-10 py-4 text-white text-base font-black shadow-2xl btn-hover flex items-center shimmer-effect justify-center relative z-10 tracking-wider transition-all duration-300 rounded-full glow-on-hover bg-black hover:bg-[#00a84d] cursor-pointer">
                    GET STARTED FREE →
                  </button>
                </Link>
                <Link href="/ats-checker">
                  <button className="px-8 py-4 text-base font-bold rounded-full bg-[#008f44] text-white hover:bg-[#007a3a] transition-all duration-300 cursor-pointer">
                    Check ATS Score
                  </button>
                </Link>
              </div>
              <p className="text-sm text-on-surface-variant">No credit card · Free plan</p>
            </div>
          </div>
        </section>

        <LogoMarqueeSection />

        <LandingFeatures />

        <section className="relative overflow-hidden bg-white px-6 py-24">
          <div className="pointer-events-none absolute left-[10%] top-[-100px] h-[800px] w-[800px] rounded-full bg-[radial-gradient(circle,rgba(163,255,179,0.8)_0%,transparent_70%)] login-aurora" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[1000px] w-[1200px] rounded-full bg-[radial-gradient(circle,rgba(2,109,50,0.3)_0%,transparent_70%)] login-aurora-two" />
          <div className="pointer-events-none absolute right-[5%] bottom-[-50px] h-[700px] w-[700px] rounded-full bg-[radial-gradient(circle,rgba(123,211,252,0.6)_0%,transparent_70%)] login-aurora" style={{ animationDelay: '4s', animationDuration: '20s' }} />
          <div className="pointer-events-none absolute left-[40%] top-[20%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(220,255,120,0.7)_0%,transparent_70%)] login-aurora-two" style={{ animationDelay: '8s', animationDuration: '26s' }} />
          <div className="mx-auto max-w-5xl space-y-10 relative z-10">
            <div className="max-w-3xl space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#026d32]">End-to-End Resume Optimization</p>
              <h2 className="text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
                Why job seekers use Rezoomed for resume optimization
              </h2>
              <p className="text-base leading-8 text-zinc-600">
                Rezoomed combines ATS resume checks, job-match analysis, bullet rewrites, metadata cleanup, and resume exports
                in one workflow built for faster applications and stronger interview odds.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  title: 'ATS resume optimization',
                  body: 'Improve keyword coverage, section structure, parsing, and formatting before your resume reaches an applicant tracking system.',
                  href: '/ats-checker',
                },
                {
                  title: 'Job description matching',
                  body: 'See where your resume fits a job, what is missing, and how to tailor bullets and summaries around real role requirements.',
                  href: '/match-score',
                },
                {
                  title: 'Resume metadata cleanup',
                  body: 'Improve PDF title, author, keywords, and other hidden fields so your resume file looks more polished and searchable.',
                  href: '/metadata-enhancer',
                },
                {
                  title: 'AI resume builder workflow',
                  body: 'Build, edit, and export role-targeted resumes without switching across multiple tools or losing version control.',
                  href: '/resume-builder',
                },
                {
                  title: 'Resume tailoring workflow',
                  body: 'Tailor your resume to a real job description and focus edits on the sections that change fit most.',
                  href: '/resume-tailoring',
                },
                {
                  title: 'Cover letter generation',
                  body: 'Create a faster first draft from your resume and the target role when an application needs a tailored note.',
                  href: '/cover-letter-generator',
                },
                {
                  title: 'Resume strategy and job search advice',
                  body: 'Use the Rezoomed blog for resume tips, ATS guidance, and job-search playbooks that support your application strategy.',
                  href: '/blog',
                },
              ].map(item => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-[1.5rem] border border-zinc-100 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(243,247,244,0.92))] p-6 shadow-[0_14px_34px_rgba(18,24,21,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(18,24,21,0.08)]"
                >
                  <h3 className="text-xl font-black tracking-tight text-zinc-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-zinc-600">{item.body}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ───────────────────────────────────────────────── */}
        <section className="py-28 bg-[#f8faf9] overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center space-y-4 mb-16 reveal-on-scroll active">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#026d32]">User feedback</p>
              <h2 className="text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
                Feedback from early Rezoomed users.
              </h2>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
                Real feedback shared by users after uploads, ATS scans, and tailoring flows. We keep identity details lightweight on the public page for privacy.
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
                      ? 'bg-[#026d32] border border-[#026d32]'
                      : 'bg-white border border-zinc-100 shadow-sm'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                        t.featured ? 'bg-white/15 text-white/85' : 'bg-[#008f44]/10 text-[#026d32]'
                      }`}>
                        Early user
                      </span>
                    </div>
                    <p className={`text-base leading-7 ${t.featured ? 'text-white/90' : 'text-zinc-700'}`}>
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>
                  <div className={`flex items-center gap-3 pt-2 border-t ${t.featured ? 'border-white/20' : 'border-zinc-100'}`}>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${t.featured ? 'bg-white/20 text-white' : `bg-gradient-to-br ${t.color} text-zinc-800`}`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className={`text-sm font-black ${t.featured ? 'text-white' : 'text-zinc-900'}`}>{t.name}</p>
                      <p className={`text-xs ${t.featured ? 'text-white/60' : 'text-zinc-500'}`}>{t.role}</p>
                      <p className={`mt-1 text-[11px] ${t.featured ? 'text-white/70' : 'text-zinc-400'}`}>{t.proof}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f8faf9] px-6 py-24">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#026d32]">FAQ</p>
              <h2 className="text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
                Resume builder and ATS checker FAQs
              </h2>
            </div>

            <div className="space-y-4">
              {FAQS.map(faq => (
                <details
                  key={faq.question}
                  className="group rounded-[1.5rem] border border-zinc-100 bg-white p-6 shadow-[0_12px_30px_rgba(18,24,21,0.04)]"
                >
                  <summary className="cursor-pointer list-none text-lg font-black tracking-tight text-zinc-950">
                    {faq.question}
                  </summary>
                  <p className="mt-4 text-sm leading-7 text-zinc-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Footer ─────────────────────────────────────────────────── */}
        <section className="py-28 px-6 overflow-hidden relative bg-[linear-gradient(135deg,#022c14_0%,#026d32_50%,#019a47_100%)]">
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-3xl translate-x-1/3 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-white/10 blur-3xl -translate-x-1/3 translate-y-1/3" />
          </div>
          <div className="relative max-w-3xl mx-auto text-center space-y-8 reveal-on-scroll active">
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              Ready to get <em>hired faster?</em>
            </h2>
            <p className="text-lg text-white/75">
              Use Rezoomed to build stronger resumes, improve ATS fit, and get more callbacks.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/auth/register">
                <button className="px-10 py-4 bg-white text-[#026d32] text-base font-black rounded-full hover:bg-[#f0fdf4] transition-all shadow-xl cursor-pointer">
                  Start for free
                </button>
              </Link>
              <Link href="/ats-checker">
                <button className="px-10 py-4 bg-white/10 text-white text-base font-bold rounded-full border border-white/25 hover:bg-white/20 transition-all cursor-pointer">
                  Check my ATS score
                </button>
              </Link>
            </div>
            <p className="text-sm text-white/50">No credit card · Free plan</p>
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  )
}
