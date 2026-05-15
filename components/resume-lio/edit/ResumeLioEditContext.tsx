'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ResumeData, ResumeLioSocialLinks } from '@/types'

export interface ResumeLioEditContextValue {
  editMode: boolean
  resumeData: ResumeData
  socialLinks: ResumeLioSocialLinks
  imageOverrides: Record<string, string>
  activeField: string | null
  setActiveField: (field: string | null) => void
  updateField: (path: string, value: string) => void
  updateSocialLink: (key: keyof ResumeLioSocialLinks, value: string) => void
  updateImage: (key: string, url: string) => void
  hasChanges: boolean
  save: () => Promise<void>
  saving: boolean
}

const ResumeLioEditContext = createContext<ResumeLioEditContextValue | null>(null)

export function useResumeLioEdit() {
  return useContext(ResumeLioEditContext)
}

/** Immutably set a value at a dot-path (e.g. "experience.0.title") */
function setDeepValue(obj: unknown, path: string, value: string): unknown {
  const parts = path.split('.')
  function recurse(cur: unknown, depth: number): unknown {
    if (depth === parts.length) return value
    const key = parts[depth]
    const idx = parseInt(key, 10)
    if (!isNaN(idx)) {
      const arr = Array.isArray(cur) ? [...cur] : []
      arr[idx] = recurse(arr[idx], depth + 1)
      return arr
    }
    const o = (cur && typeof cur === 'object' ? { ...(cur as object) } : {}) as Record<string, unknown>
    o[key] = recurse(o[key], depth + 1)
    return o
  }
  return recurse(obj, 0)
}

function hydrateFallbackSkillSection(data: ResumeData, path: string): ResumeData {
  if (!path.startsWith('skillSections.')) return data

  const hasSkillSections = data.skillSections?.some(section =>
    (section.skills ?? []).some(skill => skill.trim().length > 0),
  )
  if (hasSkillSections) return data

  const skills = (data.skills ?? []).map(skill => skill.trim()).filter(Boolean)
  if (skills.length === 0) return data

  return {
    ...data,
    skillSections: [
      {
        title: 'Core Skills',
        tag: '',
        skills,
      },
    ],
  }
}

interface ProviderProps {
  children: React.ReactNode
  initialData: ResumeData
  initialSocialLinks: ResumeLioSocialLinks
  initialImageOverrides?: Record<string, string>
  editMode?: boolean
  onSave: (
    data: ResumeData,
    socialLinks: ResumeLioSocialLinks,
    imageOverrides: Record<string, string>
  ) => Promise<void>
}

export function ResumeLioEditProvider({
  children,
  initialData,
  initialSocialLinks,
  initialImageOverrides = {},
  editMode = false,
  onSave,
}: ProviderProps) {
  const [resumeData, setResumeData] = useState<ResumeData>(initialData)
  const [socialLinks, setSocialLinks] = useState<ResumeLioSocialLinks>(initialSocialLinks)
  const [imageOverrides, setImageOverrides] = useState<Record<string, string>>(initialImageOverrides)
  const [activeField, setActiveField] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editMode) return
    setResumeData(initialData)
    setSocialLinks(initialSocialLinks)
    setImageOverrides(initialImageOverrides)
    setHasChanges(false)
  }, [editMode, initialData, initialSocialLinks, initialImageOverrides])

  const updateField = useCallback((path: string, value: string) => {
    const nextValue = path === 'name' ? value.replace(/\s+/g, ' ').trim() : value
    setResumeData(prev => setDeepValue(hydrateFallbackSkillSection(prev, path), path, nextValue) as ResumeData)
    setHasChanges(true)
  }, [])

  const updateSocialLink = useCallback((key: keyof ResumeLioSocialLinks, value: string) => {
    setSocialLinks(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }, [])

  const updateImage = useCallback((key: string, url: string) => {
    setImageOverrides(prev => ({ ...prev, [key]: url }))
    setHasChanges(true)
  }, [])

  const save = useCallback(async () => {
    setSaving(true)
    try {
      await onSave(resumeData, socialLinks, imageOverrides)
      setHasChanges(false)
    } finally {
      setSaving(false)
    }
  }, [resumeData, socialLinks, imageOverrides, onSave])

  return (
    <ResumeLioEditContext.Provider
      value={{
        editMode,
        resumeData,
        socialLinks,
        imageOverrides,
        activeField,
        setActiveField,
        updateField,
        updateSocialLink,
        updateImage,
        hasChanges,
        save,
        saving,
      }}
    >
      {editMode && (
        <style>{`
          .rl-editable { cursor: text !important; }
          .rl-editable:hover { outline: 1px dashed rgba(59,130,246,0.55); outline-offset: 2px; border-radius: 3px; }
          .rl-editable.rl-empty { display: inline-block; min-width: 7.5rem; min-height: 1.35em; }
          .rl-editable.rl-empty::before { content: attr(data-placeholder); color: rgba(37,99,235,0.72); font-style: italic; opacity: 0.9; }
          .rl-editable.rl-empty:hover::before { color: rgb(37,99,235); }
          .rl-editing.rl-empty { display: inline-block; min-width: 7.5rem; min-height: 1.35em; }
          .rl-editing { outline: 2px solid rgb(59,130,246) !important; outline-offset: 3px !important; border-radius: 3px !important; box-shadow: 0 0 0 4px rgba(59,130,246,0.18) !important; cursor: text !important; position: relative !important; }
          .rl-editing::before { content: 'Editing'; position: absolute; top: -26px; left: 0; background: rgb(59,130,246); color: #fff; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; white-space: nowrap; pointer-events: none; z-index: 9999; line-height: 18px; font-family: system-ui, -apple-system, sans-serif; letter-spacing: 0.03em; }
          .rl-img-wrap { position: relative; cursor: pointer; }
          .rl-img-wrap::after { content: 'Replace Image'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(59,130,246,0.0); color: transparent; font-size: 12px; font-weight: 600; font-family: system-ui, sans-serif; transition: all 0.2s; border-radius: inherit; pointer-events: none; }
          .rl-img-wrap:hover::after { background: rgba(59,130,246,0.22); color: #fff; content: 'Replace Image'; }
          .rl-img-wrap:hover { outline: 2px solid rgba(59,130,246,0.8); outline-offset: 2px; }
          .rl-link-editable { cursor: pointer !important; position: relative; }
          .rl-link-editable:hover { outline: 1px dashed rgba(168,85,247,0.6); outline-offset: 3px; border-radius: 4px; }
          .rl-link-editable::after { content: 'Edit Link'; position: absolute; top: -22px; right: 0; background: rgb(168,85,247); color: #fff; font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 3px; white-space: nowrap; pointer-events: none; z-index: 9999; line-height: 16px; font-family: system-ui, -apple-system, sans-serif; opacity: 0; transition: opacity 0.15s; }
          .rl-link-editable:hover::after { opacity: 1; }
          .resume-lio-editor-template,
          .resume-lio-editor-template * { cursor: auto !important; }
          .resume-lio-editor-template [class*="cursor-none"],
          .resume-lio-editor-template [class*="cursor-none"] * { cursor: auto !important; }
          .resume-lio-editor-template [class*="pointer-events-none"][class*="fixed"][class*="z-[9999]"] { display: none !important; }
          .resume-lio-editor-template a,
          .resume-lio-editor-template button,
          .resume-lio-editor-template [role="button"],
          .resume-lio-editor-template [data-hover],
          .resume-lio-editor-template .rl-link-editable,
          .resume-lio-editor-template .rl-img-wrap { cursor: pointer !important; }
          .resume-lio-editor-template .rl-editable,
          .resume-lio-editor-template .rl-editing { cursor: text !important; }
        `}</style>
      )}
      {children}
    </ResumeLioEditContext.Provider>
  )
}
