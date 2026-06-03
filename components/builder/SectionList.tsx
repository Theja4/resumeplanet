'use client'

import { useEffect, useState } from 'react'
import { X, List, AlignLeft, Tags, Loader2, User, GripVertical, SeparatorHorizontal, Plus, RotateCcw } from 'lucide-react'
import type { CustomSectionType } from '@/types'
import {
  DndContext, DragOverlay, closestCorners,
  KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors, useDroppable,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import type { ContactLinkToggles, ResumeData, BuilderVisibility, UniversalConfig } from '@/types'
import { DEFAULT_VISIBILITY } from '@/types'
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
  focusedFieldPath?: string | null
  onFocusedFieldHandled?: () => void
  isDisabled?: boolean
  onSectionAction?: (
    sectionType: string,
    action: 'edit' | 'reorder' | 'toggle_visibility' | 'add' | 'delete'
  ) => void
  onSubSectionEditorOpened?: (sectionType: string, subSectionId: string) => void
  // Per-field contact-link toggles (rendered as inline link buttons in
  // ContactEditor). Optional — when omitted the toggles still draw but the
  // buttons are non-functional. Builder passes them in normally.
  contactLinkToggles?: ContactLinkToggles
  onContactLinkTogglesChange?: (toggles: ContactLinkToggles) => void
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
  focusedFieldPath,
  onFocusedFieldHandled,
  isDisabled = false,
  onSectionAction,
  onSubSectionEditorOpened,
  contactLinkToggles,
  onContactLinkTogglesChange,
}: Props) {
  // Separate mouse + touch sensors. The PointerSensor's distance:5 activation
  // hijacks vertical scrolling on iPad — any 5px swipe became a drag. Splitting
  // by input type lets us use long-press for touch (250ms) and stay snappy on
  // mouse (5px distance).
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<CustomSectionType>('complex')
  const [activeId, setActiveId] = useState<string | null>(null)

  const isSidebarLayout = layout?.startsWith('sidebar')

  function getLocalOrdersFromVisibility(currentVisibility: BuilderVisibility) {
    const primary = (currentVisibility.sectionOrder || []).filter(id => id !== 'contact')
    const secondary = (currentVisibility.sidebarSectionOrder || []).filter(id => id !== 'contact')

    if (isSidebarLayout) {
      return { primary, secondary }
    }

    const seen = new Set<string>()
    const singleColumn = [...primary, ...secondary].filter(id => {
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })

    return { primary: singleColumn, secondary: [] }
  }

  // Local ordering state — mirrors props when idle, mutated during within-column drag
  const [localPrimary, setLocalPrimary] = useState<string[]>(() =>
    getLocalOrdersFromVisibility(visibility).primary
  )
  const [localSecondary, setLocalSecondary] = useState<string[]>(() =>
    getLocalOrdersFromVisibility(visibility).secondary
  )

  // Sync from props whenever not mid-drag. If a drag never ends cleanly (e.g.
  // the user releases over a non-droppable area, browser tab-switch quirk),
  // activeId can stick and freeze the section list out of sync with the
  // parent. Safety net below in useEffect-cleanup form clears activeId after
  // 5s of inactivity so the list eventually resyncs.
  useEffect(() => {
    if (!activeId) {
      const nextOrders = getLocalOrdersFromVisibility(visibility)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalPrimary(nextOrders.primary)
      setLocalSecondary(nextOrders.secondary)
    }
  }, [visibility, activeId, isSidebarLayout])

  useEffect(() => {
    if (!activeId) return
    const timeoutId = window.setTimeout(() => setActiveId(null), 5000)
    return () => window.clearTimeout(timeoutId)
  }, [activeId])

  function getSectionLabel(id: string): string {
    if (id.startsWith('custom_')) {
      return resumeData.customSections?.find(c => c.id === id)?.title ?? 'Custom Section'
    }
    return SECTION_LABELS[id] ?? id
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function getContainerForId(id: string, primary: string[], secondary: string[]): 'primary' | 'secondary' | null {
    if (id === 'primary-col') return 'primary'
    if (id === 'secondary-col') return 'secondary'
    if (primary.includes(id)) return 'primary'
    if (secondary.includes(id)) return 'secondary'
    return null
  }

  function moveAcrossColumns(
    source: 'primary' | 'secondary',
    target: 'primary' | 'secondary',
    activeSectionId: string,
    overId: string,
    primary: string[],
    secondary: string[]
  ) {
    const srcList = source === 'primary' ? primary : secondary
    const tgtList = target === 'primary' ? primary : secondary

    const from = srcList.indexOf(activeSectionId)
    if (from === -1) return { nextPrimary: primary, nextSecondary: secondary }

    const nextSrc = srcList.filter(id => id !== activeSectionId)
    const rawInsertIndex =
      overId === 'primary-col' || overId === 'secondary-col'
        ? tgtList.length
        : tgtList.indexOf(overId)
    const insertIndex = rawInsertIndex >= 0 ? rawInsertIndex : tgtList.length

    const targetWithoutActive = tgtList.filter(id => id !== activeSectionId)
    const nextTgt = [...targetWithoutActive]
    nextTgt.splice(insertIndex, 0, activeSectionId)

    return source === 'primary'
      ? { nextPrimary: nextSrc, nextSecondary: nextTgt }
      : { nextPrimary: nextTgt, nextSecondary: nextSrc }
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    if (!isSidebarLayout) return

    const aId = active.id as string
    const oId = over.id as string
    const source = getContainerForId(aId, localPrimary, localSecondary)
    const target = getContainerForId(oId, localPrimary, localSecondary)
    if (!source || !target || source === target) return

    const { nextPrimary, nextSecondary } = moveAcrossColumns(
      source,
      target,
      aId,
      oId,
      localPrimary,
      localSecondary
    )
    setLocalPrimary(nextPrimary)
    setLocalSecondary(nextSecondary)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const aId = active.id as string
    setActiveId(null)

    if (!over || aId === over.id) return

    const oId = over.id as string

    // Single-column: treat all sections as one flat list visually, but
    // preserve the underlying primary/secondary partition from the
    // persisted visibility. Without this, switching from sidebar→single-
    // column→sidebar would silently empty the sidebar permanently after the
    // first drag.
    if (!isSidebarLayout) {
      const combined = [...localPrimary, ...localSecondary]
      const from = combined.indexOf(aId)
      const to = combined.indexOf(oId)
      if (from === -1 || to === -1) return
      const reordered = arrayMove(combined, from, to)

      const persistedPrimary = new Set(
        (visibility.sectionOrder || []).filter(id => id !== 'contact')
      )
      const persistedSecondary = new Set(
        (visibility.sidebarSectionOrder || []).filter(id => id !== 'contact')
      )

      // For any id that doesn't appear in EITHER set (newly added section),
      // default it to primary so it shows up if the user later switches to
      // sidebar layout.
      const finalPrimary = reordered.filter(
        id => persistedPrimary.has(id) || !persistedSecondary.has(id)
      )
      const finalSecondary = reordered.filter(id => persistedSecondary.has(id))

      setLocalPrimary(reordered)
      setLocalSecondary([])
      onVisibilityChange({
        ...visibility,
        sectionOrder: finalPrimary,
        sidebarSectionOrder: finalSecondary,
      })
      return
    }

    const src = getContainerForId(aId, localPrimary, localSecondary)
    const dst = getContainerForId(oId, localPrimary, localSecondary)
    if (!src || !dst) return

    let finalPrimary = [...localPrimary]
    let finalSecondary = [...localSecondary]

    if (src === dst) {
      const list = src === 'primary' ? localPrimary : localSecondary
      const from = list.indexOf(aId)
      const to =
        oId === 'primary-col' || oId === 'secondary-col'
          ? list.length - 1
          : list.indexOf(oId)
      if (from !== -1 && to !== -1 && from !== to) {
        const moved = arrayMove(list, from, to)
        if (src === 'primary') finalPrimary = moved
        else finalSecondary = moved
      }
    } else {
      const moved = moveAcrossColumns(src, dst, aId, oId, localPrimary, localSecondary)
      finalPrimary = moved.nextPrimary
      finalSecondary = moved.nextSecondary
    }

    setLocalPrimary(finalPrimary)
    setLocalSecondary(finalSecondary)
    onVisibilityChange({
      ...visibility,
      sectionOrder: finalPrimary,
      sidebarSectionOrder: finalSecondary,
    })
  }

  function handleAddCustom() {
    // Page break sections don't need a title — they're invisible markers.
    if (newType !== 'pageBreak' && !newTitle.trim()) return
    const id = `custom_${crypto.randomUUID().split('-')[0]}`
    const title = newType === 'pageBreak' ? 'Page break' : newTitle.trim()
    onDataChange({
      ...resumeData,
      customSections: [
        ...(resumeData.customSections || []),
        { id, title, type: newType, text: '', tags: [], items: [] }
      ]
    })
    onVisibilityChange({
      ...visibility,
      sectionOrder: [...localPrimary, id]
    })
    setNewTitle('')
    setNewType('complex')
    setIsAdding(false)
    onSectionAction?.(id, 'add')
    if (newType !== 'pageBreak') onExpandSection(id)
  }

  function handleResetOrder() {
    const customIds = Array.from(new Set([
      ...localPrimary,
      ...localSecondary,
    ])).filter(id => id.startsWith('custom_'))

    const finalPrimary = [...DEFAULT_VISIBILITY.sectionOrder, ...customIds]
    const finalSecondary = [...(DEFAULT_VISIBILITY.sidebarSectionOrder ?? [])]

    setLocalPrimary(finalPrimary)
    setLocalSecondary(finalSecondary)
    onVisibilityChange({
      ...visibility,
      sectionOrder: finalPrimary,
      sidebarSectionOrder: finalSecondary,
    })
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
        focusPath={focusedFieldPath}
        onFocusHandled={onFocusedFieldHandled}
        onSectionAction={onSectionAction}
        onSubSectionEditorOpened={onSubSectionEditorOpened}
      />
    ))

  return (
    <div className="flex min-h-full w-full flex-col gap-2 bg-[radial-gradient(circle_at_18%_0%,rgba(16,185,129,0.09),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.82),rgba(247,249,248,0.92))] p-4 pt-5 pb-20">
      <div className="mb-4 rounded-[1.35rem] border border-white/80 bg-white/80 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.9)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
                Builder
              </span>
            </div>
            <h2 className="text-[1.15rem] font-black leading-tight tracking-tight text-zinc-900">Editor Sections</h2>
            <p className="mt-1 text-[13px] leading-snug text-zinc-500">Refine your professional narrative</p>
          </div>
          <button
            onClick={handleResetOrder}
            disabled={isDisabled}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-zinc-200/80 bg-white px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
      </div>

      <div className="relative">
        <nav className={`space-y-4 transition-opacity duration-200 ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}>

          {/* Contact — always fixed at top, not draggable */}
          <div className="px-1">
            <div className={`group relative overflow-hidden border bg-white/95 shadow-[0_18px_40px_rgba(15,23,42,0.07)] transition-all duration-200 ${
              expandedSection === 'contact'
                ? 'rounded-t-[1.35rem] border-emerald-200 border-b-emerald-50'
                : 'rounded-[1.35rem] border-zinc-200/80 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_22px_50px_rgba(16,185,129,0.12)]'
            } p-4`}>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                    expandedSection === 'contact' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500 group-hover:bg-emerald-50 group-hover:text-emerald-600'
                  }`}>
                    <User size={19} />
                  </div>
                  <div className="min-w-0">
                    <span className={`block truncate text-[13px] font-black uppercase tracking-[0.18em] ${
                      expandedSection === 'contact' ? 'text-emerald-950' : 'text-zinc-700'
                    }`}>Contact Info</span>
                    <span className="mt-1 block text-xs font-medium text-zinc-400">Name, role, links, location</span>
                  </div>
                </div>
                <button
                  onClick={() => onExpandSection(expandedSection === 'contact' ? null : 'contact')}
                  className={`inline-flex shrink-0 items-center justify-center rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition-all active:scale-95 ${
                    expandedSection === 'contact'
                      ? 'bg-emerald-600 text-white shadow-[0_12px_24px_rgba(5,150,105,0.26)]'
                      : 'border border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  {expandedSection === 'contact' ? 'Close' : 'Edit'}
                </button>
              </div>
            </div>
            {expandedSection === 'contact' && (
              <div className="overflow-hidden rounded-b-[1.35rem] border-x border-b border-emerald-200 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.08)] animate-in slide-in-from-top-1 duration-200">
                <div className="bg-gradient-to-b from-emerald-50/70 to-white">
                  <ContactEditor
                    data={resumeData}
                    onChange={onDataChange}
                    focusPath={focusedFieldPath}
                    onFocusHandled={onFocusedFieldHandled}
                    contactLinkToggles={contactLinkToggles}
                    onContactLinkTogglesChange={onContactLinkTogglesChange}
                  />
                </div>
              </div>
            )}
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            {isSidebarLayout ? (
              <div className="mt-5 space-y-7">
                {/* Primary Column (Body) */}
                <div>
                  <div className="mb-3 flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.55)]" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700">Primary Column</h3>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-zinc-400 shadow-sm">
                      {localPrimary.length}
                    </span>
                  </div>
                  <PrimaryCol className="flex min-h-[70px] flex-col gap-2 rounded-[1.35rem] border border-dashed border-indigo-100/80 bg-white/50 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <SortableContext items={localPrimary} strategy={verticalListSortingStrategy}>
                      {renderRows(localPrimary)}
                      {localPrimary.length === 0 && (
                        <div className="flex h-14 items-center justify-center rounded-2xl bg-white/70 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-300">
                          Drag sections here
                        </div>
                      )}
                    </SortableContext>
                  </PrimaryCol>
                </div>

                {/* Secondary Column (Sidebar) */}
                <div>
                  <div className="mb-3 flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700">Secondary Column</h3>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-zinc-400 shadow-sm">
                      {localSecondary.length}
                    </span>
                  </div>
                  <SecondaryCol className="flex min-h-[70px] flex-col gap-2 rounded-[1.35rem] border border-dashed border-emerald-100/90 bg-white/50 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <SortableContext items={localSecondary} strategy={verticalListSortingStrategy}>
                      {renderRows(localSecondary)}
                      {localSecondary.length === 0 && (
                        <div className="flex h-14 items-center justify-center rounded-2xl bg-white/70 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-300">
                          Drag sections here
                        </div>
                      )}
                    </SortableContext>
                  </SecondaryCol>
                </div>
              </div>
            ) : (
              /* Single-column: one flat list, no cross-column drag */
              <div className="mt-5 space-y-2">
                <div className="mb-2 flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.65)]" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">All Sections</h3>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-zinc-400 shadow-sm">
                    {localPrimary.length + localSecondary.length}
                  </span>
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
                <div className="flex cursor-grabbing items-center gap-3 rounded-[1.15rem] border border-emerald-300 bg-white/95 px-4 py-3 opacity-95 shadow-[0_24px_60px_rgba(15,23,42,0.22)] backdrop-blur">
                  <GripVertical size={16} className="text-emerald-400 shrink-0" />
                  <span className="text-sm font-semibold text-zinc-700">{getSectionLabel(activeId)}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </nav>

        {isDisabled && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-[1.35rem] bg-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.8)] backdrop-blur-md">
            <Loader2 size={24} className="animate-spin text-primary mb-2" />
            <span className="text-xs font-semibold text-zinc-700">AI is optimizing your resume...</span>
          </div>
        )}
      </div>

      <div className="mt-7 px-1">
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="group flex w-full items-center justify-center gap-2 rounded-[1.15rem] border border-dashed border-emerald-200 bg-white/65 py-4 text-xs font-black uppercase tracking-[0.16em] text-emerald-700 shadow-[0_14px_32px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 active:translate-y-0 active:scale-[0.98]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                <Plus size={15} strokeWidth={2.5} />
              </span>
              Add Custom Section
          </button>
        ) : (
          <div className="rounded-[1.35rem] border border-emerald-100 bg-white p-4 shadow-[0_20px_45px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-600">New Section</span>
              <button onClick={() => setIsAdding(false)} className="rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600">
                <X size={16} />
              </button>
            </div>
            {newType !== 'pageBreak' && (
              <input
                type="text"
                autoFocus
                placeholder="E.g. Leadership, Memberships..."
                value={newTitle}
                maxLength={80}
                onChange={(e) => setNewTitle(e.target.value)}
                className="mb-3 w-full rounded-xl border-zinc-200 px-3.5 py-2.5 text-sm font-medium shadow-sm placeholder:font-normal focus:border-emerald-500 focus:ring-emerald-500"
              />
            )}
            <div className="flex flex-col gap-2 mb-4">
              <button
                onClick={() => setNewType('complex')}
                className={`flex gap-3 rounded-xl border p-3 text-left transition-all ${newType === 'complex' ? 'border-emerald-400 bg-emerald-50 text-emerald-950 shadow-sm' : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'}`}
              >
                <List size={18} className={`shrink-0 ${newType === 'complex' ? 'text-emerald-500' : 'text-zinc-400'}`} />
                <div>
                  <div className="text-xs font-bold">List (Detailed)</div>
                  <div className="text-[10px] text-zinc-500">Like Work Experience — Title, Subtitle, Dates, Bullets</div>
                </div>
              </button>
              <button
                onClick={() => setNewType('tags')}
                className={`flex gap-3 rounded-xl border p-3 text-left transition-all ${newType === 'tags' ? 'border-emerald-400 bg-emerald-50 text-emerald-950 shadow-sm' : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'}`}
              >
                <Tags size={18} className={`shrink-0 ${newType === 'tags' ? 'text-emerald-500' : 'text-zinc-400'}`} />
                <div>
                  <div className="text-xs font-bold">Tags</div>
                  <div className="text-[10px] text-zinc-500">Like Skills — Comma separated items</div>
                </div>
              </button>
              <button
                onClick={() => setNewType('text')}
                className={`flex gap-3 rounded-xl border p-3 text-left transition-all ${newType === 'text' ? 'border-emerald-400 bg-emerald-50 text-emerald-950 shadow-sm' : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'}`}
              >
                <AlignLeft size={18} className={`shrink-0 ${newType === 'text' ? 'text-emerald-500' : 'text-zinc-400'}`} />
                <div>
                  <div className="text-xs font-bold">Text Block</div>
                  <div className="text-[10px] text-zinc-500">Like Summary — Paragraph of custom text</div>
                </div>
              </button>
              <button
                onClick={() => setNewType('pageBreak')}
                className={`flex gap-3 rounded-xl border p-3 text-left transition-all ${newType === 'pageBreak' ? 'border-emerald-400 bg-emerald-50 text-emerald-950 shadow-sm' : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'}`}
              >
                <SeparatorHorizontal size={18} className={`shrink-0 ${newType === 'pageBreak' ? 'text-emerald-500' : 'text-zinc-400'}`} />
                <div>
                  <div className="text-xs font-bold">Page Break</div>
                  <div className="text-[10px] text-zinc-500">Force content after this point onto a new page</div>
                </div>
              </button>
            </div>
            <button
              onClick={handleAddCustom}
              disabled={newType !== 'pageBreak' && !newTitle.trim()}
              className="w-full rounded-xl bg-primary py-3 text-xs font-black uppercase tracking-[0.14em] text-white shadow-[0_12px_24px_rgba(5,150,105,0.22)] transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {newType === 'pageBreak' ? 'Insert Page Break' : 'Construct Section'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
