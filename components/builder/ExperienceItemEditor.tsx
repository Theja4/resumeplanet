'use client'

import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff, Trash2, X, Plus } from 'lucide-react'
import type { ExperienceItem } from '@/types'

interface Props {
  item: ExperienceItem
  onChange: (updated: ExperienceItem) => void
}

function InputField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

function SortableBulletRow({
  id, text, isVisible, onChange, onToggleVisibility, onDelete,
}: {
  id: string; text: string; isVisible: boolean
  onChange: (text: string) => void; onToggleVisibility: () => void; onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 mb-2">
      <button {...attributes} {...listeners} className="mt-2.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0" tabIndex={-1}>
        <GripVertical size={15} />
      </button>
      <textarea
        value={text}
        onChange={e => onChange(e.target.value)}
        rows={2}
        className={`flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-300 ${!isVisible ? 'opacity-50 bg-gray-50' : ''}`}
        placeholder="Describe what you did and the impact..."
      />
      <button onClick={onToggleVisibility} className="mt-2 text-gray-400 hover:text-gray-600 shrink-0" title={isVisible ? 'Hide bullet' : 'Show bullet'}>
        {isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>
      <button onClick={onDelete} className="mt-2 text-gray-400 hover:text-red-500 shrink-0">
        <Trash2 size={15} />
      </button>
    </div>
  )
}

export default function ExperienceItemEditor({ item, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
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

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <InputField label="Title" value={item.title} onChange={v => onChange({ ...item, title: v })} placeholder="Job title" />
        <InputField label="Company" value={item.company} onChange={v => onChange({ ...item, company: v })} placeholder="Company name" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <InputField label="Location" value={item.location} onChange={v => onChange({ ...item, location: v })} placeholder="City, Country" />
        <InputField label="Start Date" value={item.startDate} onChange={v => onChange({ ...item, startDate: v })} placeholder="Jan 2022" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <InputField label="End Date" value={item.endDate} onChange={v => onChange({ ...item, endDate: v })} placeholder="Present" />
        <div />
      </div>

      {/* Summary optional field */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Summary (optional)</label>
        <textarea
          value={item.summary ?? ''}
          onChange={e => onChange({ ...item, summary: e.target.value })}
          rows={2}
          placeholder="Briefly describe your role..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Bullets */}
      <div>
        <label className="block text-xs text-gray-500 mb-2">Highlights</label>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBulletDragEnd}>
          <SortableContext items={bulletIds} strategy={verticalListSortingStrategy}>
            {item.bullets.map((bullet, bi) => (
              <SortableBulletRow
                key={bulletIds[bi]}
                id={bulletIds[bi]}
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
          className="w-full border border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus size={13} /> Add highlight
        </button>
      </div>
    </div>
  )
}
