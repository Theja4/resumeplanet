'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { BarChart2, Layout, Trash2, Pencil } from 'lucide-react'
import type { Resume } from '@/types'

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function scoreColor(score: number) {
  if (score >= 75) return 'bg-green-100 text-green-700'
  if (score >= 50) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
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
    <Card className="group relative flex flex-col gap-0 overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="flex flex-col gap-3 p-5">
        {/* Title row */}
        <div className="flex items-start gap-2 min-h-[28px]">
          {isEditing ? (
            <input
              ref={inputRef}
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              className="flex-1 rounded border border-indigo-300 px-2 py-0.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          ) : (
            <button
              onClick={() => router.push(`/dashboard/resumes/${resume.id}`)}
              className="flex-1 text-left text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-2"
            >
              {resume.title}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
            }}
            className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Rename"
          >
            <Pencil size={13} />
          </button>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400">{formatDate(resume.created_at)}</span>
          {latestScore !== undefined && (
            <Badge className={`text-xs px-1.5 py-0 ${scoreColor(latestScore)}`}>
              ATS {latestScore}
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs gap-1.5 text-gray-600"
            onClick={() => router.push(`/dashboard/ats-checker?resumeId=${resume.id}`)}
          >
            <BarChart2 size={13} />
            ATS Check
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs gap-1.5 text-gray-600"
            onClick={() => router.push(`/dashboard/templates?resumeId=${resume.id}`)}
          >
            <Layout size={13} />
            Fill Template
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs gap-1.5 text-indigo-600"
            asChild
          >
            <Link href={`/dashboard/builder/${resume.id}`}>
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                aria-label="Delete resume"
              >
                <Trash2 size={13} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete resume?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete <strong>{resume.title}</strong> and all associated
                  ATS scores. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
