'use client'

import { useEffect } from 'react'
import { X, Check } from 'lucide-react'
import { getAllTemplates } from '@/components/templates/registry'
import type { ResumeData, TemplateId, TemplateProps } from '@/types'

interface Props {
  isOpen: boolean
  currentTemplateId: TemplateId
  resumeData: ResumeData
  onSelect: (id: TemplateId) => void
  onClose: () => void
}

export default function TemplateSwitcherModal({
  isOpen,
  currentTemplateId,
  resumeData,
  onSelect,
  onClose,
}: Props) {
  const allTemplates = getAllTemplates()

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Choose a Template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 p-6">
          {allTemplates.map((tpl) => {
            const TemplateComponent = tpl.component as React.ComponentType<TemplateProps>
            const isSelected = tpl.config.id === currentTemplateId

            return (
              <button
                key={tpl.config.id}
                onClick={() => { onSelect(tpl.config.id); onClose() }}
                className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                  isSelected ? 'border-indigo-500 shadow-md' : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                {/* Template preview at 25% scale */}
                <div className="overflow-hidden" style={{ height: '280px' }}>
                  <div style={{ transform: 'scale(0.25)', transformOrigin: 'top left', width: '794px', pointerEvents: 'none' }}>
                    <TemplateComponent data={resumeData} isEditing={false} onFieldChange={() => {}} />
                  </div>
                </div>

                {/* Selected overlay */}
                {isSelected && (
                  <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center">
                    <div className="bg-indigo-500 rounded-full p-1">
                      <Check size={14} className="text-white" />
                    </div>
                  </div>
                )}

                {/* Label */}
                <div className="px-2 py-1.5 border-t border-gray-100 text-xs font-medium text-gray-700 text-center bg-white">
                  {tpl.config.name}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
