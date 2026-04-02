# Drag & Drop Rewrite Design
Date: 2026-04-02

## Problem
The current multi-column drag-and-drop in `SectionList.tsx` is clunky:
- Cross-column drags don't register or snap to wrong positions
- `onDragOver` logic conflicts with `SortableContext` internal state
- `DroppableContainer` adds a second droppable layer that confuses collision detection

## Chosen Approach: Simplified dnd-kit (Option C)

Keep `@dnd-kit/core` and `@dnd-kit/sortable`. Remove all complexity.

### Core rules
1. **Within-column reorder**: live visual shifting via `useSortable` CSS transforms. `arrayMove` on `dragEnd`.
2. **Cross-column drop**: item always lands at the **end** of the target column. No `onDragOver`. No live cross-column animation.
3. **No `DroppableContainer`** / `useDroppable` at all.
4. **`DragOverlay`** renders a ghost card that follows the cursor.
5. Original item is hidden (opacity 0) while its `id === activeId`.

---

## State (inside `SectionList`)

| State | Type | Purpose |
|-------|------|---------|
| `activeId` | `string \| null` | ID of item being dragged |
| `activeSrc` | `'primary' \| 'secondary' \| null` | Which list the drag started from |
| `localPrimary` | `string[]` | Local copy of primary order — mutated during within-column drag |
| `localSecondary` | `string[]` | Local copy of secondary order — mutated during within-column drag |

Local arrays are initialised from props. They sync back to props via `useEffect` **only when `activeId` is null** (idle). During a drag, they act as working state.

---

## Event Handlers

### `onDragStart({ active })`
```
activeId = active.id
activeSrc = localPrimary.includes(active.id) ? 'primary' : 'secondary'
```

### `onDragEnd({ active, over })`

```
if (!over || active.id === over.id) → reset activeId/activeSrc, return

aId = active.id
oId = over.id

overInPrimary   = localPrimary.includes(oId)   || oId === 'primary-col'
overInSecondary = localSecondary.includes(oId) || oId === 'secondary-col'

CASE 1 — same column reorder:
  activeSrc === 'primary'   && overInPrimary   → arrayMove(localPrimary,   from, to)
  activeSrc === 'secondary' && overInSecondary → arrayMove(localSecondary, from, to)

CASE 2 — cross-column (lands at end):
  activeSrc === 'primary'   && overInSecondary → remove from primary, push to secondary
  activeSrc === 'secondary' && overInPrimary   → remove from secondary, push to primary

commit finalPrimary + finalSecondary to parent via onVisibilityChange
reset activeId, activeSrc
```

### No `onDragOver`
Cross-column drops don't animate live. The `DragOverlay` ghost card is the only visual feedback during cross-column drag.

---

## Collision Detection

Use **`rectIntersection`** (simpler than `closestCenter`, no custom logic needed). For a two-column layout with large droppable zones this works well — the cursor rect overlaps whichever column it's physically inside.

Sensor: `PointerSensor` with `activationConstraint: { distance: 5 }` to prevent accidental drags on click.

---

## Components

### `SectionList.tsx` (full rewrite)
- Owns all drag state
- Renders two `SortableContext`s (one per column) inside one `DndContext`
- Each `SortableContext` gets `items={localPrimary}` / `items={localSecondary}`
- Uses `verticalListSortingStrategy`
- Renders `DragOverlay` with a simple label pill

### `SortableSectionRow.tsx` (minor change)
- Accept `isDragging: boolean` prop
- When `isDragging`, set `opacity: 0` on root div (the DragOverlay takes visual ownership)

### `DroppableContainer.tsx` (deleted)
- No longer needed

---

## Data flow

```
props: visibility.sectionOrder / sidebarSectionOrder
       ↓
localPrimary / localSecondary (initialised + idle-synced from props)
       ↓
SortableContext items={localPrimary / localSecondary}
       ↓
onDragEnd → arrayMove or cross-column swap → onVisibilityChange(finalArrays)
       ↓
parent updates visibility → props flow back down → idle-sync kicks in
```

---

## What is NOT changing
- `SortableSectionRow` editor content, expand/collapse, visibility toggle, delete
- `ContactEditor` fixed-at-top behaviour
- Single-column (non-sidebar) layout — all sections in one flat `SortableContext`
- The `handleAddCustom` flow

---

## Files touched
1. `components/builder/SectionList.tsx` — full rewrite
2. `components/builder/SortableSectionRow.tsx` — add `isDragging` prop, set opacity 0
3. `components/builder/DroppableContainer.tsx` — delete
