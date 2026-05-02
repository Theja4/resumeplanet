'use client'

import { useEffect, useRef, useState } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
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
  if (sectionId === 'education') return { institution: '', degree: '', field: '', startDate: '', endDate: '', graduationDate: '', gpa: '' }
  if (sectionId === 'projects') return { name: '', description: '', bullets: [], technologies: [] }
  if (sectionId === 'certifications') return { name: '', issuer: '', date: '' }
  return { company: '', title: '', location: '', startDate: '', endDate: '', bullets: [], bulletVisibility: [] }
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
    <div ref={setNodeRef} style={style} className="mx-3 my-2 bg-white rounded-xl border border-gray-200 shadow-sm">
      {isDeleting ? (
        <div className="px-4 py-3 flex items-center gap-3">
          <span className="flex-1 text-sm text-gray-700">Delete this entry?</span>
          <button onClick={onCancelDelete} className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirmDelete} className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600">Delete</button>
        </div>
      ) : (
        <>
          <div className="flex items-center px-4 py-3 gap-2">
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0" tabIndex={-1}>
              <GripVertical size={16} />
            </button>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium text-gray-800 truncate ${!isVisible ? 'opacity-50' : ''}`}>{label}</div>
              {sublabel && <div className="text-xs text-gray-400 truncate">{sublabel}</div>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={onToggleVisibility} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors" title={isVisible ? 'Hide' : 'Show'}>
                {isVisible ? <Eye size={15} className="text-gray-500" /> : <EyeOff size={15} className="text-gray-300" />}
              </button>
              <button onClick={onDelete} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors">
                <Trash2 size={15} className="text-gray-500 hover:text-red-500" />
              </button>
              <button onClick={onEdit} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <ChevronDown size={15} className="text-gray-500" />
              </button>
            </div>
          </div>
          {!isVisible && (
            <div className="px-4 pb-2 text-xs text-gray-400 italic">Hidden from resume</div>
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const items = getItems(resumeData, sectionId)
  const itemIds = items.map((_, i) => `${sectionId}-${i}`)
  const itemVisibility = visibility.items[sectionId] || []
  const effectiveEditingIndex = editingIndex !== null && editingIndex < items.length ? editingIndex : null

  useEffect(() => {
    if (!focusPath || !focusPath.startsWith(`${sectionId}.`)) return
    const index = getItemIndexFromFocusPath(sectionId, focusPath)
    if (index === null) return
    const timeout = window.setTimeout(() => setEditingIndex(index), 0)
    return () => window.clearTimeout(timeout)
  }, [focusPath, sectionId])

  useEffect(() => {
    if (editingIndex === null || !focusPath || !focusPath.startsWith(`${sectionId}.`) || !rootRef.current) return
    const id = window.requestAnimationFrame(() => {
      const root = rootRef.current
      if (!root) return
      const escapedPath =
        typeof window !== 'undefined' && window.CSS?.escape
          ? window.CSS.escape(focusPath)
          : focusPath
      const target = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[data-field-path="${escapedPath}"]`) ?? root.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea')
      if (target) {
        target.focus()
        target.select?.()
        onFocusHandled?.()
      }
    })
    return () => window.cancelAnimationFrame(id)
  }, [editingIndex, focusPath, sectionId, onFocusHandled])

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
    const newItem = makeEmptyItem(sectionId)
    updateItems([...items, newItem] as typeof items)
    onItemAdd?.(sectionId)
    // Set editing to the new item
    setEditingIndex(items.length)
    onItemEditorOpen?.(sectionId, `${getItemPathPrefix(sectionId)}.${items.length}`)
  }

  function confirmDelete(index: number) {
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
    const newItems = [...items]
    newItems[index] = updated
    updateItems(newItems as typeof items)
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────────────

  if (effectiveEditingIndex === null) {
    return (
      <div className="pb-3">
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
          className="mx-3 w-[calc(100%-1.5rem)] border border-dashed border-gray-300 rounded-xl py-2.5 text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus size={14} /> Add entry
        </button>
      </div>
    )
  }

  // ── EDIT VIEW ────────────────────────────────────────────────────────────────

  const item = items[effectiveEditingIndex]

  return (
    <div>
      {/* Navigation bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const nextIndex = effectiveEditingIndex > 0 ? effectiveEditingIndex - 1 : effectiveEditingIndex
              setEditingIndex(nextIndex)
              onItemEditorOpen?.(sectionId, `${getItemPathPrefix(sectionId)}.${nextIndex}`)
            }}
            disabled={effectiveEditingIndex === 0}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} className="text-gray-500" />
          </button>
          <span className="text-xs text-gray-500 font-medium">
            {effectiveEditingIndex + 1} / {items.length}
          </span>
          <button
            onClick={() => {
              const nextIndex = effectiveEditingIndex < items.length - 1 ? effectiveEditingIndex + 1 : effectiveEditingIndex
              setEditingIndex(nextIndex)
              onItemEditorOpen?.(sectionId, `${getItemPathPrefix(sectionId)}.${nextIndex}`)
            }}
            disabled={effectiveEditingIndex === items.length - 1}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addItem}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
          >
            <Plus size={15} className="text-gray-500" />
          </button>
          <button
            onClick={() => setEditingIndex(null)}
            className="px-3 py-1.5 bg-gray-900 text-white rounded-full text-xs font-medium hover:bg-gray-800"
          >
            Done
          </button>
        </div>
      </div>

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
