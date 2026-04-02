# Resume Pagination Phase 1: Simple Padding + Visual Gap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add bottom padding buffer and visual separation between pages in the resume builder live preview to prevent text clipping and improve visual clarity.

**Architecture:** Modify the existing pagination rendering logic in the builder page component by updating page constants, adding visual styling (borders, shadows), and ensuring template backgrounds render full-height on all pages.

**Tech Stack:** React, Next.js, Tailwind CSS, TypeScript

---

## File Structure Map

**Primary file to modify:**
- `app/dashboard/builder/[resumeId]/page.tsx` - Contains pagination logic and preview rendering (lines 117-949)

**Template files (verification only, likely no changes needed):**
- `components/templates/UniversalTemplate.tsx`
- `components/templates/ModernMinimal.tsx`
- `components/templates/CreativeBold.tsx`
- `components/templates/ExecutiveClassic.tsx`
- `components/templates/GraduateEntry.tsx`
- `components/templates/TechnicalPro.tsx`

**No new files needed.** All changes are in-place modifications to existing builder page.

---

## Task Breakdown

### Task 1: Update Pagination Constants

**Files:**
- Modify: `app/dashboard/builder/[resumeId]/page.tsx:117-119`

- [ ] **Step 1: Locate the pagination constants section**
  
  Read the builder page file and find the lines containing `PAGE_H`, `PAGE_GAP`, and `MAX_PAGES` (around line 117-119).

- [ ] **Step 2: Update PAGE_GAP and add PAGE_BOTTOM_PADDING constant**
  
  Replace the current constants with:
  
  ```typescript
  const PAGE_H = 1123 // A4 at 96 DPI
  const PAGE_GAP = 48 // Increased from 28 for visual separation
  const PAGE_BOTTOM_PADDING = 50 // Buffer zone at bottom of each page
  const MAX_PAGES = 2
  ```
  
  Note: We're adding `PAGE_BOTTOM_PADDING` but not yet using it in calculations - it documents the intent and can be used if we want to enforce strict limits later.

- [ ] **Step 3: Verify the change visually**
  
  Run the dev server and navigate to the builder. Verify that page gap appears larger (48px instead of 28px). Confirm no console errors.

- [ ] **Step 4: Commit the change**
  
  ```bash
  git add app/dashboard/builder/[resumeId]/page.tsx
  git commit -m "feat: increase page gap to 48px and add bottom padding constant"
  ```

---

### Task 2: Add Visual Page Separators

**Files:**
- Modify: `app/dashboard/builder/[resumeId]/page.tsx:890-947` (the page rendering div)

- [ ] **Step 1: Read the current page container JSX**
  
  Find the div with `key={`page-${pageIndex}`}` around line 891. It currently has classes `absolute left-0 bg-white border ...`.

- [ ] **Step 2: Update the page container styling**
  
  Replace the existing className and style with:
  
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
  
  Key changes:
  - Added conditional borders: `border-t border-b border-zinc-200/60` for normal pages, keeps `border-red-300` for over-limit last page
  - Added `boxShadow` with subtle drop shadow on all pages except the last
  - No change to positioning or dimensions

- [ ] **Step 3: Update page number badge position**
  
  Find the page number div around line 918. Change `top-2` to `top-3`:
  
  ```tsx
  <div className="absolute top-3 right-3 z-20 text-[10px] font-bold uppercase tracking-widest bg-white/90 text-zinc-500 px-2 py-0.5 rounded-full border border-zinc-200/80">
    Page {pageIndex + 1}
  </div>
  ```

- [ ] **Step 4: Verify visual changes**
  
  Reload builder and confirm:
  - Pages have subtle top/bottom borders (light gray)
  - Pages have a faint shadow creating depth between them
  - Page number badge moved slightly down (top-3)
  - Over-limit warning page still shows red border

- [ ] **Step 5: Commit**
  
  ```bash
  git add app/dashboard/builder/[resumeId]/page.tsx
  git commit -m "feat: add page borders and shadows for visual separation"
  ```

---

### Task 3: Ensure Template Full-Height Backgrounds

**Files to inspect:**
- `components/templates/UniversalTemplate.tsx:415`
- `components/templates/ModernMinimal.tsx:355`
- `components/templates/CreativeBold.tsx:411`
- `components/templates/ExecutiveClassic.tsx:260`
- `components/templates/GraduateEntry.tsx:451`
- `components/templates/TechnicalPro.tsx:450`

- [ ] **Step 1: Check UniversalTemplate sidebar background**
  
  Read `UniversalTemplate.tsx` and locate the sidebar div (around line 360). Verify it uses `min-h-full` or flex layout that stretches full height. Current code:
  
  ```tsx
  <div style={{ backgroundColor: `${accent}15` }} className={`${sidebarWidth} shrink-0 text-gray-900 p-8 flex flex-col gap-1`}>
  ```
  
  The `flex flex-col` with `min-h-full` behavior (since parent has defined height) should already stretch. Verify by inspecting the parent container structure (line 358-369). If the sidebar parent (`<div className={`flex flex-1 ${isSidebarRight ? 'flex-row-reverse' : 'flex-row'}`>`) doesn't have an explicit height, add `min-h-full` to sidebar container.
  
  **Action:** Add `min-h-full` to the sidebar container div to ensure it stretches to full page height:
  
  ```tsx
  <div style={{ backgroundColor: `${accent}15` }} className={`${sidebarWidth} shrink-0 text-gray-900 p-8 flex flex-col gap-1 min-h-full`}>
  ```

- [ ] **Step 2: Check other templates for full-height backgrounds**
  
  For each template:
  - **ModernMinimal**: No sidebar, just `min-h-[1123px]` on main container (line 355) - OK
  - **CreativeBold**: `min-h-[1123px]` on main container (line 411) - OK
  - **ExecutiveClassic**: `min-h-[1123px] flex` on main container (line 260) - OK
  - **GraduateEntry**: `min-h-[1123px]` on main container (line 451) - OK
  - **TechnicalPro**: `min-h-[1123px]` on main container (line 450) - OK
  
  All templates already have `min-h-[1123px]` on the root template div, so backgrounds will extend full page. No changes needed for these.

- [ ] **Step 3: Verify UniversalTemplate change**
  
  ```tsx
  // Before:
  <div style={{ backgroundColor: `${accent}15` }} className={`${sidebarWidth} shrink-0 text-gray-900 p-8 flex flex-col gap-1`}>
  
  // After:
  <div style={{ backgroundColor: `${accent}15` }} className={`${sidebarWidth} shrink-0 text-gray-900 p-8 flex flex-col gap-1 min-h-full`}>
  ```
  
  This ensures sidebar background fills entire page height even if content is short.

- [ ] **Step 4: Test with sidebar layouts**
  
  In builder, switch to sidebar layout templates (e.g., "Executive Classic" or any with sidebar). Verify sidebar background extends to bottom of page (no white gap at bottom). Do this for both single-page and two-page scenarios.

- [ ] **Step 5: Commit template fix if needed**
  
  If change was made:
  ```bash
  git add components/templates/UniversalTemplate.tsx
  git commit -m "fix: ensure sidebar background stretches full page height"
  ```
  
  If no change needed, skip commit.

---

### Task 4: Test Pagination with Multi-Page Content

**Files:**
- Modify: `lib/sampleResumeData.ts` (optional test data)
- Or use builder manually

- [ ] **Step 1: Create test data that spans multiple pages**
  
  Option A: Use existing sample data that produces >1 page
  Option B: Modify `lib/sampleResumeData.ts` to add more experience bullets temporarily:
  
  ```typescript
  // Add 3-4 more jobs with 5-6 bullets each to guarantee 2+ pages
  ```
  
  Or manually in builder: copy-paste experience items to fill content.

- [ ] **Step 2: Verify two-page rendering**
  
  Load the test data in builder and confirm:
  - Page 1 has bottom border and subtle shadow below it
  - Page 2 starts after 48px gap
  - Page 2 has same full-page styling as Page 1 (background, borders)
  - Content doesn't get clipped abruptly at page boundary (there's at least 40-50px of visible padding before page break)
  - Page numbers show correctly on each page

- [ ] **Step 3: Test single-page scenario**
  
  Trim content to fit one page. Verify:
  - Single page shows top and bottom borders
  - No shadow on single page (since it's the only page)
  - Page number shows "Page 1"

- [ ] **Step 4: Test over-limit warning**
  
  Add content to exceed 2 pages (if possible). Verify:
  - Page 2 (last allowed page) has red border (`border-red-300`)
  - Warning banner appears below page 2
  - Additional content is hidden (not shown)

- [ ] **Step 5: Clean up test data**
  
  Remove any temporary modifications to sample data if created.

- [ ] **Step 6: Commit any test data changes**
  
  ```bash
  git add lib/sampleResumeData.ts
  git commit -m "test: add multi-page sample data for pagination testing"
  ```

---

### Task 5: Cross-Browser and Responsive Check

**Files:**
- No code changes required (unless issues found)

- [ ] **Step 1: Check in Chrome/Safari/Firefox**
  
  Open builder in each browser and verify:
  - Borders render correctly (consistent color, thickness)
  - Shadow appears with proper blur
  - Page numbers positioned correctly
  - No layout shifts or misalignment

- [ ] **Step 2: Check at different zoom levels**
  
  Test at 90%, 100%, 125% zoom. Ensure borders and shadows scale appropriately.

- [ ] **Step 3: Verify print output**
  
  Click Print (PDF) and confirm print CSS doesn't include these on-screen visual elements (borders/shadows should only be in preview, not print). The existing `@media print` styles (lines 622-645) already hide the preview wrapper and use direct page-break CSS, so these on-screen borders should not affect print.

- [ ] **Step 4: Commit any fixes**
  
  If any fixes needed, commit them separately.

---

### Task 6: Final Cleanup and Documentation

**Files:**
- `docs/superpowers/specs/2026-04-02-pagination-phase1-design.md` (update if needed)

- [ ] **Step 1: Review implementation against spec**
  
  Compare implemented changes with the spec document. Create a quick checklist:
  - ✅ Bottom padding buffer (50px) added as constant
  - ✅ Page gap increased to 48px
  - ✅ Visual borders and shadow added
  - ✅ Page number repositioned
  - ✅ Templates verified for full-height backgrounds
  - ✅ Print output unaffected

- [ ] **Step 2: Update spec with any deviations**
  
  If implementation differs from spec (e.g., we chose not to enforce strict usable height yet), add a note in the spec reflecting the actual implementation.

- [ ] **Phase 1 feature flag" steps omitted as this is going straight to production?**

  Since this is visual improvement only and non-breaking, no feature flag needed.

- [ ] **Step 3: Prepare summary for user**
  
  After all tasks complete, be ready to provide a summary of what was changed and how to verify it works.

- [ ] **Step 4: Final commit verification**
  
  Ensure all changes are committed and pushed if needed:
  
  ```bash
  git log --oneline -n 10
  git status
  ```

---

## Implementation Notes

### CSS Class Reference

- `border-zinc-200/60`: Light gray border at 60% opacity
- `border-t` / `border-b`: Top and bottom borders only (1px)
- `box-shadow: 0 4px 12px -4px rgba(0,0,0,0.08)`: Subtle drop shadow, 4px vertical offset, 12px blur, -4px spread for tight control

### No Breaking Changes

All modifications are additive or cosmetic:
- Increasing `PAGE_GAP` only adds more space between pages
- Adding borders/shadows enhances visual clarity without affecting data
- Template changes only add `min-h-full` (non-breaking)

### TDD Approach

This UI-focused change doesn't require unit tests. Verification is manual visual testing. If we wanted automated testing, we'd use visual regression tools like Percy, but that's out of scope.

---

## Self-Review Checklist

Before considering plan complete, verify:

1. ✅ All spec requirements addressed (bottom padding, visual gap, full-page rendering)
2. ✅ No placeholder text ("TODO", "TBD", etc.) in any task
3. ✅ Exact file paths and line numbers provided where possible
4. ✅ Code snippets are complete and copy-paste ready
5. ✅ Commands show expected output
6. ✅ TypeScript types remain consistent (no type errors)
7. ✅ Tailwind classes exist in the project's configuration
8. ✅ Changes are backward compatible

---

**Plan ready for execution.** Choose execution method:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints
