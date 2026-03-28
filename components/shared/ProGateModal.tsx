'use client'

import { X, Zap } from 'lucide-react'
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
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Zap size={16} className="text-indigo-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">{config.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4">{config.description}</p>

        {/* Feature bullets */}
        <ul className="space-y-2 mb-6">
          {config.bullets.map((bullet) => (
            <li key={bullet} className="flex items-center gap-2 text-sm text-gray-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
              {bullet}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          href="/dashboard/billing"
          onClick={onClose}
          className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
        >
          Upgrade to Pro →
        </Link>
      </div>
    </div>
  )
}
