'use client'

import type { ResumeData } from '@/types'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}

export default function SummaryEditor({ data, onChange }: EditorProps) {
  const charCount = data.summary.length
  const isLong = charCount >= 500

  return (
    <div className="p-4">
      <textarea
        value={data.summary}
        onChange={(e) => onChange({ ...data, summary: e.target.value })}
        rows={4}
        placeholder="Write a brief professional summary…"
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
        style={{ minHeight: '96px' }}
      />
      <p className={`mt-1 text-xs text-right ${isLong ? 'text-amber-500' : 'text-gray-400'}`}>
        {charCount} characters{isLong ? ' — consider trimming' : ''}
      </p>
    </div>
  )
}
