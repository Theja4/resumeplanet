'use client'

import { useCallback, useState } from 'react'
import { ArrowLeft, Save, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { ResumeLioTemplateRenderer } from '@/components/resume-lio/ResumeLioTemplateRenderer'
import { ResumeLioEditProvider, useResumeLioEdit } from '@/components/resume-lio/edit/ResumeLioEditContext'
import { updateResumeLioSite } from './actions'
import type { ResumeData, ResumeLioSite, ResumeLioSocialLinks, ResumeLioTemplateId } from '@/types'

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
      {justSaved && !saveError && (
        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
          <CheckCircle2 size={12} /> Saved
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
