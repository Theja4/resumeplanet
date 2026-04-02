'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ArrowRight } from 'lucide-react'
import { getAllTemplates } from './registry'
import { FONT_OPTIONS, COLOR_THEMES, DEFAULT_FONT_ID, DEFAULT_THEME_ID } from '@/lib/templateOptions'
import { SAMPLE_RESUME } from '@/lib/sampleResumeData'
import type { TemplateId } from '@/types'
import type { Resume } from '@/types'

interface Props {
  userResumes: Resume[]
  defaultResumeId?: string
}

export default function TemplateCustomizer({ userResumes, defaultResumeId }: Props) {
  const router = useRouter()
  const templates = getAllTemplates()

  const [selectedFont, setSelectedFont] = useState(DEFAULT_FONT_ID)
  const [selectedTheme, setSelectedTheme] = useState(DEFAULT_THEME_ID)
  const [selectedLayout, setSelectedLayout] = useState<TemplateId>(templates[0]?.config.id ?? 'modern-minimal')
  const [selectedResumeId, setSelectedResumeId] = useState(defaultResumeId ?? userResumes[0]?.id ?? '')

  const activeFont = FONT_OPTIONS.find(f => f.id === selectedFont) ?? FONT_OPTIONS[0]
  const activeTheme = COLOR_THEMES.find(t => t.id === selectedTheme) ?? COLOR_THEMES[0]

  function handleOpenInBuilder() {
    const params = new URLSearchParams({ template: selectedLayout })
    if (activeTheme.accent) params.set('accent', activeTheme.accent)
    if (selectedFont !== DEFAULT_FONT_ID) params.set('font', selectedFont)
    if (selectedResumeId) {
      router.push(`/dashboard/builder/${selectedResumeId}?${params}`)
    } else {
      router.push(`/dashboard/resumes?${params}`)
    }
  }

  const layoutCount = templates.length
  const themeCount = COLOR_THEMES.length - 1  // exclude default
  const fontCount = FONT_OPTIONS.length
  const totalVariations = layoutCount * themeCount * fontCount

  return (
    <div className="flex h-[calc(100vh-80px)] min-h-[600px] gap-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* ── Left panel ───────────────────────────────────────────────────── */}
      <div className="w-72 shrink-0 border-r border-gray-100 bg-gray-50/60 flex flex-col overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-base font-bold text-gray-900">{totalVariations}+ Template Variations</h1>
          <p className="text-xs text-gray-500 mt-0.5">Mix and match to create your style.</p>
        </div>

        <div className="flex-1 p-5 space-y-7">
          {/* Typography */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Typography</p>
            <div className="grid grid-cols-2 gap-2">
              {FONT_OPTIONS.map(font => (
                <button
                  key={font.id}
                  onClick={() => setSelectedFont(font.id)}
                  style={{ fontFamily: font.value }}
                  className={`relative px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-left ${
                    selectedFont === font.id
                      ? 'border-[#026d32] bg-green-50 text-[#026d32] ring-1 ring-[#026d32]/30'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {font.label}
                  {selectedFont === font.id && (
                    <span className="absolute top-1.5 right-1.5">
                      <Check size={10} className="text-[#026d32]" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Color Theme */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Colour Theme</p>
            <div className="space-y-2">
              {COLOR_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-all ${
                    selectedTheme === theme.id
                      ? 'border-[#026d32] bg-green-50 ring-1 ring-[#026d32]/30'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {/* Swatches */}
                  <div className="flex gap-0.5 shrink-0">
                    {theme.swatches.map((color, i) => (
                      <div
                        key={i}
                        className="w-4 h-5 first:rounded-l-md last:rounded-r-md"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-gray-700 flex-1 text-left">{theme.label}</span>
                  {selectedTheme === theme.id && (
                    <Check size={11} className="text-[#026d32] shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="p-5 border-t border-gray-100 space-y-3">
          {userResumes.length > 1 && (
            <select
              value={selectedResumeId}
              onChange={e => setSelectedResumeId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              {userResumes.map(r => (
                <option key={r.id} value={r.id}>{r.title || 'Untitled Resume'}</option>
              ))}
            </select>
          )}
          <button
            onClick={handleOpenInBuilder}
            className="w-full flex items-center justify-center gap-2 bg-[#026d32] hover:bg-green-800 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            Open in Builder <ArrowRight size={14} />
          </button>
          {userResumes.length === 0 && (
            <p className="text-xs text-gray-400 text-center">Upload a resume first to use your data</p>
          )}
        </div>
      </div>

      {/* ── Right panel: Layout grid ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="p-6 border-b border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Layout</p>
        </div>

        <div className="p-6 grid grid-cols-2 xl:grid-cols-3 gap-5">
          {templates.map(entry => {
            const TemplateComponent = entry.component
            const isSelected = selectedLayout === entry.config.id
            const previewAccent = activeTheme.accent || entry.config.accentColor
            const previewFont = activeFont.value

            return (
              <button
                key={entry.config.id}
                onClick={() => setSelectedLayout(entry.config.id)}
                className={`group relative rounded-xl border-2 transition-all overflow-hidden text-left ${
                  isSelected
                    ? 'border-[#026d32] shadow-md shadow-green-900/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Thumbnail — 794px template scaled down to fit card width */}
                <div className="w-full overflow-hidden bg-gray-50" style={{ height: '260px' }}>
                  <div
                    style={{
                      transform: 'scale(0.22)',
                      transformOrigin: 'top left',
                      width: '794px',
                      pointerEvents: 'none',
                    }}
                  >
                    <TemplateComponent
                      data={SAMPLE_RESUME}
                      accentColor={previewAccent}
                      fontFamily={previewFont}
                    />
                  </div>
                </div>

                {/* Label */}
                <div className={`flex items-center justify-between px-3 py-2.5 border-t ${isSelected ? 'border-[#026d32]/20 bg-green-50' : 'border-gray-100 bg-white'}`}>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isSelected ? 'text-[#026d32]' : 'text-gray-600'}`}>
                    {entry.config.name}
                  </span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#026d32] flex items-center justify-center">
                      <Check size={11} className="text-white" />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
