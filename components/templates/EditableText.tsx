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
  /**
   * When true, preserves user-typed newlines (renders with white-space: pre-wrap)
   * so paragraph text and bullets show line breaks the way the user typed them.
   * Default: false — keeps the legacy single-line collapse behaviour.
   */
  preserveWhitespace?: boolean
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
  preserveWhitespace = false,
}: EditableTextProps) {
  if (!value && !fallback) return null

  const displayValue = value || fallback || ''
  const mergedStyle: React.CSSProperties = {
    ...(isEditing ? style : { ...style, cursor: onNavigateToField ? 'text' : style?.cursor }),
    ...(preserveWhitespace
      ? {
          whiteSpace: 'pre-wrap' as const,
          // Force-break in the middle of unbreakable strings (long URLs pasted
          // without spaces) so a single GitHub URL doesn't overflow the page
          // width and clip in the PDF.
          overflowWrap: 'anywhere' as const,
          wordBreak: 'break-word' as const,
        }
      : {}),
  }

  return (
    <Tag
      className={className}
      style={mergedStyle}
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
