import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight, UploadCloud, Wand2, Send, CheckCircle2, Sparkles } from 'lucide-react'

function Reveal({ children, delay = 0, className = '', from = 'bottom' }: {
  children: ReactNode; delay?: number; className?: string; from?: 'bottom' | 'left' | 'right'
}) {
  void delay
  void from
  return <div className={className}>{children}</div>
}

function StepNumber({ n, active }: { n: string; active: boolean }) {
  return (
    <div className="relative">
      <span
        className="wf-step-ring flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black text-white transition-all duration-700"
        style={{
          background: active
            ? 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 100%)'
            : 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          boxShadow: active
            ? '0 0 0 2px rgba(255,255,255,0.3), 0 12px 32px -8px rgba(0,0,0,0.2)'
            : '0 0 0 1px rgba(255,255,255,0.15)',
        }}
      >
        {n}
      </span>
      {active && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-lg">
          <span className="h-2.5 w-2.5 rounded-full bg-[#00a84d] animate-pulse" />
        </span>
      )}
    </div>
  )
}

type Step = {
  n: string
  title: string
  titleAccent: string
  copy: string
  mascot: string
  mascotAlt: string
  background: string
  Icon: typeof UploadCloud
  accentText: string
  mascotBlur: string
  bullets: string[]
  accentColor: string
}

const STEPS: Step[] = [
  {
    n: '01',
    title: 'Drop your',
    titleAccent: 'resume',
    copy: 'Upload any format — PDF, DOCX, LinkedIn export. We parse, structure, and score it instantly.',
    mascot: '/Brands/mascot-wave-cutout.png',
    mascotAlt: 'Friendly mascot waving',
    background: 'linear-gradient(145deg, #2770ff 0%, #1e4fe6 55%, #0a2ea8 100%)',
    Icon: UploadCloud,
    accentText: 'text-[#A3FFB3]',
    mascotBlur: '#7bd3fc',
    bullets: ['PDF / DOCX / LinkedIn', 'Keyword + format audit in 8s', 'Private — nothing shared'],
    accentColor: '#7bd3fc',
  },
  {
    n: '02',
    title: 'Paste the',
    titleAccent: 'job',
    copy: 'Drop in a JD. Our AI scans it for keywords, skills, and recruiter signals unique to that role.',
    mascot: '/Brands/mascot-magnify-pink.png',
    mascotAlt: 'Mascot inspecting resume with magnifier',
    background: 'linear-gradient(145deg, #ff66c4 0%, #ff3dc0 55%, #d81b93 100%)',
    Icon: Wand2,
    accentText: 'text-white',
    mascotBlur: '#ffffff',
    bullets: ['Role-specific keywords', 'Bullet rewriting', 'Recruiter-tone polish'],
    accentColor: '#ff66c4',
  },
  {
    n: '03',
    title: 'Export &',
    titleAccent: 'apply',
    copy: 'Recruiter-grade PDF in seconds. Clean metadata, ATS-friendly layout, and a tailored cover letter.',
    mascot: '/Brands/mascot-plane-blue.png',
    mascotAlt: 'Mascot flying off with resume airplane',
    background: 'linear-gradient(145deg, #00a84d 0%, #019a47 55%, #022c14 100%)',
    Icon: Send,
    accentText: 'text-[#A3FFB3]',
    mascotBlur: '#A3FFB3',
    bullets: ['ATS-clean export', 'Matching cover letter', 'Track what you sent'],
    accentColor: '#00a84d',
  },
]

export default function LandingWorkflow() {
  return (
    <section
      className="relative overflow-hidden px-6 py-24 md:py-28"
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #f8faf9 30%, #edf7f0 60%, #f8faf9 100%)',
      }}
    >
      {/* Ambient blurs */}
      <div
        className="pointer-events-none absolute -left-[15%] top-[10%] h-[500px] w-[500px] rounded-full blur-3xl opacity-[0.18]"
        style={{ background: 'radial-gradient(circle, rgba(163,255,179,0.6) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -right-[10%] top-[50%] h-[450px] w-[450px] rounded-full blur-3xl opacity-[0.14]"
        style={{ background: 'radial-gradient(circle, rgba(123,211,252,0.5) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute left-[30%] bottom-[5%] h-[400px] w-[400px] rounded-full blur-3xl opacity-[0.12]"
        style={{ background: 'radial-gradient(circle, rgba(255,102,196,0.4) 0%, transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-7xl">
        {/* ── Section header ───────────────────────────────────────── */}
        <Reveal>
          <div className="mx-auto max-w-3xl text-center mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#026d32]/15 bg-white/80 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#026d32] backdrop-blur shadow-[0_8px_24px_rgba(2,109,50,0.06)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00a84d] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00a84d]" />
              </span>
              Three steps
            </div>
            <h2 className="mt-5 text-4xl md:text-6xl font-black tracking-tighter leading-[1.06] text-zinc-950">
              From file to <span className="landing-italic-safe italic bg-gradient-to-r from-[#00a84d] to-[#026d32] bg-clip-text text-transparent">follow-up</span>
              <br />
              in under two minutes.
            </h2>
            <p className="mt-6 text-base md:text-lg text-zinc-600 leading-relaxed max-w-xl mx-auto">
              No spreadsheets. No copy-paste chaos. Just a tiny bunny doing the heavy lifting.
            </p>
          </div>
        </Reveal>

        {/* ── Timeline progress (desktop) ──────────────────────────── */}
        <div className="pointer-events-none absolute left-1/2 top-[280px] hidden h-[calc(100%-340px)] w-px -translate-x-1/2 lg:block">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-[#A3FFB3]/50 to-transparent" />
          <div
            className="absolute left-0 top-0 w-full bg-gradient-to-b from-[#00a84d] to-[#00a84d]/0 transition-all duration-1000 ease-out"
            style={{ height: '100%' }}
          />
        </div>

        {/* ── Steps ────────────────────────────────────────────────── */}
        <div className="space-y-16 md:space-y-20">
          {STEPS.map((step, idx) => {
            const flip = idx % 2 === 1
            const { Icon } = step
            const isActive = true

            return (
              <div
                key={step.n}
                data-step-card={idx}
                className={`grid items-center gap-10 md:gap-16 lg:grid-cols-2 ${flip ? 'lg:[&>*:first-child]:order-2' : ''}`}
              >
                {/* ── Mascot card ──────────────────────────────────── */}
                <Reveal from={flip ? 'right' : 'left'}>
                  <Link href="/auth/register" className="block cursor-pointer">
                    <div
                      className="wf-card group relative rounded-[2.5rem] p-8 md:p-12 overflow-hidden"
                      style={{
                        background: step.background,
                        minHeight: 320,
                      }}
                    >
                      {/* Shine sweep on hover */}
                      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                      {/* Inner glow ring */}
                      <div
                        className="pointer-events-none absolute left-1/2 top-[55%] h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 md:h-[400px] md:w-[400px]"
                        style={{
                          background: `radial-gradient(circle, ${step.mascotBlur} 0%, transparent 70%)`,
                        }}
                      />

                      {/* Grid pattern overlay */}
                      <div
                        className="pointer-events-none absolute inset-0 opacity-[0.06]"
                        style={{
                          backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
                          backgroundSize: '40px 40px',
                        }}
                      />

                      {/* Step number + icon badge */}
                      <div className="relative z-10 flex items-center gap-4">
                        <StepNumber n={step.n} active={isActive} />
                        <div className="flex items-center gap-2">
                          <Icon size={18} className={`${step.accentText} transition-transform duration-500 ${isActive ? 'scale-110' : ''}`} />
                          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/60">
                            Step {step.n}
                          </span>
                        </div>
                      </div>

                      {/* Sparkle dots */}
                      <span className="absolute top-[14%] right-[10%] sparkle-twinkle text-white/80">
                        <Sparkles size={18} />
                      </span>
                      <span className="absolute top-[55%] right-[18%] sparkle-twinkle text-white/60" style={{ animationDelay: '0.8s' }}>
                        <Sparkles size={12} />
                      </span>
                      <span className="absolute bottom-[15%] left-[8%] sparkle-twinkle text-white/50" style={{ animationDelay: '1.6s' }}>
                        <Sparkles size={14} />
                      </span>

                      {/* Mascot */}
                      <div className="relative z-10 mt-6 flex items-end justify-center">
                        <div className="relative w-[180px] sm:w-[240px] md:w-[300px] lg:w-[340px]">
                          <div
                            className="absolute inset-12 rounded-full blur-xl opacity-25"
                            style={{ background: step.mascotBlur }}
                          />
                          <div className="relative mascot-bob">
                            <Image
                              src={step.mascot}
                              alt={step.mascotAlt}
                              width={500}
                              height={500}
                              className="relative h-[220px] w-[220px] sm:h-[300px] sm:w-[300px] md:h-[370px] md:w-[370px] lg:h-[420px] lg:w-[420px] object-contain drop-shadow-[0_20px_34px_rgba(0,0,0,0.24)]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bottom bar */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/15 to-transparent" />
                    </div>
                  </Link>
                </Reveal>

                {/* ── Copy side ────────────────────────────────────── */}
                <Reveal from={flip ? 'left' : 'right'} delay={120}>
                  <div className="relative">
                    {/* Decorative accent line */}
                    <div
                      className="mb-6 h-1 w-12 rounded-full"
                      style={{ background: `linear-gradient(90deg, ${step.accentColor}, transparent)` }}
                    />

                    <h3 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-[1] text-zinc-950">
                      {step.title}
                      <br />
                      <span
                        className="landing-italic-safe italic"
                        style={{
                          background: `linear-gradient(135deg, ${step.accentColor} 0%, #026d32 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        {step.titleAccent}.
                      </span>
                    </h3>

                    <p className="mt-5 text-base md:text-lg text-zinc-600 leading-relaxed max-w-md">
                      {step.copy}
                    </p>

                    {/* Bullet list with stagger */}
                    <ul className="mt-7 space-y-3">
                      {step.bullets.map((t, i) => (
                        <li
                          key={t}
                          className="wf-bullet flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-[#A3FFB3] hover:shadow-[0_12px_28px_rgba(2,109,50,0.08)]"
                          style={{ animationDelay: `${i * 100}ms` }}
                        >
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                            style={{ background: `${step.accentColor}18` }}
                          >
                            <CheckCircle2 size={16} style={{ color: step.accentColor }} />
                          </span>
                          <span className="text-sm font-semibold text-zinc-800">{t}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/auth/register"
                      className="group mt-8 inline-flex items-center gap-2 rounded-full bg-black px-8 py-4 text-sm font-black text-white shadow-xl transition-all duration-300 hover:bg-zinc-900 hover:shadow-2xl hover:scale-105"
                    >
                      Try it now
                      <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </Reveal>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
