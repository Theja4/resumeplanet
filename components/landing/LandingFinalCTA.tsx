'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function LandingFinalCTA() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-28">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 20% 30%, rgba(163,255,179,0.7) 0%, transparent 65%), radial-gradient(ellipse at 80% 70%, rgba(2,109,50,0.7) 0%, transparent 60%), linear-gradient(135deg, #011a0b 0%, #022c14 40%, #00a84d 100%)',
        }}
      />

      {/* grid overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)',
        }}
      />

      {/* Floating sparkles */}
      <div className="pointer-events-none absolute inset-0">
        {[
          { top: '12%', left: '12%', size: 16, delay: '0s' },
          { top: '22%', left: '85%', size: 20, delay: '0.6s' },
          { top: '65%', left: '8%', size: 14, delay: '1.2s' },
          { top: '78%', left: '78%', size: 22, delay: '1.8s' },
          { top: '42%', left: '92%', size: 12, delay: '2.4s' },
          { top: '88%', left: '42%', size: 18, delay: '3s' },
        ].map((s, i) => (
          <span
            key={i}
            className="absolute text-white/80 sparkle-twinkle"
            style={{ top: s.top, left: s.left, animationDelay: s.delay }}
          >
            <svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" />
            </svg>
          </span>
        ))}
      </div>

      <div className="relative mx-auto max-w-6xl grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] text-center lg:text-left">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-white backdrop-blur">
            <Sparkles size={12} className="text-[#A3FFB3]" />
            Ready when you are
          </div>
          <h2 className="mt-5 text-4xl md:text-6xl lg:text-[5rem] font-black tracking-tighter leading-[1.12] text-white">
            Your next yes is<br />
            <span className="landing-italic-safe italic bg-gradient-to-r from-[#A3FFB3] to-white bg-clip-text text-transparent drop-shadow-sm">
              one upload away.
            </span>
          </h2>
          <p className="mt-6 text-lg md:text-xl text-white/75 leading-relaxed max-w-xl mx-auto lg:mx-0">
            Stop wrestling with Word. Stop guessing at keywords. Let the bunny handle it.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row justify-center lg:justify-start gap-3">
            <Link href="/auth/register">
              <button className="group relative overflow-hidden rounded-full bg-white px-10 py-4 text-base font-black text-[#026d32] shadow-[0_20px_50px_-12px_rgba(163,255,179,0.6)] transition-all hover:scale-[1.03] cursor-pointer">
                <span className="relative z-10 inline-flex items-center gap-2">
                  Get started free
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#A3FFB3]/50 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
            </Link>
          </div>

          <p className="mt-5 text-sm text-white/50">
            Free plan forever · Upgrade anytime
          </p>
        </div>

        <div className="relative h-[360px] md:h-[480px]">
          {/* Halo */}
          <div className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl opacity-25 md:h-[290px] md:w-[290px]"
            style={{ background: 'radial-gradient(circle, rgba(163,255,179,0.55) 0%, transparent 65%)' }}
          />
          {/* Orbital rings */}
          <div className="absolute left-1/2 top-1/2 h-[340px] w-[340px] md:h-[420px] md:w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
          <div className="absolute left-1/2 top-1/2 h-[260px] w-[260px] md:h-[330px] md:w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />

          {/* Transparent mascot floats centered with halo */}
          <Link href="/auth/register" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 mascot-bob cursor-pointer z-20">
            <Image
              src="/Brands/mascot-hero-pink.png"
              alt="Rezoomed hero mascot"
              width={600}
              height={600}
              className="relative h-[280px] w-[280px] md:h-[380px] md:w-[380px] object-contain drop-shadow-[0_24px_38px_rgba(0,0,0,0.24)]"
            />
          </Link>
        </div>
      </div>
    </section>
  )
}
