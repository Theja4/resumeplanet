# Metadata Enhancer: Move PDF Patching to Client Side

## Goal

Reduce Vercel compute usage for the Metadata Enhancer by moving the PDF metadata patch/download step from the server to the browser, while keeping the LLM audit on the server.

## Current Architecture

### Server-side audit

`app/api/resume/metadata-audit/route.ts`

- Authenticates the user with Supabase
- Checks Pro access
- Applies rate limits
- For uploaded PDFs:
  - extracts text with `lib/pdfExtractor.ts`
  - extracts PDF metadata with `lib/pdfExtractor.ts`
- For saved resumes:
  - reads resume text from `public.resumes`
- Sends the audit prompt to the LLM through `lib/claude.ts`
- Returns structured metadata suggestions

This part should remain server-side because it depends on:

- protected API keys
- auth/pro enforcement
- rate limiting
- provider-side LLM calls

### Server-side patching

`app/api/resume/metadata-patch/route.ts`

- Receives uploaded PDF + suggested fixes
- Loads the PDF with `pdf-lib`
- Applies:
  - `setTitle`
  - `setAuthor`
  - `setSubject`
  - `setKeywords`
  - `setCreator`
  - `setLanguage`
- Returns a patched PDF download

This is the part we want to move to the client.

## Why Move Patching Client-side

The patching step is lightweight compared with the audit step.

It only:

- loads PDF bytes
- changes a few metadata fields
- re-saves the PDF

This is suitable for browser execution for normal resume PDFs and should not create major performance issues for typical 1-3 page files.

## Proposed Future Architecture

### Keep on server

- `metadata-audit` route
- PDF text extraction
- metadata extraction for audit
- all LLM calls
- auth/pro/rate limit logic

### Move to client

Inside:

`app/dashboard/(shell)/metadata-enhancer/MetadataEnhancerClient.tsx`

Replace the current download flow with client-side patching:

1. Keep `auditResult.fields`
2. Build the `fixes` object in the client
3. Load the uploaded PDF in the browser with `pdf-lib`
4. Apply metadata fields directly in the browser
5. Save bytes client-side
6. Trigger local file download

## Implementation Plan

### 1. Patch inside the client component

Current function:

- `handleDownload()` posts to `/api/resume/metadata-patch`

Future behavior:

- dynamic import `pdf-lib`
- read `uploadedFile.arrayBuffer()`
- `PDFDocument.load(...)`
- apply fixed + good fields
- `pdfDoc.save()`
- create `Blob`
- trigger download with `URL.createObjectURL`

### 2. Apply the same field mapping currently used on the server

Use this exact mapping:

- `title` -> `pdfDoc.setTitle(...)`
- `author` -> `pdfDoc.setAuthor(...)`
- `subject` -> `pdfDoc.setSubject(...)`
- `keywords` -> `pdfDoc.setKeywords([value])`
- `creator` -> `pdfDoc.setCreator(...)`
- `language` -> `pdfDoc.setLanguage(...)`

### 3. Preserve current UX states

Keep:

- `isDownloading`
- `downloadError`
- success/failure messaging

Recommended text during client-side work:

- `Preparing optimized PDF...`

### 4. Use dynamic import

Do not bundle `pdf-lib` into the initial page load if avoidable.

Preferred approach:

```ts
const { PDFDocument } = await import('pdf-lib')
```

inside the download handler.

### 5. Remove or deprecate the server route later

After the client-side version is stable:

- stop calling `app/api/resume/metadata-patch/route.ts`
- optionally delete the route if no longer needed

## Expected Benefits

- lower Vercel compute usage
- lower server execution time for metadata enhancer
- fewer server round-trips
- faster perceived download flow after audit

## Expected Tradeoffs

- slightly more client-side work when the user clicks Download
- possible brief pause on weak devices or unusually large PDFs
- browser memory use increases during patch/save

For normal resume PDFs, this should be acceptable.

## Important Constraints

- This only works for `upload` mode where an actual PDF file exists in the browser.
- Saved resumes still cannot be directly patched unless the user exports/downloads a PDF first.
- The audit itself should remain server-side.

## Files Relevant To Future Implementation

- `app/dashboard/(shell)/metadata-enhancer/MetadataEnhancerClient.tsx`
- `app/api/resume/metadata-patch/route.ts`
- `app/api/resume/metadata-audit/route.ts`
- `lib/pdfExtractor.ts`

## Decision Summary

When implementing later:

- keep audit on server
- move PDF metadata patch/download to browser
- use `pdf-lib` via dynamic import
- preserve current UX and error states
