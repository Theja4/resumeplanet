import Link from 'next/link'
import { WandSparkles, Quote } from 'lucide-react'
import FeatureShowcaseSection from '@/components/landing/FeatureShowcase'
import LogoMarqueeSection from '@/components/landing/LogoMarquee'

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
              Sign Up
            </Link>
          </div>
        </nav>

        <main className="pt-16">
          {/* Hero Section */}
          <section className="relative min-h-[90vh] flex flex-col items-center justify-start pt-16 pb-24 px-6 overflow-hidden grid-bg gradient-glow-hero">
            <div className="absolute inset-0 z-0 flex justify-center items-center pointer-events-none fade-mask">
              <div className="hero-resume-animation relative w-full max-w-7xl aspect-[16/9] translate-y-16 bg-white rounded-2xl shadow-2xl border border-surface-container-highest p-12 opacity-100">
                <div className="space-y-6">
                  <div className="flex justify-between">
                    <div className="h-6 w-32 bg-surface-container-highest rounded"></div>
                    <div className="h-10 w-10 bg-surface-container-high rounded-full"></div>
                  </div>
                  <div className="h-4 w-full bg-surface-container-low rounded"></div>
                  <div className="h-4 w-5/6 bg-surface-container-low rounded"></div>
                  <div className="pt-8 space-y-4">
                    <div className="h-5 w-24 bg-primary-landing/20 rounded"></div>
                    <div className="h-3 w-full bg-surface-container-low rounded"></div>
                    <div className="h-3 w-full bg-surface-container-low rounded"></div>
                  </div>
                </div>
                {/* Restored ATS Compatibility Card */}
                <div className="absolute -right-8 top-[38%] w-48 bg-white rounded-xl shadow-xl border border-surface-container-highest p-4 space-y-3 z-30">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">ATS Score</span>
                    <span className="text-primary-landing font-black text-sm">98%</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: '98%',
                        backgroundImage: 'var(--signature-gradient)',
                      }}
                    />
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <div className="h-3 w-10 bg-primary-landing/10 rounded"></div>
                    <div className="h-3 w-12 bg-primary-landing/10 rounded"></div>
                    <div className="h-3 w-8 bg-primary-landing/10 rounded"></div>
                  </div>
                </div>
                {/* Restored AI Pointer Animation */}
                <div className="absolute z-40 right-[15%] top-[48%] ai-optimizing-float flex items-center gap-3 pointer-events-none">
                  <div className="bg-zinc-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-2 whitespace-nowrap ai-label">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    AI OPTIMIZING...
                  </div>
                </div>
              </div>
            </div>
            <div className="relative z-10 max-w-6xl mx-auto w-full text-center space-y-6 reveal-on-scroll active stagger-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-container/30 text-on-primary-container text-xs font-bold uppercase tracking-widest border border-primary-container/50">
                <WandSparkles size={16} strokeWidth={2.5} className="opacity-90" />
                AI-Powered Career Revolution
              </div>
              <h1 className="font-extrabold tracking-tighter leading-none text-on-background max-w-5xl mx-auto text-6xl md:text-[6.5rem] lg:text-[7.5rem]">The job market is <span className="text-[#008f44]">ruthless</span>. Don&apos;t let one keyword <span className="text-[#008f44]">cost you the interview</span>.</h1>
              <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                Rezoomed uses optic precision to analyze and amplify your career milestones. Stand out with AI-driven clarity and premium design.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-2">
                <Link href="/auth/register">
                  <button className="px-12 py-5 text-white text-lg font-black shadow-2xl btn-hover flex items-center shimmer-effect justify-center relative z-10 tracking-wider transition-all duration-300 rounded-full glow-on-hover bg-black hover:bg-[#00a84d] cursor-pointer">GET STARTED NOW</button>
                </Link>
              </div>
            </div>
          </section>

          <LogoMarqueeSection />

          <FeatureShowcaseSection />

          {/* Testimonials */}
          <section className="py-32 px-6 overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20">
              <div className="lg:w-1/3 space-y-6 reveal-on-scroll active">
                <h2 className="text-5xl font-extrabold tracking-tight leading-tight">Trusted by <span className="text-gradient">Innovators</span> worldwide.</h2>
                <p className="text-on-surface-variant text-lg">See how our curated approach has transformed careers across top-tier tech and creative agencies.</p>
                <div className="flex items-center gap-4 pt-4">
                  <span className="text-sm font-bold text-on-surface-variant">50,000+ Success Stories</span>
                </div>
              </div>
              <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-surface-container-low rounded-3xl space-y-6 flex flex-col justify-between card-hover reveal-on-scroll active stagger-1">
                  <Quote className="text-primary-landing rotate-180" fill="currentColor" stroke="none" size={36} />
                  <p className="text-lg font-medium italic text-on-surface">&ldquo;Rezoomed didn&apos;t just fix my resume; they helped me understand my own worth. I landed a Senior Role within two weeks.&rdquo;</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-bold">Sarah Jenkins</p>
                      <p className="text-xs text-on-surface-variant">Senior Product Designer</p>
                    </div>
                  </div>
                </div>
                <div className="p-8 bg-surface-container-lowest border border-surface-container rounded-3xl space-y-6 flex flex-col justify-between shadow-sm card-hover reveal-on-scroll active stagger-2">
                  <Quote className="text-primary-landing rotate-180" fill="currentColor" stroke="none" size={36} />
                  <p className="text-lg font-medium italic text-on-surface">&ldquo;The Optic AI identified achievements I hadn&apos;t even thought to include. The design is stunning and professional.&rdquo;</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-bold">Marcus Kane</p>
                      <p className="text-xs text-on-surface-variant">Marketing Director</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>          {/* CTA Footer */}
          <section className="py-24 px-6 bg-primary-container/10">
            <div className="max-w-4xl mx-auto text-center space-y-8 reveal-on-scroll active">
              <h2 className="text-5xl font-extrabold tracking-tight">Ready to rezoom your career?</h2>
              <p className="text-xl text-on-surface-variant">Join 50,000+ professionals who have found their dream roles.</p>
              <div className="flex justify-center">
                <Link href="/auth/register">
                  <button className="px-12 py-5 text-white text-lg font-black shadow-2xl btn-hover flex items-center shimmer-effect justify-center relative z-10 tracking-wider transition-all duration-300 rounded-full glow-on-hover bg-black hover:bg-[#00a84d] cursor-pointer uppercase">GET STARTED NOW</button>
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="w-full py-12 px-8 mt-10 border-t border-zinc-100 dark:border-zinc-800 bg-[#f8f9fa] dark:bg-zinc-950">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-7xl mx-auto text-sm text-zinc-500 font-semibold">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-zinc-600 text-lg">Rezoomed</span>
            </div>
            <div className="flex items-center gap-8 text-zinc-400">
              <Link className="hover:text-zinc-700 transition-colors" href="#">Privacy Policy</Link>
              <Link className="hover:text-zinc-700 transition-colors" href="#">Terms of Service</Link>
              <Link className="hover:text-zinc-700 transition-colors" href="#">Security</Link>
              <Link className="hover:text-zinc-700 transition-colors" href="#">Status</Link>
            </div>
            <div className="text-zinc-400 font-medium">
              © 2024 Rezoomed AI. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
  )
}
