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

interface ResumeCardProps {
  resume: Resume
  latestScore?: number
  onDelete: () => void
  onRename: (title: string) => void
}

export default function ResumeCard({ resume, latestScore, onDelete, onRename }: ResumeCardProps) {
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
    <div className="group bg-surface-container-lowest p-6 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-black/5 relative flex flex-col justify-between">
      {/* Document Header Area */}
      <div className="flex items-start gap-5 mb-6">
        {/* Document Icon / Preview placeholder */}
        <div className="w-16 h-20 bg-surface-container-low rounded-lg flex-shrink-0 flex items-center justify-center border border-outline-variant/10 overflow-hidden relative">
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
            <div className="group/title flex items-start gap-1">
              <Link
                href={`/dashboard/builder/${resume.id}`}
                className="font-bold text-on-surface text-lg truncate leading-tight hover:text-primary transition-colors"
                title={resume.title}
              >
                {resume.title}
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setIsEditing(true)
                }}
                className="opacity-0 group-hover/title:opacity-100 p-1 text-outline hover:text-primary transition-all"
              >
                <Pencil size={12} />
              </button>
            </div>
          )}
          
          <p className="text-xs text-on-surface-variant font-medium mt-1">
            Modified {formatDate(resume.created_at)}
          </p>

          <div className="mt-2 flex items-center gap-2">
            {latestScore !== undefined ? (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
                latestScore >= 75 ? 'bg-green-100 text-green-800' : 
                latestScore >= 50 ? 'bg-amber-100 text-amber-800' : 
                'bg-red-100 text-red-800'
              }`}>
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
          className="flex w-full items-center justify-center gap-2 py-2.5 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-lg hover:opacity-90 transition-all shadow-sm"
        >
          <Pencil size={14} />
          Edit
        </button>
      </div>

      {/* Delete Trigger - Absolute positioned to keep grid clean */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-outline-variant/20 rounded-full flex items-center justify-center text-outline hover:text-error hover:border-error/20 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
            aria-label="Delete resume"
          >
            <Trash2 size={14} />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-surface border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-on-surface font-black">Delete resume?</AlertDialogTitle>
            <AlertDialogDescription className="text-on-surface-variant">
              This will permanently delete <strong>{resume.title}</strong>. This action cannot be undone.
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
