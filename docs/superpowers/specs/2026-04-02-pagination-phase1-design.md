---
name: Resume Pagination Improvements - Phase 1
description: Add bottom padding buffer and visual separation between pages in resume builder preview
type: project
---

# Resume Pagination: Simple Padding + Visual Gap

**Date:** 2026-04-02  
**Status:** Approved for Implementation  
**Phase:** 1 of 2 (simple approach first)

## Problem Statement

The resume builder's live preview currently exhibits three issues:

1. **Text clipping at page boundaries** - Content that overflows to the second page gets clipped exactly at the page break with no bottom padding buffer
2. **No visual separation** - Pages appear as a continuous stream; lacks the familiar MS Word/PDF page gap visual
3. **Inconsistent full-page rendering** - Page backgrounds and styling should extend to the bottom of each page uniformly

## Current Implementation

- **Page dimensions**: 794px × 1123px (A4 at 96 DPI)
- **Page gap**: 28px (`PAGE_GAP`)
- **Templates**: All templates use `min-h-[1123px]` without explicit bottom padding
- **Rendering**: Pages rendered as absolutely positioned divs with `transform: translateY` clipping
- **Code location**: `app/dashboard/builder/[resumeId]/page.tsx` lines 117-949

## Proposed Solution (Phase 1)

### 1. Add Bottom Padding Buffer

Introduce a configurable bottom padding constant to create a "safe zone" at the bottom of each page:

```ts
const PAGE_BOTTOM_PADDING = 50 // pixels - content should not approach this close to bottom
const USABLE_PAGE_HEIGHT = PAGE_H - PAGE_BOTTOM_PADDING
```

The buffer serves two purposes:
- Provides visual breathing room (content never touches page bottom)
- Encourages content to flow to next page before reaching the absolute bottom

### 2. Increase Visual Page Gap

Increase `PAGE_GAP` from 28px to **48px** to create clear visual separation between pages:

```ts
const PAGE_GAP = 48 // increased from 28
```

### 3. Add Page Separator Styling

Add a subtle visual separator between pages in the preview:

```tsx
<div
  key={`page-${pageIndex}`}
  className={`absolute left-0 bg-white ${
    isOverPageLimit && pageIndex === MAX_PAGES - 1 
      ? 'border-red-300' 
      : 'border-t border-b border-zinc-200/60'
  }`}
  style={{
    top: pageIndex * (PAGE_H + PAGE_GAP),
    width: '794px',
    height: `${PAGE_H}px`,
    boxShadow: pageIndex < renderedPageCount - 1 ? '0 4px 12px -4px rgba(0,0,0,0.08)' : 'none',
  }}
>
```

- **Top border**: 1px solid `zinc-200/60` (light gray) on all pages
- **Bottom border**: 1px solid `zinc-200/60` on all pages
- **Box shadow**: Subtle drop shadow on all pages except the last, to create depth
- The gap itself remains transparent, showing the background through

### 4. Adjust Page Number Position

Move page number badge slightly away from edge to respect the visual separation:

```tsx
<div className="absolute top-3 right-3 z-20 ...">
  Page {pageIndex + 1}
</div>
```

### 5. Template Background Consistency

Review templates to ensure backgrounds extend full page height. Already mostly correct:
- All templates wrap in `min-h-[1123px]` containers
- Sidebar layouts need sidebar background to use `min-h-full` instead of content-limited height

**Verification needed:**
- `UniversalTemplate.tsx`: Sidebar background uses `className="flex flex-col"` - check if it stretches full height
- `ModernMinimal.tsx`: No sidebar, just content padding
- Other templates (CreativeBold, ExecutiveClassic, etc.): Similar structure

Most templates already use flex layout that stretches, but verify sidebar fills properly.

## Implementation Checklist

- [ ] Update constants in builder page: `PAGE_GAP = 48`, add `PAGE_BOTTOM_PADDING = 50`
- [ ] Adjust page rendering logic if needed (usable height concept may not require code change yet, just documentation)
- [ ] Add visual page separators (border-t, border-b, box-shadow)
- [ ] Adjust page number positioning (top-3 instead of top-2)
- [ ] Verify all templates render full-page backgrounds correctly
- [ ] Test with sample data that spans multiple pages
- [ ] Ensure content doesn't get clipped at page boundaries

## Out of Scope for Phase 1

- Manual page break controls (Phase 2)
- Smart section-aware pagination (Phase 2)
- Configurable bottom padding (user setting) - fixed at 50px for now

## Success Criteria

1. ✅ Text no longer clipped exactly at page bottom - at least 40px padding visible
2. ✅ Clear visual gap (48px) between pages with subtle borders and shadow
3. ✅ Page 2 renders with same full-page styling as page 1
4. ✅ No regression in existing pagination behavior
5. ✅ Preview matches print output (print CSS already handles page breaks)

## Technical Notes

The current `pageCount` calculation uses `Math.ceil(resumeHeight / PAGE_H)`. With bottom padding buffer, the effective usable height per page becomes `USABLE_PAGE_HEIGHT`. However, we may not need to change the calculation yet since:

- The buffer is a visual/UX improvement, not a hard constraint
- Content can still technically overflow the buffer if it's exactly that height; the benefit is the padding exists
- `min-h-[1123px]` on templates ensures each page request at least one full page height
- The buffer is small (50px) relative to total page height (1123px)

If we wanted strict enforcement (never let content approach within 50px of bottom), we'd need to:

1. Measure content height after render
2. Compare against `USABLE_PAGE_HEIGHT`
3. Force additional page if `contentHeight > USABLE_PAGE_HEIGHT`

But for Phase 1, we'll rely on the existing structure where pages are simply clipped at boundaries, with the buffer zone providing visual padding on the rendered page background.

## Future Enhancements (Phase 2)

- Manual page break dragging in SectionList
- Section-aware pagination (avoid mid-section breaks)
- Configurable buffer size in builder settings
- Page break indicators in preview (dotted lines)
