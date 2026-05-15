'use client'

import { Download } from 'lucide-react'
import { EditableText } from '@/components/resume-lio/edit/EditableText'
import { useResumeLioEdit } from '@/components/resume-lio/edit/ResumeLioEditContext'

export interface DownloadResumeButtonProps {
  className?: string
  iconSize?: number
  label?: string
  style?: React.CSSProperties
}

export function DownloadResumeButton({ className = '', iconSize = 15, label = 'Download CV', style }: DownloadResumeButtonProps) {
  const ctx = useResumeLioEdit()
  const isEditing = !!ctx?.editMode

  return (
    <button
      type="button"
      onClick={() => { if (!isEditing) window.print() }}
      className={`inline-flex items-center gap-2 print:hidden ${className}`}
      style={style}
    >
      <Download size={iconSize} />{' '}
      <EditableText field="downloadLabel" as="span">{label}</EditableText>
    </button>
  )
}
