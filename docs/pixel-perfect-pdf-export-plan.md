# Pixel-Perfect PDF Export Plan

## Goal

Make PDF export look almost identical to the on-screen resume preview without converting the resume into an image.

## Current Limitation

The app currently uses a separate `jsPDF` renderer in `lib/generatedResumePdf.jsx`.

That means preview and export use two different layout engines:

- Preview: React + HTML + CSS
- Export: manual PDF drawing with `jsPDF`

As a result, these will keep drifting:

- line wrapping
- text metrics
- spacing
- date alignment
- section dividers
- page breaks

## Recommended Architecture

Use the **same HTML/CSS template** for both preview and PDF generation.

### Target approach

1. Create a dedicated print route, for example:
   - `/resume/print/[id]`

2. Render the same resume template component used in preview:
   - same content
   - same section ordering
   - same typography/config
   - same spacing system

3. Add print-specific CSS only for:
   - page size
   - margins
   - page breaks
   - print-safe color handling

4. Generate the PDF from that page using a browser-grade print engine:
   - preferred: Playwright / Chromium on the server

## Why This Works

A real browser print engine understands the same layout rules the preview uses:

- flex
- grid
- font metrics
- wrapping
- margins
- borders
- print media rules

This gets export much closer to the preview than a custom `jsPDF` drawing layer ever will.

## Best Options

### Option 1: Server-side HTML to PDF

Best quality and most consistent.

- Build a print page route
- Use Playwright to open that page
- Export `page.pdf()`

Pros:

- highest fidelity
- consistent output
- best control

Cons:

- uses server compute
- more infrastructure than client-only export

### Option 2: Browser print on the real print page

Use `window.print()` from a print-optimized route.

Pros:

- simpler
- no server PDF generation required

Cons:

- depends on browser/user environment
- less consistent than Playwright

### Option 3: Keep `jsPDF`

Not recommended if the goal is visual parity.

Pros:

- fully custom
- no browser print dependency

Cons:

- hard to keep aligned with preview
- expensive to maintain
- always at risk of layout drift

## Recommended Implementation Steps

1. Create a print-only page route:
   - `app/resume/print/[resumeId]/page.tsx`

2. Reuse the existing template component there:
   - pass the same `resumeData`
   - pass the same template config
   - render in a print-safe shell

3. Add print CSS:
   - `@page`
   - page-break rules for sections/items
   - fixed paper width
   - remove editor-only affordances

4. Add a server PDF endpoint:
   - open the print URL with Playwright
   - wait for fonts/content
   - call `page.pdf(...)`

5. Keep the current `jsPDF` path only as fallback if needed.

## Important Constraints

- Do not rasterize the page into an image.
- Keep text selectable in the PDF.
- Preserve links when possible.
- Use the same fonts/styles as preview.

## Practical Recommendation

If the goal is “almost pixel perfect,” the project should gradually move away from `lib/generatedResumePdf.jsx` as the primary export path and replace it with:

- shared HTML template
- print route
- Chromium PDF generation

That is the cleanest long-term architecture.
