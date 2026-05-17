import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'
import {
  ArrowUpRight,
  CheckCircle2,
  Zap,
  Target,
  FileSearch,
  Send,
  Layers,
} from 'lucide-react'

function Reveal({
  children,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
  from?: 'bottom' | 'left' | 'right' | 'scale'
}) {
  return <div className={className}>{children}</div>
}

/**
 * Card CTA chip — used in every bento card, matches the hero pill so the
 * whole landing reads as one design language. Sits on top of mixed-color
 * card backgrounds so it stays dark + neutral.
 */
function BentoCta({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950 px-4 py-2 text-xs font-medium tracking-tight text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_20px_-8px_rgba(0,0,0,0.5)] transition-all duration-300 group-hover:bg-zinc-900 group-hover:translate-y-[-1px]">
      {label}
      <ArrowUpRight
        size={14}
        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </span>
  )
}

export default function LandingBento() {
  return (
    <section
      id="features"
      className="relative overflow-hidden px-6 pt-12 pb-24 md:pt-16 md:pb-28"
      style={{ background: 'var(--landing-bg)' }}
    >
      {/* Subtle dotted grid for depth — same as hero, lower density */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(15,23,42,0.05) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage:
            'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 90%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 90%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        {/* ── Section header ──────────────────────────────────── */}
        <Reveal>
          <div className="mx-auto mb-12 max-w-3xl text-center md:mb-14">
            <p className="landing-section-eyebrow">Everything job seekers need</p>
            <h2 className="mt-3 text-4xl md:text-5xl lg:text-[3.4rem] font-semibold tracking-[-0.035em] leading-[1.04] text-zinc-950">
              One toolkit.{' '}
              <span className="landing-italic-safe italic bg-gradient-to-r from-[#00a84d] via-[#026d32] to-[#019a47] bg-clip-text text-transparent">
                Infinite unfair advantage.
              </span>
            </h2>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-zinc-600">
              Every feature is designed to move you from &ldquo;submitted&rdquo; to
              &ldquo;scheduled&rdquo; faster.
            </p>
          </div>
        </Reveal>

        <div className="grid auto-rows-[minmax(260px,auto)] grid-cols-1 gap-5 md:grid-cols-6 md:gap-6">
          {/* Card 1: ATS Scanner — large, pink */}
          <Reveal className="md:col-span-3 md:row-span-2" from="left">
            <Link
              href="/ats-checker"
              className="mascot-card group relative block h-full overflow-hidden p-8 md:p-10"
              style={{
                background:
                  'linear-gradient(145deg, #ff66c4 0%, #ff3dc0 55%, #d81b93 100%)',
              }}
            >
              {/* Inner highlight ring for the premium-card lift */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[inherit]"
                style={{
                  boxShadow:
                    'inset 0 1px 0 0 rgba(255,255,255,0.25), inset 0 0 0 1px rgba(255,255,255,0.08)',
                }}
              />

              <div className="relative flex h-full min-h-[380px] flex-col justify-between sm:min-h-[480px]">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white backdrop-blur">
                    <FileSearch size={12} />
                    ATS Scanner
                  </div>
                  <h3 className="mt-5 text-3xl font-semibold tracking-[-0.025em] leading-[1.05] text-white md:text-4xl">
                    X-ray your resume
                    <br />
                    before recruiters do.
                  </h3>
                  <p className="mt-4 max-w-sm text-sm leading-7 text-white/85 md:text-base">
                    Spot parsing traps, keyword gaps, and silent formatting killers. Fix
                    before you apply.
                  </p>
                </div>

                <div className="relative mt-6 flex flex-1 items-end justify-center">
                  <div className="absolute bottom-0 left-1/2 h-[95%] w-[75%] -translate-x-1/2 rounded-2xl border-2 border-dashed border-white/30" />
                  <div className="mascot-bob relative">
                    <div
                      className="pointer-events-none absolute left-1/2 top-1/2 h-[68%] w-[68%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-md"
                      style={{
                        background:
                          'radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)',
                      }}
                    />
                    <Image
                      src="/Brands/mascot-magnify-pink.png"
                      alt="ATS scanner mascot"
                      width={500}
                      height={500}
                      quality={65}
                      sizes="(max-width: 767px) 310px, (max-width: 1023px) 360px, 400px"
                      className="relative h-[310px] w-[310px] object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.22)] md:h-[360px] md:w-[360px] lg:h-[400px] lg:w-[400px]"
                    />
                  </div>
                </div>

                <div className="flex">
                  <BentoCta label="Scan now" />
                </div>
              </div>
            </Link>
          </Reveal>

          {/* Card 2: Match Score — top right, dark */}
          <Reveal className="md:col-span-3" delay={80} from="right">
            <Link
              href="/match-score"
              className="mascot-card group relative block h-full overflow-hidden p-7 md:p-8"
              style={{
                background:
                  'linear-gradient(145deg, #18181b 0%, #09090b 55%, #000000 100%)',
              }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[inherit]"
                style={{
                  boxShadow:
                    'inset 0 1px 0 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.04)',
                }}
              />

              <div className="relative flex h-full flex-col gap-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#A3FFB3]/15 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#A3FFB3]">
                    <Target size={12} />
                    Match Score
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.025em] leading-[1.05] text-white md:text-3xl">
                    Paste a JD.
                    <br />
                    <span className="text-[#A3FFB3]">Know your shot.</span>
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    Real-time keyword coverage, gap analysis, and rewrite suggestions.
                  </p>

                  <div className="mt-4 space-y-2">
                    <div>
                      <div className="flex justify-between text-[10px] font-medium text-zinc-500">
                        <span>Keywords</span>
                        <span className="text-[#A3FFB3]">94%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                        <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-[#A3FFB3] to-[#00a84d]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-medium text-zinc-500">
                        <span>Skills</span>
                        <span className="text-[#A3FFB3]">88%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                        <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-[#A3FFB3] to-[#00a84d]" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex">
                    <BentoCta label="Match" />
                  </div>
                </div>

                <div className="relative mx-auto w-[160px] shrink-0 sm:mx-0 sm:w-[190px] md:w-[220px]">
                  <div className="absolute inset-8 rounded-full bg-[#A3FFB3] opacity-20 blur-md" />
                  <div className="mascot-bob-reverse relative">
                    <Image
                      src="/Brands/mascot-papers-blue.png"
                      alt="Match score mascot"
                      width={320}
                      height={320}
                      quality={65}
                      sizes="(max-width: 639px) 160px, (max-width: 767px) 190px, 220px"
                      className="relative h-[160px] w-[160px] object-contain drop-shadow-[0_12px_22px_rgba(163,255,179,0.18)] sm:h-[190px] sm:w-[190px] md:h-[220px] md:w-[220px]"
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
              className="mascot-card group relative block h-full overflow-hidden p-7 md:p-8"
              style={{
                background:
                  'linear-gradient(145deg, #2770ff 0%, #1e4fe6 55%, #0a2ea8 100%)',
              }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[inherit]"
                style={{
                  boxShadow:
                    'inset 0 1px 0 0 rgba(255,255,255,0.18), inset 0 0 0 1px rgba(255,255,255,0.06)',
                }}
              />

              <div className="relative flex h-full flex-col gap-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white backdrop-blur">
                    <Layers size={12} />
                    Resume Builder
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.025em] leading-[1.05] text-white md:text-3xl">
                    Type. We format.
                    <br />
                    <span className="text-[#A3FFB3]">Export ready.</span>
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/80">
                    Live preview, recruiter-grade PDF, version history — no wrestling
                    with Word.
                  </p>

                  <div className="mt-6 flex">
                    <BentoCta label="Build" />
                  </div>
                </div>

                <div className="relative mx-auto w-[160px] shrink-0 sm:mx-0 sm:w-[180px] md:w-[210px]">
                  <div className="absolute inset-8 rounded-full bg-[#A3FFB3] opacity-20 blur-md" />
                  <div className="mascot-bob relative">
                    <Image
                      src="/Brands/mascot-wave-cutout.png"
                      alt="Resume builder mascot"
                      width={320}
                      height={320}
                      quality={65}
                      sizes="(max-width: 639px) 160px, (max-width: 767px) 180px, 210px"
                      className="relative h-[160px] w-[160px] object-contain drop-shadow-[0_14px_24px_rgba(0,0,0,0.22)] sm:h-[180px] sm:w-[180px] md:h-[210px] md:w-[210px]"
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
              className="mascot-card group relative block h-full overflow-hidden p-7 md:p-8"
              style={{
                background:
                  'linear-gradient(135deg, #022c14 0%, #026d32 55%, #019a47 100%)',
              }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[inherit]"
                style={{
                  boxShadow:
                    'inset 0 1px 0 0 rgba(255,255,255,0.14), inset 0 0 0 1px rgba(255,255,255,0.05)',
                }}
              />

              <div className="relative flex h-full flex-col gap-6 sm:grid sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white backdrop-blur">
                    <Zap size={12} />
                    Resume Tailoring
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.025em] leading-[1.05] text-white md:text-3xl">
                    One click, custom resume.
                    <br />
                    <span className="landing-italic-safe italic text-[#A3FFB3]">
                      Every. Single. Job.
                    </span>
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      'Bullets rewritten',
                      'Keywords matched',
                      'Summary polished',
                      'Skills reordered',
                    ].map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur"
                      >
                        <CheckCircle2 size={10} className="text-[#A3FFB3]" />
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-7 flex">
                    <BentoCta label="Tailor" />
                  </div>
                </div>

                <div className="relative mx-auto w-[180px] shrink-0 sm:mx-0 sm:w-[210px] md:w-[250px] lg:w-[290px]">
                  <div className="absolute inset-12 rounded-full bg-[#A3FFB3] opacity-20 blur-md" />
                  <div className="mascot-bob relative">
                    <Image
                      src="/Brands/mascot-hero-pink.png"
                      alt="Tailoring hero mascot"
                      width={400}
                      height={400}
                      quality={65}
                      sizes="(max-width: 639px) 180px, (max-width: 767px) 210px, (max-width: 1023px) 250px, 290px"
                      className="relative h-[180px] w-[180px] object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.24)] sm:h-[210px] sm:w-[210px] md:h-[250px] md:w-[250px] lg:h-[290px] lg:w-[290px]"
                    />
                  </div>
                </div>
              </div>
            </Link>
          </Reveal>

          {/* Card 5: Cover letter — narrow, sky-blue gradient */}
          <Reveal className="md:col-span-2" delay={160} from="right">
            <Link
              href="/cover-letter-generator"
              className="mascot-card group relative block h-full overflow-hidden p-7 md:p-8"
              style={{
                background:
                  'linear-gradient(155deg, #e0f2fe 0%, #bae6fd 40%, #7dd3fc 100%)',
              }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[inherit]"
                style={{
                  boxShadow:
                    'inset 0 1px 0 0 rgba(255,255,255,0.5), inset 0 0 0 1px rgba(15,23,42,0.04)',
                }}
              />

              <div className="relative flex h-full min-h-[380px] flex-col justify-between sm:min-h-[420px]">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/50 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#0a2ea8] backdrop-blur">
                    <Send size={12} />
                    Cover Letter
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.025em] leading-[1.05] text-[#0c4a6e] md:text-3xl">
                    First drafts,
                    <br />
                    <span className="text-[#0a2ea8]">lifted off the ground.</span>
                  </h3>
                  <p className="mt-3 max-w-[16rem] text-sm leading-6 text-[#0c4a6e]/80">
                    Tone-matched cover letters from your resume and the job description.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['Role-specific', 'Tone control', 'One click'].map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full bg-white/40 px-3 py-1 text-[11px] font-medium text-[#0a2ea8] backdrop-blur"
                      >
                        <CheckCircle2 size={10} className="text-[#0a2ea8]" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="relative z-0 mt-4 flex flex-1 items-end justify-center">
                  <div className="mascot-bob-reverse relative w-[180px] md:w-[210px]">
                    <div className="absolute inset-6 rounded-full bg-white opacity-30 blur-xl" />
                    <Image
                      src="/Brands/mascot-plane-blue.png"
                      alt="Cover letter mascot"
                      width={320}
                      height={320}
                      quality={65}
                      sizes="(max-width: 767px) 180px, 210px"
                      className="relative h-[180px] w-[180px] object-contain drop-shadow-[0_14px_28px_rgba(10,46,168,0.22)] md:h-[210px] md:w-[210px]"
                    />
                  </div>
                </div>

                <div className="relative z-10 flex">
                  <BentoCta label="Generate" />
                </div>
              </div>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
