'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { ComponentType } from 'react'
import {
  getAllTemplates,
  getTemplate,
  type TemplateRegistryEntry,
} from '@/components/templates/registry'
import TemplateSkeleton from '@/components/templates/TemplateSkeleton'
import { updateResumeData } from '@/app/dashboard/resumes/actions'
import { generateDOCX } from '@/lib/docxGenerator'
import type { ResumeData, Resume, TemplateId, Profile, TemplateProps } from '@/types'
import { useProGate } from '@/lib/hooks/useProGate'
import { ProGateModal } from '@/components/shared/ProGateModal'

interface Props {
  initialTemplateId: TemplateId
  initialResumes: Resume[]
  profile: Profile | null
}

// ─── setNestedValue ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setNestedValue(obj: any, path: string, value: string): any {
  const keys = path.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = { ...obj }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = result
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    const nextKey = keys[i + 1]
    const isIndex = !isNaN(Number(nextKey))
    current[key] = isIndex ? [...current[key]] : { ...current[key] }
    current = current[key]
  }
  current[keys[keys.length - 1]] = value
  return result
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TemplatePreviewClient({
  initialTemplateId,
  initialResumes,
  profile,
}: Props) {
  const searchParams = useSearchParams()
  const { isPro, requirePro, blockedFeature, clearBlockedFeature } = useProGate()
  const allTemplates = getAllTemplates()

  const initialResumeId = searchParams.get('resumeId') ?? initialResumes[0]?.id ?? ''

  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>(initialTemplateId)
  const [selectedResumeId, setSelectedResumeId] = useState(initialResumeId)
  const [displayData, setDisplayData] = useState<ResumeData | null>(null)
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<ResumeData | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [showMobilePreview, setShowMobilePreview] = useState(false)

  const cacheRef = useRef(new Map<string, ResumeData>())

  const selectedResume = initialResumes.find(r => r.id === selectedResumeId)
  const entry = getTemplate(selectedTemplateId) as TemplateRegistryEntry
  const TemplateComponent = entry.component

  // ── Load data on selection change ──────────────────────────────────────────
  useEffect(() => {
    if (!selectedResumeId || !selectedResume?.parsed_data) {
      setDisplayData(null)
      return
    }

    const cacheKey = `${selectedTemplateId}-${selectedResumeId}`

    if (cacheRef.current.has(cacheKey)) {
      setDisplayData(cacheRef.current.get(cacheKey)!)
      setIsLoadingTemplate(false)
      return
    }

    if (isPro) {
      setIsLoadingTemplate(true)
      fetch('/api/resume/fill-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: selectedResume.parsed_data,
          templateId: selectedTemplateId,
        }),
      })
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data) {
            cacheRef.current.set(cacheKey, json.data)
            setDisplayData(json.data)
          } else {
            // Fallback to raw data on error
            setDisplayData(selectedResume.parsed_data!)
          }
        })
        .catch(() => setDisplayData(selectedResume.parsed_data!))
        .finally(() => setIsLoadingTemplate(false))
    } else {
      // Free users: use raw parsed_data client-side
      cacheRef.current.set(cacheKey, selectedResume.parsed_data)
      setDisplayData(selectedResume.parsed_data)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplateId, selectedResumeId])

  // ── Edit handler ───────────────────────────────────────────────────────────
  function handleFieldChange(path: string, value: string) {
    setEditedData(prev => setNestedValue(prev ?? displayData, path, value))
  }

  // ── Save handler ───────────────────────────────────────────────────────────
  async function handleSave() {
    if (!editedData || !selectedResumeId) return
    setIsSaving(true)
    const result = await updateResumeData(selectedResumeId, editedData)
    setIsSaving(false)
    if (result && 'error' in result) {
      setSaveMessage('Save failed. Try again.')
    } else {
      setSaveMessage('Saved!')
      // Update cache with edited data
      const cacheKey = `${selectedTemplateId}-${selectedResumeId}`
      cacheRef.current.set(cacheKey, editedData)
      setDisplayData(editedData)
      setEditedData(null)
    }
    setTimeout(() => setSaveMessage(''), 3000)
  }

  // ── PDF download ───────────────────────────────────────────────────────────
  function handlePDF() {
    window.print()
  }

  // ── DOCX download ──────────────────────────────────────────────────────────
  function handleDOCX() {
    if (!requirePro('docx_download')) return
    const data = editedData ?? displayData
    if (!data) return
    const name = data.name || 'resume'
    generateDOCX(data, `${name}-${selectedTemplateId}.docx`)
  }

  const activeData = editedData ?? displayData

  // ── Mobile guard ──────────────────────────────────────────────────────────
  if (!showMobilePreview) {
    return (
      <>
        {/* Mobile message — hidden on md+ */}
        <div className="md:hidden flex flex-col items-center justify-center min-h-[60vh] text-center px-6 space-y-4">
          <p className="text-gray-600 text-sm">
            Template preview works best on tablet or desktop.
          </p>
          <button
            onClick={() => setShowMobilePreview(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg"
          >
            View anyway
          </button>
        </div>

        {/* Full layout — visible on md+ */}
        <div className="hidden md:flex h-screen overflow-hidden">
          <PreviewLayout
            allTemplates={allTemplates}
            selectedTemplateId={selectedTemplateId}
            setSelectedTemplateId={setSelectedTemplateId}
            initialResumes={initialResumes}
            selectedResumeId={selectedResumeId}
            setSelectedResumeId={setSelectedResumeId}
            isPro={isPro}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            editedData={editedData}
            isSaving={isSaving}
            saveMessage={saveMessage}
            handleSave={handleSave}
            handlePDF={handlePDF}
            handleDOCX={handleDOCX}
            isLoadingTemplate={isLoadingTemplate}
            activeData={activeData}
            TemplateComponent={TemplateComponent}
            handleFieldChange={handleFieldChange}
          />
        </div>
        <ProGateModal feature={blockedFeature} onClose={clearBlockedFeature} />
      </>
    )
  }

  return (
    <>
      <PreviewLayout
        allTemplates={allTemplates}
        selectedTemplateId={selectedTemplateId}
        setSelectedTemplateId={setSelectedTemplateId}
        initialResumes={initialResumes}
        selectedResumeId={selectedResumeId}
        setSelectedResumeId={setSelectedResumeId}
        isPro={isPro}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        editedData={editedData}
        isSaving={isSaving}
        saveMessage={saveMessage}
        handleSave={handleSave}
        handlePDF={handlePDF}
        handleDOCX={handleDOCX}
        isLoadingTemplate={isLoadingTemplate}
        activeData={activeData}
        TemplateComponent={TemplateComponent}
        handleFieldChange={handleFieldChange}
      />
      <ProGateModal feature={blockedFeature} onClose={clearBlockedFeature} />
    </>
  )
}

// ─── Layout sub-component (avoids duplication) ────────────────────────────────

interface LayoutProps {
  allTemplates: TemplateRegistryEntry[]
  selectedTemplateId: TemplateId
  setSelectedTemplateId: (id: TemplateId) => void
  initialResumes: Resume[]
  selectedResumeId: string
  setSelectedResumeId: (id: string) => void
  isPro: boolean
  isEditing: boolean
  setIsEditing: (v: boolean) => void
  editedData: ResumeData | null
  isSaving: boolean
  saveMessage: string
  handleSave: () => void
  handlePDF: () => void
  handleDOCX: () => void
  isLoadingTemplate: boolean
  activeData: ResumeData | null
  TemplateComponent: ComponentType<TemplateProps>
  handleFieldChange: (path: string, value: string) => void
}

function PreviewLayout({
  allTemplates,
  selectedTemplateId,
  setSelectedTemplateId,
  initialResumes,
  selectedResumeId,
  setSelectedResumeId,
  isPro,
  isEditing,
  setIsEditing,
  editedData,
  isSaving,
  saveMessage,
  handleSave,
  handlePDF,
  handleDOCX,
  isLoadingTemplate,
  activeData,
  TemplateComponent,
  handleFieldChange,
}: LayoutProps) {
  const templateRef = useRef<HTMLDivElement>(null)
  const [templateHeight, setTemplateHeight] = useState(0)

  useEffect(() => {
    const el = templateRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      setTemplateHeight(entries[0]?.contentRect.height ?? 0)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const PAGE_H = 1123
  const isTooLong = templateHeight > PAGE_H * 2
  // Number of visible page break lines (between pages 1–2 and 2–3, max 2 lines)
  const pageBreakCount = Math.min(Math.floor(templateHeight / PAGE_H), 2)

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          body > *:not(#resume-print-wrapper) { display: none !important; }
          #resume-print-wrapper { position: fixed; top: 0; left: 0; width: 794px; }
        }
      `}</style>

      <div className="flex h-screen overflow-hidden w-full">
        {/* ── Left sidebar ── */}
        <div className="w-72 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-y-auto">
          {/* Back link */}
          <div className="px-4 py-4 border-b border-gray-100">
            <a
              href="/dashboard/templates"
              className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
            >
              ← Templates
            </a>
          </div>

          {/* Template switcher */}
          <div className="px-4 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Template
            </p>
            <div className="space-y-1">
              {allTemplates.map(t => (
                <button
                  key={t.config.id}
                  onClick={() => setSelectedTemplateId(t.config.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    selectedTemplateId === t.config.id
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: t.config.accentColor }}
                  />
                  {t.config.name}
                </button>
              ))}
            </div>
          </div>

          {/* Resume picker */}
          {initialResumes.length > 0 && (
            <div className="px-4 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Resume
              </p>
              <select
                value={selectedResumeId}
                onChange={e => setSelectedResumeId(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {initialResumes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Download */}
          <div className="px-4 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Download
            </p>
            {isPro ? (
              <div className="space-y-2">
                <button
                  onClick={handlePDF}
                  className="w-full py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Download PDF
                </button>
                <button
                  onClick={handleDOCX}
                  className="w-full py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Download DOCX
                </button>
              </div>
            ) : (
              <a
                href="/dashboard/billing"
                className="block w-full py-2 text-sm font-medium text-center text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Upgrade for downloads
              </a>
            )}
          </div>

          {/* Open in Builder */}
          <div className="px-4 py-4 border-b border-gray-100">
            {selectedResumeId ? (
              <Link
                href={`/dashboard/builder/${selectedResumeId}?template=${selectedTemplateId}`}
                className="block w-full py-2 text-sm font-medium text-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Open in Builder
              </Link>
            ) : (
              <Link
                href="/dashboard/resumes"
                className="block w-full py-2 text-sm font-medium text-center text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Open in Builder
              </Link>
            )}
            {!selectedResumeId && (
              <p className="mt-1.5 text-xs text-gray-400 text-center">Upload a resume first</p>
            )}
          </div>

          {/* Edit mode */}
          <div className="px-4 py-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Edit Mode
            </p>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsEditing(!isEditing)}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  isEditing ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    isEditing ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </div>
              <span className="text-sm text-gray-700">
                {isEditing ? 'Editing' : 'Preview'}
              </span>
            </label>

            {isEditing && editedData && (
              <div className="mt-3">
                {saveMessage && (
                  <p className="text-xs text-green-600 mb-2">{saveMessage}</p>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right preview area ── */}
        <div className="flex-1 bg-gray-100 overflow-auto">
          <div className="flex justify-center p-8 min-h-full">
            <div id="resume-print-wrapper">
              {isTooLong && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 text-center">
                  ⚠ Your resume exceeds 2 pages. Recruiters typically prefer 1–2 pages max. Consider trimming experience bullets or skills.
                </div>
              )}
              <div className="relative">
                <div className="shadow-xl bg-white" ref={templateRef}>
                  {isLoadingTemplate ? (
                    <TemplateSkeleton />
                  ) : activeData ? (
                    <TemplateComponent
                      data={activeData}
                      isEditing={isEditing}
                      onFieldChange={handleFieldChange}
                    />
                  ) : (
                    <div className="w-[794px] min-h-[1123px] flex items-center justify-center text-gray-400 text-sm">
                      {initialResumes.length === 0
                        ? 'Upload a resume to preview templates.'
                        : 'Select a resume to continue.'}
                    </div>
                  )}
                </div>
                {Array.from({ length: pageBreakCount }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{ top: (i + 1) * PAGE_H }}
                  >
                    <div className="border-t-2 border-dashed border-blue-300" />
                    <span className="absolute right-0 -top-5 text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
                      Page {i + 2}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
