import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import AuroraShader from './AuroraShader'

export default function LandingFinalCTA() {
  return (
    <section className="relative isolate overflow-hidden px-6 py-24 md:py-28">
      {/* Dark aurora — uses the dark preset palette regardless of theme,
          and the .aurora-fallback-dark class swaps the static fallback
          gradient so the section looks correct on no-WebGL too. */}
      <AuroraShader
        palette="dark"
        speed={0.05}
        intensity={1.05}
        className="aurora-fallback-dark"
      />

      {/* Subtle grid overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage:
            'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)',
        }}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 text-center lg:grid-cols-[1.05fr_0.95fr] lg:text-left">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-white/80 backdrop-blur">
            <Sparkles size={12} className="text-[#A3FFB3]" />
            Ready when you are
          </div>

          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.035em] leading-[1.04] text-white md:text-6xl lg:text-[4.4rem]">
            Your next yes is
            <br />
            <span className="landing-italic-safe italic bg-gradient-to-r from-[#A3FFB3] to-white bg-clip-text text-transparent">
              one upload away.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/65 md:text-lg lg:mx-0">
            Stop wrestling with Word. Stop guessing at keywords. Let the bunny handle it.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link href="/auth/register" className="landing-cta-primary-light group">
              <span>Get started</span>
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          <p className="mt-5 text-sm text-white/45">
            Free plan forever · Upgrade anytime
          </p>
        </div>

        {/* Right: mascot, single soft halo, no orbital rings or sparkles */}
        <div className="relative h-[360px] md:h-[480px]">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.28] blur-3xl md:h-[340px] md:w-[340px]"
            style={{
              background:
                'radial-gradient(circle, rgba(163,255,179,0.55) 0%, transparent 65%)',
            }}
          />

          <Link
            href="/auth/register"
            aria-label="Start building your resume"
            className="mascot-bob absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
          >
            <Image
              src="/Brands/mascot-hero-pink.png"
              alt="Rezoomed hero mascot"
              width={600}
              height={600}
              className="relative h-[280px] w-[280px] object-contain drop-shadow-[0_24px_38px_rgba(0,0,0,0.35)] md:h-[380px] md:w-[380px]"
            />
          </Link>
        </div>
      </div>
    </section>
  )
}
