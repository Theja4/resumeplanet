import Link from 'next/link'
import Image from 'next/image'
import { WandSparkles, Quote, Star } from 'lucide-react'
import FeatureShowcaseSection from '@/components/landing/FeatureShowcase'
import LogoMarqueeSection from '@/components/landing/LogoMarquee'

const TESTIMONIALS = [
  {
    quote: "Rezoomed didn't just fix my resume — it helped me understand my own worth. I landed a Senior Role within two weeks.",
    name: 'Sarah Jenkins',
    role: 'Senior Product Designer',
    initials: 'SJ',
    color: 'from-[#A3FFB3] to-[#80da92]',
  },
  {
    quote: "The AI identified achievements I hadn't even thought to include. The ATS score jumped from 62% to 94% on my first try.",
    name: 'Marcus Kane',
    role: 'Marketing Director',
    initials: 'MK',
    color: 'from-[#ffe8bd] to-[#f5c87a]',
  },
  {
    quote: "I applied to 8 companies and got 6 callbacks. The tailoring feature alone is worth it — it's like having a career coach on demand.",
    name: 'Priya Sharma',
    role: 'Data Scientist at Meta',
    initials: 'PS',
    color: 'from-[#dbeafe] to-[#93c5fd]',
  },
  {
    quote: "Switched from Jobscan. Night and day difference. Rezoomed actually shows you what to fix, not just a score.",
    name: "James O'Brien",
    role: 'Engineering Manager',
    initials: 'JO',
    color: 'from-[#fce7f3] to-[#f9a8d4]',
  },
]

export default async function LandingPage() {
  return (
    <div className="bg-background-landing text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-white/80 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.06)] font-['Plus_Jakarta_Sans'] tracking-tight">
        <Link href="/" className="text-xl font-black text-zinc-900 tracking-tighter">
          Rezoomed
        </Link>

        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <Link className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors" href="#features">Features</Link>
          <Link className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors" href="/blog">Blog</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm font-bold text-zinc-700 hover:text-zinc-900 transition-colors px-4 py-2"
          >
            Log in
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center text-sm font-black text-white bg-[#026d32] px-5 py-2.5 rounded-full hover:bg-[#019040] transition-all shadow-sm shadow-[#026d32]/20"
          >
            Sign up free
          </Link>
        </div>
      </nav>

      <main className="pt-16">

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center pt-12 pb-20 px-6 bg-[#f8faf9] grid-bg">

          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(163,255,179,0.3)_0%,transparent_65%)]" />
          </div>

          {/* Hero copy */}
          <div className="relative z-10 max-w-5xl w-full text-center space-y-5 reveal-on-scroll active">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#026d32]/10 text-[#026d32] text-[11px] font-black uppercase tracking-[0.18em] border border-[#026d32]/20">
              <WandSparkles size={13} strokeWidth={2.5} />
              AI Resume Optimizer
            </div>

            <h1 className="font-black tracking-tighter leading-[1.02] text-zinc-950 text-5xl md:text-6xl lg:text-[5.5rem]">
              Build your resume.<br />
              <span className="text-[#026d32]">Land 5× more interviews.</span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
              Rezoomed scans your resume against any job description, surfaces missing keywords in seconds, and gives you an ATS score before you apply.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <Link href="/auth/register">
                <button className="px-8 py-4 text-white text-base font-black bg-[#026d32] rounded-full hover:bg-[#019040] transition-all shadow-lg shadow-[#026d32]/25 cursor-pointer">
                  Sign Up — It&apos;s Free
                </button>
              </Link>
              <Link href="/ats-checker">
                <button className="px-8 py-4 text-zinc-800 text-base font-bold bg-white rounded-full border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-all cursor-pointer">
                  Free ATS Score →
                </button>
              </Link>
            </div>

            <p className="text-xs text-zinc-400 font-medium">No credit card required · Free plan forever</p>
          </div>

          {/* Product screenshot */}
          <div className="relative z-10 mt-14 w-full max-w-[72rem] reveal-on-scroll active stagger-2">
            {/* macOS window */}
            <div className="rounded-xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.08)]">
              {/* Title bar */}
              <div className="flex items-center gap-0 bg-[#ECECEC] border-b border-[#D0D0D0] px-4 py-2.5">
                {/* Traffic lights */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="h-3 w-3 rounded-full bg-[#FF5F57] border border-[#E0443E]" />
                  <span className="h-3 w-3 rounded-full bg-[#FEBC2E] border border-[#D4A017]" />
                  <span className="h-3 w-3 rounded-full bg-[#28C840] border border-[#1DAD2D]" />
                </div>
                {/* URL bar */}
                <div className="flex-1 flex justify-center px-16">
                  <div className="flex items-center gap-2 bg-white border border-[#C8C8C8] rounded-md px-3 py-1 w-72 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]">
                    <svg width="10" height="12" viewBox="0 0 10 12" fill="none" className="shrink-0 text-zinc-400">
                      <rect x="1" y="5" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M3 5V3.5a2 2 0 114 0V5" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                    <span className="text-[11px] text-zinc-500 font-medium truncate">app.rezoomed.com/dashboard/builder</span>
                  </div>
                </div>
              </div>
              {/* Screenshot — let it drive the height naturally */}
              <Image
                src="/product-hero-v2.png"
                alt="Rezoomed Tailor mode — resume editor with AI insights panel"
                width={1024}
                height={530}
                className="w-full h-auto block"
                priority
              />
            </div>
          </div>

        </section>

        <LogoMarqueeSection />

        <FeatureShowcaseSection />

        {/* ── Testimonials ───────────────────────────────────────────────── */}
        <section className="py-28 px-6 bg-[#f8faf9]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-4 mb-16 reveal-on-scroll active">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#026d32]">What people say</p>
              <h2 className="text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
                Trusted by job seekers worldwide.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <div
                  key={t.name}
                  className={`p-8 bg-white rounded-3xl border border-zinc-100 shadow-sm space-y-6 flex flex-col justify-between card-hover reveal-on-scroll active stagger-${i + 1}`}
                >
                  <div className="space-y-4">
                    <div className="flex">
                      {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="#FFB800" stroke="none" />)}
                    </div>
                    <p className="text-base leading-7 text-zinc-700">&ldquo;{t.quote}&rdquo;</p>
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-zinc-100">
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-[11px] font-black text-zinc-800 shrink-0`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-black text-zinc-900">{t.name}</p>
                      <p className="text-xs text-zinc-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Footer ─────────────────────────────────────────────────── */}
        <section className="py-28 px-6 bg-[#026d32] overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-3xl translate-x-1/3 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-white/10 blur-3xl -translate-x-1/3 translate-y-1/3" />
          </div>
          <div className="relative max-w-3xl mx-auto text-center space-y-8 reveal-on-scroll active">
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              Ready to get hired faster?
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
      <footer className="w-full py-12 px-8 border-t border-zinc-800 bg-zinc-950">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-7xl mx-auto text-sm text-zinc-500 font-medium">
          <span className="font-black text-white text-lg">Rezoomed</span>
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
