'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BarChart2, Layout, Save, X, Plus, Trash2, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getEducationDateLabel, syncResumeData } from '@/lib/resume-data'
import BuilderSkillsEditor from '@/components/builder/SkillsEditor'
import { updateResumeData } from '../actions'
import type { Resume, ATSScore, ResumeData, ExperienceItem, EducationItem } from '@/types'
import { DashboardPageIntro } from '@/components/layout/DashboardSurface'

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function scoreColor(score: number) {
  if (score >= 75) return 'bg-green-100 text-green-700'
  if (score >= 50) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

// ─── Inline field editor ──────────────────────────────────────────────────────

interface InlineFieldProps {
  label: string
  value: string
  multiline?: boolean
  onSave: (value: string) => void
}

function InlineField({ label, value, multiline = false, onSave }: InlineFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await onSave(draft)
    setSaving(false)
    setEditing(false)
  }

  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
        {multiline ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="rounded-md border border-indigo-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            autoFocus
          />
        ) : (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="rounded-md border border-indigo-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
        )}
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving} className="h-7 text-xs gap-1">
            <Save size={11} /> {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button size="sm" variant="ghost" onClick={cancel} className="h-7 text-xs gap-1">
            <X size={11} /> Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="group flex flex-col gap-0.5 cursor-pointer rounded-md px-2 py-1.5 -mx-2 hover:bg-gray-50 transition-colors"
      onClick={() => setEditing(true)}
    >
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      <span className={`text-sm ${value ? 'text-gray-900' : 'text-gray-300 italic'}`}>
        {value || `Add ${label.toLowerCase()}`}
      </span>
    </div>
  )
}

// ─── Experience editor ────────────────────────────────────────────────────────

function ExperienceEditor({
  items,
  onSave,
}: {
  items: ExperienceItem[]
  onSave: (items: ExperienceItem[]) => void
}) {
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [draft, setDraft] = useState<ExperienceItem | null>(null)
  const [saving, setSaving] = useState(false)

  function startEdit(i: number) {
    setEditIndex(i)
    setDraft({ ...items[i] })
  }

  function startAdd() {
    const blank: ExperienceItem = {
      company: '', title: '', location: '', startDate: '', endDate: '', bullets: [],
    }
    setDraft(blank)
    setEditIndex(items.length)
  }

  async function save() {
    if (!draft || editIndex === null) return
    setSaving(true)
    const updated = [...items]
    updated[editIndex] = draft
    await onSave(updated)
    setSaving(false)
    setEditIndex(null)
    setDraft(null)
  }

  async function remove(i: number) {
    const updated = items.filter((_, idx) => idx !== i)
    await onSave(updated)
  }

  if (editIndex !== null && draft) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-indigo-200 p-4 bg-indigo-50/30">
        {(['title', 'company', 'location', 'startDate', 'endDate'] as const).map((field) => (
          <div key={field} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 capitalize">{field}</label>
            <input
              value={draft[field]}
              onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
              className="rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        ))}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Bullet points (one per line)</label>
          <textarea
            value={draft.bullets.join('\n')}
            onChange={(e) =>
              setDraft({ ...draft, bullets: e.target.value.split('\n').filter(Boolean) })
            }
            rows={4}
            className="rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving} className="h-7 text-xs gap-1">
            <Save size={11} /> {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setEditIndex(null); setDraft(null) }}
            className="h-7 text-xs gap-1"
          >
            <X size={11} /> Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="group flex flex-col gap-1 rounded-lg border border-gray-100 p-3 hover:border-indigo-200 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="text-sm text-gray-600">{item.company} · {item.location}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.startDate} – {item.endDate}</p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100">
              <button onClick={() => startEdit(i)} className="text-gray-400 hover:text-indigo-600 p-1">
                <Save size={12} />
              </button>
              <button onClick={() => remove(i)} className="text-gray-400 hover:text-red-500 p-1">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          {item.bullets.length > 0 && (
            <ul className="mt-1 list-disc list-inside space-y-0.5">
              {item.bullets.map((b, bi) => (
                <li key={bi} className="text-xs text-gray-600">{b}</li>
              ))}
            </ul>
          )}
          <button
            onClick={() => startEdit(i)}
            className="mt-1 text-xs text-indigo-500 hover:text-indigo-700 text-left"
          >
            Edit
          </button>
        </div>
      ))}
      <button
        onClick={startAdd}
        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
      >
        <Plus size={14} /> Add experience
      </button>
    </div>
  )
}

// ─── Education editor ─────────────────────────────────────────────────────────

function EducationEditor({
  items,
  onSave,
}: {
  items: EducationItem[]
  onSave: (items: EducationItem[]) => void
}) {
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [draft, setDraft] = useState<EducationItem | null>(null)
  const [saving, setSaving] = useState(false)

  function startEdit(i: number) {
    setEditIndex(i)
    setDraft({ ...items[i] })
  }

  function startAdd() {
    setDraft({ institution: '', degree: '', field: '', startDate: '', endDate: '', graduationDate: '', gpa: '' })
    setEditIndex(items.length)
  }

  async function save() {
    if (!draft || editIndex === null) return
    setSaving(true)
    const updated = [...items]
    updated[editIndex] = draft
    await onSave(updated)
    setSaving(false)
    setEditIndex(null)
    setDraft(null)
  }

  async function remove(i: number) {
    await onSave(items.filter((_, idx) => idx !== i))
  }

  if (editIndex !== null && draft) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-indigo-200 p-4 bg-indigo-50/30">
        {(['institution', 'degree', 'field', 'startDate', 'endDate', 'graduationDate', 'gpa'] as const).map((field) => (
          <div key={field} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 capitalize">{field}</label>
            <input
              value={draft[field]}
              onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
              className="rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        ))}
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving} className="h-7 text-xs gap-1">
            <Save size={11} /> {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditIndex(null); setDraft(null) }} className="h-7 text-xs gap-1">
            <X size={11} /> Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className="group flex flex-col gap-0.5 rounded-lg border border-gray-100 p-3 hover:border-indigo-200 transition-colors">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">{item.institution}</p>
              <p className="text-sm text-gray-600">{item.degree}{item.field ? ` in ${item.field}` : ''}</p>
              <p className="text-xs text-gray-400">{getEducationDateLabel(item)}{item.gpa ? ` · GPA ${item.gpa}` : ''}</p>
            </div>
            <button onClick={() => remove(i)} className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100">
              <Trash2 size={12} />
            </button>
          </div>
          <button onClick={() => startEdit(i)} className="mt-1 text-xs text-indigo-500 hover:text-indigo-700 text-left">Edit</button>
        </div>
      ))}
      <button onClick={startAdd} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
        <Plus size={14} /> Add education
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ResumeDetailClientProps {
  resume: Resume
  atsHistory: Pick<ATSScore, 'id' | 'score' | 'created_at' | 'job_description'>[]
}

export default function ResumeDetailClient({ resume, atsHistory }: ResumeDetailClientProps) {
  const router = useRouter()
  const [data, setData] = useState<ResumeData>(
    resume.parsed_data ?? {
      name: '', email: '', phone: '', location: '', linkedin: '',
      website: '', summary: '', currentRole: '', experience: [], education: [],
      skills: [], skillSections: [], certifications: [], projects: [], languages: [],
      volunteer: [], interests: [], awards: [], publications: [], references: [], customSections: [],
    }
  )

  async function updateField<K extends keyof ResumeData>(key: K, value: ResumeData[K]) {
    const updated = syncResumeData({ ...data, [key]: value })
    setData(updated)
    await updateResumeData(resume.id, updated)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <DashboardPageIntro
        kicker="Resume Detail"
        title={resume.title}
        description="Review parsed sections, clean up details, and jump straight into ATS analysis or the builder from the same refined workspace."
        actions={
          <>
            <button
              onClick={() => router.push('/dashboard/resumes')}
              className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/86 px-6 py-3 text-sm font-bold text-on-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white"
            >
              <ArrowLeft size={15} /> Resumes
            </button>
            <button
              onClick={() => router.push(`/dashboard/ats-checker?resumeId=${resume.id}`)}
              className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/86 px-6 py-3 text-sm font-bold text-on-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white"
            >
              <BarChart2 size={14} /> ATS Check
            </button>
            <button
              onClick={() => router.push(`/dashboard/templates?resumeId=${resume.id}`)}
              className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/86 px-6 py-3 text-sm font-bold text-on-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white"
            >
              <Layout size={14} /> Template Preview
            </button>
            <Button
              size="sm"
              className="!h-auto rounded-full bg-zinc-950 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white hover:bg-zinc-900"
              asChild
            >
              <Link href={`/dashboard/builder/${resume.id}`}>
                <PenLine size={14} /> Open Builder
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-5">
        {/* Contact info */}
        <Card className="border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.9))] shadow-[0_20px_50px_rgba(25,28,29,0.06)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            <InlineField label="Full Name" value={data.name} onSave={(v) => updateField('name', v)} />
            <InlineField label="Email" value={data.email} onSave={(v) => updateField('email', v)} />
            <InlineField label="Phone" value={data.phone} onSave={(v) => updateField('phone', v)} />
            <InlineField label="Location" value={data.location} onSave={(v) => updateField('location', v)} />
            <InlineField label="LinkedIn" value={data.linkedin} onSave={(v) => updateField('linkedin', v)} />
            <InlineField label="Website" value={data.website} onSave={(v) => updateField('website', v)} />
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.9))] shadow-[0_20px_50px_rgba(25,28,29,0.06)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <InlineField
              label="Professional Summary"
              value={data.summary}
              multiline
              onSave={(v) => updateField('summary', v)}
            />
          </CardContent>
        </Card>

        {/* Work Experience */}
        <Card className="border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.9))] shadow-[0_20px_50px_rgba(25,28,29,0.06)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Work Experience</CardTitle>
          </CardHeader>
          <CardContent>
            <ExperienceEditor
              items={data.experience}
              onSave={(items) => updateField('experience', items)}
            />
          </CardContent>
        </Card>

        {/* Education */}
        <Card className="border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.9))] shadow-[0_20px_50px_rgba(25,28,29,0.06)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Education</CardTitle>
          </CardHeader>
          <CardContent>
            <EducationEditor
              items={data.education}
              onSave={(items) => updateField('education', items)}
            />
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.9))] shadow-[0_20px_50px_rgba(25,28,29,0.06)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <BuilderSkillsEditor
              data={data}
              onChange={(updated) => setData(syncResumeData(updated))}
            />
          </CardContent>
        </Card>

        {/* ATS score history */}
        {atsHistory.length > 0 && (
          <Card className="border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.9))] shadow-[0_20px_50px_rgba(25,28,29,0.06)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">ATS Score History</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {atsHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-gray-500">{formatDate(entry.created_at)}</span>
                    {entry.job_description && (
                      <span className="text-xs text-gray-400 line-clamp-1">
                        {entry.job_description.slice(0, 60)}…
                      </span>
                    )}
                  </div>
                  <Badge className={`text-sm font-bold px-2.5 ${scoreColor(entry.score)}`}>
                    {entry.score}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
