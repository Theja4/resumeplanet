'use client'

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-hidden">
      <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-40" onClick={onClose}></div>

      <div
        className="relative z-50 w-full max-w-lg bg-white rounded-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] overflow-hidden font-body text-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#a3ffb3]/40 px-6 py-2 flex justify-center items-center gap-2">
          <Zap size={16} className="text-[#026d32]" />
          <span className="text-xs font-bold tracking-[0.05em] uppercase text-[#19793c] leading-none">
            Pro Feature
          </span>
        </div>

        <div className="p-8 md:p-10 relative bg-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-800 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>

          <div className="mb-8">
            <span className="text-zinc-900 font-extrabold text-lg tracking-tighter">Rezoomed</span>
          </div>

          <div className="space-y-4 mb-8">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 leading-[1.1]">
              Unlock <span className="text-[#80da92]">{config.title}</span>
            </h2>
            <p className="text-zinc-600 text-lg font-medium max-w-md">
              {config.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 mb-8">
            <div className="sm:col-span-2 bg-zinc-50 rounded-xl p-6 flex items-center justify-center">
              <div className="h-16 w-16 rounded-2xl bg-[#a3ffb3]/40 flex items-center justify-center">
                <Zap size={28} className="text-[#026d32]" />
              </div>
            </div>

            <div className="sm:col-span-3 space-y-4 py-2">
              {config.bullets.map((bullet) => (
                <div key={bullet} className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-[#026d32] shrink-0" />
                  <span className="text-sm font-medium text-zinc-900 leading-tight">{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 text-center sm:text-left relative z-20">
            <Link
              href="/dashboard/pricing"
              onClick={onClose}
              className="w-full py-4 px-8 bg-[#a3ffb3] hover:bg-[#9bf7ac] transition-all duration-200 text-[#19793c] font-bold text-lg rounded-full flex items-center justify-center gap-2 group"
            >
              Upgrade to Pro
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="flex justify-center">
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-700 text-sm font-semibold transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>

          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#a3ffb3]/20 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#80da92]/10 rounded-full blur-[80px] pointer-events-none"></div>
        </div>
      </div>
    </div>
  )
}
