# Resume Builder — Design Spec
**Date:** 2026-03-28
**Status:** Approved
**Scope:** Full-screen resume builder page + supporting infrastructure

---

## 1. Overview

A full-screen resume builder at `/dashboard/builder/[resumeId]` with three zones:

- **Left sidebar** — 13 collapsible section editors
- **Centre** — live A4 preview that re-renders on every edit
- **Top bar** — navigation, mode tabs, template switcher, download

Two modes:
- **Builder** (free + pro) — edit all sections, live preview
- **Tailor** (pro only) — paste a job description, get AI-powered improvement hints

---

## 2. Architectural Principles

These boundaries are enforced throughout the codebase. Every new feature should respect them.

### 2.1 Parse Layer Abstraction

The resume parsing pipeline is hidden behind a stable interface so the engine (pdfjs, AI, etc.) can be swapped without touching the API route or any UI.

```
lib/parsers/
  index.ts        ← exports parseResume(buffer, fileType) — the only import the API route uses
  pdfjs.ts        ← current implementation (pdfExtractor + resumeParser)
  types.ts        ← ResumeParser interface
```

`/api/resume/parse/route.ts` only imports `parseResume` from `lib/parsers/index.ts`. To swap engines: write a new implementation file, update `index.ts`. One change, nothing else breaks.

### 2.2 Plan Gating — Single Source of Truth

Every pro-gated feature is defined in `lib/proFeatures.ts`. No inline `plan === 'pro'` checks anywhere in components.

```
lib/proFeatures.ts          ← config map: feature key → title/description/bullets
lib/hooks/useProGate.ts     ← hook: isPro, requirePro(featureKey)
components/shared/ProGateModal.tsx  ← the single upgrade popup
```

Usage pattern everywhere:
```tsx
const { requirePro } = useProGate()
if (!requirePro('tailor')) return   // opens modal automatically if free
```

To add a new gated feature: add one entry to `proFeatures.ts`. Nothing else changes.

### 2.3 Template / Data Separation

Templates are pure display components. They receive `data: ResumeData` and render. They never fetch, save, or import from Supabase. This is already in place.

### 2.4 Section Editor / Page Separation

Section editor components (`components/builder/*.tsx`) receive only `data: ResumeData` and emit `onChange(updated: ResumeData)`. They know nothing about Supabase, auth, or which page they live in. The builder page owns all I/O; editors own all interaction logic.

---

## 3. Routing & Layout

### 3.1 Route Group Restructure

The existing dashboard routes move into a `(shell)` route group so the builder can live at `/dashboard/builder/` without inheriting the sidebar layout.

```
app/dashboard/
  (shell)/                    ← route group (no URL impact)
    layout.tsx                ← sidebar + bottomnav + PlanProvider (moved here)
    page.tsx
    resumes/
    templates/
    ats-checker/
    billing/
    orders/
  builder/                    ← outside (shell), no sidebar
    layout.tsx                ← export default ({ children }) => <>{children}</>
    [resumeId]/
      page.tsx                ← the builder
```

All existing `/dashboard/*` URLs are unchanged. The builder gets a clean full-screen viewport.

### 3.2 Builder Page

`'use client'` page. Fetches its own data on mount (no RSC — too interactive). Reads `?template=` search param to pre-select a template.

On mount:
1. Get current user from Supabase
2. Fetch resume by `resumeId` scoped to `user_id`
3. If not found → redirect to `/dashboard/resumes`
4. Initialise state from `resume.parsed_data`

---

## 4. Types

Append to `types/index.ts`:

```ts
export interface BuilderField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'url' | 'email' | 'phone'
  placeholder?: string
  maxLength?: number
}

export interface BuilderSection {
  id: string
  label: string
  icon: string
  isRequired: boolean
  fields?: BuilderField[]
}

export type BuilderMode = 'builder' | 'tailor'

export interface TailorAnalysis {
  matchScore: number
  missingKeywords: string[]
  suggestions: { sectionId: string; hint: string }[]
}
```

---

## 5. Builder Page State

```ts
resumeData: ResumeData          // live editing state
savedData: ResumeData           // last persisted snapshot
selectedTemplateId: TemplateId  // default 'modern-minimal'
activeMode: BuilderMode         // 'builder' | 'tailor'
expandedSection: string | null  // which sidebar section is open
isTemplateModalOpen: boolean
isSaving: boolean
jobDescription: string          // tailor mode
tailorAnalysis: TailorAnalysis | null
isTailoring: boolean
```

`hasUnsavedChanges` is derived: `JSON.stringify(resumeData) !== JSON.stringify(savedData)`.

---

## 6. Top Bar

Height: `h-12`. Three zones via flex layout.

**Left:**
- `← Resumes` link → `/dashboard/resumes`
- Divider
- Resume title (static display; editable in future iteration)
- Save indicator: `Saving…` (gray) | `Saved ✓` (green) | `Unsaved changes` (amber dot)

**Centre (absolute):**
- `BUILDER` tab — always active
- `TAILOR` tab:
  - Pro user: switches to tailor mode
  - Free user: clicking calls `requirePro('tailor')` → ProGateModal opens

**Right:**
- `Templates` button (LayoutGrid icon) → `isTemplateModalOpen = true`
- `Download` dropdown:
  - `PDF` — `window.print()` (free + pro)
  - `DOCX` — `requirePro('docx_download')`, then `generateDOCX()` (pro only)

---

## 7. Left Sidebar — 13 Sections

Ordered list, each a collapsible accordion item:

| Order | id | Label | Icon | Editor component |
|---|---|---|---|---|
| 1 | contact | Contact Info | User | ContactEditor |
| 2 | summary | Summary | AlignLeft | SummaryEditor |
| 3 | experience | Work Experience | Briefcase | ExperienceEditor |
| 4 | education | Education | GraduationCap | EducationEditor |
| 5 | skills | Skills | Zap | SkillsEditor |
| 6 | projects | Projects | Code | ProjectsEditor |
| 7 | certifications | Certificates | Award | CertificationsEditor |
| 8 | volunteer | Volunteer Work | Heart | VolunteerEditor |
| 9 | languages | Languages | Globe | LanguagesEditor |
| 10 | interests | Interests | Star | InterestsEditor |
| 11 | awards | Awards | Trophy | AwardsEditor |
| 12 | publications | Publications | BookOpen | PublicationsEditor |
| 13 | references | References | Users | ReferencesEditor |

**Section row:** drag handle (visual only, ⠿) · icon · label · `EDIT` (indigo text, section has data) or `+ ADD` (gray text, section empty). Clicking anywhere on the row toggles expand/collapse.

---

## 8. Section Editor Components

All live in `components/builder/`. All share the same prop signature:
```ts
interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}
```

### ContactEditor
Six labeled inputs: name (text), email (email), phone (phone), location (text, placeholder "City, Country"), LinkedIn (url), website (url). `onChange` fires on every `input` event.

### SummaryEditor
Single auto-expanding textarea, min 4 rows. Character counter below; text turns amber at 500+ chars. `onChange` fires on input.

### SkillsEditor / LanguagesEditor / InterestsEditor
Tag-chip input. Existing items shown as chips with × to remove. Text input at bottom: Enter or comma to add a new tag. `onChange` fires after each add/remove. LanguagesEditor placeholder: `English (Native)`. Same pattern for all three.

### ExperienceEditor / VolunteerEditor
List of job/volunteer cards. Each card:
- **Collapsed:** company name + job title + date range
- **Expanded:** all fields (title, company, location, startDate, endDate) + bullets list

Bullets: each in a textarea row with drag handle (visual) and × to remove. `+ Add bullet` button at bottom. `Remove this job` button in red at bottom of expanded card. `+ Add job` / `+ Add role` button below the list.

All updates are immutable array operations: spread the array, update the specific index, call `onChange`.

### EducationEditor
Same pattern as ExperienceEditor. Fields: institution, degree, field, graduationDate, gpa.

### ProjectsEditor
Same pattern. Fields: name, description, technologies (tag-chip input).

### CertificationsEditor / AwardsEditor / PublicationsEditor
Simple list. Each item: fields in a horizontal row (name/issuer/date, title/issuer/date, title/publisher/date respectively). × to remove. `+ Add` button below.

### ReferencesEditor
Simple list of text inputs, one per reference entry. × to remove. `+ Add reference` below.

---

## 9. Live Preview

Centre zone: `flex-1`, `bg-gray-100`, `overflow-auto`, `flex justify-center`.

Scale calculation (runs on mount and window resize):
```ts
const scale = Math.min(1.0, (window.innerHeight - 48) / 1123)
```

Applied as `transform: scale(${scale})` with `transformOrigin: 'top center'` on the 794px-wide template wrapper.

The template renders `isEditing={false}` — preview is read-only. All editing happens in the left sidebar.

Wrapped in `id="builder-print-wrapper"` for print CSS.

---

## 10. Auto-Save

2-second debounce after any `resumeData` change:

```ts
const saveTimerRef = useRef<NodeJS.Timeout>()

useEffect(() => {
  clearTimeout(saveTimerRef.current)
  saveTimerRef.current = setTimeout(async () => {
    setIsSaving(true)
    await supabase.from('resumes')
      .update({ parsed_data: resumeData, updated_at: new Date().toISOString() })
      .eq('id', resumeId).eq('user_id', userId)
    setSavedData(resumeData)
    setIsSaving(false)
  }, 2000)
  return () => clearTimeout(saveTimerRef.current)
}, [resumeData])
```

`beforeunload` event fires immediate save if `hasUnsavedChanges`.

---

## 11. Template Switcher Modal

`components/builder/TemplateSwitcherModal.tsx`

Props: `{ isOpen, currentTemplateId, resumeData, onSelect, onClose }`

Full-screen backdrop (`fixed inset-0 bg-black/50 z-50`). Centered panel: `max-w-5xl`, `max-h-[90vh]`, `overflow-y-auto`.

Grid of 5 template thumbnails, each at 25% scale (same technique as existing TemplateCard). Selected template: indigo ring + ✓ overlay. Hover: slight scale-up. Click → `onSelect(id)` + `onClose()`. Preview updates instantly.

Uses `getAllTemplates()` from registry — automatically includes future templates.

---

## 12. Plan Gating Infrastructure

### `lib/proFeatures.ts`
```ts
export const PRO_FEATURES = {
  tailor: {
    title: 'Tailor Mode is a Pro feature',
    description: 'Paste any job description and AI will highlight exactly what to improve.',
    bullets: ['Match score against the job', 'Missing keyword detection', 'Section-by-section suggestions'],
  },
  docx_download: {
    title: 'DOCX export is a Pro feature',
    description: 'Download your resume as an editable Word document.',
    bullets: ['Word .docx format', 'ATS-friendly', 'Editable by recruiters'],
  },
  multi_resume: {
    title: 'Multiple resumes is a Pro feature',
    description: 'Store and manage multiple tailored resumes.',
    bullets: ['Unlimited resumes', 'Separate ATS scores', 'Quick switching'],
  },
} satisfies Record<string, ProFeatureConfig>
```

### `lib/hooks/useProGate.ts`
```ts
export function useProGate() {
  const { isPro } = usePlan()
  const [blockedFeature, setBlockedFeature] = useState<ProFeatureKey | null>(null)

  function requirePro(feature: ProFeatureKey): boolean {
    if (isPro) return true
    setBlockedFeature(feature)
    return false
  }

  return { isPro, requirePro, blockedFeature, clearBlockedFeature: () => setBlockedFeature(null) }
}
```

### `components/shared/ProGateModal.tsx`
Replaces the current stub `PaywallModal.tsx`. Renders the upgrade popup using config from `PRO_FEATURES[feature]`. Props: `{ feature: ProFeatureKey | null; onClose: () => void }`. Includes feature bullets list and "Upgrade to Pro →" CTA linking to `/dashboard/billing`.

---

## 13. Tailor Mode (Pro only)

`components/builder/TailorPanel.tsx`

Replaces left sidebar content when `activeMode === 'tailor'`. Preview stays visible.

Layout:
1. Heading "Tailor to a job" + subtext
2. Textarea for job description (8 rows)
3. "Analyse" button → calls `/api/ats/tailor-analysis`
4. After response:
   - Match score circle (coloured: ≥70 green, 40–69 amber, <40 red)
   - Missing keywords as red chips
   - Suggestions list: each has section icon + 1-sentence hint + "+ Apply" button
5. "+ Apply" → switches to builder mode, expands that section, shows amber hint badge on the section row

### `/api/ats/tailor-analysis/route.ts`

- Pro-gated (403 for free users)
- Model: `claude-sonnet-4-6`
- Input: `{ resumeText: string, jobDescription: string }`
- Claude prompt asks for JSON:
  ```json
  {
    "matchScore": 0-100,
    "missingKeywords": ["string", ...],  // top 8
    "suggestions": [
      { "sectionId": "experience", "hint": "Add metrics to your bullet points" }
    ]  // max 5, sectionId from allowed list
  }
  ```
- Returns `APIResponse<TailorAnalysis>`

---

## 14. Entry Points

| From | Change |
|---|---|
| Resume library upload success | `router.push('/dashboard/builder/[id]')` instead of `router.refresh()` |
| Resume card "Edit" button | Link → `/dashboard/builder/[id]` |
| Resume detail page | Add "Open Builder" button → `/dashboard/builder/[id]` |
| Template preview page | Add "Open in Builder" button → `/dashboard/builder/[id]?template=[templateId]` |
| Direct URL | `/dashboard/builder/[resumeId]` |

---

## 15. Mobile Fallback

On `< 768px` viewport: render a full-page message instead of the builder.

- Heading: "Builder works best on desktop"
- Body: brief explanation
- Links: View Resume (`/dashboard/resumes/[id]`), Run ATS Check (`/dashboard/ats-checker`), Browse Templates (`/dashboard/templates`)

---

## 16. Print / Download CSS

Print media query in the builder page hides everything except the resume:

```css
@media print {
  body > *:not(#builder-print-wrapper) { display: none !important; }
  #builder-print-wrapper {
    position: fixed;
    top: 0; left: 0;
    width: 794px;
    transform: none !important;
  }
}
```

DOCX: reuses `generateDOCX` from `TemplatePreviewClient` — extract to `lib/docxGenerator.ts` so both the builder and the template preview share one implementation.

---

## 17. Files Created / Modified

### New files
```
app/dashboard/(shell)/layout.tsx          ← dashboard shell layout (moved)
app/dashboard/builder/layout.tsx          ← minimal pass-through
app/dashboard/builder/[resumeId]/page.tsx ← the builder page
components/builder/
  ContactEditor.tsx
  SummaryEditor.tsx
  SkillsEditor.tsx
  LanguagesEditor.tsx
  InterestsEditor.tsx
  ExperienceEditor.tsx
  VolunteerEditor.tsx
  EducationEditor.tsx
  ProjectsEditor.tsx
  CertificationsEditor.tsx
  AwardsEditor.tsx
  PublicationsEditor.tsx
  ReferencesEditor.tsx
  TemplateSwitcherModal.tsx
  TailorPanel.tsx
lib/proFeatures.ts
lib/hooks/useProGate.ts
lib/docxGenerator.ts                      ← extracted from TemplatePreviewClient
app/api/ats/tailor-analysis/route.ts
```

### Modified files
```
types/index.ts                            ← add BuilderField, BuilderSection, BuilderMode, TailorAnalysis
components/shared/ProGateModal.tsx        ← replace stub, implement fully
app/dashboard/resumes/ResumesClient.tsx   ← redirect to builder after upload
components/resumes/ResumeCard.tsx         ← "Edit" → builder link
app/dashboard/resumes/[id]/ResumeDetailClient.tsx  ← "Open Builder" button
app/dashboard/templates/[templateId]/TemplatePreviewClient.tsx  ← "Open in Builder" button
```

### Moved files (route group restructure)
All files under `app/dashboard/` except `builder/` move into `app/dashboard/(shell)/`. File contents do not change — only directory.

---

## 18. What Does Not Change

- All template components in `components/templates/`
- The registry (`components/templates/registry.ts`)
- `/api/ats/score`, `/api/ats/optimise`
- `/api/resume/parse`
- Auth, middleware, Supabase schema
- The ATS checker page
