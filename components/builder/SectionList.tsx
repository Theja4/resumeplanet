'use client'

import { useState } from 'react'
import { Plus, X, List, AlignLeft, Tags } from 'lucide-react'
import type { CustomSectionType } from '@/types'
import {
  DndContext, closestCenter,
  KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import type { ResumeData, BuilderVisibility } from '@/types'
import SortableSectionRow from './SortableSectionRow'

interface Props {
  resumeData: ResumeData
  visibility: BuilderVisibility
  expandedSection: string | null
  sectionHints: Set<string>
  onDataChange: (updated: ResumeData) => void
  onVisibilityChange: (updated: BuilderVisibility) => void
  onExpandSection: (id: string | null) => void
}

export default function SectionList({
  resumeData,
  visibility,
  expandedSection,
  sectionHints,
  onDataChange,
  onVisibilityChange,
  onExpandSection,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<CustomSectionType>('complex')

  function handleAddCustom() {
    if (!newTitle.trim()) return
    // e.g. custom_12345
    const id = `custom_${crypto.randomUUID().split('-')[0]}`
    
    // Inject custom section payload
    const customSections = resumeData.customSections || []
    onDataChange({
      ...resumeData,
      customSections: [
        ...customSections,
        { id, title: newTitle.trim(), type: newType, text: '', tags: [], items: [] }
      ]
    })
    
    // Add to order
    onVisibilityChange({
      ...visibility,
      sectionOrder: [...visibility.sectionOrder, id]
    })
    
    // Reset and select
    setNewTitle('')
    setNewType('complex')
    setIsAdding(false)
    onExpandSection(id)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = visibility.sectionOrder.indexOf(active.id as string)
    const newIndex = visibility.sectionOrder.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    onVisibilityChange({
      ...visibility,
      sectionOrder: arrayMove(visibility.sectionOrder, oldIndex, newIndex),
    })
  }

  return (
    <div className="flex flex-col gap-2 p-4 pt-6 w-full">
      <div className="mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 px-4 mb-1">Editor Sections</h2>
        <p className="text-xs text-zinc-500 px-4">Refine your professional narrative</p>
      </div>
      
      <nav className="space-y-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibility.sectionOrder}
            strategy={verticalListSortingStrategy}
          >
            {visibility.sectionOrder.map(sectionId => (
              <SortableSectionRow
                key={sectionId}
                sectionId={sectionId}
                resumeData={resumeData}
                visibility={visibility}
                isExpanded={expandedSection === sectionId}
                hasHint={sectionHints.has(sectionId)}
                onDataChange={onDataChange}
                onVisibilityChange={onVisibilityChange}
                onExpand={() => onExpandSection(expandedSection === sectionId ? null : sectionId)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </nav>

      <div className="mt-8 px-4 pb-8">
        {!isAdding ? (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full py-4 border-2 border-dashed border-zinc-200 rounded-xl text-xs font-bold text-zinc-400 uppercase tracking-widest hover:border-primary-container hover:text-primary transition-all active:scale-[0.98]">
              + Add Custom Section
          </button>
        ) : (
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">New Section</span>
              <button onClick={() => setIsAdding(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={16} />
              </button>
            </div>
            
            <input
              type="text"
              autoFocus
              placeholder="E.g. Leadership, Memberships..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full text-sm font-medium border-zinc-200 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 mb-3 placeholder:font-normal"
            />
            
            <div className="flex flex-col gap-2 mb-4">
              <button 
                onClick={() => setNewType('complex')}
                className={`flex gap-3 text-left p-2.5 rounded-lg border transition-all ${newType === 'complex' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900' : 'border-zinc-200 bg-white hover:bg-zinc-50'}`}
              >
                <List size={18} className={`shrink-0 ${newType === 'complex' ? 'text-emerald-500' : 'text-zinc-400'}`} />
                <div>
                  <div className="text-xs font-bold">List (Detailed)</div>
                  <div className="text-[10px] text-zinc-500">Like Experience — Title, Subtitle, Dates, Bullets</div>
                </div>
              </button>
              
              <button 
                onClick={() => setNewType('tags')}
                className={`flex gap-3 text-left p-2.5 rounded-lg border transition-all ${newType === 'tags' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900' : 'border-zinc-200 bg-white hover:bg-zinc-50'}`}
              >
                <Tags size={18} className={`shrink-0 ${newType === 'tags' ? 'text-emerald-500' : 'text-zinc-400'}`} />
                <div>
                  <div className="text-xs font-bold">Tags</div>
                  <div className="text-[10px] text-zinc-500">Like Skills — Comma separated items</div>
                </div>
              </button>
              
              <button 
                onClick={() => setNewType('text')}
                className={`flex gap-3 text-left p-2.5 rounded-lg border transition-all ${newType === 'text' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900' : 'border-zinc-200 bg-white hover:bg-zinc-50'}`}
              >
                <AlignLeft size={18} className={`shrink-0 ${newType === 'text' ? 'text-emerald-500' : 'text-zinc-400'}`} />
                <div>
                  <div className="text-xs font-bold">Text Block</div>
                  <div className="text-[10px] text-zinc-500">Like Summary — Paragraph of custom text</div>
                </div>
              </button>
            </div>
            
            <button
              onClick={handleAddCustom}
              disabled={!newTitle.trim()}
              className="w-full py-2.5 bg-primary text-white rounded-lg text-xs font-bold tracking-wide uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              Construct Section
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
