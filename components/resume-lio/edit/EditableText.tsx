'use client'

import { useResumeLioEdit } from './ResumeLioEditContext'
import { useEffect, useId, useRef } from 'react'

const RESUME_DATA_FIELD_ROOTS = new Set([
  'name',
  'email',
  'phone',
  'location',
  'linkedin',
  'website',
  'summary',
  'currentRole',
  'experience',
  'education',
  'skills',
  'skillSections',
  'certifications',
  'projects',
  'languages',
  'volunteer',
  'interests',
  'awards',
  'publications',
  'references',
  'customSections',
])

function getDeepValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((cur, part) => {
    if (cur == null) return undefined
    const index = Number(part)
    if (Array.isArray(cur) && Number.isInteger(index)) return cur[index]
    if (typeof cur === 'object') return (cur as Record<string, unknown>)[part]
    return undefined
  }, obj)
}

interface EditableTextProps {
  /** Dot-path into ResumeData, e.g. "name" or "experience.0.title" */
  field: string
  children: React.ReactNode
  as?: React.ElementType
  className?: string
  style?: React.CSSProperties
  /** Allow Enter key (multiline) – default false */
  multiline?: boolean
  /** Text shown only in edit mode when the field is empty */
  placeholder?: string
}

export function EditableText({
  field,
  children,
  as,
  className = '',
  style,
  multiline = false,
  placeholder = 'Add text',
}: EditableTextProps) {
  const ctx = useResumeLioEdit()
  const ref = useRef<HTMLElement>(null)
  const editId = useId()
  const Tag = (as ?? 'span') as React.ElementType
  const activeKey = `${field}:${editId}`
  const isActive = ctx?.editMode && ctx.activeField === activeKey
  const fieldRoot = field.split('.')[0]
  const storedValue = ctx && !RESUME_DATA_FIELD_ROOTS.has(fieldRoot)
    ? getDeepValue(ctx.resumeData, field)
    : undefined
  const renderedChildren = typeof storedValue === 'string' ? storedValue : children
  const isEmpty = (
    renderedChildren == null ||
    renderedChildren === false ||
    (typeof renderedChildren === 'string' && renderedChildren.trim().length === 0)
  )

  // When this field becomes active, focus and place cursor at end
  useEffect(() => {
    if (isActive && ref.current) {
      const el = ref.current
      el.focus()
      try {
        const range = document.createRange()
        range.selectNodeContents(el)
        range.collapse(false)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
      } catch {}
    }
  }, [isActive])

  if (!ctx?.editMode) {
    return (
      <Tag className={className} style={style}>
        {renderedChildren}
      </Tag>
    )
  }

  return (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      data-edit-field={field}
      data-placeholder={placeholder}
      contentEditable={isActive}
      suppressContentEditableWarning
      className={`${className} ${isActive ? 'rl-editing' : 'rl-editable'} ${isEmpty ? 'rl-empty' : ''}`}
      style={style}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        ctx.setActiveField(activeKey)
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        ctx.updateField(field, e.currentTarget.textContent ?? '')
        ctx.setActiveField(null)
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault()
          ;(e.currentTarget as HTMLElement).blur()
        }
        if (e.key === 'Escape') {
          ;(e.currentTarget as HTMLElement).blur()
        }
      }}
    >
      {renderedChildren}
    </Tag>
  )
}
