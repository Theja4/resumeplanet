'use client'

import { useState, KeyboardEvent, useRef, useEffect } from 'react'
import { GripVertical, X } from 'lucide-react'
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
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ResumeData } from '@/types'
import { useFocusFieldPath } from './useFocusFieldPath'

interface EditorProps {
  sectionId: string
  data: ResumeData
  onChange: (updated: ResumeData) => void
  focusPath?: string | null
  onFocusHandled?: () => void
}

interface SortableTagChipProps {
  id: string
  tag: string
  sectionId: string
  tagIndex: number
  isEditing: boolean
  draftValue: string
  onDraftChange: (value: string) => void
  onStartEdit: () => void
  onCommitEdit: () => void
  onCancelEdit: () => void
  onRemove: () => void
}

function SortableTagChip({
  id,
  tag,
  sectionId,
  tagIndex,
  isEditing,
  draftValue,
  onDraftChange,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onRemove,
}: SortableTagChipProps) {
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
        className="inline-flex max-w-full items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 ring-2 ring-emerald-200"
      >
        <input
          autoFocus
          data-field-path={`${sectionId}.tags.${tagIndex}`}
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
          className="min-w-[80px] max-w-[220px] bg-transparent text-xs text-emerald-800 outline-none"
        />
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onRemove}
          className="text-emerald-400 hover:text-emerald-700"
          aria-label={`Remove ${tag}`}
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
      className="inline-flex max-w-full items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-emerald-300 transition-colors hover:text-emerald-600 active:cursor-grabbing"
        aria-label={`Drag ${tag}`}
      >
        <GripVertical size={11} />
      </button>
      <button
        type="button"
        onClick={onStartEdit}
        className="max-w-[220px] truncate text-left hover:text-emerald-900"
        title="Click to edit"
      >
        {tag}
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="text-emerald-400 hover:text-emerald-700"
        aria-label={`Remove ${tag}`}
      >
        <X size={10} />
      </button>
    </span>
  )
}

function TagOverlayChip({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 shadow-lg ring-2 ring-emerald-300 cursor-grabbing">
      <GripVertical size={11} className="text-emerald-400" />
      <span className="max-w-[220px] truncate">{tag}</span>
      <X size={10} className="text-emerald-400" />
    </span>
  )
}

export default function CustomTagsEditor({ sectionId, data, onChange, focusPath, onFocusHandled }: EditorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  
  const customSection = data.customSections?.find(c => c.id === sectionId)
  const tags = customSection?.tags || []

  let initialEditingIndex: number | null = null
  let initialDraftTag = ''
  
  if (focusPath && focusPath.startsWith(`${sectionId}.tags.`)) {
    const parts = focusPath.split('.')
    if (parts[2]) {
      const idx = parseInt(parts[2], 10)
      if (!isNaN(idx) && tags[idx] !== undefined) {
        initialEditingIndex = idx
        initialDraftTag = tags[idx]
      }
    }
  }

  const [input, setInput] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(initialEditingIndex)
  const [draftTag, setDraftTag] = useState(initialDraftTag)
  const skipNextEditCommitRef = useRef(false)
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useFocusFieldPath({ focusPath, rootRef, onHandled: onFocusHandled })

  const [prevFocusPath, setPrevFocusPath] = useState(focusPath)
  
  if (focusPath !== prevFocusPath) {
    setPrevFocusPath(focusPath)
    if (focusPath && focusPath.startsWith(`${sectionId}.tags.`)) {
      const parts = focusPath.split('.')
      const tagIndex = parseInt(parts[parts.length - 1], 10)
      if (!isNaN(tagIndex) && tags[tagIndex] !== undefined) {
        setEditingIndex(tagIndex)
        setDraftTag(tags[tagIndex])
      }
    }
  }

  if (!customSection) return null

  function updateTags(newTags: string[]) {
    const newSections = [...(data.customSections || [])]
    const idx = newSections.findIndex(c => c.id === sectionId)
    if (idx !== -1) {
      newSections[idx] = { ...newSections[idx], tags: newTags }
      onChange({ ...data, customSections: newSections })
    }
  }

  function addTag(raw: string) {
    const tag = raw.trim()
    if (!tag) {
      setInput('')
      return
    }
    // Only add if not duplicate
    if (!tags.includes(tag)) {
      updateTags([...tags, tag])
    }
    setInput('')
  }

  function removeTag(index: number) {
    updateTags(tags.filter((_, i) => i !== index))
    if (editingIndex === index) resetEditing()
  }

  function startEditing(index: number, value: string) {
    setEditingIndex(index)
    setDraftTag(value)
  }

  function resetEditing() {
    setEditingIndex(null)
    setDraftTag('')
  }

  function commitEditing() {
    if (skipNextEditCommitRef.current) {
      skipNextEditCommitRef.current = false
      return
    }

    if (editingIndex === null) return

    const replacement = draftTag.trim()
    const nextTags = [...tags]

    if (replacement) {
      nextTags[editingIndex] = replacement
      updateTags(nextTags)
    } else {
      removeTag(editingIndex)
    }
    resetEditing()
  }

  function handleDragStart(event: DragStartEvent) {
    const idx = tags.indexOf(String(event.active.id).replace(`${sectionId}-tag-`, ''))
    // Using index-based IDs for stability
    const match = String(event.active.id).match(/-(\d+)$/)
    if (match) setActiveDragIndex(Number(match[1]))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragIndex(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = Number(String(active.id).split('-').pop())
    const newIndex = Number(String(over.id).split('-').pop())
    
    if (isNaN(oldIndex) || isNaN(newIndex)) return

    resetEditing()
    updateTags(arrayMove([...tags], oldIndex, newIndex))
  }

  const tagIds = tags.map((_, i) => `${sectionId}-tag-${i}`)

  return (
    <div ref={rootRef} className="p-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDragIndex(null)}
      >
        <SortableContext items={tagIds} strategy={rectSortingStrategy}>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((tag, i) => {
              const isEditing = editingIndex === i
              return (
                <SortableTagChip
                  key={tagIds[i]}
                  id={tagIds[i]}
                  tag={tag}
                  sectionId={sectionId}
                  tagIndex={i}
                  isEditing={isEditing}
                  draftValue={draftTag}
                  onDraftChange={setDraftTag}
                  onStartEdit={() => startEditing(i, tag)}
                  onCommitEdit={commitEditing}
                  onCancelEdit={resetEditing}
                  onRemove={() => removeTag(i)}
                />
              )
            })}
          </div>
        </SortableContext>
        <DragOverlay dropAnimation={null}>
          {activeDragIndex !== null && activeDragIndex < tags.length ? (
            <TagOverlayChip tag={tags[activeDragIndex]} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <input
        data-field-path={`${sectionId}.tags`}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag(input.replace(/,$/, ''))
          }
        }}
        onBlur={() => { if (input.trim()) addTag(input) }}
        placeholder={`Type an item for ${customSection.title}, press Enter or comma to add`}
        className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
      />
    </div>
  )
}
