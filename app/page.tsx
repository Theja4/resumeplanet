import Link from 'next/link'
import { WandSparkles, FileUp, Lock, BadgeCheck, Quote } from 'lucide-react'

export default async function LandingPage() {
  return (
    <div className="bg-background-landing text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Navigation */}
        <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-white/70 backdrop-blur-xl dark:bg-zinc-900/70 shadow-[0_8px_24px_rgba(0,0,0,0.06)] font-['Plus_Jakarta_Sans'] tracking-tight">
          <div className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <span className="tracking-tighter">Rezoomed</span>
          </div>
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 group">
            <Link className="font-semibold border-b-2 pb-1 transition-all text-[#026d32] dark:text-[#A3FFB3] border-[#A3FFB3] group-hover:text-zinc-500 group-hover:border-transparent hover:!text-[#026d32] dark:hover:!text-[#A3FFB3] hover:!border-[#A3FFB3]" href="#">Home</Link>
            <Link className="font-semibold border-b-2 pb-1 transition-all text-zinc-500 dark:text-zinc-400 border-transparent hover:!text-[#026d32] dark:hover:!text-[#A3FFB3] hover:!border-[#A3FFB3]" href="#features">Features</Link>
            <Link className="font-semibold border-b-2 pb-1 transition-all text-zinc-500 dark:text-zinc-400 border-transparent hover:!text-[#026d32] dark:hover:!text-[#A3FFB3] hover:!border-[#A3FFB3]" href="/blog">Blog</Link>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm font-bold text-zinc-500 hover:text-white hover:bg-black transition-all px-6 py-2 border-2 border-transparent rounded-full cursor-pointer">Sign In</button>
            <Link href="/dashboard" className="text-sm font-bold text-primary-landing border-2 border-primary-container bg-primary-container/10 px-6 py-2 rounded-full hover:bg-primary-container/20 transition-all">Sign Up</Link>
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
                    <div className="h-full bg-primary-landing w-[98%]"></div>
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
              <h1 className="font-extrabold tracking-tighter leading-none text-on-background max-w-5xl mx-auto text-6xl md:text-[6.5rem] lg:text-[7.5rem]">The job market is <span className="text-[#008f44]">ruthless</span>. Don't let one keyword <span className="text-[#008f44]">cost you the interview</span>.</h1>
              <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                Rezoomed uses optic precision to analyze and amplify your career milestones. Stand out with AI-driven clarity and premium design.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-2">
                <Link href="/dashboard">
                  <button className="px-12 py-5 text-white text-lg font-black shadow-2xl btn-hover flex items-center shimmer-effect justify-center relative z-10 tracking-wider transition-all duration-300 rounded-full glow-on-hover bg-black hover:bg-[#00a84d] cursor-pointer">GET STARTED NOW</button>
                </Link>
              </div>
            </div>
          </section>

          {/* Features Section (The Process) */}
          <section id="features" className="py-32 px-6 bg-surface-container-low overflow-hidden">
            <div className="max-w-7xl mx-auto">
              <div className="mb-20 space-y-4 reveal-on-scroll active">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary-landing">The Process</h2>
                <h3 className="text-5xl font-extrabold tracking-tight">Optic Precision in <span className="text-gradient">100+ Phases</span></h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* AI Optimization (Main Feature) */}
                <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-12 border border-surface-container-highest shadow-sm card-hover reveal-on-scroll active stagger-1 flex flex-col justify-between overflow-hidden relative group">
                  <div className="space-y-6 relative z-10">
                    <h4 className="text-3xl font-extrabold tracking-tight">AI Optimization <span className="text-on-surface-variant font-medium">(for job description)</span></h4>
                    <p className="text-on-surface-variant text-lg leading-relaxed max-w-md">Customize your resume to match job postings, increasing interview chances.</p>
                  </div>
                  <div className="mt-12 relative h-72 w-full bg-surface-container-low rounded-2xl overflow-hidden border border-surface-container-highest">
                    {/* Simulated Resume UI */}
                    <div className="p-8 space-y-4">
                      <div className="h-4 w-32 bg-zinc-800 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-2.5 w-full bg-zinc-200 rounded-full"></div>
                        <div className="h-2.5 w-5/6 bg-zinc-200 rounded-full"></div>
                      </div>
                      <div className="flex gap-2 py-4">
                        <div className="h-8 w-24 bg-primary-landing/20 rounded-lg flex items-center justify-center">
                          <div className="h-2 w-16 bg-primary-landing/40 rounded-full"></div>
                        </div>
                        <div className="h-8 w-24 bg-surface-container-high rounded-lg"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2.5 w-full bg-zinc-200 rounded-full"></div>
                        <div className="h-2.5 w-4/5 bg-zinc-200 rounded-full"></div>
                      </div>
                    </div>
                    {/* Scanning Line Animation */}
                    <div className="scanning-animation"></div>
                    <div className="absolute bottom-6 right-6">
                      <div className="bg-zinc-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                        TAILORED
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column for Secure Ingestion and Semantic Analysis */}
                <div className="lg:col-span-5 flex flex-col gap-8">
                  {/* Secure Ingestion */}
                  <div className="bg-white rounded-[2.5rem] p-8 border border-surface-container-highest shadow-sm card-hover reveal-on-scroll active stagger-2 flex flex-col relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="bg-surface-container-low/50 rounded-2xl p-6 mb-6 flex items-center justify-center h-40">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-2xl bg-primary-landing/10 flex items-center justify-center relative z-10 border border-primary-landing/20 ring-animation">
                            <FileUp className="text-[#80ba92]" size={36} strokeWidth={2.5} />
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-md shadow-md flex items-center justify-center border border-zinc-100 float-animation">
                            <Lock className="text-zinc-500" size={16} strokeWidth={2.5} />
                          </div>
                        </div>
                      </div>
                      <h4 className="text-2xl font-bold tracking-tight">Secure Ingestion</h4>
                      <p className="text-on-surface-variant text-sm mt-2">Upload your current resume with enterprise-grade privacy.</p>
                    </div>
                  </div>

                  {/* Semantic Analysis */}
                  <div className="bg-white rounded-[2.5rem] p-8 border border-surface-container-highest shadow-sm card-hover reveal-on-scroll active stagger-3 flex flex-col relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="bg-zinc-900 rounded-2xl p-6 mb-6 flex flex-col justify-center h-40 space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="h-2 w-16 bg-white/20 rounded-full"></div>
                          <div className="text-[10px] text-primary-landing font-bold">DETECTION: 98%</div>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-landing w-4/5 animate-[shimmer-flow_3s_infinite]"></div>
                        </div>
                        <div className="space-y-1.5 opacity-50">
                          <div className="h-1 w-2/3 bg-white/20 rounded-full"></div>
                          <div className="h-1 w-full bg-white/20 rounded-full"></div>
                        </div>
                      </div>
                      <h4 className="text-2xl font-bold tracking-tight">Semantic Analysis</h4>
                      <p className="text-on-surface-variant text-sm mt-2">Identify skill gaps and quantify achievements using deep learning models.</p>
                    </div>
                  </div>
                </div>

                {/* Curated Output */}
                <div className="lg:col-span-5 bg-white rounded-[2.5rem] p-8 border border-surface-container-highest shadow-sm card-hover reveal-on-scroll active stagger-4 flex flex-col relative overflow-hidden group">
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="bg-surface-container-low/50 rounded-2xl p-6 mb-6 flex items-center justify-center h-48">
                      <div className="w-32 h-40 bg-white rounded-lg shadow-xl border border-zinc-100 p-4 space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary-landing"></div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-100"></div>
                          <div className="h-1.5 w-12 bg-zinc-800 rounded-full"></div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-1 w-full bg-zinc-100 rounded-full"></div>
                          <div className="h-1 w-full bg-zinc-100 rounded-full"></div>
                          <div className="h-1 w-3/4 bg-zinc-100 rounded-full"></div>
                        </div>
                        <div className="pt-2 flex justify-end">
                          <BadgeCheck className="text-primary-landing animate-bounce" fill="currentColor" stroke="white" size={20} />
                        </div>
                      </div>
                    </div>
                    <h4 className="text-2xl font-bold tracking-tight">Curated Output</h4>
                    <p className="text-on-surface-variant text-sm mt-2">Receive a professionally formatted, ATS-optimized document ready for submission.</p>
                  </div>
                </div>

                {/* Professionally Proven Templates */}
                <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-8 lg:p-12 border border-surface-container-highest shadow-sm card-hover reveal-on-scroll active stagger-5 flex flex-col lg:flex-row items-center gap-12 relative overflow-hidden group">
                  <div className="flex-1 space-y-6">
                    <h4 className="text-3xl font-extrabold tracking-tight">Professionally Proven Templates</h4>
                    <p className="text-on-surface-variant text-lg">Swiss typography and layout principles that make your resume a joy to read.</p>
                    <div className="flex gap-4">
                      <div className="text-xs font-bold uppercase tracking-widest text-primary-landing py-3">10+ DESIGN VARIATIONS</div>
                    </div>
                  </div>
                  <div className="flex-1 relative h-64 w-full max-w-sm flex items-center justify-center">
                    <div className="absolute w-40 h-56 bg-zinc-900 rounded-xl shadow-2xl rotate-[-6deg] translate-x-[-20px] opacity-10 stack-animation"></div>
                    <div className="absolute w-40 h-56 bg-zinc-800 rounded-xl shadow-2xl rotate-[3deg] translate-x-[20px] opacity-20 stack-animation" style={{ animationDelay: '0.5s' }}></div>
                    <div className="relative w-40 h-56 bg-white rounded-xl shadow-2xl border border-zinc-100 p-4 space-y-3 z-10 stack-animation" style={{ animationDelay: '1s' }}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-zinc-100"></div>
                        <div className="space-y-1">
                          <div className="h-1.5 w-12 bg-zinc-800 rounded-full"></div>
                          <div className="h-1 w-8 bg-zinc-400 rounded-full"></div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-1 w-full bg-zinc-100 rounded-full"></div>
                        <div className="h-1 w-full bg-zinc-100 rounded-full"></div>
                        <div className="h-1 w-3/4 bg-zinc-100 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

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
                  <p className="text-lg font-medium italic text-on-surface">"Rezoomed didn't just fix my resume; they helped me understand my own worth. I landed a Senior Role within two weeks."</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-bold">Sarah Jenkins</p>
                      <p className="text-xs text-on-surface-variant">Senior Product Designer</p>
                    </div>
                  </div>
                </div>
                <div className="p-8 bg-surface-container-lowest border border-surface-container rounded-3xl space-y-6 flex flex-col justify-between shadow-sm card-hover reveal-on-scroll active stagger-2">
                  <Quote className="text-primary-landing rotate-180" fill="currentColor" stroke="none" size={36} />
                  <p className="text-lg font-medium italic text-on-surface">"The Optic AI identified achievements I hadn't even thought to include. The design is stunning and professional."</p>
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
                <Link href="/dashboard">
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
