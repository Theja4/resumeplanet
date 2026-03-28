'use client'

import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import type { ResumeData } from '@/types'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}

export default function SkillsEditor({ data, onChange }: EditorProps) {
  const [input, setInput] = useState('')

  function addTag(raw: string) {
    const tag = raw.trim()
    if (!tag || data.skills.includes(tag)) {
      setInput('')
      return
    }
    onChange({ ...data, skills: [...data.skills, tag] })
    setInput('')
  }

  function removeTag(index: number) {
    onChange({ ...data, skills: data.skills.filter((_, i) => i !== index) })
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input.replace(/,$/, ''))
    }
  }

  return (
    <div className="p-4">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {data.skills.map((skill, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full"
          >
            {skill}
            <button
              onClick={() => removeTag(i)}
              className="text-indigo-400 hover:text-indigo-700"
              aria-label={`Remove ${skill}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(input) }}
        placeholder="Type a skill, press Enter or comma to add"
        className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  )
}
