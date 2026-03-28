# Resume Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-screen resume builder at `/dashboard/builder/[resumeId]` with 13 section editors, live A4 preview, template switching, auto-save, and pro-gated Tailor mode.

**Architecture:** The builder lives outside the dashboard shell layout via a Next.js route group (`(shell)`), giving it a clean full-screen viewport. All section editors are pure components receiving `data: ResumeData` and emitting `onChange(updated)` — the builder page owns all Supabase I/O. Pro gating is centralised in `lib/proFeatures.ts` + `lib/hooks/useProGate.ts` so any feature can be gated by adding one config entry.

**Tech Stack:** Next.js 15 App Router, React, TypeScript, Tailwind CSS, Supabase (client-side), Lucide React icons, `docx` npm package (already installed), `claude-sonnet-4-6` for tailor analysis.

---

## Task 1: Add Builder Types to `types/index.ts`

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Append the four new types** after the last existing export in `types/index.ts`:

```ts
// ─── Builder ──────────────────────────────────────────────────────────────────

export interface BuilderField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'url' | 'email' | 'phone'
  placeholder?: string
  maxLength?: number
}

export interface BuilderSection {
  id: string
  label: string
  icon: string
  isRequired: boolean
  fields?: BuilderField[]
}

export type BuilderMode = 'builder' | 'tailor'

export interface TailorAnalysis {
  matchScore: number
  missingKeywords: string[]
  suggestions: { sectionId: string; hint: string }[]
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors related to `types/index.ts`

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "feat: add BuilderField, BuilderSection, BuilderMode, TailorAnalysis types"
```

---

## Task 2: Parse Layer Abstraction

**Files:**
- Create: `lib/parsers/types.ts`
- Create: `lib/parsers/pdfjs.ts`
- Create: `lib/parsers/index.ts`
- Modify: `app/api/resume/parse/route.ts`

This wraps the existing `pdfExtractor` + `resumeParser` behind a stable interface so the engine can be swapped by editing one file.

- [ ] **Step 1: Create `lib/parsers/types.ts`**

```ts
import type { ResumeData } from '@/types'

export interface ResumeParser {
  parse(buffer: Buffer, fileType: string): Promise<ResumeData>
}
```

- [ ] **Step 2: Create `lib/parsers/pdfjs.ts`**

This is the current implementation — it calls the existing `pdfExtractor` and `resumeParser`.

```ts
import type { ResumeData } from '@/types'
import type { ResumeParser } from './types'
import { extractTextFromPDF } from '@/lib/pdfExtractor'
import { parseResumeText } from '@/lib/resumeParser'

const pdfjsParser: ResumeParser = {
  async parse(buffer: Buffer, fileType: string): Promise<ResumeData> {
    if (fileType === 'application/pdf') {
      const text = await extractTextFromPDF(buffer)
      return parseResumeText(text)
    }
    // Plain text fallback
    const text = buffer.toString('utf-8')
    return parseResumeText(text)
  },
}

export default pdfjsParser
```

- [ ] **Step 3: Create `lib/parsers/index.ts`**

```ts
import type { ResumeData } from '@/types'
import pdfjsParser from './pdfjs'

// To swap the parse engine: change the import above. Nothing else needs to change.
export async function parseResume(buffer: Buffer, fileType: string): Promise<ResumeData> {
  return pdfjsParser.parse(buffer, fileType)
}
```

- [ ] **Step 4: Check the current parse route to find what to replace**

Read `app/api/resume/parse/route.ts` and find the direct imports of `pdfExtractor` / `resumeParser`. Replace those imports and their usage with the single `parseResume` call.

- [ ] **Step 5: Update `app/api/resume/parse/route.ts`**

Remove the direct imports of `extractTextFromPDF` and `parseResumeText`. Add:
```ts
import { parseResume } from '@/lib/parsers'
```

Then replace the parse logic in the route handler with:
```ts
const parsed = await parseResume(fileBuffer, file.type)
```

(Preserve all surrounding auth, validation, and Supabase save logic unchanged.)

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add lib/parsers/types.ts lib/parsers/pdfjs.ts lib/parsers/index.ts app/api/resume/parse/route.ts
git commit -m "refactor: abstract parse layer behind lib/parsers stable interface"
```

---

## Task 3: Route Group Restructure

**Files:**
- Create: `app/dashboard/(shell)/layout.tsx` (content of current `app/dashboard/layout.tsx`)
- Create: `app/dashboard/builder/layout.tsx` (minimal pass-through)
- Delete: `app/dashboard/layout.tsx`
- Move: `app/dashboard/page.tsx` → `app/dashboard/(shell)/page.tsx`
- Move: `app/dashboard/resumes/` → `app/dashboard/(shell)/resumes/`
- Move: `app/dashboard/templates/` → `app/dashboard/(shell)/templates/`
- Move: `app/dashboard/ats-checker/` → `app/dashboard/(shell)/ats-checker/`
- Move: `app/dashboard/billing/` → `app/dashboard/(shell)/billing/`
- Move: `app/dashboard/orders/` → `app/dashboard/(shell)/orders/`

> **Important:** `actions.ts` at `app/dashboard/actions.ts` stays at the dashboard level if it exists, or moves into `(shell)` if it's only used by shell pages.

- [ ] **Step 1: Create `app/dashboard/(shell)/layout.tsx`**

Copy the exact content from `app/dashboard/layout.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PlanProvider } from '@/lib/context/PlanContext'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import UserMenu from '@/components/layout/UserMenu'
import type { Profile } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  const typedProfile = profile as Profile
  const proUser = typedProfile.plan === 'pro'

  return (
    <PlanProvider isPro={proUser} profile={typedProfile}>
      <div className="min-h-screen bg-gray-50">
        <Sidebar profile={typedProfile} />
        <div className="md:pl-60 flex flex-col min-h-screen">
          <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-20">
            <span className="text-lg font-bold tracking-tight text-gray-900">
              Resum<span className="text-indigo-600">AI</span>
            </span>
            <UserMenu profile={typedProfile} />
          </header>
          <main className="flex-1 px-4 py-6 md:px-8 pb-20 md:pb-6">
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </PlanProvider>
  )
}
```

- [ ] **Step 2: Move existing routes into `(shell)` using shell commands**

```bash
cd /path/to/project   # replace with actual project root
mkdir -p app/dashboard/\(shell\)
mv app/dashboard/page.tsx app/dashboard/\(shell\)/page.tsx
mv app/dashboard/resumes app/dashboard/\(shell\)/resumes
mv app/dashboard/templates app/dashboard/\(shell\)/templates
mv app/dashboard/ats-checker app/dashboard/\(shell\)/ats-checker
mv app/dashboard/billing app/dashboard/\(shell\)/billing
mv app/dashboard/orders app/dashboard/\(shell\)/orders
```

- [ ] **Step 3: Delete old layout**

```bash
rm app/dashboard/layout.tsx
```

- [ ] **Step 4: Create `app/dashboard/builder/layout.tsx`** (minimal, no sidebar)

```tsx
export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 5: Start dev server and verify existing routes still work**

Run: `npm run dev`

Navigate to `/dashboard/resumes` — should show the sidebar layout as before.
Navigate to `/dashboard/templates` — same.

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/
git commit -m "refactor: move dashboard routes into (shell) route group for builder layout isolation"
```

---

## Task 4: Plan Gating Infrastructure

**Files:**
- Create: `lib/proFeatures.ts`
- Create: `lib/hooks/useProGate.ts`
- Modify: `components/shared/ProGateModal.tsx` (replace stub)

- [ ] **Step 1: Create `lib/proFeatures.ts`**

```ts
export interface ProFeatureConfig {
  title: string
  description: string
  bullets: string[]
}

export const PRO_FEATURES = {
  tailor: {
    title: 'Tailor Mode is a Pro feature',
    description: 'Paste any job description and AI will highlight exactly what to improve.',
    bullets: [
      'Match score against the job',
      'Missing keyword detection',
      'Section-by-section suggestions',
    ],
  },
  docx_download: {
    title: 'DOCX export is a Pro feature',
    description: 'Download your resume as an editable Word document.',
    bullets: ['Word .docx format', 'ATS-friendly', 'Editable by recruiters'],
  },
  multi_resume: {
    title: 'Multiple resumes is a Pro feature',
    description: 'Store and manage multiple tailored resumes.',
    bullets: ['Unlimited resumes', 'Separate ATS scores', 'Quick switching'],
  },
} satisfies Record<string, ProFeatureConfig>

export type ProFeatureKey = keyof typeof PRO_FEATURES
```

- [ ] **Step 2: Create `lib/hooks/useProGate.ts`**

```ts
'use client'

import { useState } from 'react'
import { usePlan } from '@/lib/context/PlanContext'
import type { ProFeatureKey } from '@/lib/proFeatures'

export function useProGate() {
  const { isPro } = usePlan()
  const [blockedFeature, setBlockedFeature] = useState<ProFeatureKey | null>(null)

  function requirePro(feature: ProFeatureKey): boolean {
    if (isPro) return true
    setBlockedFeature(feature)
    return false
  }

  return {
    isPro,
    requirePro,
    blockedFeature,
    clearBlockedFeature: () => setBlockedFeature(null),
  }
}
```

- [ ] **Step 3: Replace `components/shared/ProGateModal.tsx`** with full implementation

```tsx
'use client'

import { X, Zap } from 'lucide-react'
import Link from 'next/link'
import { PRO_FEATURES } from '@/lib/proFeatures'
import type { ProFeatureKey } from '@/lib/proFeatures'

interface ProGateModalProps {
  feature: ProFeatureKey | null
  onClose: () => void
}

export default function ProGateModal({ feature, onClose }: ProGateModalProps) {
  if (!feature) return null

  const config = PRO_FEATURES[feature]

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Zap size={16} className="text-indigo-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">{config.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4">{config.description}</p>

        {/* Feature bullets */}
        <ul className="space-y-2 mb-6">
          {config.bullets.map((bullet) => (
            <li key={bullet} className="flex items-center gap-2 text-sm text-gray-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
              {bullet}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          href="/dashboard/billing"
          onClick={onClose}
          className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
        >
          Upgrade to Pro →
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add lib/proFeatures.ts lib/hooks/useProGate.ts components/shared/ProGateModal.tsx
git commit -m "feat: add centralised plan-gating infrastructure (proFeatures, useProGate, ProGateModal)"
```

---

## Task 5: Extract DOCX Generator

**Files:**
- Create: `lib/docxGenerator.ts`
- Modify: `app/dashboard/(shell)/templates/[templateId]/TemplatePreviewClient.tsx`

- [ ] **Step 1: Create `lib/docxGenerator.ts`**

Copy the `generateDOCX` function body from `TemplatePreviewClient.tsx` lines 43–154 into a new file:

```ts
import type { ResumeData } from '@/types'

export async function generateDOCX(data: ResumeData, filename: string): Promise<void> {
  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')

    const sections: InstanceType<typeof Paragraph>[] = []

    sections.push(new Paragraph({ text: data.name, heading: HeadingLevel.TITLE }))

    const contact = [data.email, data.phone, data.location, data.linkedin]
      .filter(Boolean)
      .join(' | ')
    if (contact) sections.push(new Paragraph({ text: contact }))

    if (data.summary) {
      sections.push(new Paragraph({ text: 'Summary', heading: HeadingLevel.HEADING_1 }))
      sections.push(new Paragraph({ text: data.summary }))
    }

    if (data.experience.length > 0) {
      sections.push(new Paragraph({ text: 'Experience', heading: HeadingLevel.HEADING_1 }))
      data.experience.forEach(exp => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: exp.title, bold: true }),
              new TextRun({ text: ` — ${exp.company}` }),
              new TextRun({
                text: `  ${exp.startDate}${exp.endDate ? ` – ${exp.endDate}` : ''}`,
                color: '666666',
              }),
            ],
          })
        )
        exp.bullets.forEach(b => {
          sections.push(new Paragraph({ text: `• ${b}` }))
        })
      })
    }

    if (data.education.length > 0) {
      sections.push(new Paragraph({ text: 'Education', heading: HeadingLevel.HEADING_1 }))
      data.education.forEach(edu => {
        sections.push(
          new Paragraph({
            text: `${edu.degree}${edu.field ? ` in ${edu.field}` : ''} — ${edu.institution} (${edu.graduationDate})`,
          })
        )
      })
    }

    if (data.skills.length > 0) {
      sections.push(new Paragraph({ text: 'Skills', heading: HeadingLevel.HEADING_1 }))
      sections.push(new Paragraph({ text: data.skills.join(', ') }))
    }

    if (data.certifications.length > 0) {
      sections.push(new Paragraph({ text: 'Certifications', heading: HeadingLevel.HEADING_1 }))
      data.certifications.forEach(c => {
        sections.push(new Paragraph({ text: `${c.name}${c.issuer ? ` · ${c.issuer}` : ''}${c.date ? ` (${c.date})` : ''}` }))
      })
    }

    if (data.projects.length > 0) {
      sections.push(new Paragraph({ text: 'Projects', heading: HeadingLevel.HEADING_1 }))
      data.projects.forEach(p => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: p.name, bold: true }),
              ...(p.description ? [new TextRun({ text: ` — ${p.description}` })] : []),
            ],
          })
        )
        if (p.technologies.length > 0) {
          sections.push(new Paragraph({ text: p.technologies.join(', '), indent: { left: 360 } }))
        }
      })
    }

    if (data.languages.length > 0) {
      sections.push(new Paragraph({ text: 'Languages', heading: HeadingLevel.HEADING_1 }))
      sections.push(new Paragraph({ text: data.languages.join(', ') }))
    }

    const doc = new Document({ sections: [{ children: sections }] })
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('DOCX generation failed:', err)
    const plain = [
      data.name,
      [data.email, data.phone, data.location].filter(Boolean).join(' | '),
      '',
      data.summary,
      '',
      ...data.experience.flatMap(e => [
        `${e.title} — ${e.company} (${e.startDate}–${e.endDate})`,
        ...e.bullets.map(b => `  • ${b}`),
        '',
      ]),
    ].join('\n')
    await navigator.clipboard.writeText(plain).catch(() => {})
    alert('DOCX generation failed. Resume text copied to clipboard instead.')
  }
}
```

- [ ] **Step 2: Update `TemplatePreviewClient.tsx`** to import from the shared lib instead

Remove the inline `generateDOCX` function (lines 43–154) and add this import at the top:
```ts
import { generateDOCX } from '@/lib/docxGenerator'
```

All existing calls to `generateDOCX(...)` in the file continue to work unchanged.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add lib/docxGenerator.ts "app/dashboard/(shell)/templates/[templateId]/TemplatePreviewClient.tsx"
git commit -m "refactor: extract generateDOCX to lib/docxGenerator for sharing with builder"
```

---

## Task 6: Simple Section Editors (ContactEditor, SummaryEditor, tag-chip editors)

**Files:**
- Create: `components/builder/ContactEditor.tsx`
- Create: `components/builder/SummaryEditor.tsx`
- Create: `components/builder/SkillsEditor.tsx`
- Create: `components/builder/LanguagesEditor.tsx`
- Create: `components/builder/InterestsEditor.tsx`

All editors share the same prop type:
```ts
interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}
```

- [ ] **Step 1: Create `components/builder/ContactEditor.tsx`**

```tsx
'use client'

import type { ResumeData } from '@/types'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}

const FIELDS: { key: keyof ResumeData; label: string; type: string; placeholder?: string }[] = [
  { key: 'name', label: 'Full Name', type: 'text' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'location', label: 'Location', type: 'text', placeholder: 'City, Country' },
  { key: 'linkedin', label: 'LinkedIn URL', type: 'url' },
  { key: 'website', label: 'Website URL', type: 'url' },
]

export default function ContactEditor({ data, onChange }: EditorProps) {
  function handleChange(key: keyof ResumeData, value: string) {
    onChange({ ...data, [key]: value })
  }

  return (
    <div className="space-y-3 p-4">
      {FIELDS.map(({ key, label, type, placeholder }) => (
        <div key={key}>
          <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
          <input
            type={type}
            value={(data[key] as string) ?? ''}
            placeholder={placeholder}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create `components/builder/SummaryEditor.tsx`**

```tsx
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
```

- [ ] **Step 3: Create `components/builder/SkillsEditor.tsx`** (tag-chip input)

```tsx
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
```

- [ ] **Step 4: Create `components/builder/LanguagesEditor.tsx`**

Same pattern as SkillsEditor but for `data.languages`:

```tsx
'use client'

import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import type { ResumeData } from '@/types'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}

export default function LanguagesEditor({ data, onChange }: EditorProps) {
  const [input, setInput] = useState('')

  function addTag(raw: string) {
    const tag = raw.trim()
    if (!tag || data.languages.includes(tag)) {
      setInput('')
      return
    }
    onChange({ ...data, languages: [...data.languages, tag] })
    setInput('')
  }

  function removeTag(index: number) {
    onChange({ ...data, languages: data.languages.filter((_, i) => i !== index) })
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
        {data.languages.map((lang, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full"
          >
            {lang}
            <button
              onClick={() => removeTag(i)}
              className="text-indigo-400 hover:text-indigo-700"
              aria-label={`Remove ${lang}`}
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
        placeholder="English (Native)"
        className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  )
}
```

- [ ] **Step 5: Create `components/builder/InterestsEditor.tsx`**

Same pattern for `data.interests`:

```tsx
'use client'

import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import type { ResumeData } from '@/types'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}

export default function InterestsEditor({ data, onChange }: EditorProps) {
  const [input, setInput] = useState('')

  function addTag(raw: string) {
    const tag = raw.trim()
    if (!tag || data.interests.includes(tag)) {
      setInput('')
      return
    }
    onChange({ ...data, interests: [...data.interests, tag] })
    setInput('')
  }

  function removeTag(index: number) {
    onChange({ ...data, interests: data.interests.filter((_, i) => i !== index) })
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
        {data.interests.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full"
          >
            {item}
            <button
              onClick={() => removeTag(i)}
              className="text-indigo-400 hover:text-indigo-700"
              aria-label={`Remove ${item}`}
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
        placeholder="Type an interest, press Enter or comma to add"
        className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  )
}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add components/builder/
git commit -m "feat: add ContactEditor, SummaryEditor, SkillsEditor, LanguagesEditor, InterestsEditor"
```

---

## Task 7: List-Card Section Editors (Experience, Volunteer, Education, Projects)

**Files:**
- Create: `components/builder/ExperienceEditor.tsx`
- Create: `components/builder/VolunteerEditor.tsx`
- Create: `components/builder/EducationEditor.tsx`
- Create: `components/builder/ProjectsEditor.tsx`

- [ ] **Step 1: Create `components/builder/ExperienceEditor.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { ResumeData, ExperienceItem } from '@/types'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}

const EMPTY_JOB: ExperienceItem = {
  company: '',
  title: '',
  location: '',
  startDate: '',
  endDate: '',
  bullets: [],
}

export default function ExperienceEditor({ data, onChange }: EditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  function updateItem(index: number, updated: ExperienceItem) {
    const next = [...data.experience]
    next[index] = updated
    onChange({ ...data, experience: next })
  }

  function removeItem(index: number) {
    onChange({ ...data, experience: data.experience.filter((_, i) => i !== index) })
    if (expandedIndex === index) setExpandedIndex(null)
  }

  function addItem() {
    const next = [...data.experience, { ...EMPTY_JOB }]
    onChange({ ...data, experience: next })
    setExpandedIndex(next.length - 1)
  }

  function updateBullet(jobIndex: number, bulletIndex: number, value: string) {
    const item = { ...data.experience[jobIndex], bullets: [...data.experience[jobIndex].bullets] }
    item.bullets[bulletIndex] = value
    updateItem(jobIndex, item)
  }

  function addBullet(jobIndex: number) {
    const item = { ...data.experience[jobIndex], bullets: [...data.experience[jobIndex].bullets, ''] }
    updateItem(jobIndex, item)
  }

  function removeBullet(jobIndex: number, bulletIndex: number) {
    const item = {
      ...data.experience[jobIndex],
      bullets: data.experience[jobIndex].bullets.filter((_, i) => i !== bulletIndex),
    }
    updateItem(jobIndex, item)
  }

  return (
    <div className="p-4 space-y-2">
      {data.experience.map((job, i) => (
        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Card header */}
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors"
            onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {job.company || 'New Job'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {job.title}{job.startDate ? ` · ${job.startDate}${job.endDate ? `–${job.endDate}` : ''}` : ''}
              </p>
            </div>
            {expandedIndex === i ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
          </button>

          {/* Expanded fields */}
          {expandedIndex === i && (
            <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-100">
              {(
                [
                  ['title', 'Job Title'],
                  ['company', 'Company'],
                  ['location', 'Location'],
                  ['startDate', 'Start Date'],
                  ['endDate', 'End Date'],
                ] as [keyof ExperienceItem, string][]
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
                  <input
                    type="text"
                    value={(job[key] as string) ?? ''}
                    onChange={(e) => updateItem(i, { ...job, [key]: e.target.value })}
                    className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              ))}

              {/* Bullets */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bullet Points</label>
                <div className="space-y-1">
                  {job.bullets.map((bullet, bi) => (
                    <div key={bi} className="flex items-start gap-1">
                      <textarea
                        value={bullet}
                        onChange={(e) => updateBullet(i, bi, e.target.value)}
                        rows={2}
                        className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => removeBullet(i, bi)}
                        className="mt-1 text-gray-300 hover:text-red-500 transition-colors"
                        aria-label="Remove bullet"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addBullet(i)}
                  className="mt-1.5 text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus size={11} /> Add bullet
                </button>
              </div>

              <button
                onClick={() => removeItem(i)}
                className="mt-2 text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Remove this job
              </button>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addItem}
        className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        <Plus size={14} /> Add job
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/builder/VolunteerEditor.tsx`**

Same pattern as ExperienceEditor but operates on `data.volunteer` and uses "Add role" / "Remove this role" labels:

```tsx
'use client'

import { useState } from 'react'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { ResumeData, ExperienceItem } from '@/types'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}

const EMPTY_ROLE: ExperienceItem = {
  company: '',
  title: '',
  location: '',
  startDate: '',
  endDate: '',
  bullets: [],
}

export default function VolunteerEditor({ data, onChange }: EditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  function updateItem(index: number, updated: ExperienceItem) {
    const next = [...data.volunteer]
    next[index] = updated
    onChange({ ...data, volunteer: next })
  }

  function removeItem(index: number) {
    onChange({ ...data, volunteer: data.volunteer.filter((_, i) => i !== index) })
    if (expandedIndex === index) setExpandedIndex(null)
  }

  function addItem() {
    const next = [...data.volunteer, { ...EMPTY_ROLE }]
    onChange({ ...data, volunteer: next })
    setExpandedIndex(next.length - 1)
  }

  function updateBullet(roleIndex: number, bulletIndex: number, value: string) {
    const item = { ...data.volunteer[roleIndex], bullets: [...data.volunteer[roleIndex].bullets] }
    item.bullets[bulletIndex] = value
    updateItem(roleIndex, item)
  }

  function addBullet(roleIndex: number) {
    const item = { ...data.volunteer[roleIndex], bullets: [...data.volunteer[roleIndex].bullets, ''] }
    updateItem(roleIndex, item)
  }

  function removeBullet(roleIndex: number, bulletIndex: number) {
    const item = {
      ...data.volunteer[roleIndex],
      bullets: data.volunteer[roleIndex].bullets.filter((_, i) => i !== bulletIndex),
    }
    updateItem(roleIndex, item)
  }

  return (
    <div className="p-4 space-y-2">
      {data.volunteer.map((role, i) => (
        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors"
            onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{role.company || 'New Role'}</p>
              <p className="text-xs text-gray-500 truncate">
                {role.title}{role.startDate ? ` · ${role.startDate}${role.endDate ? `–${role.endDate}` : ''}` : ''}
              </p>
            </div>
            {expandedIndex === i ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
          </button>

          {expandedIndex === i && (
            <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-100">
              {(
                [
                  ['title', 'Role Title'],
                  ['company', 'Organisation'],
                  ['location', 'Location'],
                  ['startDate', 'Start Date'],
                  ['endDate', 'End Date'],
                ] as [keyof ExperienceItem, string][]
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
                  <input
                    type="text"
                    value={(role[key] as string) ?? ''}
                    onChange={(e) => updateItem(i, { ...role, [key]: e.target.value })}
                    className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bullet Points</label>
                <div className="space-y-1">
                  {role.bullets.map((bullet, bi) => (
                    <div key={bi} className="flex items-start gap-1">
                      <textarea
                        value={bullet}
                        onChange={(e) => updateBullet(i, bi, e.target.value)}
                        rows={2}
                        className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button onClick={() => removeBullet(i, bi)} className="mt-1 text-gray-300 hover:text-red-500 transition-colors" aria-label="Remove bullet">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => addBullet(i)} className="mt-1.5 text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  <Plus size={11} /> Add bullet
                </button>
              </div>
              <button onClick={() => removeItem(i)} className="mt-2 text-xs text-red-500 hover:text-red-700 transition-colors">
                Remove this role
              </button>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={addItem}
        className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        <Plus size={14} /> Add role
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/builder/EducationEditor.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import type { ResumeData, EducationItem } from '@/types'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}

const EMPTY_EDU: EducationItem = { institution: '', degree: '', field: '', graduationDate: '', gpa: '' }

export default function EducationEditor({ data, onChange }: EditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  function updateItem(index: number, updated: EducationItem) {
    const next = [...data.education]
    next[index] = updated
    onChange({ ...data, education: next })
  }

  function removeItem(index: number) {
    onChange({ ...data, education: data.education.filter((_, i) => i !== index) })
    if (expandedIndex === index) setExpandedIndex(null)
  }

  function addItem() {
    const next = [...data.education, { ...EMPTY_EDU }]
    onChange({ ...data, education: next })
    setExpandedIndex(next.length - 1)
  }

  return (
    <div className="p-4 space-y-2">
      {data.education.map((edu, i) => (
        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors"
            onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{edu.institution || 'New School'}</p>
              <p className="text-xs text-gray-500 truncate">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
            </div>
            {expandedIndex === i ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
          </button>

          {expandedIndex === i && (
            <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-100">
              {(
                [
                  ['institution', 'Institution'],
                  ['degree', 'Degree'],
                  ['field', 'Field of Study'],
                  ['graduationDate', 'Graduation Date'],
                  ['gpa', 'GPA (optional)'],
                ] as [keyof EducationItem, string][]
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
                  <input
                    type="text"
                    value={edu[key] ?? ''}
                    onChange={(e) => updateItem(i, { ...edu, [key]: e.target.value })}
                    className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              ))}
              <button onClick={() => removeItem(i)} className="mt-2 text-xs text-red-500 hover:text-red-700 transition-colors">
                Remove this entry
              </button>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={addItem}
        className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        <Plus size={14} /> Add education
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Create `components/builder/ProjectsEditor.tsx`**

```tsx
'use client'

import { useState, KeyboardEvent } from 'react'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { ResumeData, ProjectItem } from '@/types'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}

const EMPTY_PROJECT: ProjectItem = { name: '', description: '', technologies: [] }

export default function ProjectsEditor({ data, onChange }: EditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [techInputs, setTechInputs] = useState<Record<number, string>>({})

  function updateItem(index: number, updated: ProjectItem) {
    const next = [...data.projects]
    next[index] = updated
    onChange({ ...data, projects: next })
  }

  function removeItem(index: number) {
    onChange({ ...data, projects: data.projects.filter((_, i) => i !== index) })
    if (expandedIndex === index) setExpandedIndex(null)
  }

  function addItem() {
    const next = [...data.projects, { ...EMPTY_PROJECT }]
    onChange({ ...data, projects: next })
    setExpandedIndex(next.length - 1)
  }

  function addTech(projectIndex: number, raw: string) {
    const tag = raw.trim()
    if (!tag || data.projects[projectIndex].technologies.includes(tag)) {
      setTechInputs(prev => ({ ...prev, [projectIndex]: '' }))
      return
    }
    updateItem(projectIndex, {
      ...data.projects[projectIndex],
      technologies: [...data.projects[projectIndex].technologies, tag],
    })
    setTechInputs(prev => ({ ...prev, [projectIndex]: '' }))
  }

  function removeTech(projectIndex: number, techIndex: number) {
    updateItem(projectIndex, {
      ...data.projects[projectIndex],
      technologies: data.projects[projectIndex].technologies.filter((_, i) => i !== techIndex),
    })
  }

  return (
    <div className="p-4 space-y-2">
      {data.projects.map((project, i) => (
        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors"
            onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
          >
            <p className="text-sm font-medium text-gray-900 truncate">{project.name || 'New Project'}</p>
            {expandedIndex === i ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
          </button>

          {expandedIndex === i && (
            <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-100">
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Project Name</label>
                <input
                  type="text"
                  value={project.name}
                  onChange={(e) => updateItem(i, { ...project, name: e.target.value })}
                  className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Description</label>
                <textarea
                  value={project.description}
                  onChange={(e) => updateItem(i, { ...project, description: e.target.value })}
                  rows={2}
                  className="w-full rounded border border-gray-200 px-2 py-1 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Technologies</label>
                <div className="flex flex-wrap gap-1 mb-1">
                  {project.technologies.map((tech, ti) => (
                    <span key={ti} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                      {tech}
                      <button onClick={() => removeTech(i, ti)} className="text-indigo-400 hover:text-indigo-700"><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <input
                  value={techInputs[i] ?? ''}
                  onChange={(e) => setTechInputs(prev => ({ ...prev, [i]: e.target.value }))}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      addTech(i, (techInputs[i] ?? '').replace(/,$/, ''))
                    }
                  }}
                  onBlur={() => { if (techInputs[i]?.trim()) addTech(i, techInputs[i]) }}
                  placeholder="React, TypeScript…"
                  className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button onClick={() => removeItem(i)} className="mt-2 text-xs text-red-500 hover:text-red-700 transition-colors">
                Remove this project
              </button>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={addItem}
        className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        <Plus size={14} /> Add project
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add components/builder/
git commit -m "feat: add ExperienceEditor, VolunteerEditor, EducationEditor, ProjectsEditor"
```

---

## Task 8: Simple List Editors (Certifications, Awards, Publications, References)

**Files:**
- Create: `components/builder/CertificationsEditor.tsx`
- Create: `components/builder/AwardsEditor.tsx`
- Create: `components/builder/PublicationsEditor.tsx`
- Create: `components/builder/ReferencesEditor.tsx`

- [ ] **Step 1: Create `components/builder/CertificationsEditor.tsx`**

```tsx
'use client'

import { Plus, X } from 'lucide-react'
import type { ResumeData, CertificationItem } from '@/types'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}

const EMPTY: CertificationItem = { name: '', issuer: '', date: '' }

export default function CertificationsEditor({ data, onChange }: EditorProps) {
  function updateItem(index: number, updated: CertificationItem) {
    const next = [...data.certifications]
    next[index] = updated
    onChange({ ...data, certifications: next })
  }

  function removeItem(index: number) {
    onChange({ ...data, certifications: data.certifications.filter((_, i) => i !== index) })
  }

  function addItem() {
    onChange({ ...data, certifications: [...data.certifications, { ...EMPTY }] })
  }

  return (
    <div className="p-4 space-y-2">
      {data.certifications.map((cert, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={cert.name}
            onChange={(e) => updateItem(i, { ...cert, name: e.target.value })}
            placeholder="Certification name"
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={cert.issuer}
            onChange={(e) => updateItem(i, { ...cert, issuer: e.target.value })}
            placeholder="Issuer"
            className="w-28 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={cert.date}
            onChange={(e) => updateItem(i, { ...cert, date: e.target.value })}
            placeholder="Year"
            className="w-16 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0" aria-label="Remove">
            <X size={13} />
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
      >
        <Plus size={13} /> Add certification
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/builder/AwardsEditor.tsx`**

```tsx
'use client'

import { Plus, X } from 'lucide-react'
import type { ResumeData, AwardItem } from '@/types'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}

const EMPTY: AwardItem = { title: '', issuer: '', date: '' }

export default function AwardsEditor({ data, onChange }: EditorProps) {
  function updateItem(index: number, updated: AwardItem) {
    const next = [...data.awards]
    next[index] = updated
    onChange({ ...data, awards: next })
  }

  function removeItem(index: number) {
    onChange({ ...data, awards: data.awards.filter((_, i) => i !== index) })
  }

  function addItem() {
    onChange({ ...data, awards: [...data.awards, { ...EMPTY }] })
  }

  return (
    <div className="p-4 space-y-2">
      {data.awards.map((award, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={award.title}
            onChange={(e) => updateItem(i, { ...award, title: e.target.value })}
            placeholder="Award title"
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={award.issuer}
            onChange={(e) => updateItem(i, { ...award, issuer: e.target.value })}
            placeholder="Issuer"
            className="w-28 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={award.date}
            onChange={(e) => updateItem(i, { ...award, date: e.target.value })}
            placeholder="Year"
            className="w-16 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0" aria-label="Remove">
            <X size={13} />
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
      >
        <Plus size={13} /> Add award
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/builder/PublicationsEditor.tsx`**

```tsx
'use client'

import { Plus, X } from 'lucide-react'
import type { ResumeData, PublicationItem } from '@/types'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}

const EMPTY: PublicationItem = { title: '', publisher: '', date: '' }

export default function PublicationsEditor({ data, onChange }: EditorProps) {
  function updateItem(index: number, updated: PublicationItem) {
    const next = [...data.publications]
    next[index] = updated
    onChange({ ...data, publications: next })
  }

  function removeItem(index: number) {
    onChange({ ...data, publications: data.publications.filter((_, i) => i !== index) })
  }

  function addItem() {
    onChange({ ...data, publications: [...data.publications, { ...EMPTY }] })
  }

  return (
    <div className="p-4 space-y-2">
      {data.publications.map((pub, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={pub.title}
            onChange={(e) => updateItem(i, { ...pub, title: e.target.value })}
            placeholder="Publication title"
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={pub.publisher}
            onChange={(e) => updateItem(i, { ...pub, publisher: e.target.value })}
            placeholder="Publisher"
            className="w-28 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={pub.date}
            onChange={(e) => updateItem(i, { ...pub, date: e.target.value })}
            placeholder="Year"
            className="w-16 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0" aria-label="Remove">
            <X size={13} />
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
      >
        <Plus size={13} /> Add publication
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Create `components/builder/ReferencesEditor.tsx`**

```tsx
'use client'

import { Plus, X } from 'lucide-react'
import type { ResumeData } from '@/types'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}

export default function ReferencesEditor({ data, onChange }: EditorProps) {
  function updateItem(index: number, value: string) {
    const next = [...data.references]
    next[index] = value
    onChange({ ...data, references: next })
  }

  function removeItem(index: number) {
    onChange({ ...data, references: data.references.filter((_, i) => i !== index) })
  }

  function addItem() {
    onChange({ ...data, references: [...data.references, ''] })
  }

  return (
    <div className="p-4 space-y-2">
      {data.references.map((ref, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={ref}
            onChange={(e) => updateItem(i, e.target.value)}
            placeholder="Name, Title, Company, email@example.com"
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0" aria-label="Remove">
            <X size={13} />
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
      >
        <Plus size={13} /> Add reference
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add components/builder/
git commit -m "feat: add CertificationsEditor, AwardsEditor, PublicationsEditor, ReferencesEditor"
```

---

## Task 9: Template Switcher Modal

**Files:**
- Create: `components/builder/TemplateSwitcherModal.tsx`

- [ ] **Step 1: Create `components/builder/TemplateSwitcherModal.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { X, Check } from 'lucide-react'
import { getAllTemplates, getTemplateComponent } from '@/components/templates/registry'
import type { ResumeData, TemplateId, TemplateProps } from '@/types'

interface Props {
  isOpen: boolean
  currentTemplateId: TemplateId
  resumeData: ResumeData
  onSelect: (id: TemplateId) => void
  onClose: () => void
}

export default function TemplateSwitcherModal({
  isOpen,
  currentTemplateId,
  resumeData,
  onSelect,
  onClose,
}: Props) {
  const allTemplates = getAllTemplates()

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Choose a Template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 p-6">
          {allTemplates.map((tpl) => {
            const TemplateComponent = getTemplateComponent(tpl.id) as React.ComponentType<TemplateProps>
            const isSelected = tpl.id === currentTemplateId

            return (
              <button
                key={tpl.id}
                onClick={() => { onSelect(tpl.id); onClose() }}
                className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                  isSelected ? 'border-indigo-500 shadow-md' : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                {/* Template preview at 25% scale */}
                <div className="overflow-hidden" style={{ height: '280px' }}>
                  <div style={{ transform: 'scale(0.25)', transformOrigin: 'top left', width: '794px', pointerEvents: 'none' }}>
                    <TemplateComponent data={resumeData} isEditing={false} onFieldChange={() => {}} />
                  </div>
                </div>

                {/* Selected overlay */}
                {isSelected && (
                  <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center">
                    <div className="bg-indigo-500 rounded-full p-1">
                      <Check size={14} className="text-white" />
                    </div>
                  </div>
                )}

                {/* Label */}
                <div className="px-2 py-1.5 border-t border-gray-100 text-xs font-medium text-gray-700 text-center bg-white">
                  {tpl.name}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/builder/TemplateSwitcherModal.tsx
git commit -m "feat: add TemplateSwitcherModal with 25% scale preview grid"
```

---

## Task 10: Tailor Analysis API Route

**Files:**
- Create: `app/api/ats/tailor-analysis/route.ts`

- [ ] **Step 1: Create `app/api/ats/tailor-analysis/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaudeJSON } from '@/lib/claude'
import { isPro } from '@/lib/planUtils'
import type { TailorAnalysis, APIResponse, Profile } from '@/types'

const SYSTEM = `You are a resume career coach. Analyse the provided resume against the job description and return structured JSON. Return ONLY valid JSON.`

const SCHEMA = `{
  "matchScore": number 0-100,
  "missingKeywords": ["string"],
  "suggestions": [
    { "sectionId": "string", "hint": "string" }
  ]
}`

const ALLOWED_SECTIONS = ['contact', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'volunteer', 'languages', 'interests', 'awards', 'publications', 'references']

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  if (!isPro(profile)) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Pro plan required' },
      { status: 403 }
    )
  }

  let body: { resumeText: string; jobDescription: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { resumeText, jobDescription } = body

  if (!resumeText || resumeText.trim().length < 50) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Resume text too short' },
      { status: 400 }
    )
  }

  if (!jobDescription || jobDescription.trim().length < 50) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Job description too short' },
      { status: 400 }
    )
  }

  const prompt = `Job Description:\n${jobDescription}\n\nResume:\n${resumeText}\n\nReturn a JSON object matching exactly this schema:\n${SCHEMA}\n\nRules:\n- matchScore: 0-100 integer\n- missingKeywords: top 8 keywords from the job description that are absent in the resume\n- suggestions: max 5 items, sectionId must be one of: ${ALLOWED_SECTIONS.join(', ')}\n- hint: 1 sentence, actionable`

  let result: TailorAnalysis

  try {
    result = await callClaudeJSON<TailorAnalysis>({
      model: 'claude-sonnet-4-6',
      system: SYSTEM,
      prompt,
      maxTokens: 2048,
      timeoutMs: 60000,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'CLAUDE_TIMEOUT') {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: 'CLAUDE_TIMEOUT' },
        { status: 408 }
      )
    }
    if (msg === 'CLAUDE_JSON_PARSE_FAILED') {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: 'PARSE_FAILED' },
        { status: 422 }
      )
    }
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }

  return NextResponse.json<APIResponse<TailorAnalysis>>(
    { success: true, data: result },
    { status: 200 }
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/api/ats/tailor-analysis/route.ts
git commit -m "feat: add /api/ats/tailor-analysis route (pro-gated, claude-sonnet-4-6)"
```

---

## Task 11: Tailor Panel Component

**Files:**
- Create: `components/builder/TailorPanel.tsx`

- [ ] **Step 1: Create `components/builder/TailorPanel.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import type { ResumeData, TailorAnalysis } from '@/types'

// Section id → icon label map (matches sidebar section ids)
const SECTION_LABELS: Record<string, string> = {
  contact: 'Contact Info',
  summary: 'Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certificates',
  volunteer: 'Volunteer Work',
  languages: 'Languages',
  interests: 'Interests',
  awards: 'Awards',
  publications: 'Publications',
  references: 'References',
}

function scoreColor(score: number) {
  if (score >= 70) return 'text-green-600 border-green-500'
  if (score >= 40) return 'text-amber-600 border-amber-500'
  return 'text-red-600 border-red-500'
}

function scoreRingColor(score: number) {
  if (score >= 70) return '#16a34a'
  if (score >= 40) return '#d97706'
  return '#dc2626'
}

interface Props {
  resumeData: ResumeData
  analysis: TailorAnalysis | null
  isTailoring: boolean
  jobDescription: string
  onJobDescriptionChange: (value: string) => void
  onAnalyse: () => void
  onApplySuggestion: (sectionId: string) => void
}

export default function TailorPanel({
  resumeData,
  analysis,
  isTailoring,
  jobDescription,
  onJobDescriptionChange,
  onAnalyse,
  onApplySuggestion,
}: Props) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Tailor to a job</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Paste a job description and get AI-powered improvement hints.
        </p>
      </div>

      <div className="p-4 space-y-3">
        <textarea
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          rows={8}
          placeholder="Paste the job description here…"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
        />
        <button
          onClick={onAnalyse}
          disabled={isTailoring || jobDescription.trim().length < 50}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          {isTailoring ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Analysing…
            </>
          ) : (
            'Analyse'
          )}
        </button>
      </div>

      {analysis && (
        <div className="px-4 pb-6 space-y-4">
          {/* Match score */}
          <div className="flex items-center gap-3">
            <div
              className={`h-14 w-14 rounded-full border-4 flex items-center justify-center shrink-0 ${scoreColor(analysis.matchScore)}`}
              style={{ borderColor: scoreRingColor(analysis.matchScore) }}
            >
              <span className="text-lg font-bold">{analysis.matchScore}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Match Score</p>
              <p className="text-xs text-gray-500">
                {analysis.matchScore >= 70
                  ? 'Strong match'
                  : analysis.matchScore >= 40
                  ? 'Moderate match — some gaps'
                  : 'Weak match — significant gaps'}
              </p>
            </div>
          </div>

          {/* Missing keywords */}
          {analysis.missingKeywords.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Missing Keywords
              </p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.missingKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-full"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Suggestions
              </p>
              <div className="space-y-2">
                {analysis.suggestions.map((s, i) => (
                  <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-medium text-amber-800 mb-1">
                      {SECTION_LABELS[s.sectionId] ?? s.sectionId}
                    </p>
                    <p className="text-xs text-amber-700 mb-2">{s.hint}</p>
                    <button
                      onClick={() => onApplySuggestion(s.sectionId)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      + Apply
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/builder/TailorPanel.tsx
git commit -m "feat: add TailorPanel component with match score, missing keywords, suggestions"
```

---

## Task 12: Builder Page

**Files:**
- Create: `app/dashboard/builder/[resumeId]/page.tsx`

This is the main assembly — it wires all the editors, the preview, the top bar, auto-save, and plan gating together.

- [ ] **Step 1: Create `app/dashboard/builder/[resumeId]/page.tsx`**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutGrid,
  ChevronDown,
  User,
  AlignLeft,
  Briefcase,
  GraduationCap,
  Zap,
  Code,
  Award,
  Heart,
  Globe,
  Star,
  Trophy,
  BookOpen,
  Users,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProGate } from '@/lib/hooks/useProGate'
import { PlanProvider } from '@/lib/context/PlanContext'
import ProGateModal from '@/components/shared/ProGateModal'
import TemplateSwitcherModal from '@/components/builder/TemplateSwitcherModal'
import TailorPanel from '@/components/builder/TailorPanel'
import ContactEditor from '@/components/builder/ContactEditor'
import SummaryEditor from '@/components/builder/SummaryEditor'
import ExperienceEditor from '@/components/builder/ExperienceEditor'
import EducationEditor from '@/components/builder/EducationEditor'
import SkillsEditor from '@/components/builder/SkillsEditor'
import ProjectsEditor from '@/components/builder/ProjectsEditor'
import CertificationsEditor from '@/components/builder/CertificationsEditor'
import VolunteerEditor from '@/components/builder/VolunteerEditor'
import LanguagesEditor from '@/components/builder/LanguagesEditor'
import InterestsEditor from '@/components/builder/InterestsEditor'
import AwardsEditor from '@/components/builder/AwardsEditor'
import PublicationsEditor from '@/components/builder/PublicationsEditor'
import ReferencesEditor from '@/components/builder/ReferencesEditor'
import { getTemplate, getTemplateComponent } from '@/components/templates/registry'
import { generateDOCX } from '@/lib/docxGenerator'
import type { ResumeData, TemplateId, BuilderMode, TailorAnalysis, TemplateProps, Profile } from '@/types'

// ─── Section config ───────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'contact', label: 'Contact Info', Icon: User },
  { id: 'summary', label: 'Summary', Icon: AlignLeft },
  { id: 'experience', label: 'Work Experience', Icon: Briefcase },
  { id: 'education', label: 'Education', Icon: GraduationCap },
  { id: 'skills', label: 'Skills', Icon: Zap },
  { id: 'projects', label: 'Projects', Icon: Code },
  { id: 'certifications', label: 'Certificates', Icon: Award },
  { id: 'volunteer', label: 'Volunteer Work', Icon: Heart },
  { id: 'languages', label: 'Languages', Icon: Globe },
  { id: 'interests', label: 'Interests', Icon: Star },
  { id: 'awards', label: 'Awards', Icon: Trophy },
  { id: 'publications', label: 'Publications', Icon: BookOpen },
  { id: 'references', label: 'References', Icon: Users },
] as const

type SectionId = typeof SECTIONS[number]['id']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EDITORS: Record<SectionId, React.ComponentType<any>> = {
  contact: ContactEditor,
  summary: SummaryEditor,
  experience: ExperienceEditor,
  education: EducationEditor,
  skills: SkillsEditor,
  projects: ProjectsEditor,
  certifications: CertificationsEditor,
  volunteer: VolunteerEditor,
  languages: LanguagesEditor,
  interests: InterestsEditor,
  awards: AwardsEditor,
  publications: PublicationsEditor,
  references: ReferencesEditor,
}

function sectionHasData(sectionId: SectionId, data: ResumeData): boolean {
  switch (sectionId) {
    case 'contact': return !!(data.name || data.email || data.phone)
    case 'summary': return !!data.summary
    case 'experience': return data.experience.length > 0
    case 'education': return data.education.length > 0
    case 'skills': return data.skills.length > 0
    case 'projects': return data.projects.length > 0
    case 'certifications': return data.certifications.length > 0
    case 'volunteer': return data.volunteer.length > 0
    case 'languages': return data.languages.length > 0
    case 'interests': return data.interests.length > 0
    case 'awards': return data.awards.length > 0
    case 'publications': return data.publications.length > 0
    case 'references': return data.references.length > 0
  }
}

// ─── Inner builder (needs PlanContext) ────────────────────────────────────────

interface BuilderInnerProps {
  resumeId: string
  isPro: boolean
  profile: Profile
}

function BuilderInner({ resumeId, isPro, profile }: BuilderInnerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const { requirePro, blockedFeature, clearBlockedFeature } = useProGate()

  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [savedData, setSavedData] = useState<ResumeData | null>(null)
  const [resumeTitle, setResumeTitle] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>(
    (searchParams.get('template') as TemplateId) ?? 'modern-minimal'
  )
  const [activeMode, setActiveMode] = useState<BuilderMode>('builder')
  const [expandedSection, setExpandedSection] = useState<SectionId | null>('contact')
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [tailorAnalysis, setTailorAnalysis] = useState<TailorAnalysis | null>(null)
  const [isTailoring, setIsTailoring] = useState(false)
  const [sectionHints, setSectionHints] = useState<Set<string>>(new Set())
  const [previewScale, setPreviewScale] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  const saveTimerRef = useRef<NodeJS.Timeout>()
  const userId = profile.id

  // ── Load resume on mount ────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: resume, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .eq('user_id', userId)
        .single()

      if (error || !resume) {
        router.replace('/dashboard/resumes')
        return
      }

      const data = resume.parsed_data as ResumeData
      setResumeData(data)
      setSavedData(data)
      setResumeTitle(resume.title ?? '')
      setIsLoading(false)
    }
    load()
  }, [resumeId, userId])

  // ── Preview scale ───────────────────────────────────────────────────────────
  useEffect(() => {
    function updateScale() {
      setPreviewScale(Math.min(1.0, (window.innerHeight - 48) / 1123))
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  // ── Auto-save ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!resumeData) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      setIsSaving(true)
      await supabase
        .from('resumes')
        .update({ parsed_data: resumeData, updated_at: new Date().toISOString() })
        .eq('id', resumeId)
        .eq('user_id', userId)
      setSavedData(resumeData)
      setIsSaving(false)
    }, 2000)
    return () => clearTimeout(saveTimerRef.current)
  }, [resumeData])

  // ── beforeunload guard ──────────────────────────────────────────────────────
  useEffect(() => {
    async function handleUnload() {
      if (!resumeData || JSON.stringify(resumeData) === JSON.stringify(savedData)) return
      await supabase
        .from('resumes')
        .update({ parsed_data: resumeData, updated_at: new Date().toISOString() })
        .eq('id', resumeId)
        .eq('user_id', userId)
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [resumeData, savedData])

  const hasUnsavedChanges =
    !!resumeData && JSON.stringify(resumeData) !== JSON.stringify(savedData)

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleDataChange(updated: ResumeData) {
    setResumeData(updated)
  }

  function handleTailorClick() {
    if (!requirePro('tailor')) return
    setActiveMode('tailor')
  }

  async function handleAnalyse() {
    if (!resumeData) return
    setIsTailoring(true)
    try {
      const resumeText = [
        resumeData.name,
        resumeData.summary,
        ...resumeData.experience.flatMap(e => [e.title, e.company, ...e.bullets]),
        ...resumeData.skills,
      ].filter(Boolean).join('\n')

      const res = await fetch('/api/ats/tailor-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      })
      const json = await res.json()
      if (json.success) {
        setTailorAnalysis(json.data)
      }
    } finally {
      setIsTailoring(false)
    }
  }

  function handleApplySuggestion(sectionId: string) {
    setActiveMode('builder')
    setExpandedSection(sectionId as SectionId)
    setSectionHints(prev => new Set(prev).add(sectionId))
  }

  async function handleDownloadDOCX() {
    if (!requirePro('docx_download') || !resumeData) return
    await generateDOCX(resumeData, `${resumeTitle || 'resume'}.docx`)
    setIsDownloadOpen(false)
  }

  // ── Template component ──────────────────────────────────────────────────────
  const TemplateComponent = getTemplateComponent(selectedTemplateId) as React.ComponentType<TemplateProps>

  // ── Mobile fallback ─────────────────────────────────────────────────────────
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Builder works best on desktop</h1>
        <p className="text-sm text-gray-500 mb-6">
          The resume builder requires a larger screen. Use a laptop or desktop to edit your resume.
        </p>
        <div className="flex flex-col gap-2">
          <Link href={`/dashboard/resumes/${resumeId}`} className="text-sm text-indigo-600 hover:underline">
            View Resume
          </Link>
          <Link href="/dashboard/ats-checker" className="text-sm text-indigo-600 hover:underline">
            Run ATS Check
          </Link>
          <Link href="/dashboard/templates" className="text-sm text-indigo-600 hover:underline">
            Browse Templates
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading || !resumeData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    )
  }

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          body > *:not(#builder-print-wrapper) { display: none !important; }
          #builder-print-wrapper {
            position: fixed;
            top: 0; left: 0;
            width: 794px;
            transform: none !important;
          }
        }
      `}</style>

      <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
        {/* ── Top bar ── */}
        <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 relative z-10">
          {/* Left */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/resumes"
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Resumes
            </Link>
            <span className="text-gray-200">|</span>
            <span className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
              {resumeTitle}
            </span>
            {isSaving ? (
              <span className="text-xs text-gray-400">Saving…</span>
            ) : hasUnsavedChanges ? (
              <span className="flex items-center gap-1 text-xs text-amber-500">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Unsaved changes
              </span>
            ) : (
              <span className="text-xs text-green-600">Saved ✓</span>
            )}
          </div>

          {/* Centre — mode tabs */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setActiveMode('builder')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-colors ${
                activeMode === 'builder'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              BUILDER
            </button>
            <button
              onClick={handleTailorClick}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-colors ${
                activeMode === 'tailor'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              TAILOR
              {!isPro && (
                <span className="ml-1 text-amber-500 text-[10px] font-bold">PRO</span>
              )}
            </button>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-md hover:bg-gray-100"
            >
              <LayoutGrid size={15} />
              Templates
            </button>

            <div className="relative">
              <button
                onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
              >
                Download
                <ChevronDown size={13} />
              </button>
              {isDownloadOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg py-1 w-36 z-20">
                  <button
                    onClick={() => { window.print(); setIsDownloadOpen(false) }}
                    className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    PDF
                  </button>
                  <button
                    onClick={handleDownloadDOCX}
                    className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    DOCX
                    {!isPro && <span className="text-[10px] text-amber-500 font-bold">PRO</span>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar */}
          <aside className="w-72 bg-white border-r border-gray-200 overflow-y-auto shrink-0">
            {activeMode === 'tailor' ? (
              <TailorPanel
                resumeData={resumeData}
                analysis={tailorAnalysis}
                isTailoring={isTailoring}
                jobDescription={jobDescription}
                onJobDescriptionChange={setJobDescription}
                onAnalyse={handleAnalyse}
                onApplySuggestion={handleApplySuggestion}
              />
            ) : (
              <div className="py-2">
                {SECTIONS.map(({ id, label, Icon }) => {
                  const hasData = sectionHasData(id, resumeData)
                  const isExpanded = expandedSection === id
                  const hasHint = sectionHints.has(id)
                  const Editor = EDITORS[id]

                  return (
                    <div key={id} className="border-b border-gray-100 last:border-b-0">
                      {/* Section row */}
                      <button
                        onClick={() => setExpandedSection(isExpanded ? null : id)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                      >
                        <span className="text-gray-300 text-xs select-none">⠿</span>
                        <Icon size={14} className="text-gray-500 shrink-0" />
                        <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
                        {hasHint && (
                          <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                        )}
                        <span
                          className={`text-xs font-medium shrink-0 ${
                            hasData ? 'text-indigo-600' : 'text-gray-400'
                          }`}
                        >
                          {hasData ? 'EDIT' : '+ ADD'}
                        </span>
                      </button>

                      {/* Editor */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50">
                          <Editor data={resumeData} onChange={handleDataChange} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </aside>

          {/* Preview */}
          <main className="flex-1 bg-gray-100 overflow-auto flex justify-center py-6">
            <div
              id="builder-print-wrapper"
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: 'top center',
                width: '794px',
              }}
            >
              <TemplateComponent
                data={resumeData}
                isEditing={false}
                onFieldChange={() => {}}
              />
            </div>
          </main>
        </div>
      </div>

      {/* Modals */}
      <TemplateSwitcherModal
        isOpen={isTemplateModalOpen}
        currentTemplateId={selectedTemplateId}
        resumeData={resumeData}
        onSelect={setSelectedTemplateId}
        onClose={() => setIsTemplateModalOpen(false)}
      />
      <ProGateModal feature={blockedFeature} onClose={clearBlockedFeature} />
    </>
  )
}

// ─── Page wrapper — fetches auth + provides PlanContext ───────────────────────

export default function BuilderPage() {
  const params = useParams()
  const resumeId = params.resumeId as string
  const [profileState, setProfileState] = useState<Profile | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!profile) { router.replace('/auth/login'); return }
      setProfileState(profile as Profile)
      setAuthChecked(true)
    }
    checkAuth()
  }, [])

  if (!authChecked || !profileState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    )
  }

  return (
    <PlanProvider isPro={profileState.plan === 'pro'} profile={profileState}>
      <BuilderInner
        resumeId={resumeId}
        isPro={profileState.plan === 'pro'}
        profile={profileState}
      />
    </PlanProvider>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Start dev server, navigate to a builder URL, verify the builder loads**

Run: `npm run dev`
Navigate to `/dashboard/builder/<any-valid-resume-id>`
Expected: full-screen builder with top bar, left sidebar, A4 preview

- [ ] **Step 4: Commit**

```bash
git add "app/dashboard/builder/[resumeId]/page.tsx"
git commit -m "feat: add full-screen builder page with 13 section editors, live preview, auto-save"
```

---

## Task 13: Entry Points

**Files:**
- Modify: `app/dashboard/(shell)/resumes/ResumesClient.tsx`
- Modify: `components/resumes/ResumeCard.tsx`
- Modify: `app/dashboard/(shell)/resumes/[id]/ResumeDetailClient.tsx`
- Modify: `app/dashboard/(shell)/templates/[templateId]/TemplatePreviewClient.tsx`

- [ ] **Step 1: Update `ResumesClient.tsx` — redirect to builder after upload**

Find `handleUploadSuccess` in `app/dashboard/(shell)/resumes/ResumesClient.tsx`:
```ts
function handleUploadSuccess(newResume: Resume) {
  setResumes((prev) => [newResume, ...prev])
  router.refresh()
}
```

Replace with:
```ts
function handleUploadSuccess(newResume: Resume) {
  setResumes((prev) => [newResume, ...prev])
  router.push(`/dashboard/builder/${newResume.id}`)
}
```

- [ ] **Step 2: Update `ResumeCard.tsx` — add "Edit in Builder" button**

In `components/resumes/ResumeCard.tsx`, find the action buttons section (around line 121). Add a new button between "ATS Check" and "Fill Template":

```tsx
<Button
  variant="ghost"
  size="sm"
  className="flex-1 h-8 text-xs gap-1.5 text-indigo-600"
  onClick={() => router.push(`/dashboard/builder/${resume.id}`)}
>
  <Pencil size={13} />
  Edit
</Button>
```

`Pencil` is already imported in that file.

- [ ] **Step 3: Update `ResumeDetailClient.tsx` — add "Open Builder" button**

In `app/dashboard/(shell)/resumes/[id]/ResumeDetailClient.tsx`, find the top action bar (where the ATS Check and Fill Template buttons live — look for `ArrowLeft` in the imports). Add an "Open Builder" button:

```tsx
<Button
  variant="outline"
  size="sm"
  className="gap-1.5 text-indigo-600 border-indigo-300 hover:bg-indigo-50"
  onClick={() => router.push(`/dashboard/builder/${resume.id}`)}
>
  Open Builder
</Button>
```

Place it alongside the other action buttons at the top of the page.

- [ ] **Step 4: Update `TemplatePreviewClient.tsx` — add "Open in Builder" button**

In `app/dashboard/(shell)/templates/[templateId]/TemplatePreviewClient.tsx`, find where the resume selection or action buttons are rendered. Add a button that links to the builder with the template param:

```tsx
<Button
  variant="outline"
  size="sm"
  className="gap-1.5"
  onClick={() => {
    if (selectedResumeId) {
      router.push(`/dashboard/builder/${selectedResumeId}?template=${selectedTemplateId}`)
    }
  }}
  disabled={!selectedResumeId}
>
  Open in Builder
</Button>
```

You'll need to add `useRouter` if it's not already imported in that component (check line 1–20).

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Smoke test all entry points**

Run: `npm run dev`

- Upload a resume → should redirect to `/dashboard/builder/[id]`
- Resume card → "Edit" button → builder
- Resume detail page → "Open Builder" button → builder
- Template preview → "Open in Builder" → builder with correct template pre-selected

- [ ] **Step 7: Commit**

```bash
git add "app/dashboard/(shell)/resumes/ResumesClient.tsx" "components/resumes/ResumeCard.tsx" "app/dashboard/(shell)/resumes/[id]/ResumeDetailClient.tsx" "app/dashboard/(shell)/templates/[templateId]/TemplatePreviewClient.tsx"
git commit -m "feat: wire up all builder entry points (upload, card edit, detail page, template preview)"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Section 1 (Overview): Task 12 covers the three-zone layout
- ✅ Section 2.1 (Parse layer): Task 2
- ✅ Section 2.2 (Plan gating): Task 4
- ✅ Section 2.3 (Template/data separation): Enforced — TemplateComponent receives only data
- ✅ Section 2.4 (Editor/page separation): All editor components take only `data`+`onChange`
- ✅ Section 3 (Routing): Task 3
- ✅ Section 4 (Types): Task 1
- ✅ Section 5 (State): Task 12 implements all state fields
- ✅ Section 6 (Top bar): Task 12 — BUILDER/TAILOR tabs, Templates button, Download dropdown
- ✅ Section 7 (Sidebar 13 sections): Tasks 6–8 + Task 12 assembly
- ✅ Section 8 (Editor components): Tasks 6, 7, 8
- ✅ Section 9 (Live preview): Task 12 — scale calc + `id="builder-print-wrapper"`
- ✅ Section 10 (Auto-save): Task 12 — 2-second debounce + beforeunload
- ✅ Section 11 (Template switcher modal): Task 9
- ✅ Section 12 (Plan gating infra): Task 4
- ✅ Section 13 (Tailor mode): Tasks 10, 11
- ✅ Section 14 (Entry points): Task 13
- ✅ Section 15 (Mobile fallback): Task 12 — renders fallback message on <768px
- ✅ Section 16 (Print CSS): Task 12 — inline `<style>` block
- ✅ Section 16 (DOCX extraction): Task 5
- ✅ Section 17 (File manifest): All tasks map to spec files

**Type consistency check:**
- `ProFeatureKey` defined in `lib/proFeatures.ts`, used identically in `useProGate.ts` and `ProGateModal.tsx`
- `TailorAnalysis` defined in Task 1, used in Task 10 API, Task 11 panel, Task 12 page — all match
- `SectionId` in builder page derived from SECTIONS array const — matches all editor map keys
- `EditorProps` shape (`data: ResumeData`, `onChange: (updated: ResumeData) => void`) is consistent across all 13 editors

**Placeholder scan:** None found.
