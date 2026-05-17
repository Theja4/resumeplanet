'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Save, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { ResumeLioTemplateRenderer } from '@/components/resume-lio/ResumeLioTemplateRenderer'
import { ResumeLioEditProvider, useResumeLioEdit } from '@/components/resume-lio/edit/ResumeLioEditContext'
import { updateResumeLioSite } from './actions'
import type { ResumeData, ResumeLioSite, ResumeLioSocialLinks, ResumeLioTemplateId } from '@/types'

function SavedToast({ show }: { show: boolean }) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>
    let t2: ReturnType<typeof setTimeout>
    if (show) {
      setMounted(true)
      t1 = setTimeout(() => setVisible(true), 10)
    } else {
      setVisible(false)
      t2 = setTimeout(() => setMounted(false), 350)
    }
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [show])

  if (!mounted) return null

  return (
    <div
      className="fixed top-6 right-6 z-[9999] pointer-events-none"
      style={{
        transform: `translateY(${visible ? '0px' : '-14px'})`,
        opacity: visible ? 1 : 0,
        transition: visible
          ? 'opacity 300ms ease, transform 450ms cubic-bezier(0.34,1.56,0.64,1)'
          : 'opacity 280ms ease-in, transform 280ms ease-in',
      }}
    >
      <div className="flex items-center gap-2.5 rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-emerald-500">
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        Saved
      </div>
    </div>
  )
}

/* ── Inner toolbar – must be inside the Provider to access context ── */
function EditorToolbar({
  siteName,
  published,
  justSaved,
  saveError,
  onClose,
  onTogglePublish,
}: {
  siteName: string
  published: boolean
  justSaved: boolean
  saveError: string | null
  onClose: () => void
  onTogglePublish: () => void
}) {
  const ctx = useResumeLioEdit()!
  return (
    <div className="relative z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2.5 shadow-sm print:hidden">
      <button
        onClick={onClose}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
      >
        <ArrowLeft size={15} /> Back
      </button>
      <div className="h-5 w-px bg-gray-200" />
      <span className="hidden text-sm text-gray-500 sm:block">
        Editing <span className="font-semibold text-gray-800">{siteName}</span>
      </span>
      <div className="flex-1" />

      {saveError && (
        <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">
          <AlertCircle size={12} /> {saveError}
        </span>
      )}

      <button
        onClick={onTogglePublish}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
          published
            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
        }`}
      >
        {published ? <EyeOff size={14} /> : <Eye size={14} />}
        {published ? 'Unpublish' : 'Publish'}
      </button>

      {ctx.hasChanges && (
        <button
          onClick={ctx.save}
          disabled={ctx.saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          <Save size={14} />
          {ctx.saving ? 'Saving…' : 'Save Changes'}
        </button>
      )}
    </div>
  )
}

/* ── Inner template pane – uses context for live data ── */
function LiveTemplate({ templateId }: { templateId: ResumeLioTemplateId }) {
  const ctx = useResumeLioEdit()!
  return (
    <ResumeLioTemplateRenderer
      templateId={templateId}
      data={ctx.resumeData}
      socialLinks={ctx.socialLinks}
      imageOverrides={ctx.imageOverrides}
    />
  )
}

/* ── Public component ── */
interface ResumeLioEditorViewProps {
  site: ResumeLioSite
  onClose: () => void
  onSaved: (site: ResumeLioSite) => void
}

export function ResumeLioEditorView({ site, onClose, onSaved }: ResumeLioEditorViewProps) {
  const [published, setPublished] = useState(site.published)
  const [justSaved, setJustSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSave = useCallback(
    async (
      data: ResumeData,
      socialLinks: ResumeLioSocialLinks,
      imageOverrides: Record<string, string>,
    ) => {
      setSaveError(null)
      const result = await updateResumeLioSite({
        resume_data: data,
        social_links: socialLinks,
        image_overrides: imageOverrides,
      })
      if (result.error) {
        setSaveError(result.error)
        throw new Error(result.error)
      }
      if (result.data) {
        onSaved(result.data as ResumeLioSite)
        setJustSaved(true)
        setTimeout(() => setJustSaved(false), 2500)
      }
    },
    [onSaved],
  )

  const handleTogglePublish = async () => {
    const next = !published
    setPublished(next)
    const result = await updateResumeLioSite({ published: next })
    if (result.error) {
      setPublished(!next)
      setSaveError(result.error)
    } else if (result.data) {
      onSaved(result.data as ResumeLioSite)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-white">
      <SavedToast show={justSaved} />
      <ResumeLioEditProvider
        initialData={site.resume_data as ResumeData}
        initialSocialLinks={site.social_links as ResumeLioSocialLinks}
        initialImageOverrides={(site.image_overrides as Record<string, string>) ?? {}}
        editMode
        onSave={handleSave}
      >
        <EditorToolbar
          siteName={(site.resume_data as ResumeData)?.name || site.slug}
          published={published}
          justSaved={justSaved}
          saveError={saveError}
          onClose={onClose}
          onTogglePublish={handleTogglePublish}
        />

        {/* Hint bar */}
        <div className="relative z-20 border-b border-blue-100 bg-blue-50 px-4 py-1.5 text-center print:hidden">
          <p className="text-xs text-blue-700">
            <span className="font-semibold">Edit mode</span> — click any text to edit · click any image to replace · hover to see editable areas
          </p>
        </div>

        {/* Scrollable template */}
        <div className="resume-lio-editor-template flex-1 overflow-y-auto">
          <LiveTemplate templateId={site.template_id} />
        </div>
      </ResumeLioEditProvider>
    </div>
  )
}
