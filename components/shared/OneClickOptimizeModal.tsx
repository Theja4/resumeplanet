'use client'

import { useEffect, useState } from 'react'
import { Lock, X, Zap, ArrowRight, CheckCircle2 } from 'lucide-react'
import { usePaddleCheckout } from '@/hooks/usePaddleCheckout'

export interface ModalPromoDisplay {
  currencySymbol: string
  monthly: { original: string; discounted: string }
  annual: { originalPerMonth: string; discountedPerMonth: string; discountedTotal: string }
}

interface OneClickOptimizeModalProps {
  onClose: () => void
  promoDisplay?: ModalPromoDisplay | null
  currentScore?: number | null
}

// ─── Score Ring ──────────────────────────────────────────────────────────────

function ScoreRing({
  score,
  size = 96,
  locked = false,
}: {
  score: number
  size?: number
  locked?: boolean
}) {
  const r = (size / 2) - 8
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const color = score >= 70 ? '#026d32' : score >= 50 ? '#ca8a04' : '#ef4444'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-black/8" />
        {!locked && (
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          />
        )}
        {locked && (
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="#026d32" strokeWidth="7"
            strokeDasharray={circ} strokeDashoffset={circ * 0.13} strokeLinecap="round"
            className="opacity-30"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {locked ? (
          <>
            <span className="text-2xl font-black text-primary/20">{score}</span>
            <Lock size={14} className="text-primary/30 -mt-0.5" />
          </>
        ) : (
          <span className="text-2xl font-black" style={{ color }}>{score}</span>
        )}
      </div>
    </div>
  )
}

// ─── Live social-proof ticker (Booking.com-style) ────────────────────────────

function useLiveCount(initial: number) {
  const [count, setCount] = useState(initial)
  useEffect(() => {
    const tick = () => {
      setCount(c => c + Math.floor(Math.random() * 2) + 1)
    }
    const id = window.setInterval(tick, 6000 + Math.random() * 6000)
    return () => clearInterval(id)
  }, [])
  return count
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export default function OneClickOptimizeModal({
  onClose,
  promoDisplay,
  currentScore,
}: OneClickOptimizeModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'annual'>('annual')
  const [isLoading, setIsLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const { openSubscriptionCheckout } = usePaddleCheckout()
  const liveCount = useLiveCount(8460)

  const score = typeof currentScore === 'number' ? currentScore : 42
  const scoreColor = score >= 70 ? '#026d32' : score >= 50 ? '#ca8a04' : '#ef4444'
  const potentialScore = Math.min(Math.max(score + 38, 82), 94)
  const scoreGain = potentialScore - score

  // Zone label: anything below 81 is the "auto-reject" zone for ATS bots
  const inDangerZone = score < 81

  async function handleUpgrade() {
    setIsLoading(true)
    setCheckoutError(null)
    await openSubscriptionCheckout({
      priceId: selectedInterval,
      promotionCode: 'CAREER50',
      onSuccess: () => {
        setIsLoading(false)
        onClose()
      },
      onError: (err) => {
        setIsLoading(false)
        setCheckoutError(err)
      },
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-4 py-8">
      <div
        className="fixed inset-0 bg-zinc-950/55 backdrop-blur-md"
        onClick={step === 1 ? onClose : undefined}
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          STEP 1 — The gut punch: show them the problem + what they're missing
          ═══════════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div
          className="relative z-50 w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/60 bg-white text-zinc-900 shadow-[0_32px_80px_rgba(15,23,42,0.22)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Promo strip ── */}
          <div className="flex items-center justify-between bg-[linear-gradient(90deg,#026d32,#019442)] px-5 py-2">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/90">
              <Zap size={10} className="text-yellow-300" />
              Exclusive · 50% off · limited time
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors" aria-label="Close">
              <X size={14} />
            </button>
          </div>

          <div className="px-8 pt-6 pb-7 space-y-5">
            {/* ── Headline ── */}
            <div>
              <h2 className="text-[1.75rem] font-black leading-[1.15] text-zinc-900">
                Recruiters never see your resume.
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-on-surface-variant">
                {inDangerZone
                  ? <>Your score is in the <strong className="text-red-600">auto-reject zone</strong>. Over 90% of resumes are filtered out before a human ever opens the file.</>
                  : <>Your score is close but still below the <strong className="text-zinc-800">interview threshold</strong>. A few AI fixes can push you over the line.</>
                }
              </p>
            </div>

            {/* ── Score comparison ── */}
            <div className="rounded-2xl border border-black/6 bg-zinc-50/80 px-6 py-5">
              <div className="flex items-center justify-center gap-5 sm:gap-8">
                {/* Current score */}
                <div className="flex flex-col items-center gap-1.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">Now</p>
                  <ScoreRing score={score} size={108} />
                  <span
                    className="rounded-full px-3 py-0.5 text-[11px] font-black"
                    style={{ background: `${scoreColor}18`, color: scoreColor }}
                  >
                    {inDangerZone ? 'Rejected' : 'At risk'}
                  </span>
                </div>

                {/* Arrow + gain badge */}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <ArrowRight size={20} className="text-primary" />
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                    +{scoreGain} pts
                  </span>
                </div>

                {/* After score (locked) */}
                <div className="flex flex-col items-center gap-1.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">After AI fix</p>
                  <ScoreRing score={potentialScore} size={108} locked />
                  <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-[11px] font-black text-emerald-700">
                    Interview zone
                  </span>
                </div>
              </div>

              {/* Threshold bar */}
              <div className="mt-5 flex items-center gap-3">
                <span className="shrink-0 text-[10px] font-bold text-zinc-500">You: {score}%</span>
                <div className="relative h-2.5 flex-1 rounded-full bg-gradient-to-r from-red-200 via-amber-200 to-emerald-200">
                  {/* Score dot */}
                  <div
                    className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white shadow-md"
                    style={{ left: `${score}%`, background: scoreColor }}
                  />
                  {/* Threshold line */}
                  <div
                    className="absolute -top-1 h-[calc(100%+8px)] w-0.5 bg-zinc-800/60 rounded-full"
                    style={{ left: '81%' }}
                  />
                </div>
                <span className="shrink-0 text-[10px] font-bold text-zinc-500">Interview</span>
              </div>
            </div>

            {/* ── Live social proof ticker ── */}
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-on-surface-variant">
                <strong className="text-zinc-800">{liveCount.toLocaleString()}</strong> job seekers fixed their resume today
              </span>
            </div>

            {/* ── Stat row ── */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-3.5 text-center">
                <p className="text-2xl font-black text-red-600">90%+</p>
                <p className="mt-0.5 text-[11px] font-semibold text-red-600/80">auto-rejected by bots</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3.5 text-center">
                <p className="text-2xl font-black text-amber-600">250+</p>
                <p className="mt-0.5 text-[11px] font-semibold text-amber-600/80">applicants per job</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3.5 text-center">
                <p className="text-2xl font-black text-emerald-600">60s</p>
                <p className="mt-0.5 text-[11px] font-semibold leading-snug text-emerald-600/80">to apply advanced AI fix</p>
              </div>
            </div>

            {/* ── CTA ── */}
            <button
              onClick={() => setStep(2)}
              className="group w-full rounded-full bg-zinc-950 py-4 text-[15px] font-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-0.5 hover:bg-zinc-800 active:scale-[0.98]"
            >
              Fix my score now
              <ArrowRight size={16} className="ml-1.5 inline transition-transform group-hover:translate-x-1" />
            </button>

            {/* ── Dismiss (personalized with their score — hurts to read) ── */}
            <button
              onClick={onClose}
              className="w-full rounded-full border border-zinc-200 bg-zinc-100 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-zinc-200 hover:text-red-600"
            >
              I&apos;m not ready to get hired
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          STEP 2 — The close: urgency, social proof, direct checkout
          ═══════════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div
          className="relative z-50 w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/60 bg-white text-zinc-900 shadow-[0_32px_80px_rgba(15,23,42,0.22)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Green header ── */}
          <div className="bg-[linear-gradient(150deg,#026d32,#019442)] px-8 pt-7 pb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <Zap size={22} className="text-white" />
            </div>
            <h2 className="text-xl font-black text-white">
              You&apos;re {scoreGain} points from the interview zone
            </h2>
            <p className="mt-1.5 text-sm text-white/75">
              CAREER50 auto-applied — <span className="font-bold text-yellow-300">50% off</span> today
            </p>
          </div>

          <div className="px-7 pb-7 pt-5 space-y-5">
            {/* ── Social proof ── */}
            <div className="flex items-center justify-center gap-2 rounded-xl bg-zinc-50 py-2.5 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-on-surface-variant">
                <strong className="text-zinc-800">{liveCount.toLocaleString()}</strong> people upgraded today
              </span>
            </div>

            {/* ── What's included ── */}
            <div className="space-y-2.5">
              {[
                'One-click optimize — apply all AI fixes instantly',
                'Unlimited ATS scans & job-match scores',
                'AI cover letters & Tailor Mode rewrites',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-primary" />
                  <span className="text-sm text-zinc-700">{item}</span>
                </div>
              ))}
            </div>

            {/* ── Plan cards ── */}
            <div className="grid grid-cols-2 gap-3">
              {/* Monthly */}
              <button
                onClick={() => setSelectedInterval('monthly')}
                className={`relative rounded-[1.3rem] border p-4 text-center transition-all ${
                  selectedInterval === 'monthly'
                    ? 'border-primary bg-primary-container/20 shadow-[0_4px_16px_rgba(2,109,50,0.14)]'
                    : 'border-black/8 bg-zinc-50 hover:border-primary/30'
                }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Monthly</p>
                {promoDisplay ? (
                  <>
                    <p className="mt-1 text-xs text-zinc-400 line-through">{promoDisplay.monthly.original}</p>
                    <p className="text-2xl font-black text-zinc-900">{promoDisplay.monthly.discounted}</p>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-xs text-zinc-400 line-through">$19.99</p>
                    <p className="text-2xl font-black text-zinc-900">$9.99</p>
                  </>
                )}
                <p className="text-xs text-on-surface-variant">/ month</p>
                <p className="mt-1.5 text-[11px] font-bold text-zinc-500">
                  Billed {promoDisplay ? promoDisplay.monthly.discounted : '$9.99'}/mo
                </p>
              </button>

              {/* Annual */}
              <button
                onClick={() => setSelectedInterval('annual')}
                className={`relative rounded-[1.3rem] border p-4 text-center transition-all ${
                  selectedInterval === 'annual'
                    ? 'border-primary bg-primary-container/20 shadow-[0_4px_16px_rgba(2,109,50,0.14)]'
                    : 'border-black/8 bg-zinc-50 hover:border-primary/30'
                }`}
              >
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-black text-white">
                  MOST POPULAR
                </span>
                <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Annual</p>
                {promoDisplay ? (
                  <>
                    <p className="mt-1 text-xs text-zinc-400 line-through">{promoDisplay.annual.originalPerMonth}</p>
                    <p className="text-2xl font-black text-zinc-900">{promoDisplay.annual.discountedPerMonth}</p>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-xs text-zinc-400 line-through">$8.33</p>
                    <p className="text-2xl font-black text-zinc-900">$4.16</p>
                  </>
                )}
                <p className="text-xs text-on-surface-variant">/ month</p>
                <p className="mt-1.5 text-[11px] font-bold text-zinc-500">
                  Billed {promoDisplay ? promoDisplay.annual.discountedTotal : '$49.99'}/yr
                </p>
              </button>
            </div>

            {checkoutError && (
              <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">{checkoutError}</p>
            )}

            {/* ── Upgrade CTA ── */}
            <button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="group w-full rounded-full bg-zinc-950 py-4 text-[15px] font-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-all hover:-translate-y-0.5 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60 disabled:translate-y-0"
            >
              {isLoading ? 'Opening checkout…' : 'Start Pro — fix my resume now'}
            </button>

            {/* ── Speed / trust row ── */}
            <p className="text-center text-[11px] text-on-surface-variant">
              Instant checkout · Cancel anytime
            </p>

            {/* ── Dismiss (personalized guilt) ── */}
            <button
              onClick={onClose}
              className="w-full rounded-full border border-zinc-200 bg-zinc-100 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-zinc-200 hover:text-red-600"
            >
              I&apos;m not ready to get hired
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
