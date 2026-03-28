'use client'

import React from 'react'

interface EditableTextProps {
  value: string | undefined | null
  path: string
  isEditing?: boolean
  onFieldChange?: (path: string, value: string) => void
  className?: string
  as?: React.ElementType
  fallback?: string
}

export default function EditableText({
  value,
  path,
  isEditing,
  onFieldChange,
  className,
  as: Tag = 'span',
  fallback,
}: EditableTextProps) {
  if (!value && !fallback) return null

  const displayValue = value || fallback || ''

  return (
    <Tag
      className={className}
      contentEditable={isEditing || undefined}
      suppressContentEditableWarning
      onBlur={
        isEditing
          ? (e: React.FocusEvent<HTMLElement>) =>
              onFieldChange?.(path, e.currentTarget.textContent ?? '')
          : undefined
      }
    >
      {displayValue}
    </Tag>
  )
}
