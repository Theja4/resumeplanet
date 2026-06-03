'use client'

import { useRef, useState } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, MouseSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff, Trash2, ChevronDown, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ResumeData, BuilderVisibility, ExperienceItem, EducationItem, ProjectItem, CertificationItem } from '@/types'
import ExperienceItemEditor from './ExperienceItemEditor'
import EducationItemEditor from './EducationItemEditor'
import ProjectItemEditor from './ProjectItemEditor'
import CertificationItemEditor from './CertificationItemEditor'

import { useFocusFieldPath } from './useFocusFieldPath'

type ComplexSectionId = 'experience' | 'education' | 'projects' | 'certifications' | string
type ComplexSectionItem = ExperienceItem | EducationItem | ProjectItem | CertificationItem

interface Props {
  sectionId: ComplexSectionId
  resumeData: ResumeData
  visibility: BuilderVisibility
  onDataChange: (updated: ResumeData) => void
  onVisibilityChange: (updated: BuilderVisibility) => void
  focusPath?: string | null
  onFocusHandled?: () => void
  onItemAdd?: (sectionId: string) => void
  onItemDelete?: (sectionId: string) => void
  onItemEditorOpen?: (sectionId: string, subSectionId: string) => void
}

function getItems(data: ResumeData, sectionId: ComplexSectionId) {
  if (sectionId.startsWith('custom_')) {
    const custom = data.customSections?.find(c => c.id === sectionId)
    return (custom?.items || []) as ComplexSectionItem[]
  }
  return data[sectionId as keyof ResumeData] as ComplexSectionItem[]
}

function getItemLabel(item: ComplexSectionItem, sectionId: ComplexSectionId): string {
  if (sectionId.startsWith('custom_') || sectionId === 'experience') {
    const experienceItem = item as ExperienceItem
    return experienceItem.company || experienceItem.title || 'Untitled'
  }
  if (sectionId === 'education') return (item as EducationItem).institution || 'Untitled'
  if (sectionId === 'projects') return (item as ProjectItem).name || 'Untitled'
  if (sectionId === 'certifications') return (item as CertificationItem).name || 'Untitled'
  return 'Untitled'
}

function getItemSublabel(item: ComplexSectionItem, sectionId: ComplexSectionId): string {
  if (sectionId.startsWith('custom_') || sectionId === 'experience') return (item as ExperienceItem).title || ''
  if (sectionId === 'education') return (item as EducationItem).degree || ''
  if (sectionId === 'projects') return (item as ProjectItem).description?.slice(0, 40) || ''
  if (sectionId === 'certifications') return (item as CertificationItem).issuer || ''
  return ''
}

function makeEmptyItem(sectionId: ComplexSectionId): ComplexSectionItem {
  if (sectionId.startsWith('custom_') || sectionId === 'experience') return { company: '', title: '', location: '', startDate: '', endDate: '', bullets: [], bulletVisibility: [] }
  if (sectionId === 'education') return { institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' }
  if (sectionId === 'projects') return { name: '', description: '', bullets: [], technologies: [] }
  if (sectionId === 'certifications') return { name: '', issuer: '', date: '' }
  return { company: '', title: '', location: '', startDate: '', endDate: '', bullets: [], bulletVisibility: [] }
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function hasMeaningfulItemData(item: ComplexSectionItem, sectionId: ComplexSectionId): boolean {
  if (sectionId.startsWith('custom_') || sectionId === 'experience') {
    const experienceItem = item as ExperienceItem
    return (
      hasText(experienceItem.company) ||
      hasText(experienceItem.title) ||
      hasText(experienceItem.location) ||
      hasText(experienceItem.startDate) ||
      hasText(experienceItem.endDate) ||
      hasText(experienceItem.summary) ||
      hasText(experienceItem.url) ||
      experienceItem.bullets.some(hasText)
    )
  }

  if (sectionId === 'education') {
    const educationItem = item as EducationItem
    return (
      hasText(educationItem.institution) ||
      hasText(educationItem.degree) ||
      hasText(educationItem.field) ||
      hasText(educationItem.startDate) ||
      hasText(educationItem.endDate) ||
      hasText(educationItem.graduationDate) ||
      hasText(educationItem.gpa) ||
      hasText(educationItem.url)
    )
  }

  if (sectionId === 'projects') {
    const projectItem = item as ProjectItem
    return (
      hasText(projectItem.name) ||
      hasText(projectItem.description) ||
      hasText(projectItem.url) ||
      projectItem.bullets?.some(hasText) === true ||
      projectItem.technologies.some(hasText)
    )
  }

  if (sectionId === 'certifications') {
    const certificationItem = item as CertificationItem
    return (
      hasText(certificationItem.name) ||
      hasText(certificationItem.issuer) ||
      hasText(certificationItem.date) ||
      hasText(certificationItem.url)
    )
  }

  return false
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getItemPathPrefix(sectionId: ComplexSectionId) {
  return sectionId.startsWith('custom_') ? `${sectionId}.items` : sectionId
}

function getItemIndexFromFocusPath(sectionId: ComplexSectionId, focusPath: string) {
  const pathPrefix = getItemPathPrefix(sectionId)
  const match = focusPath.match(new RegExp(`^${escapeRegex(pathPrefix)}\\.(\\d+)`))
  return match ? Number(match[1]) : null
}

// Sortable wrapper for a single sub-item card
function SortableItemCard({
  id, label, sublabel, isVisible, isDeleting,
  onToggleVisibility, onDelete, onConfirmDelete, onCancelDelete, onEdit,
}: {
  id: string; label: string; sublabel: string; isVisible: boolean; isDeleting: boolean
  onToggleVisibility: () => void; onDelete: () => void
  onConfirmDelete: () => void; onCancelDelete: () => void; onEdit: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style} className={`mx-3 my-2 overflow-hidden rounded-[1.1rem] border bg-white/95 shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition-all ${
      isVisible
        ? 'border-zinc-200 hover:border-emerald-200 hover:shadow-[0_18px_36px_rgba(16,185,129,0.09)]'
        : 'border-zinc-100 bg-zinc-50/80'
    }`}>
      {isDeleting ? (
        <div className="flex items-center gap-3 bg-rose-50 px-4 py-3">
          <span className="flex-1 text-sm font-semibold text-rose-950">Delete this entry?</span>
          <button onClick={onCancelDelete} className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100">Cancel</button>
          <button onClick={onConfirmDelete} className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow-[0_10px_20px_rgba(239,68,68,0.2)] transition-colors hover:bg-red-600">Delete</button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <button {...attributes} {...listeners} className="flex h-9 w-6 shrink-0 cursor-grab items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-500 active:cursor-grabbing" tabIndex={-1}>
              <GripVertical size={16} />
            </button>
            <div className="min-w-0 flex-1">
              <div className={`truncate text-sm font-bold ${isVisible ? 'text-zinc-900' : 'text-zinc-400'}`}>{label}</div>
              {sublabel && <div className={`mt-0.5 truncate text-xs font-medium ${isVisible ? 'text-zinc-500' : 'text-zinc-300'}`}>{sublabel}</div>}
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${isVisible ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
                  {isVisible ? 'Visible' : 'Hidden'}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button onClick={onToggleVisibility} className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                isVisible
                  ? 'bg-zinc-100 text-zinc-500 hover:bg-emerald-50 hover:text-emerald-700'
                  : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
              }`} title={isVisible ? 'Hide' : 'Show'}>
                {isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
              <button onClick={onDelete} className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-500">
                <Trash2 size={15} />
              </button>
              <button onClick={onEdit} className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white">
                <ChevronDown size={15} />
              </button>
            </div>
          </div>
          {!isVisible && (
            <div className="border-t border-zinc-100 bg-zinc-50/80 px-4 py-2 text-xs font-semibold text-zinc-400">Hidden from resume output</div>
          )}
        </>
      )}
    </div>
  )
}

export default function SubItemList({
  sectionId,
  resumeData,
  visibility,
  onDataChange,
  onVisibilityChange,
  focusPath,
  onFocusHandled,
  onItemAdd,
  onItemDelete,
  onItemEditorOpen,
}: Props) {
  const items = getItems(resumeData, sectionId)
  const initialFocusIndex = focusPath ? getItemIndexFromFocusPath(sectionId, focusPath) : null
  const [draftItem, setDraftItem] = useState<ComplexSectionItem | null>(() =>
    initialFocusIndex !== null && initialFocusIndex === items.length ? makeEmptyItem(sectionId) : null
  )
  const [editingIndex, setEditingIndex] = useState<number | null>(() =>
    initialFocusIndex !== null && initialFocusIndex <= items.length ? initialFocusIndex : null
  )
  const [prevFocusPath, setPrevFocusPath] = useState(focusPath)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  if (focusPath !== prevFocusPath) {
    setPrevFocusPath(focusPath)
    if (focusPath && focusPath.startsWith(`${sectionId}.`)) {
      const index = getItemIndexFromFocusPath(sectionId, focusPath)
      if (index !== null && index <= items.length) {
        if (index === items.length) {
          setDraftItem(current => current ?? makeEmptyItem(sectionId))
        } else {
          setDraftItem(null)
        }
        setEditingIndex(index)
      }
    }
  }

  // Split mouse + touch sensors to keep iPad vertical scrolling working inside
  // long item lists (experience with 8 jobs, etc.). Long-press to initiate
  // drag on touch; 5px-distance on mouse.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const itemIds = items.map((_, i) => `${sectionId}-${i}`)
  const itemVisibility = visibility.items[sectionId] || []
  const draftIndex = draftItem ? items.length : null
  const effectiveEditingIndex =
    editingIndex !== null && (editingIndex < items.length || editingIndex === draftIndex)
      ? editingIndex
      : null
  const isEditingDraftItem = draftIndex !== null && effectiveEditingIndex === draftIndex
  const editableItemCount = items.length + (draftItem ? 1 : 0)

  const focusIndex = focusPath ? getItemIndexFromFocusPath(sectionId, focusPath) : null

  useFocusFieldPath({
    focusPath: (effectiveEditingIndex !== null && effectiveEditingIndex === focusIndex) ? focusPath : null,
    rootRef,
    onHandled: onFocusHandled
  })

  function updateItems(newItems: typeof items) {
    if (sectionId.startsWith('custom_')) {
      const customSections = [...(resumeData.customSections || [])]
      const idx = customSections.findIndex(c => c.id === sectionId)
      if (idx !== -1) {
        customSections[idx] = { ...customSections[idx], items: newItems as ExperienceItem[] }
        onDataChange({ ...resumeData, customSections })
      }
    } else {
      onDataChange({ ...resumeData, [sectionId as keyof ResumeData]: newItems })
    }
  }

  function updateItemVisibility(newVis: boolean[]) {
    onVisibilityChange({
      ...visibility,
      items: { ...visibility.items, [sectionId]: newVis },
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = itemIds.indexOf(active.id as string)
    const newIndex = itemIds.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    updateItems(arrayMove([...items], oldIndex, newIndex))
    updateItemVisibility(arrayMove([...itemVisibility], oldIndex, newIndex))
  }

  function toggleItemVisibility(index: number) {
    const newVis = [...itemVisibility]
    newVis[index] = newVis[index] === false ? true : false
    updateItemVisibility(newVis)
  }

  function addItem() {
    setDraftItem(current => current ?? makeEmptyItem(sectionId))
    setEditingIndex(items.length)
    onItemEditorOpen?.(sectionId, `${getItemPathPrefix(sectionId)}.${items.length}`)
  }

  function confirmDelete(index: number) {
    if (draftIndex !== null && index === draftIndex) {
      setDraftItem(null)
      setEditingIndex(null)
      setDeletingIndex(null)
      return
    }

    const newItems = items.filter((_, i) => i !== index) as typeof items
    const newVis = itemVisibility.filter((_, i) => i !== index)
    updateItems(newItems)
    updateItemVisibility(newVis)
    onItemDelete?.(sectionId)
    setDeletingIndex(null)
    if (editingIndex !== null) {
      if (editingIndex === index) setEditingIndex(null)
      else if (editingIndex > index) setEditingIndex(editingIndex - 1)
    }
  }

  function updateItem(index: number, updated: ExperienceItem | EducationItem | ProjectItem | CertificationItem) {
    if (draftIndex !== null && index === draftIndex) {
      if (!hasMeaningfulItemData(updated, sectionId)) {
        setDraftItem(updated)
        return
      }

      updateItems([...items, updated] as typeof items)
      setDraftItem(null)
      setEditingIndex(items.length)
      onItemAdd?.(sectionId)
      return
    }

    const newItems = [...items]
    newItems[index] = updated
    updateItems(newItems as typeof items)
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────────────

  if (effectiveEditingIndex === null) {
    return (
      <div className="bg-gradient-to-b from-emerald-50/30 to-white pb-4 pt-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {items.map((item, i) => (
              <SortableItemCard
                key={itemIds[i]}
                id={itemIds[i]}
                label={getItemLabel(item, sectionId)}
                sublabel={getItemSublabel(item, sectionId)}
                isVisible={itemVisibility[i] !== false}
                isDeleting={deletingIndex === i}
                onToggleVisibility={() => toggleItemVisibility(i)}
                onDelete={() => setDeletingIndex(i)}
                onConfirmDelete={() => confirmDelete(i)}
                onCancelDelete={() => setDeletingIndex(null)}
                onEdit={() => {
                  setEditingIndex(i)
                  onItemEditorOpen?.(sectionId, `${getItemPathPrefix(sectionId)}.${i}`)
                }}
              />
            ))}
          </SortableContext>
        </DndContext>

        <button
          onClick={addItem}
          className="mx-3 mt-3 flex w-[calc(100%-1.5rem)] items-center justify-center gap-2 rounded-[1rem] border border-dashed border-emerald-200 bg-white/80 py-3 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 active:scale-[0.99]"
        >
          <Plus size={14} /> Add entry
        </button>
      </div>
    )
  }

  // ── EDIT VIEW ────────────────────────────────────────────────────────────────

  const item = (isEditingDraftItem ? draftItem : items[effectiveEditingIndex]) as ComplexSectionItem

  return (
    <div className="bg-gradient-to-b from-emerald-50/30 to-white">
      {/* Navigation bar */}
      <div className="flex items-center justify-between gap-3 border-b border-emerald-100 bg-white/92 px-4 py-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)] backdrop-blur">
        <div
          className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 p-1 shadow-sm"
          aria-label={`Entry ${effectiveEditingIndex + 1} of ${editableItemCount}`}
        >
          <button
            onClick={() => {
              const nextIndex = effectiveEditingIndex > 0 ? effectiveEditingIndex - 1 : effectiveEditingIndex
              if (isEditingDraftItem) setDraftItem(null)
              setEditingIndex(nextIndex)
              onItemEditorOpen?.(sectionId, `${getItemPathPrefix(sectionId)}.${nextIndex}`)
            }}
            disabled={effectiveEditingIndex === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-transparent disabled:text-zinc-300 disabled:shadow-none"
            aria-label="Previous entry"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <span className="min-w-[52px] px-2 text-center text-sm font-black tabular-nums text-zinc-700">
            {effectiveEditingIndex + 1} / {editableItemCount}
          </span>
          <button
            onClick={() => {
              const nextIndex = effectiveEditingIndex < editableItemCount - 1 ? effectiveEditingIndex + 1 : effectiveEditingIndex
              setEditingIndex(nextIndex)
              onItemEditorOpen?.(sectionId, `${getItemPathPrefix(sectionId)}.${nextIndex}`)
            }}
            disabled={effectiveEditingIndex === editableItemCount - 1}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-transparent disabled:text-zinc-300 disabled:shadow-none"
            aria-label="Next entry"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Hide/show the CURRENT sub-item without leaving the editor view.
              Mirror of the eye icon on the list-view card so users don't have
              to bounce back to the list to toggle visibility. */}
          {!isEditingDraftItem && (
            <button
              onClick={() => toggleItemVisibility(effectiveEditingIndex)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
              title={itemVisibility[effectiveEditingIndex] !== false ? 'Hide this entry' : 'Show this entry'}
              aria-label={itemVisibility[effectiveEditingIndex] !== false ? 'Hide entry' : 'Show entry'}
            >
              {itemVisibility[effectiveEditingIndex] !== false ? (
                <Eye size={14} />
              ) : (
                <EyeOff size={14} />
              )}
            </button>
          )}
          {/* Delete the CURRENT sub-item. Reuses the existing confirm flow so
              an accidental tap doesn't nuke an entry. */}
          <button
            onClick={() => setDeletingIndex(effectiveEditingIndex)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Delete this entry"
            aria-label="Delete entry"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={addItem}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white"
            title="Add new entry"
            aria-label="Add entry"
          >
            <Plus size={15} />
          </button>
          <button
            onClick={() => {
              if (isEditingDraftItem) setDraftItem(null)
              setEditingIndex(null)
            }}
            className="rounded-full bg-zinc-950 px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition-colors hover:bg-zinc-800"
          >
            Done
          </button>
        </div>
      </div>

      {/* Inline delete confirm for the current sub-item (mirrors list-view) */}
      {deletingIndex === effectiveEditingIndex && (
        <div className="flex items-center gap-3 border-b border-rose-100 bg-rose-50 px-4 py-3">
          <span className="flex-1 text-sm font-semibold text-rose-950">Delete this entry?</span>
          <button
            onClick={() => setDeletingIndex(null)}
            className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
          >
            Cancel
          </button>
          <button
            onClick={() => confirmDelete(effectiveEditingIndex)}
            className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow-[0_10px_20px_rgba(239,68,68,0.2)] hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      )}

      {/* Item editor */}
      <div ref={rootRef} className="p-4">
        {(sectionId === 'experience' || sectionId.startsWith('custom_')) && (
          <ExperienceItemEditor
            item={item as ExperienceItem}
            pathPrefix={`${getItemPathPrefix(sectionId)}.${effectiveEditingIndex}`}
            onChange={updated => updateItem(effectiveEditingIndex, updated)}
          />
        )}
        {sectionId === 'education' && (
          <EducationItemEditor
            item={item as EducationItem}
            pathPrefix={`${sectionId}.${effectiveEditingIndex}`}
            onChange={updated => updateItem(effectiveEditingIndex, updated)}
          />
        )}
        {sectionId === 'projects' && (
          <ProjectItemEditor
            item={item as ProjectItem}
            pathPrefix={`${sectionId}.${effectiveEditingIndex}`}
            onChange={updated => updateItem(effectiveEditingIndex, updated)}
          />
        )}
        {sectionId === 'certifications' && (
          <CertificationItemEditor
            item={item as CertificationItem}
            pathPrefix={`${sectionId}.${effectiveEditingIndex}`}
            onChange={updated => updateItem(effectiveEditingIndex, updated)}
          />
        )}
      </div>
    </div>
  )
}
