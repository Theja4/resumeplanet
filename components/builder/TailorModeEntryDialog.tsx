'use client'

import { useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, FileText, Plus, Sparkles, Upload, X } from 'lucide-react'
import UploadZone from '@/components/resumes/UploadZone'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { buildResumeTitleLabelMap, getResumeTitleLabel } from '@/lib/resumeTitleLabels'
import type { Resume } from '@/types'

interface TailorModeEntryDialogProps {
  resumes: Pick<Resume, 'id' | 'title' | 'created_at' | 'updated_at'>[]
}

function formatUpdatedAt(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function TailorModeEntryDialog({ resumes }: TailorModeEntryDialogProps) {
  const router = useRouter()
  const resumeTitleLabels = useMemo(() => buildResumeTitleLabelMap(resumes), [resumes])

  const closeDialog = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  const openTailorBuilder = useCallback((resumeId: string) => {
    router.push(`/dashboard/builder/${resumeId}?mode=tailor`)
  }, [router])

  return (
    <Dialog open onOpenChange={(open) => {
      if (!open) closeDialog()
    }}>
      <DialogContent
        className="w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] !max-w-[calc(100vw-3rem)] sm:!max-w-[960px] lg:!max-w-[1120px] overflow-y-auto rounded-[2rem] border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.995),rgba(246,249,247,0.985))] p-0 shadow-[0_32px_90px_rgba(25,28,29,0.16)]"
        showCloseButton={false}
      >
        <div className="relative overflow-hidden rounded-[2rem]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.26),transparent_50%),radial-gradient(circle_at_top_right,rgba(2,109,50,0.08),transparent_34%)]" />

          <div className="relative border-b border-black/5 px-6 py-5 sm:px-8">
            <button
              type="button"
              onClick={closeDialog}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-white/90 text-zinc-500 transition-colors hover:text-zinc-900"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <DialogHeader className="max-w-2xl pr-12">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary-container/50 bg-primary-container/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
                <Sparkles size={14} strokeWidth={2.2} />
                Tailor Resume
              </div>
              <DialogTitle className="text-3xl font-black tracking-tight text-on-background sm:text-4xl">
                Pick a resume to tailor.
              </DialogTitle>
              <DialogDescription className="text-sm leading-7 text-on-surface-variant sm:text-base">
                Upload a new resume, continue from one you already saved, or create a fresh draft. Once you choose a resume, Rezoomed opens the builder directly in Tailor Resume.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-5 px-6 py-6 sm:px-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(22rem,0.82fr)]">
            <section className="flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-black/5 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,249,0.96))] p-5 shadow-[0_18px_44px_rgba(25,28,29,0.05)]">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Option 1</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-on-background">Upload a resume</h2>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    Start from an existing PDF and jump straight into Tailor Resume after parsing completes.
                  </p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-container/60 text-on-primary-container">
                  <Upload size={20} strokeWidth={2.2} />
                </span>
              </div>

              <div className="flex-1">
                <UploadZone
                  onUploadSuccess={(resume) => openTailorBuilder(resume.id)}
                  variant="compact"
                />
              </div>
            </section>

            <div className="space-y-5">
              <section className="overflow-hidden rounded-[1.6rem] border border-black/5 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,249,0.96))] p-5 shadow-[0_18px_44px_rgba(25,28,29,0.05)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Option 2</p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-on-background">Create a new draft</h2>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                      Open a blank resume and land in Tailor Resume when you are ready to paste a job description.
                    </p>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-container/60 text-on-primary-container">
                    <Plus size={20} strokeWidth={2.2} />
                  </span>
                </div>

                <Link
                  href="/dashboard/builder/new?mode=tailor"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-4 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
                >
                  Create New Resume
                  <ArrowRight size={16} strokeWidth={2.2} />
                </Link>
              </section>

              <section className="overflow-hidden rounded-[1.6rem] border border-black/5 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,249,0.96))] p-5 shadow-[0_18px_44px_rgba(25,28,29,0.05)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Option 3</p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-on-background">Use a saved resume</h2>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                      Pick any stored resume and continue tailoring without re-uploading it.
                    </p>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-container/60 text-on-primary-container">
                    <FileText size={20} strokeWidth={2.2} />
                  </span>
                </div>

                {resumes.length === 0 ? (
                  <div className="mt-5 rounded-[1.25rem] border border-dashed border-black/10 bg-surface-container-low px-4 py-5 text-sm leading-6 text-on-surface-variant">
                    No saved resumes yet. Upload one above or create a new draft to start tailoring.
                  </div>
                ) : (
                  <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-black/5 bg-white/70">
                    <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        Saved resumes
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                        {resumes.length}
                      </span>
                    </div>
                    <div className="max-h-[18rem] space-y-3 overflow-y-scroll overscroll-contain p-3 pr-2 [scrollbar-gutter:stable] lg:max-h-[24rem]">
                    {resumes.map((resume) => (
                      <button
                        key={resume.id}
                        type="button"
                        onClick={() => openTailorBuilder(resume.id)}
                        className="flex w-full items-center gap-3 rounded-[1.25rem] border border-black/5 bg-white px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_14px_32px_rgba(2,109,50,0.08)]"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                          <FileText size={18} strokeWidth={2.1} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-on-surface">
                            {getResumeTitleLabel(resume, resumeTitleLabels)}
                          </span>
                          <span className="mt-1 block text-xs text-on-surface-variant">
                            Updated {formatUpdatedAt(resume.updated_at ?? resume.created_at)}
                          </span>
                        </span>
                        <ArrowRight size={16} className="shrink-0 text-zinc-400" />
                      </button>
                    ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
