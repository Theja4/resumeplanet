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
      {/* Soft ambient orbs */}
      <div className="pointer-events-none absolute left-[-10%] top-[20%] h-[500px] w-[500px] rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(circle, #A3FFB3 0%, transparent 70%)' }} />
      <div className="pointer-events-none absolute right-[-10%] top-[60%] h-[500px] w-[500px] rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, #7bd3fc 0%, transparent 70%)' }} />

      <div className="relative mx-auto max-w-7xl">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center mb-16 md:mb-20">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#00a84d]">
              Everything job seekers need
            </p>
            <h2 className="mt-3 text-4xl md:text-6xl font-black tracking-tighter leading-[0.98] text-zinc-950">
              One playful toolkit.
              <br />
              <span className="bg-gradient-to-r from-[#00a84d] via-[#026d32] to-[#019a47] bg-clip-text text-transparent italic gradient-shift">
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
                    <div
                      className="relative h-[260px] w-[260px] md:h-[300px] md:w-[300px] lg:h-[340px] lg:w-[340px] overflow-hidden rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(216,27,147,0.6)]"
                      style={{
                        background:
                          'radial-gradient(circle at 30% 20%, #ff8acc 0%, #ff3dc0 50%, #d81b93 100%)',
                      }}
                    >
                      {/* Subtle scanning line on top */}
                      <span className="scan-pulse" style={{ background: 'linear-gradient(90deg, transparent, #fff, #A3FFB3, #fff, transparent)' }} />
                      <Image
                        src="/Brands/mascot-magnify-pink.png"
                        alt="ATS scanner mascot"
                        width={500}
                        height={500}
                        className="absolute inset-0 h-full w-full object-cover scale-[1.05]"
                      />
                    </div>
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

                <div className="relative w-[140px] md:w-[170px] shrink-0">
                  <div className="absolute -inset-3 rounded-full blur-2xl opacity-60 bg-[#7bd3fc]" />
                  <div className="relative mascot-bob-reverse">
                    <div
                      className="relative h-[140px] w-[140px] md:h-[170px] md:w-[170px] overflow-hidden rounded-3xl shadow-[0_18px_36px_-10px_rgba(39,112,255,0.4)]"
                      style={{
                        background:
                          'radial-gradient(circle at 30% 20%, #5fa3ff 0%, #2770ff 55%, #0a2ea8 100%)',
                      }}
                    >
                      <Image
                        src="/Brands/mascot-papers-blue.png"
                        alt="Match score mascot"
                        width={320}
                        height={320}
                        className="absolute inset-0 h-full w-full object-cover scale-[1.05]"
                      />
                    </div>
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

                <div className="relative w-[140px] md:w-[160px] shrink-0">
                  <div className="relative mascot-bob">
                    <div
                      className="relative h-[140px] w-[140px] md:h-[160px] md:w-[160px] overflow-hidden rounded-3xl shadow-[0_24px_50px_-10px_rgba(0,0,0,0.45)]"
                      style={{
                        background:
                          'radial-gradient(circle at 30% 20%, #5fa3ff 0%, #2770ff 55%, #0a2ea8 100%)',
                      }}
                    >
                      <Image
                        src="/Brands/mascot-wave-blue.png"
                        alt="Resume builder mascot"
                        width={320}
                        height={320}
                        className="absolute inset-0 h-full w-full object-cover scale-[1.05]"
                      />
                    </div>
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
                    <span className="text-[#A3FFB3] italic">Every. Single. Job.</span>
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

                <div className="relative w-[160px] md:w-[190px] lg:w-[220px] shrink-0">
                  <div className="absolute -inset-3 rounded-full blur-2xl opacity-60 bg-[#A3FFB3]" />
                  <div className="relative mascot-bob">
                    <div
                      className="relative h-[160px] w-[160px] md:h-[190px] md:w-[190px] lg:h-[220px] lg:w-[220px] overflow-hidden rounded-3xl shadow-[0_30px_60px_-12px_rgba(216,27,147,0.5)]"
                      style={{
                        background:
                          'radial-gradient(circle at 30% 20%, #ff8acc 0%, #ff3dc0 50%, #d81b93 100%)',
                      }}
                    >
                      <Image
                        src="/Brands/mascot-hero-pink.png"
                        alt="Tailoring hero mascot"
                        width={400}
                        height={400}
                        className="absolute inset-0 h-full w-full object-cover scale-[1.05]"
                      />
                    </div>
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
                  <div className="relative w-[150px] md:w-[170px] mascot-bob-reverse">
                    <div
                      className="relative h-[150px] w-[150px] md:h-[170px] md:w-[170px] overflow-hidden rounded-3xl shadow-[0_18px_36px_-10px_rgba(39,112,255,0.35)]"
                      style={{
                        background:
                          'radial-gradient(circle at 30% 20%, #5fa3ff 0%, #2770ff 55%, #0a2ea8 100%)',
                      }}
                    >
                      <Image
                        src="/Brands/mascot-plane-blue.png"
                        alt="Cover letter mascot"
                        width={320}
                        height={320}
                        className="absolute inset-0 h-full w-full object-cover scale-[1.05]"
                      />
                    </div>
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
