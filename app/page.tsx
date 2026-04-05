import Link from 'next/link'
import Image from 'next/image'
import { WandSparkles } from 'lucide-react'
import FeatureShowcaseSection from '@/components/landing/FeatureShowcase'
import LogoMarqueeSection from '@/components/landing/LogoMarquee'

type Testimonial = {
  quote: string
  name: string
  role: string
  initials: string
  color: string
  featured: boolean
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "I applied to 8 companies and got 6 callbacks. The tailoring feature alone is worth it — it's like having a career coach on demand.",
    name: 'Priya Sharma',
    role: 'Data Scientist at Meta',
    initials: 'PS',
    color: 'from-[#dbeafe] to-[#93c5fd]',
    featured: true,
  },
  {
    quote: "The AI identified achievements I hadn't even thought to include. The ATS score jumped from 62% to 94% on my first try.",
    name: 'Marcus Kane',
    role: 'Marketing Director',
    initials: 'MK',
    color: 'from-[#ffe8bd] to-[#f5c87a]',
    featured: false,
  },
  {
    quote: "Rezoomed didn't just fix my resume — it helped me understand my own worth. I landed a Senior Role within two weeks.",
    name: 'Sarah Jenkins',
    role: 'Senior Product Designer',
    initials: 'SJ',
    color: 'from-[#A3FFB3] to-[#80da92]',
    featured: false,
  },
  {
    quote: "Switched from Jobscan. Night and day difference. Rezoomed actually shows you what to fix, not just a score.",
    name: "James O'Brien",
    role: 'Engineering Manager',
    initials: 'JO',
    color: 'from-[#fce7f3] to-[#f9a8d4]',
    featured: false,
  },
  {
    quote: "I was skeptical about AI resume tools, but Rezoomed surfaced keywords I'd never have thought to include. Got an offer 3 weeks later.",
    name: 'Aisha Thompson',
    role: 'UX Researcher at Spotify',
    initials: 'AT',
    color: 'from-[#d1fae5] to-[#6ee7b7]',
    featured: false,
  },
  {
    quote: "Applied to 12 roles, heard back from 9. My recruiter actually complimented my resume format — that's never happened before.",
    name: 'Daniel Park',
    role: 'Software Engineer at Stripe',
    initials: 'DP',
    color: 'from-[#ede9fe] to-[#c4b5fd]',
    featured: false,
  },
  {
    quote: "The tailor feature is insane. I paste a job description and it tells me exactly what's missing. Interviews went from 10% to 60% callback rate.",
    name: 'Leila Nasser',
    role: 'Product Manager at Shopify',
    initials: 'LN',
    color: 'from-[#fff7ed] to-[#fed7aa]',
    featured: false,
  },
  {
    quote: "I used three other tools before this. Rezoomed is the only one that felt like it actually understood what recruiters are looking for.",
    name: 'Ryan Okafor',
    role: 'Operations Lead at Airbnb',
    initials: 'RO',
    color: 'from-[#fef9c3] to-[#fde047]',
    featured: false,
  },
]

export default async function LandingPage() {
  return (
    <div className="bg-background-landing text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-white/70 backdrop-blur-xl dark:bg-zinc-900/70 shadow-[0_8px_24px_rgba(0,0,0,0.06)] font-['Plus_Jakarta_Sans'] tracking-tight">
        <div className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <span className="tracking-tighter">Rezoomed</span>
        </div>
        <div className="pointer-events-none hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 group">
          <Link className="pointer-events-auto font-semibold border-b-2 pb-1 transition-all text-[#026d32] dark:text-[#A3FFB3] border-[#A3FFB3] group-hover:text-zinc-500 group-hover:border-transparent hover:!text-[#026d32] dark:hover:!text-[#A3FFB3] hover:!border-[#A3FFB3]" href="#">Home</Link>
          <Link className="pointer-events-auto font-semibold border-b-2 pb-1 transition-all text-zinc-500 dark:text-zinc-400 border-transparent hover:!text-[#026d32] dark:hover:!text-[#A3FFB3] hover:!border-[#A3FFB3]" href="#features">Features</Link>
          <Link className="pointer-events-auto font-semibold border-b-2 pb-1 transition-all text-zinc-500 dark:text-zinc-400 border-transparent hover:!text-[#026d32] dark:hover:!text-[#A3FFB3] hover:!border-[#A3FFB3]" href="/blog">Blog</Link>
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <Link
            href="/auth/login"
            className="inline-flex cursor-pointer items-center justify-center text-sm font-bold text-zinc-500 hover:text-white hover:bg-black transition-all px-6 py-2 border-2 border-transparent rounded-full"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center text-sm font-bold text-primary-landing border-2 border-primary-container bg-primary-container/10 px-6 py-2 rounded-full hover:bg-primary-container/20 transition-all"
          >
            Sign Up Free →
          </Link>
        </div>
      </nav>

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
            <div className="absolute right-[8%] bottom-[15%] flex items-center gap-3 ai-optimizing-float">
              <div className="ai-label whitespace-nowrap rounded-full bg-zinc-900 px-4 py-2 text-[10px] font-bold text-white flex items-center gap-2 shadow-[0_20px_40px_rgba(15,23,18,0.22)]">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>
                AI OPTIMIZING...
              </div>
            </div>
          </div>
          <div className="relative z-10 max-w-6xl mx-auto w-full text-center space-y-6 reveal-on-scroll active stagger-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-container/30 text-on-primary-container text-xs font-bold uppercase tracking-widest border border-primary-container/50">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <WandSparkles size={16} strokeWidth={2.5} className="opacity-90" />
              AI-Powered Career Revolution
            </div>
            <h1 className="font-extrabold tracking-tighter leading-none text-on-background max-w-5xl mx-auto text-6xl md:text-[6.5rem] lg:text-[7.5rem]">
              Build your resume.
              <br />
              <span className="text-[#008f44] italic">Land 5× more interviews.</span>
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              In this brutal job market, do not gamble with your career. Use
              industry-leading <strong className="font-bold text-on-background">Frontier AI</strong>{' '}
              models tuned by Rezoomed to land the interview.
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
              <p className="text-sm text-on-surface-variant">No credit card · Free plan · Cancel anytime</p>
            </div>
          </div>
        </section>

        <LogoMarqueeSection />

        <FeatureShowcaseSection />

        {/* ── Testimonials ───────────────────────────────────────────────── */}
        <section className="py-28 bg-[#f8faf9] overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center space-y-4 mb-16 reveal-on-scroll active">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#026d32]">What people say</p>
              <h2 className="text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
                Trusted by job seekers worldwide.
              </h2>
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
                    <div className="flex">
                      {[...Array(5)].map((_, j) => (
                        <span key={j} className="text-[#FFB800] text-sm">★</span>
                      ))}
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
                    </div>
                  </div>
                </div>
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
              Join 50,000+ professionals who use Rezoomed to get more callbacks.
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
            <p className="text-sm text-white/50">No credit card · Free plan · Cancel anytime</p>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="w-full py-12 px-8 border-t border-zinc-800/60 bg-[#0a0f0b]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-7xl mx-auto text-sm text-zinc-500 font-medium">
          <span className="font-black text-white text-xl tracking-tight">Rezoomed</span>
          <div className="flex items-center gap-8">
            <Link className="hover:text-white transition-colors" href="#">Privacy Policy</Link>
            <Link className="hover:text-white transition-colors" href="#">Terms of Service</Link>
            <Link className="hover:text-white transition-colors" href="/blog">Blog</Link>
          </div>
          <div>© 2026 Rezoomed. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
