# Drag & Drop Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken multi-column drag-and-drop in the resume builder sidebar with a clean, working implementation using simplified dnd-kit.

**Architecture:** Single `DndContext` wrapping both columns. Each column is a `SortableContext` (live visual shifting within-column via `useSortable` CSS transforms) plus an inline `useDroppable` zone (so empty columns can receive drops). Cross-column drops land at the end of the target list — no `onDragOver`. A `DragOverlay` ghost card follows the cursor.

**Tech Stack:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, Next.js App Router, TypeScript

---

### Task 1: Delete DroppableContainer.tsx and fix SortableSectionRow opacity

**Files:**
- Delete: `components/builder/DroppableContainer.tsx`
- Modify: `components/builder/SortableSectionRow.tsx:96-100`

- [ ] **Step 1: Delete DroppableContainer**

```bash
rm components/builder/DroppableContainer.tsx
```

- [ ] **Step 2: Update drag opacity in SortableSectionRow**

In `components/builder/SortableSectionRow.tsx`, change line 99:

```ts
// Before
opacity: isDragging ? 0.5 : 1,

// After
opacity: isDragging ? 0 : 1,
```

This makes the original item invisible while the `DragOverlay` ghost card is shown — the standard dnd-kit pattern.

- [ ] **Step 3: Verify no other files import DroppableContainer**

```bash
grep -r "DroppableContainer" . --include="*.tsx" --include="*.ts"
```

Expected: no output (only `SectionList.tsx` imported it and will be fully rewritten in Task 2).

- [ ] **Step 4: Commit**

```bash
git add components/builder/SortableSectionRow.tsx
git rm components/builder/DroppableContainer.tsx
git commit -m "refactor: remove DroppableContainer, hide original item while dragging"
```

---

### Task 2: Rewrite SectionList.tsx

**Files:**
- Modify: `components/builder/SectionList.tsx` (full rewrite)

- [ ] **Step 1: Replace the entire file with the new implementation**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Plus, X, List, AlignLeft, Tags, Loader2, User, GripVertical } from 'lucide-react'
import type { CustomSectionType } from '@/types'
import {
  DndContext, DragOverlay, rectIntersection,
  KeyboardSensor, PointerSensor, useSensor, useSensors, useDroppable,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import type { ResumeData, BuilderVisibility, UniversalConfig } from '@/types'
import SortableSectionRow from './SortableSectionRow'
import ContactEditor from './ContactEditor'

const SECTION_LABELS: Record<string, string> = {
  summary: 'Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certificates',
  volunteer: 'Volunteer Work',
  languages: 'Languages',
  interests: 'Interests',
  awards: 'Awards',
  publications: 'Publications',
  references: 'References',
}

interface Props {
  resumeData: ResumeData
  visibility: BuilderVisibility
  layout: UniversalConfig['layout']
  expandedSection: string | null
  sectionHints: Set<string>
  onDataChange: (updated: ResumeData) => void
  onVisibilityChange: (updated: BuilderVisibility) => void
  onExpandSection: (id: string | null) => void
  isDisabled?: boolean
}

// Thin droppable wrappers — needed so empty columns can receive cross-column drops
function PrimaryCol({ children, className }: { children: React.ReactNode; className?: string }) {
  const { setNodeRef } = useDroppable({ id: 'primary-col' })
  return <div ref={setNodeRef} className={className}>{children}</div>
}
function SecondaryCol({ children, className }: { children: React.ReactNode; className?: string }) {
  const { setNodeRef } = useDroppable({ id: 'secondary-col' })
  return <div ref={setNodeRef} className={className}>{children}</div>
}

export default function SectionList({
  resumeData,
  visibility,
  layout,
  expandedSection,
  sectionHints,
  onDataChange,
  onVisibilityChange,
  onExpandSection,
  isDisabled = false,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<CustomSectionType>('complex')
  const [activeId, setActiveId] = useState<string | null>(null)

  const isSidebarLayout = layout?.startsWith('sidebar')

  // Local ordering state — mirrors props when idle, mutated during within-column drag
  const [localPrimary, setLocalPrimary] = useState<string[]>(() =>
    (visibility.sectionOrder || []).filter(id => id !== 'contact')
  )
  const [localSecondary, setLocalSecondary] = useState<string[]>(() =>
    (visibility.sidebarSectionOrder || []).filter(id => id !== 'contact')
  )

  // Sync from props whenever not mid-drag
  useEffect(() => {
    if (!activeId) {
      setLocalPrimary((visibility.sectionOrder || []).filter(id => id !== 'contact'))
      setLocalSecondary((visibility.sidebarSectionOrder || []).filter(id => id !== 'contact'))
    }
  }, [visibility.sectionOrder, visibility.sidebarSectionOrder, activeId])

  function getSectionLabel(id: string): string {
    if (id.startsWith('custom_')) {
      return resumeData.customSections?.find(c => c.id === id)?.title ?? 'Custom Section'
    }
    return SECTION_LABELS[id] ?? id
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const aId = active.id as string
    // Determine source from local arrays (more reliable than stale state)
    const src = localPrimary.includes(aId) ? 'primary' : 'secondary'

    setActiveId(null)

    if (!over || aId === over.id) return

    const oId = over.id as string
    const overInPrimary = localPrimary.includes(oId) || oId === 'primary-col'
    const overInSecondary = localSecondary.includes(oId) || oId === 'secondary-col'

    let finalPrimary = [...localPrimary]
    let finalSecondary = [...localSecondary]

    if (src === 'primary' && overInPrimary) {
      // Within primary: live reorder
      const from = localPrimary.indexOf(aId)
      const to = localPrimary.indexOf(oId)
      if (from !== -1 && to !== -1) finalPrimary = arrayMove(localPrimary, from, to)
    } else if (src === 'secondary' && overInSecondary) {
      // Within secondary: live reorder
      const from = localSecondary.indexOf(aId)
      const to = localSecondary.indexOf(oId)
      if (from !== -1 && to !== -1) finalSecondary = arrayMove(localSecondary, from, to)
    } else if (src === 'primary' && overInSecondary) {
      // Cross: primary → secondary (append to end)
      finalPrimary = localPrimary.filter(id => id !== aId)
      finalSecondary = [...localSecondary, aId]
    } else if (src === 'secondary' && overInPrimary) {
      // Cross: secondary → primary (append to end)
      finalSecondary = localSecondary.filter(id => id !== aId)
      finalPrimary = [...localPrimary, aId]
    }

    onVisibilityChange({
      ...visibility,
      sectionOrder: finalPrimary,
      sidebarSectionOrder: finalSecondary,
    })
  }

  function handleAddCustom() {
    if (!newTitle.trim()) return
    const id = `custom_${crypto.randomUUID().split('-')[0]}`
    onDataChange({
      ...resumeData,
      customSections: [
        ...(resumeData.customSections || []),
        { id, title: newTitle.trim(), type: newType, text: '', tags: [], items: [] }
      ]
    })
    onVisibilityChange({
      ...visibility,
      sectionOrder: [...localPrimary, id]
    })
    setNewTitle('')
    setNewType('complex')
    setIsAdding(false)
    onExpandSection(id)
  }

  const renderRows = (items: string[]) =>
    items.map(sectionId => (
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
    ))

  return (
    <div className="flex flex-col gap-2 p-4 pt-6 w-full pb-20">
      <div className="mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 px-4 mb-1">Editor Sections</h2>
        <p className="text-xs text-zinc-500 px-4">Refine your professional narrative</p>
      </div>

      <div className="relative">
        <nav className={`space-y-4 transition-opacity duration-200 ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}>

          {/* Contact — always fixed at top, not draggable */}
          <div className="px-1 translate-y-0.5">
            <div className={`bg-white border shadow-sm transition-all duration-200 ${
              expandedSection === 'contact'
                ? 'border-emerald-200 rounded-t-xl border-b-emerald-50'
                : 'border-dashed border-zinc-200 rounded-xl'
            } p-4 flex items-center justify-between group`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  expandedSection === 'contact' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-50 text-zinc-400 group-hover:bg-emerald-50 group-hover:text-emerald-500'
                }`}>
                  <User size={16} />
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest ${
                  expandedSection === 'contact' ? 'text-emerald-900' : 'text-zinc-600'
                }`}>Contact Info</span>
              </div>
              <button
                onClick={() => onExpandSection(expandedSection === 'contact' ? null : 'contact')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border rounded-lg transition-all active:scale-95 flex items-center gap-2 ${
                  expandedSection === 'contact'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-200'
                    : 'bg-zinc-50 text-zinc-400 border-zinc-100 hover:bg-emerald-50 hover:text-emerald-600'
                }`}
              >
                {expandedSection === 'contact' ? 'Close' : 'Edit'}
              </button>
            </div>
            {expandedSection === 'contact' && (
              <div className="bg-white border-x border-b border-emerald-200 rounded-b-xl shadow-sm animate-in slide-in-from-top-1 duration-200 overflow-hidden">
                <div className="bg-emerald-50/30">
                  <ContactEditor data={resumeData} onChange={onDataChange} />
                </div>
              </div>
            )}
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {isSidebarLayout ? (
              <div className="space-y-8 mt-4">
                {/* Secondary Column (Sidebar) */}
                <div>
                  <div className="flex items-center gap-2 px-4 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-800">Secondary Column</h3>
                  </div>
                  <SecondaryCol className="min-h-[60px] border-2 border-dashed border-zinc-100/50 rounded-2xl p-2 bg-zinc-50/30 flex flex-col gap-1.5">
                    <SortableContext items={localSecondary} strategy={verticalListSortingStrategy}>
                      {renderRows(localSecondary)}
                      {localSecondary.length === 0 && (
                        <div className="h-12 flex items-center justify-center text-[10px] font-bold text-zinc-300 uppercase tracking-widest italic">
                          Drag sections here
                        </div>
                      )}
                    </SortableContext>
                  </SecondaryCol>
                </div>

                {/* Primary Column (Body) */}
                <div>
                  <div className="flex items-center gap-2 px-4 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-800">Primary Column</h3>
                  </div>
                  <PrimaryCol className="min-h-[60px] border-2 border-dashed border-zinc-100/50 rounded-2xl p-2 bg-zinc-50/30 flex flex-col gap-1.5">
                    <SortableContext items={localPrimary} strategy={verticalListSortingStrategy}>
                      {renderRows(localPrimary)}
                      {localPrimary.length === 0 && (
                        <div className="h-12 flex items-center justify-center text-[10px] font-bold text-zinc-300 uppercase tracking-widest italic">
                          Drag sections here
                        </div>
                      )}
                    </SortableContext>
                  </PrimaryCol>
                </div>
              </div>
            ) : (
              /* Single-column: one flat list, no cross-column drag */
              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 px-4 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">All Sections</h3>
                </div>
                <SortableContext
                  items={[...localPrimary, ...localSecondary]}
                  strategy={verticalListSortingStrategy}
                >
                  {renderRows([...localPrimary, ...localSecondary])}
                </SortableContext>
              </div>
            )}

            <DragOverlay>
              {activeId ? (
                <div className="bg-white border border-emerald-300 rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3 opacity-95 cursor-grabbing">
                  <GripVertical size={16} className="text-emerald-400 shrink-0" />
                  <span className="text-sm font-semibold text-zinc-700">{getSectionLabel(activeId)}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </nav>

        {isDisabled && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
            <Loader2 size={24} className="animate-spin text-primary mb-2" />
            <span className="text-xs font-semibold text-zinc-700">AI is optimizing your resume...</span>
          </div>
        )}
      </div>

      <div className="mt-8 px-4">
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
```

- [ ] **Step 2: Verify TypeScript compiles without errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing unrelated errors).

- [ ] **Step 3: Manually test within-column reorder (sidebar layout)**

1. Open the builder on a resume with a sidebar template (e.g. Executive Classic)
2. Grab the grip handle on any section in either column
3. Drag it past another section — the other sections should visually shift out of the way
4. Release — the order should be saved and persist on page reload

- [ ] **Step 4: Manually test cross-column drag (sidebar layout)**

1. Grab a section from the Primary column
2. Drag it over to the Secondary column area and release
3. Section should appear at the **bottom** of the Secondary column
4. Drag it back — it should appear at the bottom of Primary
5. Reload the page — the new order should persist

- [ ] **Step 5: Manually test single-column layout**

1. Switch to a single-column template (e.g. Modern Minimal)
2. Reorder sections by dragging — should work as a single flat list

- [ ] **Step 6: Commit**

```bash
git add components/builder/SectionList.tsx
git commit -m "feat: rewrite drag-and-drop with simplified dnd-kit (no DroppableContainer, no onDragOver)"
```
