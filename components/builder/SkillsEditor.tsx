'use client'

import { useState, KeyboardEvent, useRef, useEffect } from 'react'
import { GripVertical, Plus, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ResumeData, SkillSection } from '@/types'
import { flattenSkillSections, normalizeSkillSections, syncResumeData } from '@/lib/resume-data'
import { useFocusFieldPath } from './useFocusFieldPath'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
  focusPath?: string | null
  onFocusHandled?: () => void
}

const EMPTY_SECTION: SkillSection = { title: '', tag: '', skills: [] }

interface EditingSkill {
  sectionIndex: number
  skillIndex: number
}

interface SortableSkillChipProps {
  id: string
  skill: string
  sectionIndex: number
  skillIndex: number
  isEditing: boolean
  draftValue: string
  onDraftChange: (value: string) => void
  onStartEdit: () => void
  onCommitEdit: () => void
  onCancelEdit: () => void
  onRemove: () => void
}

function SortableSkillChip({
  id,
  skill,
  sectionIndex,
  skillIndex,
  isEditing,
  draftValue,
  onDraftChange,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onRemove,
}: SortableSkillChipProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  if (isEditing) {
    return (
      <span
        ref={setNodeRef}
        style={style}
        className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-sm ring-4 ring-emerald-100/80"
      >
        <input
          autoFocus
          data-field-path={`skillSections.${sectionIndex}.skills.${skillIndex}`}
          value={draftValue}
          onChange={(event) => onDraftChange(event.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onCommitEdit()
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              onCancelEdit()
            }
          }}
          onPointerDown={(event) => event.stopPropagation()}
          className="min-w-[80px] max-w-[220px] bg-transparent text-xs font-semibold text-slate-800 outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onRemove}
          className="rounded-full p-0.5 text-emerald-400 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
          aria-label={`Remove ${skill}`}
        >
          <X size={10} />
        </button>
      </span>
    )
  }

  return (
    <span
      ref={setNodeRef}
      style={style}
      className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50/80 px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-sm shadow-emerald-950/[0.03] transition-colors hover:border-emerald-200 hover:bg-white"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab rounded-md text-emerald-300 transition-colors hover:bg-emerald-50 hover:text-emerald-600 active:cursor-grabbing"
        aria-label={`Drag ${skill}`}
      >
        <GripVertical size={11} />
      </button>
      <button
        type="button"
        onClick={onStartEdit}
        className="max-w-[220px] truncate text-left transition-colors hover:text-slate-950"
        title="Click to edit"
      >
        {skill}
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 text-emerald-400 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
        aria-label={`Remove ${skill}`}
      >
        <X size={10} />
      </button>
    </span>
  )
}

function SkillOverlayChip({ skill }: { skill: string }) {
  return (
    <span className="inline-flex min-h-8 cursor-grabbing items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-xl ring-4 ring-emerald-100">
      <GripVertical size={11} className="text-emerald-400" />
      <span className="max-w-[220px] truncate">{skill}</span>
      <X size={10} className="text-emerald-400" />
    </span>
  )
}

// ── Sortable section card (collapsed view for multi-section mode) ──────────

function SortableSectionCard({
  id,
  title,
  skillCount,
  isExpanded,
  isDeleting,
  onToggleExpand,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  id: string
  title: string
  skillCount: number
  isExpanded: boolean
  isDeleting: boolean
  onToggleExpand: () => void
  onDelete: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm shadow-emerald-950/[0.04] transition-all ${
        isExpanded ? 'border-emerald-200 ring-4 ring-emerald-50' : 'border-slate-200/80 hover:border-emerald-200 hover:shadow-md'
      }`}
    >
      {isDeleting ? (
        <div className="flex items-center gap-3 bg-red-50/70 px-4 py-3">
          <span className="flex-1 text-sm font-semibold text-slate-700">Delete this section?</span>
          <button onClick={onCancelDelete} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700">Cancel</button>
          <button onClick={onConfirmDelete} className="rounded-xl bg-red-500 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-sm shadow-red-500/20 transition-colors hover:bg-red-600">Delete</button>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3">
          <button {...attributes} {...listeners} className="grid h-9 w-9 shrink-0 cursor-grab place-items-center rounded-xl border border-slate-100 bg-slate-50 text-slate-300 transition-colors hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-600 active:cursor-grabbing" tabIndex={-1}>
            <GripVertical size={16} />
          </button>
          <div className="min-w-0 flex-1 cursor-pointer" onClick={onToggleExpand}>
            <div className="truncate text-sm font-bold text-slate-800">{title || 'Untitled Section'}</div>
            <div className="mt-0.5 text-xs font-medium text-slate-400">{skillCount} skill{skillCount !== 1 ? 's' : ''}</div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={onDelete} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-100 bg-white text-slate-400 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-500">
              <Trash2 size={15} />
            </button>
            <button onClick={onToggleExpand} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-100 bg-white text-slate-500 transition-colors hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-700">
              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Section overlay for drag ──────────────────────────────────────────────

function SectionOverlayCard({ title, skillCount }: { title: string; skillCount: number }) {
  return (
    <div className="flex cursor-grabbing items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-xl ring-4 ring-emerald-100">
      <GripVertical size={16} className="text-emerald-400" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-slate-800">{title || 'Untitled Section'}</div>
        <div className="text-xs font-medium text-slate-400">{skillCount} skill{skillCount !== 1 ? 's' : ''}</div>
      </div>
    </div>
  )
}

export default function SkillsEditor({ data, onChange, focusPath, onFocusHandled }: EditorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const titleRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const focusSectionIndex = focusPath?.startsWith('skillSections.') ? parseInt(focusPath.split('.')[1], 10) : null

  // Split mouse + touch sensors so iPad scrolling inside the skill list isn't
  // hijacked into drag mode. Long-press initiates drag on touch.
  const chipSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const sectionSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const sections: SkillSection[] = data.skillSections?.length
    ? data.skillSections.map(section => ({
        ...section,
        tag: section.tag ?? '',
        skills: normalizeEditorSkillList(section.skills ?? []),
      }))
    : [{ title: 'Core Skills', tag: '', skills: normalizeEditorSkillList(data.skills ?? []) }]

  // Determine initial editing state from focusPath
  let initialEditingSkill: EditingSkill | null = null
  let initialDraftSkill = ''
  const initialExpandedIndex = focusSectionIndex !== null && !isNaN(focusSectionIndex) ? focusSectionIndex : null

  if (focusPath && focusPath.startsWith('skillSections.')) {
    const parts = focusPath.split('.')
    const sectionIndex = parseInt(parts[1], 10)
    if (!isNaN(sectionIndex) && parts[2] === 'skills' && parts[3]) {
      const skillIndex = parseInt(parts[3], 10)
      if (!isNaN(skillIndex)) {
        const skill = sections[sectionIndex]?.skills[skillIndex]
        if (skill !== undefined) {
          initialEditingSkill = { sectionIndex, skillIndex }
          initialDraftSkill = skill
        }
      }
    }
  }

  const [inputs, setInputs] = useState<Record<number, string>>({})
  const [editingSkill, setEditingSkill] = useState<EditingSkill | null>(initialEditingSkill)
  const [draftSkill, setDraftSkill] = useState(initialDraftSkill)
  const skipNextEditCommitRef = useRef(false)
  const [pendingFocusIndex, setPendingFocusIndex] = useState<number | null>(null)
  const [activeDrag, setActiveDrag] = useState<{ sectionIndex: number; skillIndex: number } | null>(null)
  const [draftSection, setDraftSection] = useState<SkillSection | null>(null)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(initialExpandedIndex)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)
  const [activeSectionDrag, setActiveSectionDrag] = useState<number | null>(null)

  const displayedSections = draftSection ? [...sections, draftSection] : sections
  const isMultiSection = displayedSections.length > 1

  useFocusFieldPath({
    focusPath: (!isMultiSection || (expandedIndex !== null && expandedIndex === focusSectionIndex) || focusSectionIndex === null) ? focusPath : null,
    rootRef,
    onHandled: onFocusHandled
  })

  function isDraftSectionIndex(index: number) {
    return draftSection !== null && index === sections.length
  }

  function commit(nextSections: SkillSection[]) {
    onChange(syncResumeData({
      ...data,
      skillSections: nextSections,
      skills: flattenSkillSections(nextSections),
    }))
  }

  function persistedSectionsBeforeDraft() {
    if (data.skillSections?.length) return sections

    return sections.filter(section =>
      section.tag?.trim() ||
      section.skills.some(skill => skill.trim())
    )
  }

  function updateSection(index: number, updated: SkillSection) {
    if (isDraftSectionIndex(index)) {
      setDraftSection(updated)
      return
    }

    const next = [...sections]
    next[index] = updated
    commit(next)
  }

  function addSection() {
    const newIndex = sections.length
    setPendingFocusIndex(newIndex)
    setDraftSection(current => current ?? { ...EMPTY_SECTION })
    setExpandedIndex(newIndex)
  }

  function removeSection(index: number) {
    if (isDraftSectionIndex(index)) {
      setDraftSection(null)
      setInputs(prev => {
        const next = { ...prev }
        delete next[index]
        return next
      })
      setDeletingIndex(null)
      if (expandedIndex === index) setExpandedIndex(null)
      return
    }

    commit(sections.filter((_, i) => i !== index))
    setDeletingIndex(null)
    if (expandedIndex === index) setExpandedIndex(null)
    else if (expandedIndex !== null && expandedIndex > index) setExpandedIndex(expandedIndex - 1)
  }

  function addSkill(sectionIndex: number, raw: string) {
    const incomingSkills = normalizeEditorSkillList([raw])
    if (incomingSkills.length === 0) {
      setInputs(prev => ({ ...prev, [sectionIndex]: '' }))
      return
    }

    const current = displayedSections[sectionIndex]
    if (!current) return

    const existing = new Set(current.skills.map(item => item.toLowerCase()))
    const nextSkills = [
      ...current.skills,
      ...incomingSkills.filter(skill => !existing.has(skill.toLowerCase())),
    ]

    const nextSection = {
      ...current,
      skills: nextSkills,
    }

    if (isDraftSectionIndex(sectionIndex)) {
      setDraftSection(null)
      commit([...persistedSectionsBeforeDraft(), nextSection])
    } else {
      updateSection(sectionIndex, nextSection)
    }
    setInputs(prev => ({ ...prev, [sectionIndex]: '' }))
  }

  function removeSkill(sectionIndex: number, skillIndex: number) {
    const current = displayedSections[sectionIndex]
    if (!current) return

    updateSection(sectionIndex, {
      ...current,
      skills: current.skills.filter((_, i) => i !== skillIndex),
    })
    resetEditingSkill()
  }

  function startEditingSkill(sectionIndex: number, skillIndex: number, value: string) {
    setEditingSkill({ sectionIndex, skillIndex })
    setDraftSkill(value)
  }

  function resetEditingSkill() {
    setEditingSkill(null)
    setDraftSkill('')
  }

  function cancelEditingSkill() {
    skipNextEditCommitRef.current = true
    resetEditingSkill()
  }

  function commitEditingSkill() {
    if (skipNextEditCommitRef.current) {
      skipNextEditCommitRef.current = false
      return
    }

    if (!editingSkill) return

    const { sectionIndex, skillIndex } = editingSkill
    const current = displayedSections[sectionIndex]
    if (!current) {
      cancelEditingSkill()
      return
    }

    const replacementSkills = normalizeEditorSkillList([draftSkill])
    const nextSkills = current.skills.filter((_, index) => index !== skillIndex)

    if (replacementSkills.length > 0) {
      const existing = new Set(nextSkills.map(item => item.toLowerCase()))
      const uniqueReplacements = replacementSkills.filter((skill) => {
        const key = skill.toLowerCase()
        if (existing.has(key)) return false
        existing.add(key)
        return true
      })

      nextSkills.splice(skillIndex, 0, ...uniqueReplacements)
    }

    updateSection(sectionIndex, {
      ...current,
      skills: nextSkills,
    })
    resetEditingSkill()
  }

  function handleSkillDragStart(sectionIndex: number, event: DragStartEvent) {
    const idx = skillIds(sectionIndex, displayedSections[sectionIndex]?.skills ?? []).indexOf(String(event.active.id))
    if (idx !== -1) setActiveDrag({ sectionIndex, skillIndex: idx })
  }

  function handleSkillDragEnd(sectionIndex: number, event: DragEndEvent) {
    setActiveDrag(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const current = displayedSections[sectionIndex]
    if (!current) return

    const oldIndex = skillIds(sectionIndex, current.skills).indexOf(String(active.id))
    const newIndex = skillIds(sectionIndex, current.skills).indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return

    resetEditingSkill()
    updateSection(sectionIndex, {
      ...current,
      skills: arrayMove(current.skills, oldIndex, newIndex),
    })
  }

  function handleSectionDragStart(event: DragStartEvent) {
    const idx = sectionIds.indexOf(String(event.active.id))
    if (idx !== -1) setActiveSectionDrag(idx)
  }

  function handleSectionDragEnd(event: DragEndEvent) {
    setActiveSectionDrag(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sectionIds.indexOf(String(active.id))
    const newIndex = sectionIds.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove([...sections], oldIndex, newIndex)
    commit(reordered)

    // Update expanded index to follow the moved section
    if (expandedIndex === oldIndex) setExpandedIndex(newIndex)
    else if (expandedIndex !== null) {
      if (oldIndex < expandedIndex && newIndex >= expandedIndex) setExpandedIndex(expandedIndex - 1)
      else if (oldIndex > expandedIndex && newIndex <= expandedIndex) setExpandedIndex(expandedIndex + 1)
    }
  }

  useEffect(() => {
    if (pendingFocusIndex === null) return

    const target = titleRefs.current[pendingFocusIndex]
    if (target) {
      target.focus()
      target.select()
      const frame = window.requestAnimationFrame(() => setPendingFocusIndex(null))
      return () => window.cancelAnimationFrame(frame)
    }
  }, [pendingFocusIndex, displayedSections.length])

  const sectionIds = displayedSections.map((_, i) => `section-${i}`)
  const [prevFocusPath, setPrevFocusPath] = useState(focusPath)

  if (focusPath !== prevFocusPath) {
    setPrevFocusPath(focusPath)
    if (focusPath && focusPath.startsWith('skillSections.')) {
      const parts = focusPath.split('.')
      const sectionIndex = parseInt(parts[1], 10)
      if (!isNaN(sectionIndex)) {
        setExpandedIndex(sectionIndex)

        // If focusPath targets a specific skill (e.g. skillSections.0.skills.2)
        if (parts[2] === 'skills' && parts[3]) {
          const skillIndex = parseInt(parts[3], 10)
          if (!isNaN(skillIndex)) {
            const section = displayedSections[sectionIndex]
            const skill = section?.skills[skillIndex]
            if (skill !== undefined) {
              setEditingSkill({ sectionIndex, skillIndex })
              setDraftSkill(skill)
            }
          }
        }
      }
    }
  }

  function renderSectionEditor(section: SkillSection, sectionIndex: number) {
    return (
      <div className="space-y-4 rounded-2xl border border-emerald-100/80 bg-gradient-to-b from-white to-emerald-50/35 p-4 shadow-sm shadow-emerald-950/[0.03]">
        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">Section Title</label>
          <input
            ref={node => {
              titleRefs.current[sectionIndex] = node
            }}
            data-field-path={`skillSections.${sectionIndex}.title`}
            value={section.title}
            onChange={(e) => updateSection(sectionIndex, { ...section, title: e.target.value })}
            placeholder="Product, Tools, Collaboration..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm shadow-slate-950/[0.02] outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        <DndContext
          sensors={chipSensors}
          collisionDetection={closestCenter}
          onDragStart={(event) => handleSkillDragStart(sectionIndex, event)}
          onDragEnd={(event) => handleSkillDragEnd(sectionIndex, event)}
          onDragCancel={() => setActiveDrag(null)}
        >
          <SortableContext items={skillIds(sectionIndex, section.skills)} strategy={rectSortingStrategy}>
            <div className="min-h-16 rounded-2xl border border-dashed border-emerald-200/80 bg-white/75 p-3">
              <div className="flex flex-wrap gap-2">
                {section.skills.map((skill, skillIndex) => {
                  const isEditing =
                    editingSkill?.sectionIndex === sectionIndex &&
                    editingSkill.skillIndex === skillIndex

                  return (
                    <SortableSkillChip
                      key={skillId(sectionIndex, skillIndex)}
                      id={skillId(sectionIndex, skillIndex)}
                      skill={skill}
                      sectionIndex={sectionIndex}
                      skillIndex={skillIndex}
                      isEditing={isEditing}
                      draftValue={draftSkill}
                      onDraftChange={setDraftSkill}
                      onStartEdit={() => startEditingSkill(sectionIndex, skillIndex, skill)}
                      onCommitEdit={commitEditingSkill}
                      onCancelEdit={cancelEditingSkill}
                      onRemove={() => removeSkill(sectionIndex, skillIndex)}
                    />
                  )
                })}
              </div>
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {activeDrag?.sectionIndex === sectionIndex && activeDrag.skillIndex < section.skills.length ? (
              <SkillOverlayChip skill={section.skills[activeDrag.skillIndex]} />
            ) : null}
          </DragOverlay>
        </DndContext>

        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm shadow-slate-950/[0.02] transition-all focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-100">
          <Plus size={15} className="shrink-0 text-emerald-500" />
          <input
            data-field-path={`skillSections.${sectionIndex}.skills`}
            value={inputs[sectionIndex] ?? ''}
            onChange={(e) => setInputs(prev => ({ ...prev, [sectionIndex]: e.target.value }))}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addSkill(sectionIndex, (inputs[sectionIndex] ?? '').replace(/,$/, ''))
              }
            }}
            onBlur={() => {
              if (inputs[sectionIndex]?.trim()) addSkill(sectionIndex, inputs[sectionIndex])
            }}
            placeholder="Type a skill, press Enter or comma to add"
            className="min-w-0 flex-1 bg-transparent py-1 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>
    )
  }

  // ── SINGLE SECTION MODE ──────────────────────────────────────────────────────
  if (!isMultiSection) {
    return (
      <div ref={rootRef} className="space-y-4 p-4">
        <div className="rounded-[22px] border border-emerald-100 bg-white p-2 shadow-sm shadow-emerald-950/[0.04]">
          {renderSectionEditor(displayedSections[0], 0)}
        </div>

        <button
          onClick={addSection}
          className="flex items-center gap-2 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm font-bold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-white"
        >
          <Plus size={14} /> Add skill section
        </button>
      </div>
    )
  }

  // ── MULTI-SECTION MODE (SubItemList-like) ────────────────────────────────────
  return (
    <div ref={rootRef} className="space-y-3 p-4">
      <DndContext
        sensors={sectionSensors}
        collisionDetection={closestCenter}
        onDragStart={handleSectionDragStart}
        onDragEnd={handleSectionDragEnd}
        onDragCancel={() => setActiveSectionDrag(null)}
      >
        <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
          {displayedSections.map((section, sectionIndex) => {
            const isExpanded = expandedIndex === sectionIndex
            const isDraft = isDraftSectionIndex(sectionIndex)

            return (
              <div key={isDraft ? 'draft-skill-section' : sectionIndex}>
                <SortableSectionCard
                  id={sectionIds[sectionIndex]}
                  title={section.title}
                  skillCount={section.skills.length}
                  isExpanded={isExpanded}
                  isDeleting={deletingIndex === sectionIndex}
                  onToggleExpand={() => setExpandedIndex(isExpanded ? null : sectionIndex)}
                  onDelete={() => setDeletingIndex(sectionIndex)}
                  onConfirmDelete={() => removeSection(sectionIndex)}
                  onCancelDelete={() => setDeletingIndex(null)}
                />
                {isExpanded && deletingIndex !== sectionIndex && (
                  <div className="-mt-1 rounded-b-[22px] border border-t-0 border-emerald-100 bg-emerald-50/45 p-3">
                    {renderSectionEditor(section, sectionIndex)}
                  </div>
                )}
              </div>
            )
          })}
        </SortableContext>
        <DragOverlay dropAnimation={null}>
          {activeSectionDrag !== null && activeSectionDrag < displayedSections.length ? (
            <SectionOverlayCard
              title={displayedSections[activeSectionDrag].title}
              skillCount={displayedSections[activeSectionDrag].skills.length}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <button
        onClick={addSection}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 py-3 text-sm font-bold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-white"
      >
        <Plus size={14} /> Add skill section
      </button>
    </div>
  )
}

function skillId(sectionIndex: number, skillIndex: number) {
  return `skill-${sectionIndex}-${skillIndex}`
}

function skillIds(sectionIndex: number, skills: string[]) {
  return skills.map((_, skillIndex) => skillId(sectionIndex, skillIndex))
}

function normalizeEditorSkillList(skills: string[]) {
  return normalizeSkillSections([{ title: 'Skills', tag: '', skills }], [])[0]?.skills ?? []
}
