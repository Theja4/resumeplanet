'use client'

import React from 'react'

interface EditableTextProps {
  value: string | undefined | null
  path: string
  isEditing?: boolean
  onFieldChange?: (path: string, value: string) => void
  onNavigateToField?: (path: string) => void
  className?: string
  style?: React.CSSProperties
  as?: React.ElementType
  fallback?: string
}

export default function EditableText({
  value,
  path,
  isEditing,
  onFieldChange,
  onNavigateToField,
  className,
  style,
  as: Tag = 'span',
  fallback,
}: EditableTextProps) {
  if (!value && !fallback) return null

  const displayValue = value || fallback || ''

  return (
    <Tag
      className={className}
      style={isEditing ? style : { ...style, cursor: onNavigateToField ? 'text' : style?.cursor }}
      data-resume-path={path}
      contentEditable={isEditing || undefined}
      suppressContentEditableWarning
      onClick={
        !isEditing && onNavigateToField
          ? (e: React.MouseEvent<HTMLElement>) => {
              e.stopPropagation()
              onNavigateToField(path)
            }
          : undefined
      }
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
