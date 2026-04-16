'use client'

import { useState, KeyboardEvent, useRef, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import type { ResumeData, SkillSection } from '@/types'
import { flattenSkillSections, splitSkillInput, syncResumeData } from '@/lib/resume-data'
import { useFocusFieldPath } from './useFocusFieldPath'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
  focusPath?: string | null
  onFocusHandled?: () => void
}

const EMPTY_SECTION: SkillSection = { title: '', tag: '', skills: [] }

export default function SkillsEditor({ data, onChange, focusPath, onFocusHandled }: EditorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const titleRefs = useRef<Record<number, HTMLInputElement | null>>({})
  useFocusFieldPath({ focusPath, rootRef, onHandled: onFocusHandled })
  const [inputs, setInputs] = useState<Record<number, string>>({})
  const [pendingFocusIndex, setPendingFocusIndex] = useState<number | null>(null)

  const sections = data.skillSections?.length
    ? data.skillSections
    : [{ title: 'Core Skills', skills: data.skills }]

  function commit(nextSections: SkillSection[]) {
    onChange(syncResumeData({
      ...data,
      skillSections: nextSections,
      skills: flattenSkillSections(nextSections),
    }))
  }

  function updateSection(index: number, updated: SkillSection) {
    const next = [...sections]
    next[index] = updated
    commit(next)
  }

  function addSection() {
    setPendingFocusIndex(sections.length)
    commit([...sections, { ...EMPTY_SECTION }])
  }

  function removeSection(index: number) {
    commit(sections.filter((_, i) => i !== index))
  }

  function addSkill(sectionIndex: number, raw: string) {
    const incomingSkills = splitSkillInput(raw)
    if (incomingSkills.length === 0) {
      setInputs(prev => ({ ...prev, [sectionIndex]: '' }))
      return
    }

    const current = sections[sectionIndex]
    const existing = new Set(current.skills.map(item => item.toLowerCase()))
    const nextSkills = [
      ...current.skills,
      ...incomingSkills.filter(skill => !existing.has(skill.toLowerCase())),
    ]

    updateSection(sectionIndex, {
      ...current,
      skills: nextSkills,
    })
    setInputs(prev => ({ ...prev, [sectionIndex]: '' }))
  }

  function removeSkill(sectionIndex: number, skillIndex: number) {
    const current = sections[sectionIndex]
    updateSection(sectionIndex, {
      ...current,
      skills: current.skills.filter((_, i) => i !== skillIndex),
    })
  }

  useEffect(() => {
    if (pendingFocusIndex === null) return

    const target = titleRefs.current[pendingFocusIndex]
    if (target) {
      target.focus()
      target.select()
      setPendingFocusIndex(null)
    }
  }, [pendingFocusIndex, sections.length])

  return (
    <div ref={rootRef} className="space-y-4 p-4">
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Section Title (Optional)</label>
                <input
                  ref={node => {
                    titleRefs.current[sectionIndex] = node
                  }}
                  data-field-path={`skillSections.${sectionIndex}.title`}
                  value={section.title}
                  onChange={(e) => updateSection(sectionIndex, { ...section, title: e.target.value })}
                  placeholder="Product, Tools, Collaboration..."
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {section.skills.map((skill, skillIndex) => (
                  <span
                    key={skillIndex}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(sectionIndex, skillIndex)}
                      className="text-indigo-400 hover:text-indigo-700"
                      aria-label={`Remove ${skill}`}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>

              <input
                data-field-path={focusPath?.startsWith(`skillSections.${sectionIndex}.skills`) ? focusPath : `skillSections.${sectionIndex}.skills`}
                value={inputs[sectionIndex] ?? ''}
                onChange={(e) => setInputs(prev => ({ ...prev, [sectionIndex]: e.target.value }))}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addSkill(sectionIndex, (inputs[sectionIndex] ?? '').replace(/,$/, ''))
                  }
                }}
                onBlur={() => {
                  if (inputs[sectionIndex]?.trim()) addSkill(sectionIndex, inputs[sectionIndex])
                }}
                placeholder="Type a skill, press Enter or comma to add"
                className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {sections.length > 1 && (
              <button
                onClick={() => removeSection(sectionIndex)}
                className="rounded-full p-2 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                aria-label="Remove section"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      ))}

      <button
        onClick={addSection}
        className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-indigo-400 hover:text-indigo-600"
      >
        <Plus size={14} /> Add skill section
      </button>
    </div>
  )
}
