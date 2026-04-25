'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, UploadCloud, Wand2, Send, CheckCircle2 } from 'lucide-react'

const E = 'cubic-bezier(0.22, 1, 0.36, 1)'

function Reveal({ children, delay = 0, className = '', from = 'bottom' }: {
  children: React.ReactNode; delay?: number; className?: string; from?: 'bottom' | 'left' | 'right'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect() } },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  const hide =
    from === 'left' ? 'translateX(-40px)' :
    from === 'right' ? 'translateX(40px)' :
    'translateY(36px)'
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: v ? 1 : 0,
        transform: v ? 'translate(0,0)' : hide,
        transition: `opacity 0.9s ${E} ${delay}ms, transform 0.9s ${E} ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

type Step = {
  n: string
  title: string
  copy: string
  mascot: string
  mascotAlt: string
  background: string
  Icon: typeof UploadCloud
  accentText: string
  mascotBlur: string
}

const STEPS: Step[] = [
  {
    n: '01',
    title: 'Drop your resume',
    copy: 'Upload any format — PDF, DOCX, LinkedIn export. We parse, structure, and score it instantly.',
    mascot: '/Brands/mascot-wave-cutout.png',
    mascotAlt: 'Friendly mascot waving',
    background: 'linear-gradient(145deg, #2770ff 0%, #1e4fe6 55%, #0a2ea8 100%)',
    Icon: UploadCloud,
    accentText: 'text-[#A3FFB3]',
    mascotBlur: '#7bd3fc',
  },
  {
    n: '02',
    title: 'Paste the job',
    copy: 'Drop in a JD. Our AI scans it for keywords, skills, and recruiter signals unique to that role.',
    mascot: '/Brands/mascot-magnify-pink.png',
    mascotAlt: 'Mascot inspecting resume with magnifier',
    background: 'linear-gradient(145deg, #ff66c4 0%, #ff3dc0 55%, #d81b93 100%)',
    Icon: Wand2,
    accentText: 'text-white',
    mascotBlur: '#ffffff',
  },
  {
    n: '03',
    title: 'Export & apply',
    copy: 'Recruiter-grade PDF in seconds. Clean metadata, ATS-friendly layout, and a tailored cover letter.',
    mascot: '/Brands/mascot-plane-cutout.png',
    mascotAlt: 'Mascot flying off with resume airplane',
    background: 'linear-gradient(145deg, #00a84d 0%, #019a47 55%, #022c14 100%)',
    Icon: Send,
    accentText: 'text-[#A3FFB3]',
    mascotBlur: '#A3FFB3',
  },
]

export default function LandingWorkflow() {
  return (
    <section className="relative overflow-hidden bg-white px-6 py-24 md:py-32">
      <div className="relative mx-auto max-w-7xl">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center mb-16 md:mb-20">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#00a84d]">Three steps</p>
            <h2 className="mt-3 text-4xl md:text-6xl font-black tracking-tighter leading-[1.06] text-zinc-950">
              From file to <span className="landing-italic-safe italic bg-gradient-to-r from-[#00a84d] to-[#026d32] bg-clip-text text-transparent">follow-up</span>
              <br />
              in under two minutes.
            </h2>
            <p className="mt-6 text-base md:text-lg text-zinc-600 leading-relaxed">
              No spreadsheets. No copy-paste chaos. Just a tiny bunny doing the heavy lifting.
            </p>
          </div>
        </Reveal>

        <div className="relative">
          {/* Connecting line */}
          <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-[#A3FFB3] to-transparent lg:block" />

          <div className="space-y-20 md:space-y-28">
            {STEPS.map((step, idx) => {
              const flip = idx % 2 === 1
              const { Icon } = step
              return (
                <div
                  key={step.n}
                  className={`grid items-center gap-10 md:gap-16 lg:grid-cols-2 ${flip ? 'lg:[&>*:first-child]:order-2' : ''}`}
                >
                  <Reveal from={flip ? 'right' : 'left'}>
                    <div
                      className="relative rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-[0_40px_100px_-30px_rgba(2,109,50,0.4)]"
                      style={{ background: step.background, minHeight: 420 }}
                    >
                      {/* Step number tag */}
                      <div className="relative z-10 inline-flex items-center gap-3">
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur text-2xl font-black text-white">
                          {step.n}
                        </span>
                        <Icon size={20} className={step.accentText} />
                      </div>

                      {/* Sparkle dots */}
                      <span className="absolute top-[14%] right-[10%] sparkle-twinkle text-white"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z"/></svg></span>
                      <span className="absolute top-[60%] right-[22%] sparkle-twinkle text-white" style={{ animationDelay: '0.8s' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z"/></svg></span>
                      <span className="absolute bottom-[12%] left-[8%] sparkle-twinkle text-white" style={{ animationDelay: '1.6s' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z"/></svg></span>

                      {/* Transparent mascot floats on the card background */}
                      <div className="relative mt-6 flex items-end justify-center">
                        <div className="relative w-[240px] md:w-[300px] lg:w-[340px]">
                          <div
                            className="absolute inset-12 rounded-full blur-md opacity-20"
                            style={{ background: step.mascotBlur }}
                          />
                          <div className="relative mascot-bob">
                            <Image
                              src={step.mascot}
                              alt={step.mascotAlt}
                              width={500}
                              height={500}
                              className="relative h-[300px] w-[300px] md:h-[370px] md:w-[370px] lg:h-[420px] lg:w-[420px] object-contain drop-shadow-[0_20px_34px_rgba(0,0,0,0.24)]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Reveal>

                  <Reveal from={flip ? 'left' : 'right'} delay={120}>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#00a84d]">
                        Step {step.n}
                      </p>
                      <h3 className="mt-3 text-3xl md:text-5xl font-black tracking-tighter leading-[1] text-zinc-950">
                        {step.title}
                      </h3>
                      <p className="mt-4 text-base md:text-lg text-zinc-600 leading-relaxed">
                        {step.copy}
                      </p>

                      <ul className="mt-6 space-y-2">
                        {idx === 0 && ['PDF / DOCX / LinkedIn', 'Keyword + format audit in 8s', 'Private — nothing shared'].map((t) => (
                          <li key={t} className="flex items-start gap-2 text-sm text-zinc-700">
                            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#00a84d]" />
                            <span className="font-medium">{t}</span>
                          </li>
                        ))}
                        {idx === 1 && ['Role-specific keywords', 'Bullet rewriting', 'Recruiter-tone polish'].map((t) => (
                          <li key={t} className="flex items-start gap-2 text-sm text-zinc-700">
                            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#00a84d]" />
                            <span className="font-medium">{t}</span>
                          </li>
                        ))}
                        {idx === 2 && ['ATS-clean export', 'Matching cover letter', 'Track what you sent'].map((t) => (
                          <li key={t} className="flex items-start gap-2 text-sm text-zinc-700">
                            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#00a84d]" />
                            <span className="font-medium">{t}</span>
                          </li>
                        ))}
                      </ul>

                      <Link href="/auth/register" className="mt-8 inline-flex items-center gap-2 text-sm font-black text-[#026d32] hover:text-[#00a84d]">
                        Try it now
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </Reveal>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
