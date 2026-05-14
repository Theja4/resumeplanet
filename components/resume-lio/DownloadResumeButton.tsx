'use client'

import { Download } from 'lucide-react'

interface DownloadResumeButtonProps {
  className?: string
  iconSize?: number
  label?: string
}

export function DownloadResumeButton({ className = '', iconSize = 15, label = 'Download CV' }: DownloadResumeButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`inline-flex items-center gap-2 print:hidden ${className}`}
    >
      <Download size={iconSize} /> {label}
    </button>
  )
}
