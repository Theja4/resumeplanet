'use client'

import { useState } from 'react'
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
  )
}
