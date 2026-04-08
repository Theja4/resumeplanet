'use client'

import { useState, type ReactNode } from 'react'
import { Check, Pipette, ShieldCheck, Sparkles } from 'lucide-react'
import TemplatePresetThumbnail from '@/components/builder/TemplatePresetThumbnail'
import UniversalTemplate from '@/components/templates/UniversalTemplate'
import { SAMPLE_RESUME } from '@/lib/sampleResumeData'
import {
  ATS_TEMPLATE_PRESETS,
  BULLET_STYLE_OPTIONS,
  COLOR_THEMES,
  CONTACT_STYLE_OPTIONS,
  DATE_LAYOUT_OPTIONS,
  DEFAULT_FONT_ID,
  findMatchingTemplatePreset,
  FONT_OPTIONS,
  HEADER_STYLE_OPTIONS,
  NAME_SIZE_OPTIONS,
  SECTION_HEADING_OPTIONS,
  SKILLS_STYLE_OPTIONS,
  sanitizeUniversalConfig,
  type TemplateOption,
  updateUniversalConfig,
} from '@/lib/templateOptions'
import type { ResumeData, UniversalConfig } from '@/types'

interface Props {
  isOpen: boolean
  config: UniversalConfig
  onConfigChange: (config: UniversalConfig) => void
  onClose: () => void
  resumeData?: ResumeData | null
}

interface ChoiceGridProps<T extends string> {
  title: string
  options: Array<TemplateOption<T>>
  value: T
  onSelect: (value: T) => void
  columns?: string
}

function ControlHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-[17px] font-bold leading-none tracking-tight text-zinc-950">
        {title}
      </p>
      <div className="h-px flex-1 bg-zinc-200" />
    </div>
  )
}

function ChoiceGrid<T extends string>({
  title,
  options,
  value,
  onSelect,
  columns = 'grid-cols-2',
}: ChoiceGridProps<T>) {
  return (
    <div className="space-y-3.5">
      <ControlHeading title={title} />
      <div className={`grid gap-2.5 ${columns}`}>
        {options.map((option) => {
          const isSelected = value === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-[0_12px_28px_rgba(16,185,129,0.14)]'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold leading-tight">{option.label}</div>
                  <div className={`mt-1.5 text-[12px] leading-[1.35] ${isSelected ? 'text-emerald-700' : 'text-zinc-500'}`}>
                    {option.description}
                  </div>
                </div>
                {isSelected && <Check size={14} className="mt-0.5 shrink-0 text-emerald-600" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const DENSITY_OPTIONS: Array<TemplateOption<UniversalConfig['density']>> = [
  { value: 'compressed', label: 'Compressed', description: 'Tighter spacing for one-page resumes.' },
  { value: 'relaxed', label: 'Relaxed', description: 'More breathing room with the same structure.' },
]

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[24px] border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <div className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">{title}</div>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">{description}</p>
      </div>
      {children}
    </section>
  )
}

export default function TemplateCustomizerModal({
  isOpen,
  config,
  onConfigChange,
  onClose,
  resumeData = SAMPLE_RESUME,
}: Props) {
  const baseConfig = sanitizeUniversalConfig(config)
  const [localConfig, setLocalConfig] = useState<UniversalConfig>(() => baseConfig)
  const [activeView, setActiveView] = useState<'customize' | 'presets'>('presets')
  const hasChanges = JSON.stringify(localConfig) !== JSON.stringify(baseConfig)
  const selectedPresetId = findMatchingTemplatePreset(localConfig)
  const selectedPreset = ATS_TEMPLATE_PRESETS.find(preset => preset.id === selectedPresetId) ?? null
  const matchingTheme = COLOR_THEMES.find(theme => theme.accent === localConfig.accentColor) ?? null
  const activeThemeLabel = matchingTheme?.label ?? 'Custom'
  const previewBackground = matchingTheme
    ? `radial-gradient(circle at top, ${matchingTheme.swatches[2]}dd 0%, ${matchingTheme.swatches[2]}88 24%, #ffffff 70%)`
    : `radial-gradient(circle at top, ${localConfig.accentColor}20 0%, ${localConfig.accentColor}08 24%, #ffffff 70%)`
  const previewScale = 0.82
  const previewWidth = Math.round(794 * previewScale)

  function updateConfig(patch: Partial<UniversalConfig>) {
    setLocalConfig(current => updateUniversalConfig(current, patch))
  }

  function handleApply() {
    onConfigChange(sanitizeUniversalConfig(localConfig))
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-[90rem] overflow-hidden rounded-[30px] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex w-[31rem] shrink-0 flex-col border-r border-zinc-100 bg-zinc-50/80 pt-7">
          <div className="border-b border-zinc-100 px-6 pb-5">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-zinc-100">
              <button
                type="button"
                onClick={() => setActiveView('presets')}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-all ${
                  activeView === 'presets'
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'text-zinc-500 hover:bg-zinc-100'
                }`}
              >
                <Sparkles size={14} />
                {ATS_TEMPLATE_PRESETS.length} Presets
              </button>
              <button
                type="button"
                onClick={() => setActiveView('customize')}
                className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-all ${
                  activeView === 'customize'
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'text-zinc-500 hover:bg-zinc-100'
                }`}
              >
                Customize
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-32 pt-6">
            {activeView === 'presets' ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-800">
                  Best first step: pick the closest preset, then use Customize for fonts, spacing, bullets, and
                  colors.
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {ATS_TEMPLATE_PRESETS.map((preset) => {
                    const isSelected = selectedPresetId === preset.id

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setLocalConfig(preset.config)}
                        className={`rounded-[24px] border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 shadow-[0_14px_36px_rgba(16,185,129,0.14)]'
                            : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]'
                        }`}
                      >
                        <TemplatePresetThumbnail config={preset.config} />
                        <div className="mt-3 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-zinc-950">{preset.label}</div>
                            <div className="mt-1 text-[11px] leading-4 text-zinc-500">{preset.description}</div>
                          </div>
                          {isSelected && (
                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                              Current
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                  <ShieldCheck size={13} />
                  ATS Friendly Style Only
                </div>

                <SectionCard
                  title="Structure"
                  description="Adjust hierarchy and scanning rhythm without changing the ATS-safe single-column layout."
                >
                  <div className="space-y-4">
                    <ChoiceGrid
                      title="Header Style"
                      options={HEADER_STYLE_OPTIONS}
                      value={localConfig.headerStyle}
                      onSelect={(headerStyle) => updateConfig({ headerStyle })}
                      columns="grid-cols-2"
                    />

                    <ChoiceGrid
                      title="Section Headings"
                      options={SECTION_HEADING_OPTIONS}
                      value={localConfig.sectionHeadingStyle}
                      onSelect={(sectionHeadingStyle) => updateConfig({ sectionHeadingStyle })}
                      columns="grid-cols-2"
                    />

                    <div className="space-y-4">
                      <ChoiceGrid
                        title="Contact Layout"
                        options={CONTACT_STYLE_OPTIONS}
                        value={localConfig.contactStyle}
                        onSelect={(contactStyle) => updateConfig({ contactStyle })}
                        columns="grid-cols-2"
                      />

                      <ChoiceGrid
                        title="Date Placement"
                        options={DATE_LAYOUT_OPTIONS}
                        value={localConfig.dateLayout}
                        onSelect={(dateLayout) => updateConfig({ dateLayout })}
                        columns="grid-cols-2"
                      />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Typography"
                  description="Control how prominent the header feels and how tightly the page packs content."
                >
                  <div className="space-y-4">
                    <ChoiceGrid
                      title="Name Size"
                      options={NAME_SIZE_OPTIONS}
                      value={localConfig.nameSize}
                      onSelect={(nameSize) => updateConfig({ nameSize })}
                      columns="grid-cols-2"
                    />

                    <div>
                      <div className="mb-3">
                        <ControlHeading title="Font" />
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {FONT_OPTIONS.map((font) => {
                          const selectedFontId =
                            FONT_OPTIONS.find(item => item.value === localConfig.fontFamily)?.id ?? DEFAULT_FONT_ID
                          const isSelected = selectedFontId === font.id

                          return (
                            <button
                              key={font.id}
                              type="button"
                              onClick={() => updateConfig({ fontFamily: font.value })}
                              className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                                isSelected
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-[0_12px_28px_rgba(16,185,129,0.14)]'
                                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                              }`}
                              style={{ fontFamily: font.value }}
                            >
                              <div className="text-[15px] font-bold leading-tight">{font.label}</div>
                              <div className={`mt-1.5 text-[12px] leading-[1.35] ${isSelected ? 'text-emerald-700' : 'text-zinc-500'}`}>
                                The quick brown fox
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <ChoiceGrid
                      title="Spacing"
                      options={DENSITY_OPTIONS}
                      value={localConfig.density}
                      onSelect={(density) => updateConfig({ density })}
                      columns="grid-cols-2"
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  title="Details"
                  description="Polish bullets, skills formatting, and accent color while keeping the page readable."
                >
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <ChoiceGrid
                        title="Bullet Style"
                        options={BULLET_STYLE_OPTIONS}
                        value={localConfig.bulletStyle}
                        onSelect={(bulletStyle) => updateConfig({ bulletStyle })}
                        columns="grid-cols-2"
                      />

                      <ChoiceGrid
                        title="Skills Format"
                        options={SKILLS_STYLE_OPTIONS}
                        value={localConfig.skillsStyle}
                        onSelect={(skillsStyle) => updateConfig({ skillsStyle })}
                        columns="grid-cols-2"
                      />
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <ControlHeading title="Accent Color" />
                        <span className="text-[11px] font-semibold text-zinc-500">{activeThemeLabel}</span>
                      </div>

                      <div className="grid grid-cols-5 gap-2.5">
                        {COLOR_THEMES.slice(1).map((theme) => (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => updateConfig({ accentColor: theme.accent })}
                            className={`aspect-square w-full rounded-xl border-2 transition-all ${
                              localConfig.accentColor === theme.accent
                                ? 'scale-110 border-transparent shadow-[0_6px_18px_rgba(16,185,129,0.35)]'
                                : 'border-zinc-200 hover:border-zinc-300'
                            }`}
                            style={{ backgroundColor: theme.accent }}
                            title={theme.label}
                          />
                        ))}

                        <label
                          className={`relative flex aspect-square w-full cursor-pointer items-center justify-center rounded-xl border-2 transition-all ${
                            !COLOR_THEMES.slice(1).some(theme => theme.accent === localConfig.accentColor)
                              ? 'scale-110 border-emerald-500 bg-emerald-50 shadow-[0_6px_18px_rgba(16,185,129,0.2)]'
                              : 'border-zinc-200 bg-white hover:border-zinc-300'
                          }`}
                          title="Custom Color"
                        >
                          <input
                            type="color"
                            value={localConfig.accentColor || '#10b981'}
                            onChange={(event) => updateConfig({ accentColor: event.target.value })}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            aria-label="Pick custom accent color"
                          />
                          <Pipette
                            size={18}
                            className={
                              !COLOR_THEMES.slice(1).some(theme => theme.accent === localConfig.accentColor)
                                ? 'text-emerald-700'
                                : 'text-zinc-500'
                            }
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 border-t border-zinc-100 bg-white/88 p-6 backdrop-blur-xl">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl py-3 text-xs font-bold uppercase tracking-[0.18em] text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className={`flex-[2] rounded-xl py-3 text-xs font-bold uppercase tracking-[0.18em] transition-all ${
                hasChanges
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700'
                  : 'cursor-not-allowed bg-zinc-200 text-zinc-400 shadow-none'
              }`}
              disabled={!hasChanges}
            >
              Apply Changes
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto p-8" style={{ background: previewBackground }}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">Live Preview</p>
              <p className="mt-1 text-sm text-zinc-500">
                Scaled down so you can compare more of the page without as much scrolling.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {selectedPreset && (
                <span className="rounded-full bg-white/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 ring-1 ring-zinc-200">
                  {selectedPreset.label}
                </span>
              )}
              <span className="rounded-full bg-white/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 ring-1 ring-zinc-200">
                82% view
              </span>
            </div>
          </div>

          <div className="flex flex-1 items-start justify-center overflow-auto pb-6">
            <div className="rounded-[32px] bg-white/80 p-4 shadow-[0_28px_80px_rgba(15,23,42,0.14)] ring-1 ring-white/80">
              <div style={{ width: `${previewWidth}px` }}>
                <div
                  style={{
                    transform: `scale(${previewScale})`,
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
      </div>
    </div>
  )
}
