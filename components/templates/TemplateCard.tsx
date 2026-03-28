'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SAMPLE_RESUME from '@/lib/sampleResumeData'
import { getTemplate } from './registry'
import type { TemplateId, Resume } from '@/types'

interface TemplateCardProps {
  templateId: TemplateId
  userResumes: Resume[]
  isPro: boolean
}

export default function TemplateCard({ templateId, userResumes, isPro }: TemplateCardProps) {
  const router = useRouter()
  // Looked up client-side so no functions are passed over the server/client boundary
  const entry = getTemplate(templateId)!
  const { config, component: TemplateComponent } = entry
  const [showPicker, setShowPicker] = useState(false)

  function navigateToPreview(resumeId: string) {
    router.push(`/dashboard/templates/${config.id}?resumeId=${resumeId}`)
  }

  function handlePreview() {
    if (userResumes.length === 0) {
      router.push('/dashboard/resumes')
      return
    }
    if (userResumes.length === 1) {
      navigateToPreview(userResumes[0].id)
      return
    }
    setShowPicker(v => !v)
  }

  function handleDownload() {
    if (!isPro) return
    if (userResumes.length === 0) {
      router.push('/dashboard/resumes')
      return
    }
    const id = userResumes.length === 1 ? userResumes[0].id : ''
    router.push(`/dashboard/templates/${config.id}${id ? `?resumeId=${id}` : ''}`)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative">
      {/* Thumbnail */}
      <div className="h-[260px] overflow-hidden bg-white relative border-b border-gray-100">
        <div
          style={{
            transform: 'scale(0.27)',
            transformOrigin: 'top left',
            width: '794px',
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
        >
          <TemplateComponent data={SAMPLE_RESUME} />
        </div>
        {/* Accent colour strip at top */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: config.accentColor }}
        />
        {/* Badges */}
        <div className="absolute top-3 right-3 flex gap-1">
          {config.isNew && (
            <span className="bg-green-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
              New
            </span>
          )}
          {config.isPremium && (
            <span className="bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Premium
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-gray-900 text-sm">{config.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{config.targetRole}</p>
          </div>
          <div
            className="w-3 h-3 rounded-full mt-1 shrink-0"
            style={{ backgroundColor: config.accentColor }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3 relative">
          {/* Preview */}
          <button
            onClick={handlePreview}
            className="flex-1 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Preview
          </button>

          {/* Download */}
          {isPro ? (
            <button
              onClick={handleDownload}
              className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Download
            </button>
          ) : (
            <div className="flex-1 relative group">
              <button
                className="w-full py-2 text-sm font-medium text-gray-400 border border-gray-200 rounded-lg cursor-not-allowed flex items-center justify-center gap-1.5"
                disabled
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Download
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  Download requires Pro
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resume picker dropdown */}
        {showPicker && userResumes.length > 1 && (
          <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
            <p className="text-xs text-gray-500 px-3 py-2 border-b border-gray-100">
              Select a resume to preview
            </p>
            {userResumes.map(r => (
              <button
                key={r.id}
                onClick={() => {
                  setShowPicker(false)
                  navigateToPreview(r.id)
                }}
                className="w-full text-left text-sm text-gray-700 px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                {r.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
