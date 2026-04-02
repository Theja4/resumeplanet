'use client'

import { useEffect, useState } from 'react'
import { X, Check, ArrowRight, Pipette } from 'lucide-react'
import { getPresetConfig } from '@/types'
import { FONT_OPTIONS, COLOR_THEMES, DEFAULT_FONT_ID } from '@/lib/templateOptions'
import { SAMPLE_RESUME } from '@/lib/sampleResumeData'
import UniversalTemplate from '@/components/templates/UniversalTemplate'
import type { UniversalConfig } from '@/types'
import type { ResumeData } from '@/types'

interface Props {
  isOpen: boolean
  config: UniversalConfig
  onConfigChange: (config: UniversalConfig) => void
  onClose: () => void
  resumeData?: ResumeData | null
}

export default function TemplateCustomizerModal({
  isOpen,
  config,
  onConfigChange,
  onClose,
  resumeData = SAMPLE_RESUME,
}: Props) {
  const [localConfig, setLocalConfig] = useState<UniversalConfig>(config)
  const [hasChanges, setHasChanges] = useState(false)

  // Sync local config when modal opens or config prop changes
  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config)
      setHasChanges(false)
    }
  }, [isOpen, config])

  // Detect changes
  useEffect(() => {
    const changed = JSON.stringify(localConfig) !== JSON.stringify(config)
    setHasChanges(changed)
  }, [localConfig, config])

  function handleReset() {
    setLocalConfig(config)
    setHasChanges(false)
  }

  function handleApply() {
    onConfigChange(localConfig)
    onClose()
  }

  // Auto-switch layout if needed when header changes
  function handleHeaderStyleChange(headerStyle: UniversalConfig['headerStyle']) {
    setLocalConfig({ ...localConfig, headerStyle })
  }

  const activeTheme = COLOR_THEMES.find(t => t.accent === localConfig.accentColor) || COLOR_THEMES[0]
  const previewBackground = activeTheme.accent
    ? `radial-gradient(circle at top, ${activeTheme.swatches[2]}dd 0%, ${activeTheme.swatches[2]}88 22%, #ffffff 68%)`
    : 'radial-gradient(circle at top, rgba(244, 244, 245, 0.95) 0%, #ffffff 70%)'
  const selectedControlClass = 'border-transparent text-white shadow-[0_4px_14px_rgba(16,185,129,0.4)]'
  const selectedControlStyle = {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    boxShadow: '0 4px 14px rgba(16,185,129,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
  } as const

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Panel - Controls */}
        <div className="w-96 shrink-0 border-r border-zinc-100 bg-zinc-50/50 flex flex-col pt-8 relative">
          <div className="flex-1 overflow-y-auto pb-28 px-6 space-y-8">
            {/* Layout */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Layout</p>
              <div className="space-y-2">
                <label
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${localConfig.layout === 'single-column' ? selectedControlClass : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  style={localConfig.layout === 'single-column' ? selectedControlStyle : undefined}
                >
                  <input
                    type="radio"
                    name="layout"
                    value="single-column"
                    checked={localConfig.layout === 'single-column'}
                    onChange={() => setLocalConfig({ ...localConfig, layout: 'single-column', headerStyle: 'minimal' })}
                    className="sr-only"
                  />
                  <span className={`text-xs font-medium ${localConfig.layout === 'single-column' ? 'text-white' : 'text-gray-700'}`}>
                    Single Column <span className={`font-normal ml-0.5 ${localConfig.layout === 'single-column' ? 'text-white/75' : 'text-gray-400'}`}>(Recommended)</span>
                  </span>
                  {localConfig.layout === 'single-column' && <Check size={11} className="text-white ml-auto" />}
                </label>
                <label
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${localConfig.layout === 'sidebar-left' ? selectedControlClass : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  style={localConfig.layout === 'sidebar-left' ? selectedControlStyle : undefined}
                >
                  <input
                    type="radio"
                    name="layout"
                    value="sidebar-left"
                    checked={localConfig.layout === 'sidebar-left'}
                    onChange={() => setLocalConfig({ ...localConfig, layout: 'sidebar-left' })}
                    className="sr-only"
                  />
                  <span className={`text-xs font-medium ${localConfig.layout === 'sidebar-left' ? 'text-white' : 'text-gray-700'}`}>Sidebar Left</span>
                  {localConfig.layout === 'sidebar-left' && <Check size={11} className="text-white ml-auto" />}
                </label>
                <label
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${localConfig.layout === 'sidebar-right' ? selectedControlClass : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  style={localConfig.layout === 'sidebar-right' ? selectedControlStyle : undefined}
                >
                  <input
                    type="radio"
                    name="layout"
                    value="sidebar-right"
                    checked={localConfig.layout === 'sidebar-right'}
                    onChange={() => setLocalConfig({ ...localConfig, layout: 'sidebar-right' })}
                    className="sr-only"
                  />
                  <span className={`text-xs font-medium ${localConfig.layout === 'sidebar-right' ? 'text-white' : 'text-gray-700'}`}>Sidebar Right</span>
                  {localConfig.layout === 'sidebar-right' && <Check size={11} className="text-white ml-auto" />}
                </label>
              </div>
            </div>

            {/* Header Style */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Header Style</p>
              <div className="space-y-2">
                <label
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${localConfig.headerStyle === 'minimal' ? selectedControlClass : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  style={localConfig.headerStyle === 'minimal' ? selectedControlStyle : undefined}
                >
                  <input
                    type="radio"
                    name="headerStyle"
                    value="minimal"
                    checked={localConfig.headerStyle === 'minimal'}
                    onChange={() => handleHeaderStyleChange('minimal')}
                    className="sr-only"
                  />
                  <span className={`text-xs font-medium ${localConfig.headerStyle === 'minimal' ? 'text-white' : 'text-gray-700'}`}>Minimal</span>
                  {localConfig.headerStyle === 'minimal' && <Check size={11} className="text-white ml-auto" />}
                </label>
                <label
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${localConfig.headerStyle === 'banner' ? selectedControlClass : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  style={localConfig.headerStyle === 'banner' ? selectedControlStyle : undefined}
                >
                  <input
                    type="radio"
                    name="headerStyle"
                    value="banner"
                    checked={localConfig.headerStyle === 'banner'}
                    onChange={() => handleHeaderStyleChange('banner')}
                    className="sr-only"
                  />
                  <span className={`text-xs font-medium ${localConfig.headerStyle === 'banner' ? 'text-white' : 'text-gray-700'}`}>Banner</span>
                  {localConfig.headerStyle === 'banner' && <Check size={11} className="text-white ml-auto" />}
                </label>
              </div>
            </div>

            {/* Bullet Style */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Bullet Style</p>
              <div className="space-y-2">
                <label
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${localConfig.bulletStyle === 'plain' ? selectedControlClass : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  style={localConfig.bulletStyle === 'plain' ? selectedControlStyle : undefined}
                >
                  <input
                    type="radio"
                    name="bulletStyle"
                    value="plain"
                    checked={localConfig.bulletStyle === 'plain'}
                    onChange={() => setLocalConfig({ ...localConfig, bulletStyle: 'plain' })}
                    className="sr-only"
                  />
                  <span className={`text-xs font-medium ${localConfig.bulletStyle === 'plain' ? 'text-white' : 'text-gray-700'}`}>Plain</span>
                  {localConfig.bulletStyle === 'plain' && <Check size={11} className="text-white ml-auto" />}
                </label>
                <label
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${localConfig.bulletStyle === 'timeline' ? selectedControlClass : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  style={localConfig.bulletStyle === 'timeline' ? selectedControlStyle : undefined}
                >
                  <input
                    type="radio"
                    name="bulletStyle"
                    value="timeline"
                    checked={localConfig.bulletStyle === 'timeline'}
                    onChange={() => setLocalConfig({ ...localConfig, bulletStyle: 'timeline' })}
                    className="sr-only"
                  />
                  <span className={`text-xs font-medium ${localConfig.bulletStyle === 'timeline' ? 'text-white' : 'text-gray-700'}`}>Timeline</span>
                  {localConfig.bulletStyle === 'timeline' && <Check size={11} className="text-white ml-auto" />}
                </label>
              </div>
            </div>

            {/* Skills Style */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Skills Style</p>
              <div className="space-y-2">
                <label
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${localConfig.skillsStyle === 'inline' ? selectedControlClass : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  style={localConfig.skillsStyle === 'inline' ? selectedControlStyle : undefined}
                >
                  <input
                    type="radio"
                    name="skillsStyle"
                    value="inline"
                    checked={localConfig.skillsStyle === 'inline'}
                    onChange={() => setLocalConfig({ ...localConfig, skillsStyle: 'inline' })}
                    className="sr-only"
                  />
                  <span className={`text-xs font-medium ${localConfig.skillsStyle === 'inline' ? 'text-white' : 'text-gray-700'}`}>Inline</span>
                  {localConfig.skillsStyle === 'inline' && <Check size={11} className="text-white ml-auto" />}
                </label>
                <label
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${localConfig.skillsStyle === 'badges' ? selectedControlClass : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  style={localConfig.skillsStyle === 'badges' ? selectedControlStyle : undefined}
                >
                  <input
                    type="radio"
                    name="skillsStyle"
                    value="badges"
                    checked={localConfig.skillsStyle === 'badges'}
                    onChange={() => setLocalConfig({ ...localConfig, skillsStyle: 'badges' })}
                    className="sr-only"
                  />
                  <span className={`text-xs font-medium ${localConfig.skillsStyle === 'badges' ? 'text-white' : 'text-gray-700'}`}>Badges</span>
                  {localConfig.skillsStyle === 'badges' && <Check size={11} className="text-white ml-auto" />}
                </label>
              </div>
            </div>

            {/* Color Theme */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Accent Color</p>
              <div className="grid grid-cols-5 gap-2">
                {COLOR_THEMES.slice(1).map(theme => ( // Skip 'none' default
                  <button
                    key={theme.id}
                    onClick={() => setLocalConfig({ ...localConfig, accentColor: theme.accent })}
                    className={`w-full aspect-square rounded-lg border-2 transition-all ${localConfig.accentColor === theme.accent ? 'border-transparent scale-110 shadow-[0_4px_14px_rgba(16,185,129,0.4)]' : 'border-gray-200 hover:border-gray-300'}`}
                    style={localConfig.accentColor === theme.accent ? selectedControlStyle : { backgroundColor: theme.accent }}
                    title={theme.label}
                  />
                ))}
                <label
                  className={`relative flex aspect-square w-full cursor-pointer items-center justify-center rounded-lg border-2 transition-all ${
                    !COLOR_THEMES.slice(1).some(theme => theme.accent === localConfig.accentColor)
                      ? 'border-transparent scale-110 shadow-[0_4px_14px_rgba(16,185,129,0.4)]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  style={
                    !COLOR_THEMES.slice(1).some(theme => theme.accent === localConfig.accentColor)
                      ? selectedControlStyle
                      : undefined
                  }
                  title="Custom Color"
                >
                  <input
                    type="color"
                    value={localConfig.accentColor || '#10b981'}
                    onChange={(e) => setLocalConfig({ ...localConfig, accentColor: e.target.value })}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Pick custom accent color"
                  />
                  <Pipette
                    size={18}
                    className={
                      !COLOR_THEMES.slice(1).some(theme => theme.accent === localConfig.accentColor)
                        ? 'text-white'
                        : 'text-zinc-500'
                    }
                  />
                </label>
              </div>
            </div>

            {/* Font */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Font</p>
              <div className="grid grid-cols-2 gap-2">
                {FONT_OPTIONS.map((font) => {
                  const isSelected = (FONT_OPTIONS.find(f => f.value === localConfig.fontFamily)?.id ?? DEFAULT_FONT_ID) === font.id

                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => setLocalConfig({ ...localConfig, fontFamily: font.value })}
                      className={`rounded-xl border px-3 py-3 text-left transition-all ${
                        isSelected
                          ? 'border-transparent text-white shadow-[0_4px_14px_rgba(16,185,129,0.4)]'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                      style={isSelected ? selectedControlStyle : { fontFamily: font.value }}
                    >
                      <div
                        className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-zinc-900'}`}
                        style={{ fontFamily: font.value }}
                      >
                        {font.label}
                      </div>
                      <div
                        className={`mt-1 text-[11px] ${isSelected ? 'text-white/75' : 'text-zinc-500'}`}
                        style={{ fontFamily: font.value }}
                      >
                        The quick brown fox
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Density */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Spacing</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setLocalConfig({ ...localConfig, density: 'compressed' })}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${localConfig.density === 'compressed' ? 'border-transparent text-white shadow-[0_4px_14px_rgba(16,185,129,0.4)]' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                  style={localConfig.density === 'compressed' ? selectedControlStyle : undefined}
                >
                  Compressed
                </button>
                <button
                  onClick={() => setLocalConfig({ ...localConfig, density: 'relaxed' })}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${localConfig.density === 'relaxed' ? 'border-transparent text-white shadow-[0_4px_14px_rgba(16,185,129,0.4)]' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                  style={localConfig.density === 'relaxed' ? selectedControlStyle : undefined}
                >
                  Relaxed
                </button>
              </div>
            </div>
          </div>

          {/* Fixed Action Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/70 backdrop-blur-xl border-t border-zinc-100 flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/50 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className={`flex-[2] py-3 text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                hasChanges 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20 cursor-pointer' 
                  : 'bg-zinc-200 text-zinc-400 shadow-none cursor-not-allowed'
              }`}
              disabled={!hasChanges}
            >
              <Check size={14} strokeWidth={3} />
              Apply Changes
            </button>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col" style={{ background: previewBackground }}>
          <div className="mb-4 flex justify-between items-center">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Live Preview</p>
            <span className="text-xs text-gray-400">Scale: 100%</span>
          </div>

          <div className="flex-1 flex items-start justify-center overflow-auto">
            <div
              style={{
                transform: 'scale(1)',
                transformOrigin: 'top left',
                width: '794px',
              }}
            >
              <UniversalTemplate
                data={resumeData ?? SAMPLE_RESUME}
                isEditing={false}
                onFieldChange={() => {}}
                config={localConfig}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
