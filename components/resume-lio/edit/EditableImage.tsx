'use client'

import { useResumeLioEdit } from './ResumeLioEditContext'
import { useState, useRef } from 'react'
import { X, Upload, Link2 } from 'lucide-react'

interface EditableImageProps {
  /** Unique key for this image in image_overrides */
  imageKey: string
  /** Default/fallback src */
  src: string
  alt?: string
  className?: string
  style?: React.CSSProperties
}

export function EditableImage({ imageKey, src, alt = '', className = '', style }: EditableImageProps) {
  const ctx = useResumeLioEdit()
  const [showModal, setShowModal] = useState(false)
  const [tab, setTab] = useState<'upload' | 'url'>('upload')
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const displaySrc = ctx?.imageOverrides[imageKey] || src

  if (!ctx?.editMode) {
    return <img src={displaySrc} alt={alt} className={className} style={style} />
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 1024) {
      setUploadError('File too large — max 1 MB.')
      return
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      setUploadError('Invalid type. Use JPG, PNG, WebP, or GIF.')
      return
    }
    setUploading(true)
    setUploadError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('key', imageKey)
      const res = await fetch('/api/resume-lio/upload-image', { method: 'POST', body })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      ctx!.updateImage(imageKey, json.url)
      setShowModal(false)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function applyUrl() {
    const url = urlInput.trim()
    if (!url) return
    ctx!.updateImage(imageKey, url)
    setShowModal(false)
    setUrlInput('')
  }

  return (
    <>
      {/* Wrapper – CSS class .rl-img-wrap provides hover glow + "Replace Image" overlay */}
      <div
        className={`rl-img-wrap ${className}`}
        style={{ ...style, display: 'contents' }}
        onClick={() => setShowModal(true)}
      >
        <img
          src={displaySrc}
          alt={alt}
          className={className}
          style={{ ...style, display: className || style ? undefined : 'block' }}
        />
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 print:hidden"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Replace Image</h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="mb-5 flex gap-2">
              {(['upload', 'url'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                    tab === t ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t === 'upload' ? <><Upload size={11} className="inline mr-1" />Upload File</> : <><Link2 size={11} className="inline mr-1" />Paste URL</>}
                </button>
              ))}
            </div>

            {uploadError && (
              <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{uploadError}</p>
            )}

            {tab === 'upload' ? (
              <>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                <div
                  onClick={() => !uploading && fileRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-10 text-center transition hover:border-blue-400 hover:bg-blue-50/40"
                >
                  {uploading ? (
                    <p className="text-xs text-gray-500">Uploading…</p>
                  ) : (
                    <>
                      <Upload size={22} className="text-gray-400" />
                      <p className="text-xs font-medium text-gray-600">Click to choose file</p>
                      <p className="text-[11px] text-gray-400">PNG, JPG, WebP · Max 1 MB</p>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyUrl()}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  onClick={applyUrl}
                  disabled={!urlInput.trim()}
                  className="w-full rounded-xl bg-blue-500 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
