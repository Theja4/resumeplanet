'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import type { Resume, ResumeData } from '@/types'
import { parsePdfClient } from '@/lib/clientParser'
import { Analytics } from '@/lib/analytics'
import { MAX_RESUME_UPLOAD_BYTES, MAX_RESUME_UPLOAD_LABEL } from '@/lib/uploadLimits'

const MAX_FILE_SIZE = MAX_RESUME_UPLOAD_BYTES

type UploadState = 'idle' | 'uploading' | 'parsing' | 'done' | 'error'

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_FILE_TYPE: 'Only PDF files are accepted.',
  FILE_TOO_LARGE: `File must be under ${MAX_RESUME_UPLOAD_LABEL}.`,
  INVALID_PARSED_DATA: 'Parsing failed — please try again.',
  DUPLICATE_FILE: 'This file was already uploaded recently.',
  STORAGE_UPLOAD_FAILED: 'Storage error — make sure the "resumes" bucket exists in Supabase Storage.',
  PARSE_FAILED: 'Could not parse this file. Try a different PDF.',
  PARSE_LOW_CONFIDENCE:
    'We could not reliably extract enough resume content. Export as a text-based PDF and try again.',
  DB_SAVE_FAILED: 'Database error — the resume could not be saved. Check Supabase logs.',
  CLIENT_PARSE_FAILED: 'Could not extract text from this PDF. Try a different file.',
  default: 'Upload failed. Please try again.',
}

interface UploadZoneProps {
  onUploadSuccess: (resume: Resume) => void
  disabled?: boolean
  variant?: 'hero' | 'compact'
}

type ParsedResumeLike = ResumeData | null | undefined

function countResumeSections(parsedData: ParsedResumeLike): number {
  if (!parsedData) return 0

  const sections = [
    parsedData.summary,
    parsedData.skills?.length,
    parsedData.experience?.length,
    parsedData.education?.length,
    parsedData.projects?.length,
    parsedData.certifications?.length,
    parsedData.languages?.length,
    parsedData.volunteer?.length,
    parsedData.awards?.length,
    parsedData.publications?.length,
    parsedData.interests?.length,
    parsedData.references?.length,
    parsedData.customSections?.length,
  ]

  return sections.filter(Boolean).length
}

export default function UploadZone({
  onUploadSuccess,
  disabled = false,
  variant = 'hero',
}: UploadZoneProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isTakingLong, setIsTakingLong] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const longRunningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressRef = useRef(0)

  // Clean up timers on unmount to prevent leaks during upload/parse
  useEffect(() => {
    return () => {
      if (animationRef.current) clearInterval(animationRef.current)
      if (longRunningTimerRef.current) clearTimeout(longRunningTimerRef.current)
    }
  }, [])

  function validateFile(file: File): string | null {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (file.type !== 'application/pdf' && ext !== '.pdf') {
      return 'Only PDF files are accepted.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File must be under ${MAX_RESUME_UPLOAD_LABEL}.`
    }
    return null
  }

  function setProgressMonotonic(next: number) {
    setProgress(prev => {
      const value = Math.max(prev, Math.min(100, next))
      progressRef.current = value
      return value
    })
  }

  function resetProgress() {
    progressRef.current = 0
    setProgress(0)
  }

  function startParsingAnimation() {
    // Continue from current progress and gently approach 96 while the backend works
    let current = progressRef.current
    animationRef.current = setInterval(() => {
      current = current + (96 - current) * 0.035
      setProgressMonotonic(Math.round(current))
    }, 500)
  }

  function stopAnimation() {
    if (animationRef.current) {
      clearInterval(animationRef.current)
      animationRef.current = null
    }
  }

  function startLongRunningTimer() {
    if (longRunningTimerRef.current) {
      clearTimeout(longRunningTimerRef.current)
    }
    setIsTakingLong(false)
    longRunningTimerRef.current = setTimeout(() => {
      setIsTakingLong(true)
    }, 12000)
  }

  function stopLongRunningTimer() {
    if (longRunningTimerRef.current) {
      clearTimeout(longRunningTimerRef.current)
      longRunningTimerRef.current = null
    }
    setIsTakingLong(false)
  }

  async function uploadFile(file: File) {
    // Validate first
    const validationError = validateFile(file)
    if (validationError) {
      setErrorMessage(validationError)
      setState('error')
      return
    }

    // Phase 1: Client-side parsing
    setState('uploading')
    resetProgress()
    setErrorMessage(null)
    stopLongRunningTimer()
    const parseStartedAt = performance.now()

    Analytics.resumeUploaded({
      fileSize: file.size,
      pageCount: 1,
      fileType: file.type || 'application/pdf',
    })

    let parsedData: Awaited<ReturnType<typeof parsePdfClient>> | null = null
    try {
      parsedData = await parsePdfClient(file)
      Analytics.resumeParseCompleted({
        sectionCount: countResumeSections(parsedData),
        durationMs: Math.round(performance.now() - parseStartedAt),
      })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      Analytics.resumeParseFailed({
        error: errMsg,
      })
    }

    setProgressMonotonic(30)

    // Phase 2: Upload + save to server (server receives parsed data)
    setState('parsing')
    setProgressMonotonic(40)
    startLongRunningTimer()
    startParsingAnimation()

    const formData = new FormData()
    formData.append('file', file)
    if (parsedData) {
      formData.append('parsedData', JSON.stringify(parsedData))
    }

    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        // 40-60% range for upload
        const uploadProgress = 40 + Math.round((event.loaded / event.total) * 20)
        setProgressMonotonic(uploadProgress)
      }
    }

    xhr.onload = () => {
      stopAnimation()
      stopLongRunningTimer()

      if (xhr.status === 409) {
        // Duplicate file — parse the response to get the existing resume ID
        try {
          const body = JSON.parse(xhr.responseText)
          setErrorMessage(
            body.error === 'DUPLICATE_FILE'
              ? 'This file was already uploaded recently.'
              : (ERROR_MESSAGES[body.error] ?? ERROR_MESSAGES.default)
          )
        } catch {
          setErrorMessage(ERROR_MESSAGES.default)
        }
        setState('error')
        return
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const body = JSON.parse(xhr.responseText)
          if (body.success && body.data) {
            setProgressMonotonic(100)
            setState('done')
            requestAnimationFrame(() => {
              onUploadSuccess(body.data as Resume)
              setState('idle')
              resetProgress()
            })
            return
          }
        } catch {
          // fall through to error
        }
      }

      // Non-2xx or bad body
      try {
        const body = JSON.parse(xhr.responseText)
        const base = ERROR_MESSAGES[body.error] ?? ERROR_MESSAGES.default
        setErrorMessage(body.detail ? `${base} (${body.detail})` : base)
      } catch {
        setErrorMessage(ERROR_MESSAGES.default)
      }
      setState('error')
    }

    xhr.onerror = () => {
      stopAnimation()
      stopLongRunningTimer()
      setErrorMessage(ERROR_MESSAGES.default)
      setState('error')
    }

    xhr.open('POST', '/api/resume/parse')
    xhr.send(formData)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (disabled || state === 'uploading' || state === 'parsing') return
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    // Reset so same file can be re-selected after an error
    e.target.value = ''
  }

  const isActive = state === 'uploading' || state === 'parsing'
  const isCompact = variant === 'compact'

  return (
    <section className={`relative group w-full ${isCompact ? 'h-full' : 'mb-12'}`}>
      {/* Background glow effect */}
      {!isCompact ? (
        <div className="absolute -inset-1 bg-gradient-to-r from-primary-container/20 to-secondary-container/20 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
      ) : null}
      
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled && !isActive) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all
          transition-all border-2 border-dashed 
          ${isDragging ? 'border-primary/40 bg-primary/5' : 'border-outline-variant/20 hover:border-primary/30'}
          ${disabled || isActive ? 'cursor-default' : 'cursor-pointer'}
          ${isCompact ? 'h-full bg-white px-5 py-6 sm:px-6 sm:py-7' : 'bg-surface-container-lowest p-10'}
        `}
        onClick={() => {
          if (!disabled && !isActive) inputRef.current?.click()
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={handleFileChange}
          disabled={disabled || isActive}
        />

        {state === 'done' ? (
          <div className={`${isCompact ? 'mb-4 h-14 w-14' : 'mb-6 h-20 w-20'} rounded-full bg-green-50 flex items-center justify-center`}>
            <CheckCircle2 size={isCompact ? 28 : 40} className="text-green-500" />
          </div>
        ) : (
          <div className={`${isCompact ? 'mb-4 h-14 w-14' : 'mb-6 h-20 w-20'} bg-primary/5 rounded-full flex items-center justify-center transition-transform group-hover:scale-110`}>
            {state === 'parsing' ? (
              <FileText size={isCompact ? 24 : 36} className="text-primary animate-pulse" />
            ) : (
              <Upload size={isCompact ? 24 : 36} className={`text-primary ${isDragging ? 'scale-110' : ''}`} />
            )}
          </div>
        )}

        <h2 className={`${isCompact ? 'text-xl' : 'text-2xl'} mb-2 font-extrabold tracking-tight text-on-surface`}>
          {state === 'parsing' ? 'Analyzing with AI…' : isCompact ? 'Upload your resume' : 'Upload Your Resume'}
        </h2>
        
        <p className={`max-w-md text-center text-on-surface-variant ${isCompact ? 'mb-5 text-sm leading-6' : 'mb-8'}`}>
          {state === 'parsing' 
            ? "We're extracting your skills and experience to build your professional profile."
            : isCompact
              ? "Drop a PDF here or click to upload. After parsing, we’ll open Tailor Mode for that resume."
              : "Drag and drop your PDF here to start optimizing. We'll automatically parse your data."}
        </p>

        {(state === 'idle' || state === 'error') && (
          <button 
            className={`${isCompact ? 'px-6 py-3 text-sm' : 'px-10 py-3.5'} bg-[var(--signature-gradient)] text-on-primary-container font-bold rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-95 flex items-center gap-2`}
            disabled={disabled}
          >
            <Upload size={18} />
            Select File
          </button>
        )}

        {/* Progress bar for active states */}
        {isActive && (
          <div className="w-full max-w-md mt-4 space-y-2">
            <Progress value={progress} className="h-2 bg-surface-container" />
            <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              <span>{state === 'uploading' ? 'Uploading' : 'AI Processing'}</span>
              <span>{progress}%</span>
            </div>
            {state === 'parsing' && isTakingLong && (
              <p className="text-center text-xs font-semibold text-on-surface-variant animate-pulse">
                Taking longer than expected. Still parsing with AI. Please keep this tab open.
              </p>
            )}
          </div>
        )}

        {state === 'error' && (
          <div className="mt-6 flex items-center gap-2 text-error font-semibold text-sm">
            <AlertCircle size={16} />
            {errorMessage || 'Upload failed'}
          </div>
        )}

        <div className={`${isCompact ? 'mt-6 gap-4 text-[10px]' : 'mt-10 gap-6 text-[11px]'} flex items-center font-bold text-outline uppercase tracking-widest opacity-60`}>
          <span>PDF only</span>
          <span className="w-1 h-1 bg-outline rounded-full"></span>
          <span>Max size: {MAX_RESUME_UPLOAD_LABEL}</span>
        </div>
      </div>
    </section>
  )
}
