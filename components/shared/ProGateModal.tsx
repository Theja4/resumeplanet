'use client'

import Image from 'next/image'
import { X, Zap, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { PRO_FEATURES } from '@/lib/proFeatures'
import type { ProFeatureKey } from '@/lib/proFeatures'

interface ProGateModalProps {
  feature: ProFeatureKey | null
  onClose: () => void
}

export default function ProGateModal({ feature, onClose }: ProGateModalProps) {
  if (!feature) return null

  const config = PRO_FEATURES[feature]
  const isTailorFeature = feature === 'tailor'

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto px-4 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-10 lg:pb-16 lg:pt-14">
      <div
        className="fixed inset-0 bg-zinc-950/45 backdrop-blur-md"
        onClick={onClose}
      />

      <div
        className="relative z-50 w-full max-w-lg overflow-y-auto rounded-[2rem] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.99),rgba(244,250,246,0.97))] text-zinc-900 shadow-[0_30px_90px_rgba(15,23,42,0.18)] max-h-[calc(100dvh-4rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top badge bar */}
        <div className="relative flex items-center border-b border-black/6 bg-[linear-gradient(90deg,rgba(163,255,179,0.4),rgba(255,255,255,0.94))] px-5 py-2.5 sm:px-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/12 bg-white/86 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
            <Zap size={14} />
            Pro Feature
          </div>
        </div>

        <div className="relative p-5 sm:p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/6 bg-white/85 text-zinc-500 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-colors hover:text-zinc-900"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Heading */}
          <div className="mt-4 space-y-3 pr-8">
            <h2 className="max-w-md text-[2.05rem] font-black leading-[0.98] text-on-background sm:text-[2.55rem]">
              Unlock {config.label}.
            </h2>
            <p className="max-w-md text-sm leading-6 text-on-surface-variant sm:text-[15px]">
              {config.description}
            </p>
          </div>

          {/* Feature card with mascot */}
          <div className="mt-5 grid grid-cols-[auto_1fr] gap-4 rounded-[1.4rem] border border-primary/12 bg-white/82 p-3.5 shadow-[0_18px_42px_rgba(2,109,50,0.08)]">
            {isTailorFeature ? (
              <div className="relative h-28 w-28 overflow-hidden rounded-[1rem] border border-primary/12 bg-primary-container/30 sm:h-32 sm:w-32">
                <Image
                  src="/pro-gate-tailor-v2.jpg"
                  alt="Rezoomed Tailor Mode mascot"
                  fill
                  priority
                  sizes="128px"
                  className="object-cover object-center"
                />
              </div>
            ) : (
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[1rem] border border-primary/12 bg-primary-container/30 sm:h-32 sm:w-32">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container/60">
                  <Zap size={24} className="text-primary" />
                </div>
              </div>
            )}

            <div className="flex flex-col justify-center gap-3 py-1">
              {config.bullets.map((bullet) => (
                <div key={bullet} className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" />
                  <span className="text-sm font-semibold leading-tight text-zinc-800">{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FOMO stat — tailor only */}
          {isTailorFeature && (
            <div className="mt-5 rounded-[1.1rem] border border-primary/15 bg-primary-container/25 px-4 py-3.5 text-center">
              <p className="text-[1.35rem] font-black leading-tight text-primary">80%</p>
              <p className="mt-1 text-xs font-bold text-on-surface-variant">
                more callbacks with a tailored resume vs. a generic one.
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-5 space-y-2.5">
            <Link
              href="/dashboard/pricing"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
            >
              Upgrade to Pro
              <ArrowRight size={16} />
            </Link>
            <button
              onClick={onClose}
              className="w-full text-sm font-semibold text-on-surface-variant transition-colors hover:text-on-background"
            >
              Maybe later
            </button>
          </div>

          <p className="mt-4 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/70">
            Protected by our 14-day refund policy
          </p>
        </div>
      </div>
    </div>
  )
}
