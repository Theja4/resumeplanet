'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ArrowUpRight, CheckCircle2, Zap, Target, FileSearch, Send, Layers,
} from 'lucide-react'

const E = 'cubic-bezier(0.22, 1, 0.36, 1)'

function Reveal({
  children, delay = 0, className = '', from = 'bottom',
}: {
  children: ReactNode
  delay?: number
  className?: string
  from?: 'bottom' | 'left' | 'right' | 'scale'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const hidden =
    from === 'bottom' ? 'translateY(40px) scale(0.98)' :
    from === 'left'   ? 'translateX(-40px) scale(0.98)' :
    from === 'right'  ? 'translateX(40px) scale(0.98)' :
    'scale(0.92)'

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate(0,0) scale(1)' : hidden,
        transition: `opacity 0.9s ${E} ${delay}ms, transform 0.9s ${E} ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}

export default function LandingBento() {
  return (
    <section id="features" className="relative overflow-hidden bg-white px-6 py-24 md:py-32">
      {/* Soft ambient washes */}
      <div className="pointer-events-none absolute left-[-10%] top-[20%] h-[420px] w-[420px] rounded-full blur-3xl opacity-[0.18]"
        style={{ background: 'radial-gradient(circle, rgba(163,255,179,0.55) 0%, transparent 70%)' }} />
      <div className="pointer-events-none absolute right-[-10%] top-[60%] h-[420px] w-[420px] rounded-full blur-3xl opacity-[0.16]"
        style={{ background: 'radial-gradient(circle, rgba(123,211,252,0.5) 0%, transparent 70%)' }} />

      <div className="relative mx-auto max-w-7xl">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center mb-16 md:mb-20">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#00a84d]">
              Everything job seekers need
            </p>
            <h2 className="mt-3 text-4xl md:text-6xl font-black tracking-tighter leading-[1.06] text-zinc-950">
              One powerful toolkit.
              <br />
              <span className="landing-italic-safe bg-gradient-to-r from-[#00a84d] via-[#026d32] to-[#019a47] bg-clip-text text-transparent italic gradient-shift">
                Infinite unfair advantage.
              </span>
            </h2>
            <p className="mt-6 text-base md:text-lg text-zinc-600 leading-relaxed">
              Every feature is designed to move you from &ldquo;submitted&rdquo; to &ldquo;scheduled&rdquo; faster.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-5 md:gap-6 grid-cols-1 md:grid-cols-6 auto-rows-[minmax(260px,auto)]">
          {/* Card 1: ATS Scanner — large, pink */}
          <Reveal className="md:col-span-3 md:row-span-2" from="left">
            <Link
              href="/ats-checker"
              className="mascot-card group block h-full p-8 md:p-10"
              style={{
                background: 'linear-gradient(145deg, #ff66c4 0%, #ff3dc0 55%, #d81b93 100%)',
              }}
            >
              <div className="relative flex h-full flex-col justify-between min-h-[480px]">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur">
                    <FileSearch size={12} />
                    ATS Scanner
                  </div>
                  <h3 className="mt-5 text-3xl md:text-4xl font-black tracking-tight leading-[1.05] text-white">
                    X-ray your resume<br />before recruiters do.
                  </h3>
                  <p className="mt-4 max-w-sm text-sm md:text-base leading-7 text-white/85">
                    Spot parsing traps, keyword gaps, and silent formatting killers. Fix before you apply.
                  </p>
                </div>

                <div className="relative flex-1 mt-6 flex items-end justify-center">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[95%] w-[75%] rounded-2xl border-2 border-dashed border-white/30" />
                  <div className="relative mascot-bob">
                    <div className="absolute left-1/2 top-1/2 h-[68%] w-[68%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-md opacity-25 pointer-events-none"
                      style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)' }} />
                    <Image
                      src="/Brands/mascot-magnify-pink.png"
                      alt="ATS scanner mascot"
                      width={500}
                      height={500}
                      className="relative h-[310px] w-[310px] md:h-[360px] md:w-[360px] lg:h-[400px] lg:w-[400px] object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.22)]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-white">
                  <span className="text-sm font-bold">Scan now</span>
                  <ArrowUpRight size={22} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </div>
            </Link>
          </Reveal>

          {/* Card 2: Match Score — top right, white bento */}
          <Reveal className="md:col-span-3" delay={80} from="right">
            <Link
              href="/match-score"
              className="mascot-card group block h-full p-7 md:p-8 bg-white border border-zinc-100 relative"
            >
              <div className="relative flex items-center gap-5 h-full">
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#A3FFB3]/40 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#026d32]">
                    <Target size={12} />
                    Match Score
                  </div>
                  <h3 className="mt-4 text-2xl md:text-3xl font-black tracking-tight leading-[1.05] text-zinc-950">
                    Paste a JD.<br />
                    <span className="text-[#00a84d]">Know your shot.</span>
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">
                    Real-time keyword coverage, gap analysis, and rewrite suggestions.
                  </p>

                  {/* Mini progress bars */}
                  <div className="mt-4 space-y-2">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                        <span>Keywords</span><span className="text-[#026d32]">94%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                        <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-[#A3FFB3] to-[#00a84d] gradient-shift" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                        <span>Skills</span><span className="text-[#026d32]">88%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                        <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-[#A3FFB3] to-[#00a84d] gradient-shift" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative w-[190px] md:w-[220px] shrink-0">
                  <div className="absolute inset-8 rounded-full blur-md opacity-20 bg-[#7bd3fc]" />
                  <div className="relative mascot-bob-reverse">
                    <Image
                      src="/Brands/mascot-papers-blue.png"
                      alt="Match score mascot"
                      width={320}
                      height={320}
                      className="relative h-[190px] w-[190px] md:h-[220px] md:w-[220px] object-contain drop-shadow-[0_12px_22px_rgba(39,112,255,0.22)]"
                    />
                  </div>
                </div>
              </div>
            </Link>
          </Reveal>

          {/* Card 3: Resume Builder — right, blue gradient */}
          <Reveal className="md:col-span-3" delay={160} from="right">
            <Link
              href="/resume-builder"
              className="mascot-card group block h-full p-7 md:p-8 relative"
              style={{
                background: 'linear-gradient(145deg, #2770ff 0%, #1e4fe6 55%, #0a2ea8 100%)',
              }}
            >
              <div className="relative flex items-center gap-5 h-full">
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur">
                    <Layers size={12} />
                    Resume Builder
                  </div>
                  <h3 className="mt-4 text-2xl md:text-3xl font-black tracking-tight leading-[1.05] text-white">
                    Type. We format.<br />
                    <span className="text-[#A3FFB3]">Export ready.</span>
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/80">
                    Live preview, recruiter-grade PDF, version history — no wrestling with Word.
                  </p>
                </div>

                <div className="relative w-[180px] md:w-[210px] shrink-0">
                  <div className="absolute inset-8 rounded-full blur-md opacity-20 bg-[#A3FFB3]" />
                  <div className="relative mascot-bob">
                    <Image
                      src="/Brands/mascot-wave-cutout.png"
                      alt="Resume builder mascot"
                      width={320}
                      height={320}
                      className="relative h-[180px] w-[180px] md:h-[210px] md:w-[210px] object-contain drop-shadow-[0_14px_24px_rgba(0,0,0,0.22)]"
                    />
                  </div>
                </div>
              </div>
            </Link>
          </Reveal>

          {/* Card 4: Tailor — wide, dark green */}
          <Reveal className="md:col-span-4" delay={80} from="left">
            <Link
              href="/resume-tailoring"
              className="mascot-card group block h-full p-7 md:p-8 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #022c14 0%, #026d32 55%, #019a47 100%)',
              }}
            >
              <div className="relative grid h-full grid-cols-[1fr_auto] items-center gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur">
                    <Zap size={12} />
                    Resume Tailoring
                  </div>
                  <h3 className="mt-4 text-2xl md:text-3xl font-black tracking-tight leading-[1.05] text-white">
                    One click, custom resume.<br />
                    <span className="landing-italic-safe text-[#A3FFB3] italic">Every. Single. Job.</span>
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['Bullets rewritten', 'Keywords matched', 'Summary polished', 'Skills reordered'].map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white/90 backdrop-blur">
                        <CheckCircle2 size={10} className="text-[#A3FFB3]" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="relative w-[210px] md:w-[250px] lg:w-[290px] shrink-0">
                  <div className="absolute inset-12 rounded-full blur-md opacity-20 bg-[#A3FFB3]" />
                  <div className="relative mascot-bob">
                    <Image
                      src="/Brands/mascot-hero-pink.png"
                      alt="Tailoring hero mascot"
                      width={400}
                      height={400}
                      className="relative h-[210px] w-[210px] md:h-[250px] md:w-[250px] lg:h-[290px] lg:w-[290px] object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.24)]"
                    />
                  </div>
                </div>
              </div>
            </Link>
          </Reveal>

          {/* Card 5: Cover letter — narrow, white */}
          <Reveal className="md:col-span-2" delay={160} from="right">
            <Link
              href="/cover-letter-generator"
              className="mascot-card group block h-full p-7 bg-white border border-zinc-100 relative"
            >
              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#7bd3fc]/25 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#0a2ea8]">
                    <Send size={12} />
                    Cover Letter
                  </div>
                  <h3 className="mt-3 text-xl md:text-2xl font-black tracking-tight leading-[1.1] text-zinc-950">
                    First drafts, lifted off the ground.
                  </h3>
                </div>
                <div className="relative mt-4 flex items-end justify-end">
                  <div className="relative w-[190px] md:w-[215px] mascot-bob-reverse">
                    <div className="absolute inset-8 rounded-full blur-md opacity-20 bg-[#7bd3fc]" />
                    <Image
                      src="/Brands/mascot-plane-cutout.png"
                      alt="Cover letter mascot"
                      width={320}
                      height={320}
                      className="relative h-[190px] w-[190px] md:h-[215px] md:w-[215px] object-contain drop-shadow-[0_12px_22px_rgba(39,112,255,0.24)]"
                    />
                  </div>
                </div>
              </div>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
