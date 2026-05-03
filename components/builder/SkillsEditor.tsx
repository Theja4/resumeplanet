'use client'

import { useState, KeyboardEvent, useRef, useEffect } from 'react'
import { GripVertical, Plus, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
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
        className="inline-flex max-w-full items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 ring-2 ring-indigo-200"
      >
        <input
          autoFocus
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
          className="min-w-[80px] max-w-[220px] bg-transparent text-xs text-indigo-800 outline-none"
        />
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onRemove}
          className="text-indigo-400 hover:text-indigo-700"
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
      className="inline-flex max-w-full items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-indigo-300 transition-colors hover:text-indigo-600 active:cursor-grabbing"
        aria-label={`Drag ${skill}`}
      >
        <GripVertical size={11} />
      </button>
      <button
        type="button"
        onClick={onStartEdit}
        className="max-w-[220px] truncate text-left hover:text-indigo-900"
        title="Click to edit"
      >
        {skill}
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="text-indigo-400 hover:text-indigo-700"
        aria-label={`Remove ${skill}`}
      >
        <X size={10} />
      </button>
    </span>
  )
}

function SkillOverlayChip({ skill }: { skill: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 shadow-lg ring-2 ring-indigo-300 cursor-grabbing">
      <GripVertical size={11} className="text-indigo-400" />
      <span className="max-w-[220px] truncate">{skill}</span>
      <X size={10} className="text-indigo-400" />
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
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {isDeleting ? (
        <div className="px-4 py-3 flex items-center gap-3">
          <span className="flex-1 text-sm text-gray-700">Delete this section?</span>
          <button onClick={onCancelDelete} className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirmDelete} className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600">Delete</button>
        </div>
      ) : (
        <div className="flex items-center px-4 py-3 gap-2">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0" tabIndex={-1}>
            <GripVertical size={16} />
          </button>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggleExpand}>
            <div className="text-sm font-medium text-gray-800 truncate">{title || 'Untitled Section'}</div>
            <div className="text-xs text-gray-400">{skillCount} skill{skillCount !== 1 ? 's' : ''}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onDelete} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors">
              <Trash2 size={15} className="text-gray-500 hover:text-red-500" />
            </button>
            <button onClick={onToggleExpand} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              {isExpanded ? <ChevronUp size={15} className="text-gray-500" /> : <ChevronDown size={15} className="text-gray-500" />}
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg px-4 py-3 flex items-center gap-2 cursor-grabbing">
      <GripVertical size={16} className="text-gray-400" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate">{title || 'Untitled Section'}</div>
        <div className="text-xs text-gray-400">{skillCount} skill{skillCount !== 1 ? 's' : ''}</div>
      </div>
    </div>
  )
}

export default function SkillsEditor({ data, onChange, focusPath, onFocusHandled }: EditorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const titleRefs = useRef<Record<number, HTMLInputElement | null>>({})
  useFocusFieldPath({ focusPath, rootRef, onHandled: onFocusHandled })
  const chipSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const sectionSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const [inputs, setInputs] = useState<Record<number, string>>({})
  const [editingSkill, setEditingSkill] = useState<EditingSkill | null>(null)
  const [draftSkill, setDraftSkill] = useState('')
  const skipNextEditCommitRef = useRef(false)
  const [pendingFocusIndex, setPendingFocusIndex] = useState<number | null>(null)
  const [activeDrag, setActiveDrag] = useState<{ sectionIndex: number; skillIndex: number } | null>(null)
  const [draftSection, setDraftSection] = useState<SkillSection | null>(null)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)
  const [activeSectionDrag, setActiveSectionDrag] = useState<number | null>(null)

  const sections: SkillSection[] = data.skillSections?.length
    ? data.skillSections.map(section => ({
        ...section,
        tag: section.tag ?? '',
        skills: normalizeEditorSkillList(section.skills ?? []),
      }))
    : [{ title: 'Core Skills', tag: '', skills: normalizeEditorSkillList(data.skills ?? []) }]
  const displayedSections = draftSection ? [...sections, draftSection] : sections
  const isMultiSection = displayedSections.length > 1

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

  function renderSectionEditor(section: SkillSection, sectionIndex: number) {
    return (
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Section Title (Optional)</label>
          <input
            ref={node => {
              titleRefs.current[sectionIndex] = node
            }}
            data-field-path={`skillSections.${sectionIndex}.title`}
            value={section.title}
            onChange={(e) => updateSection(sectionIndex, { ...section, title: e.target.value })}
            placeholder="Product, Tools, Collaboration..."
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <div className="flex flex-wrap gap-1.5">
              {section.skills.map((skill, skillIndex) => {
                const isEditing =
                  editingSkill?.sectionIndex === sectionIndex &&
                  editingSkill.skillIndex === skillIndex

                return (
                  <SortableSkillChip
                    key={skillId(sectionIndex, skillIndex)}
                    id={skillId(sectionIndex, skillIndex)}
                    skill={skill}
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
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {activeDrag?.sectionIndex === sectionIndex && activeDrag.skillIndex < section.skills.length ? (
              <SkillOverlayChip skill={section.skills[activeDrag.skillIndex]} />
            ) : null}
          </DragOverlay>
        </DndContext>

        <input
          data-field-path={focusPath?.startsWith(`skillSections.${sectionIndex}.skills`) ? focusPath : `skillSections.${sectionIndex}.skills`}
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
          className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    )
  }

  // ── SINGLE SECTION MODE ──────────────────────────────────────────────────────
  if (!isMultiSection) {
    return (
      <div ref={rootRef} className="space-y-4 p-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          {renderSectionEditor(displayedSections[0], 0)}
        </div>

        <button
          onClick={addSection}
          className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-indigo-400 hover:text-indigo-600"
        >
          <Plus size={14} /> Add skill section
        </button>
      </div>
    )
  }

  // ── MULTI-SECTION MODE (SubItemList-like) ────────────────────────────────────
  return (
    <div ref={rootRef} className="space-y-2 p-4">
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
                  <div className="rounded-b-xl border border-t-0 border-gray-200 bg-gray-50 p-4 -mt-1">
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
        className="w-full border border-dashed border-gray-300 rounded-xl py-2.5 text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1.5"
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
