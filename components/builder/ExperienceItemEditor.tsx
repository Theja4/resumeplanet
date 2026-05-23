'use client'

import {
  DndContext, closestCenter, KeyboardSensor, MouseSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff, Trash2, X, Plus, Link as LinkIcon } from 'lucide-react'
import type { ExperienceItem } from '@/types'
import AutoGrowTextarea from './AutoGrowTextarea'

interface Props {
  item: ExperienceItem
  pathPrefix: string
  onChange: (updated: ExperienceItem) => void
}

function InputField({ label, path, value, onChange, placeholder, type = 'text', maxLength, labelIcon }: {
  label: string; path: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; maxLength?: number; labelIcon?: React.ReactNode
}) {
  const inputId = `field-${path.replace(/[^a-zA-Z0-9]+/g, '-')}`
  return (
    <div>
      <label htmlFor={inputId} className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mb-1.5">
        {labelIcon}
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          data-field-path={path}
          type={type}
          value={value}
          maxLength={maxLength}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
        />
        {value && (
          <button
            aria-label="Clear field"
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

function SortableBulletRow({
  id, path, text, isVisible, onChange, onToggleVisibility, onDelete,
}: {
  id: string; path: string; text: string; isVisible: boolean
  onChange: (text: string) => void; onToggleVisibility: () => void; onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 mb-3">
      <button {...attributes} {...listeners} aria-label="Drag to reorder" className="mt-3 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0" tabIndex={-1}>
        <GripVertical size={16} />
      </button>
      <AutoGrowTextarea
        data-field-path={path}
        value={text}
        maxLength={2000}
        onChange={e => onChange(e.target.value)}
        className={`flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-300 ${!isVisible ? 'opacity-50 bg-gray-50' : ''}`}
        placeholder="Describe what you did and the impact..."
        style={{ whiteSpace: 'pre-wrap' }}
        minHeight={42}
      />
      <button onClick={onToggleVisibility} className="mt-3 text-gray-400 hover:text-gray-600 shrink-0" title={isVisible ? 'Hide bullet' : 'Show bullet'} aria-label={isVisible ? 'Hide bullet' : 'Show bullet'}>
        {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
      <button onClick={onDelete} className="mt-3 text-gray-400 hover:text-red-500 shrink-0" aria-label="Delete bullet">
        <Trash2 size={16} />
      </button>
    </div>
  )
}

export default function ExperienceItemEditor({ item, pathPrefix, onChange }: Props) {
  // Mouse → 5px distance, Touch → 250ms press. Prevents drag from hijacking
  // vertical scroll on iPad inside long bullet lists.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const bulletIds = item.bullets.map((_, i) => `bullet-${i}`)
  const bulletVis = item.bulletVisibility ?? []

  function updateBullet(index: number, text: string) {
    const newBullets = [...item.bullets]
    newBullets[index] = text
    onChange({ ...item, bullets: newBullets })
  }

  function toggleBulletVisibility(index: number) {
    const newVis = [...bulletVis]
    newVis[index] = newVis[index] === false ? true : false
    onChange({ ...item, bulletVisibility: newVis })
  }

  function deleteBullet(index: number) {
    onChange({
      ...item,
      bullets: item.bullets.filter((_, i) => i !== index),
      bulletVisibility: bulletVis.filter((_, i) => i !== index),
    })
  }

  function addBullet() {
    onChange({ ...item, bullets: [...item.bullets, ''], bulletVisibility: [...bulletVis, true] })
  }

  function handleBulletDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = bulletIds.indexOf(active.id as string)
    const newIndex = bulletIds.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    onChange({
      ...item,
      bullets: arrayMove([...item.bullets], oldIndex, newIndex),
      bulletVisibility: arrayMove([...bulletVis], oldIndex, newIndex),
    })
  }

  const summaryId = `field-${pathPrefix.replace(/[^a-zA-Z0-9]+/g, '-')}-summary`

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Title" path={`${pathPrefix}.title`} value={item.title} onChange={v => onChange({ ...item, title: v })} placeholder="Job title" />
        <InputField label="Company" path={`${pathPrefix}.company`} value={item.company} onChange={v => onChange({ ...item, company: v })} placeholder="Company name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Location" path={`${pathPrefix}.location`} value={item.location} onChange={v => onChange({ ...item, location: v })} placeholder="City, Country" maxLength={120} />
        <InputField label="Start Date" path={`${pathPrefix}.startDate`} value={item.startDate} onChange={v => onChange({ ...item, startDate: v })} placeholder="Jan 2022" maxLength={32} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <InputField label="End Date" path={`${pathPrefix}.endDate`} value={item.endDate} onChange={v => onChange({ ...item, endDate: v })} placeholder="Present" maxLength={32} />
        <InputField label="Link (optional)" path={`${pathPrefix}.url`} value={item.url ?? ''} onChange={v => onChange({ ...item, url: v })} placeholder="https://company.com" maxLength={500} labelIcon={<LinkIcon size={13} className="text-gray-400" />} />
      </div>

      {/* Summary optional field */}
      <div>
        <label htmlFor={summaryId} className="block text-sm font-medium text-gray-600 mb-1.5">Summary (optional)</label>
        <AutoGrowTextarea
          id={summaryId}
          data-field-path={`${pathPrefix}.summary`}
          value={item.summary ?? ''}
          maxLength={2000}
          onChange={e => onChange({ ...item, summary: e.target.value })}
          placeholder="Briefly describe your role..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-300"
          minHeight={42}
        />
      </div>

      {/* Bullets */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">Highlights</label>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBulletDragEnd}>
          <SortableContext items={bulletIds} strategy={verticalListSortingStrategy}>
            {item.bullets.map((bullet, bi) => (
              <SortableBulletRow
                key={bulletIds[bi]}
                id={bulletIds[bi]}
                path={`${pathPrefix}.bullets.${bi}`}
                text={bullet}
                isVisible={bulletVis[bi] !== false}
                onChange={text => updateBullet(bi, text)}
                onToggleVisibility={() => toggleBulletVisibility(bi)}
                onDelete={() => deleteBullet(bi)}
              />
            ))}
          </SortableContext>
        </DndContext>
        <button
          onClick={addBullet}
          className="w-full border border-dashed border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus size={14} /> Add highlight
        </button>
      </div>
    </div>
  )
}
