'use client'

import { useCallback, useRef, useState } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import type { Resume } from '@/types'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const ALLOWED_EXTENSIONS = ['.pdf', '.docx']

type UploadState = 'idle' | 'uploading' | 'parsing' | 'done' | 'error'

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_FILE_TYPE: 'Only PDF and DOCX files are accepted.',
  FILE_TOO_LARGE: 'File must be under 5MB.',
  SCANNED_PDF: 'This PDF appears to be scanned. Please upload a text-based PDF.',
  DUPLICATE_FILE: 'This file was already uploaded recently.',
  STORAGE_UPLOAD_FAILED: 'Storage error — make sure the "resumes" bucket exists in Supabase Storage.',
  TEXT_EXTRACTION_FAILED: 'Could not extract text from this file. Try a different PDF or DOCX.',
  PARSE_FAILED: 'Could not parse this file. Try a different PDF or DOCX.',
  DB_SAVE_FAILED: 'Database error — the resume could not be saved. Check Supabase logs.',
  default: 'Upload failed. Please try again.',
}

interface UploadZoneProps {
  onUploadSuccess: (resume: Resume) => void
  disabled?: boolean
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
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
      return 'Only PDF and DOCX files are accepted.'
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
    (file: File) => {
      const validationError = validateFile(file)
      if (validationError) {
        setErrorMessage(validationError)
        setState('error')
        return
      }

      setState('uploading')
      setProgress(0)
      setErrorMessage(null)

      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          // Upload phase: 0 → 50%
          const uploadProgress = Math.round((event.loaded / event.total) * 50)
          setProgress(uploadProgress)
        }
      }

      xhr.upload.onload = () => {
        // Upload done — switch to parsing phase
        setState('parsing')
        setProgress(50)
        startParsingAnimation()
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
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled && !isActive) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && !isActive) inputRef.current?.click()
        }}
        className={`
          relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed
          px-6 py-10 transition-colors
          ${disabled || isActive ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
          ${isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/40'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={handleFileChange}
          disabled={disabled || isActive}
        />

        {state === 'done' ? (
          <CheckCircle2 size={32} className="text-green-500 mb-3" />
        ) : (
          <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${isDragging ? 'bg-indigo-100' : 'bg-white border border-gray-200'}`}>
            {state === 'parsing' ? (
              <FileText size={22} className="text-indigo-500" />
            ) : (
              <Upload size={22} className="text-gray-400" />
            )}
          </div>
        )}

        {state === 'idle' && (
          <>
            <p className="text-sm font-medium text-gray-700">
              Drop your resume here, or <span className="text-indigo-600">browse</span>
            </p>
            <p className="mt-1 text-xs text-gray-400">PDF or DOCX · max 5MB</p>
          </>
        )}

        {state === 'uploading' && (
          <p className="text-sm font-medium text-gray-700">Uploading…</p>
        )}

        {state === 'parsing' && (
          <p className="text-sm font-medium text-indigo-600">Analysing with AI…</p>
        )}

        {state === 'done' && (
          <p className="text-sm font-medium text-green-600">Resume parsed successfully!</p>
        )}
      </div>

      {/* Progress bar */}
      {(state === 'uploading' || state === 'parsing' || state === 'done') && (
        <div className="mt-3">
          <Progress value={progress} className="h-1.5" />
          <p className="mt-1 text-right text-xs text-gray-400">{progress}%</p>
        </div>
      )}

      {/* Error message */}
      {state === 'error' && errorMessage && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
          <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{errorMessage}</p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setState('idle')
                setErrorMessage(null)
              }}
              className="mt-1 text-xs text-red-600 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
