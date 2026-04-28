'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { FileText, Trash2, Pencil } from 'lucide-react'
import type { Resume } from '@/types'

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function scoreBadgeClass(score: number) {
  if (score < 50) return 'bg-red-100 text-red-800'
  if (score < 70) return 'bg-amber-100 text-amber-800'
  return 'bg-green-100 text-green-800'
}

interface ResumeCardProps {
  resume: Resume
  displayTitle?: string
  latestScore?: number
  onDelete: () => void
  onRename: (title: string) => void
}

export default function ResumeCard({ resume, displayTitle = resume.title, latestScore, onDelete, onRename }: ResumeCardProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [titleValue, setTitleValue] = useState(resume.title)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) inputRef.current?.focus()
  }, [isEditing])

  async function saveTitle() {
    const trimmed = titleValue.trim()
    if (!trimmed || trimmed === resume.title) {
      setTitleValue(resume.title)
      setIsEditing(false)
      return
    }
    setIsSaving(true)
    await onRename(trimmed)
    setIsSaving(false)
    setIsEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') saveTitle()
    if (e.key === 'Escape') {
      setTitleValue(resume.title)
      setIsEditing(false)
    }
  }

  return (
    <div className="dashboard-card-hover group relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.9))] p-6 pr-12 shadow-[0_20px_50px_rgba(25,28,29,0.06)] transition-all hover:scale-[1.01]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.22),transparent_58%)]" />
      {/* Document Header Area */}
      <div className="relative mb-6 flex items-start gap-5">
        {/* Document Icon / Preview placeholder */}
        <div className="relative flex h-20 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border border-white/80 bg-[linear-gradient(145deg,rgba(240,246,242,0.92),rgba(255,255,255,0.96))]">
          <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
          <FileText size={32} className="text-primary opacity-80" />
        </div>

        <div className="overflow-hidden flex-1">
          {isEditing ? (
            <input
              ref={inputRef}
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              className="w-full bg-surface-container-low rounded px-2 py-1 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          ) : (
            <div className="flex items-start">
              <Link
                href={`/dashboard/builder/${resume.id}`}
                className="font-bold text-on-surface text-lg truncate leading-tight hover:text-primary transition-colors"
                title={displayTitle}
              >
                {displayTitle}
              </Link>
            </div>
          )}
          
          <p className="mt-1 text-xs font-medium text-on-surface-variant">
            Updated {formatDate(resume.updated_at ?? resume.created_at)}
          </p>

          <div className="mt-2 flex items-center gap-2">
            {latestScore !== undefined ? (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${scoreBadgeClass(latestScore)}`}>
                {latestScore} ATS Score
              </span>
            ) : (
              <span className="bg-surface-container-high text-on-surface-variant/60 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                Unscored
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Stack */}
      <div className="mt-auto flex flex-col items-center gap-3">
        <button
          onClick={() => router.push(`/dashboard/builder/${resume.id}`)}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
        >
          <Pencil size={14} />
          Edit
        </button>
      </div>

      {/* Delete Trigger - Absolute positioned to keep grid clean */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/95 text-outline opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:border-error/20 hover:text-error"
            aria-label="Delete resume"
          >
            <Trash2 size={14} />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-surface border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-on-surface font-black">Delete resume?</AlertDialogTitle>
            <AlertDialogDescription className="text-on-surface-variant">
              This will permanently delete <strong>{displayTitle}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-surface-container font-bold border-none text-on-surface-variant">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-error text-white font-bold rounded-lg hover:bg-error/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
