'use client'

import { useResumeLioEdit } from './ResumeLioEditContext'
import { useState, useRef, useEffect } from 'react'
import { Link2 } from 'lucide-react'
import type { ResumeLioSocialLinks } from '@/types'

function getDeepValue(obj: unknown, path: string): string {
  const parts = path.split('.')
  let cur: unknown = obj
  for (const part of parts) {
    if (cur == null) return ''
    const idx = parseInt(part, 10)
    if (!isNaN(idx) && Array.isArray(cur)) cur = cur[idx]
    else if (typeof cur === 'object') cur = (cur as Record<string, unknown>)[part]
    else return ''
  }
  return typeof cur === 'string' ? cur : ''
}

interface EditableLinkProps {
  /**
   * Field to update on save.
   *  - "social.<key>" → ctx.updateSocialLink(key, value)
   *  - anything else  → ctx.updateField(path, value)
   */
  linkField: string
  href: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  target?: string
  rel?: string
}

export function EditableLink({
  linkField,
  href,
  children,
  className = '',
  style,
  target,
  rel,
}: EditableLinkProps) {
  const ctx = useResumeLioEdit()
  const [showPopover, setShowPopover] = useState(false)
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showPopover) inputRef.current?.focus()
  }, [showPopover])

  if (!ctx?.editMode) {
    return (
      <a href={href} className={className} style={style} target={target} rel={rel}>
        {children}
      </a>
    )
  }

  function getCurrentValue(): string {
    if (linkField.startsWith('social.')) {
      const key = linkField.slice(7) as keyof ResumeLioSocialLinks
      return (ctx!.socialLinks[key] as string) || ''
    }
    return getDeepValue(ctx!.resumeData, linkField)
  }

  function openPopover(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPopoverPos({
      top: rect.bottom + 8,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 340)),
    })
    setInputValue(getCurrentValue())
    setShowPopover(true)
  }

  function handleSave() {
    const val = inputValue.trim()
    if (linkField.startsWith('social.')) {
      const key = linkField.slice(7) as keyof ResumeLioSocialLinks
      ctx!.updateSocialLink(key, val)
    } else {
      ctx!.updateField(linkField, val)
    }
    setShowPopover(false)
  }

  const label = linkField.startsWith('social.')
    ? linkField.slice(7).charAt(0).toUpperCase() + linkField.slice(8)
    : linkField

  return (
    <>
      <a
        href={href}
        className={`rl-link-editable ${className}`}
        style={style}
        onClick={openPopover}
      >
        {children}
      </a>

      {showPopover && (
        <div
          className="fixed inset-0 z-[99999] print:hidden"
          onClick={() => setShowPopover(false)}
        >
          <div
            className="fixed w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-2xl"
            style={{ top: popoverPos.top, left: popoverPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2">
              <Link2 size={14} className="text-blue-500" />
              <span className="text-xs font-semibold text-gray-700">
                Edit Link &mdash; {label}
              </span>
            </div>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') setShowPopover(false)
              }}
              placeholder={
                linkField.includes('email')
                  ? 'hello@example.com'
                  : linkField.includes('phone')
                    ? '+1 555 123 4567'
                    : 'https://...'
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 rounded-lg bg-blue-500 py-2 text-xs font-semibold text-white transition hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={() => setShowPopover(false)}
                className="flex-1 rounded-lg bg-gray-100 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
