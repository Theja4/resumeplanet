'use client'

import { useCallback, useRef, useState } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import type { Resume, ResumeData } from '@/types'
import { parsePdfClient } from '@/lib/clientParser'
import { Analytics } from '@/lib/analytics'

const MAX_FILE_SIZE = 5 * 1024 * 1024

type UploadState = 'idle' | 'uploading' | 'parsing' | 'done' | 'error'

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_FILE_TYPE: 'Only PDF files are accepted.',
  FILE_TOO_LARGE: 'File must be under 5MB.',
  INVALID_PARSED_DATA: 'Parsing failed — please try again.',
  DUPLICATE_FILE: 'This file was already uploaded recently.',
  STORAGE_UPLOAD_FAILED: 'Storage error — make sure the "resumes" bucket exists in Supabase Storage.',
  PARSE_FAILED: 'Could not parse this file. Try a different PDF.',
  DB_SAVE_FAILED: 'Database error — the resume could not be saved. Check Supabase logs.',
  CLIENT_PARSE_FAILED: 'Could not extract text from this PDF. Try a different file.',
  default: 'Upload failed. Please try again.',
}

interface UploadZoneProps {
  onUploadSuccess: (resume: Resume) => void
  disabled?: boolean
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

export default function UploadZone({ onUploadSuccess, disabled = false }: UploadZoneProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function validateFile(file: File): string | null {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (file.type !== 'application/pdf' && ext !== '.pdf') {
      return 'Only PDF files are accepted.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File must be under 5MB.'
    }
    return null
  }

  function startParsingAnimation() {
    // Animate progress from 50 → 92 over ~25 seconds
    let current = 50
    animationRef.current = setInterval(() => {
      current = current + (92 - current) * 0.04
      setProgress(Math.min(Math.round(current), 92))
    }, 500)
  }

  function stopAnimation() {
    if (animationRef.current) {
      clearInterval(animationRef.current)
      animationRef.current = null
    }
  }

  const uploadFile = useCallback(
    async (file: File) => {
      // Validate first
      const validationError = validateFile(file)
      if (validationError) {
        setErrorMessage(validationError)
        setState('error')
        return
      }

      // Phase 1: Client-side parsing
      setState('uploading')
      setProgress(0)
      setErrorMessage(null)
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

      setProgress(30)

      // Phase 2: Upload + save to server (server receives parsed data)
      setState('parsing')
      setProgress(40)
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
          setProgress(uploadProgress)
        }
      }

      xhr.onload = () => {
        stopAnimation()

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
              setProgress(100)
              setState('done')
              setTimeout(() => {
                onUploadSuccess(body.data as Resume)
                setState('idle')
                setProgress(0)
              }, 800)
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
        setErrorMessage(ERROR_MESSAGES.default)
        setState('error')
      }

      xhr.open('POST', '/api/resume/parse')
      xhr.send(formData)
    },
    [onUploadSuccess]
  )

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

  return (
    <section className="relative group w-full mb-12">
      {/* Background glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary-container/20 to-secondary-container/20 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
      
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled && !isActive) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative bg-surface-container-lowest p-10 rounded-3xl flex flex-col items-center justify-center 
          transition-all border-2 border-dashed 
          ${isDragging ? 'border-primary/40 bg-primary/5' : 'border-outline-variant/20 hover:border-primary/30'}
          ${disabled || isActive ? 'cursor-default' : 'cursor-pointer'}
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
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
        ) : (
          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
            {state === 'parsing' ? (
              <FileText size={36} className="text-primary animate-pulse" />
            ) : (
              <Upload size={36} className={`text-primary ${isDragging ? 'scale-110' : ''}`} />
            )}
          </div>
        )}

        <h2 className="text-2xl font-extrabold text-on-surface mb-2 tracking-tight">
          {state === 'parsing' ? 'Analyzing with AI…' : 'Upload Your Resume'}
        </h2>
        
        <p className="text-on-surface-variant text-center max-w-md mb-8">
          {state === 'parsing' 
            ? "We're extracting your skills and experience to build your professional profile."
            : "Drag and drop your PDF here to start optimizing. We'll automatically parse your data."}
        </p>

        {(state === 'idle' || state === 'error') && (
          <button 
            className="px-10 py-3.5 bg-[var(--signature-gradient)] text-on-primary-container font-bold rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
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
          </div>
        )}

        {state === 'error' && (
          <div className="mt-6 flex items-center gap-2 text-error font-semibold text-sm">
            <AlertCircle size={16} />
            {errorMessage || 'Upload failed'}
          </div>
        )}

        <div className="mt-10 flex items-center gap-6 text-[11px] font-bold text-outline uppercase tracking-widest opacity-60">
          <span>PDF only</span>
          <span className="w-1 h-1 bg-outline rounded-full"></span>
          <span>Max size: 5MB</span>
        </div>
      </div>
    </section>
  )
}
