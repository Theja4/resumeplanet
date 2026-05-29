# PROGRESS — Rezoomed Profile Optimizer

## Stripe-Grade Professional Revamp — 2026-05-26

A complete rebuild of the visual + IA layer. The previous "Zentra"
pass produced a startup-flashy aesthetic (neon glows, glass panels,
sparkle decorations, oversized type, four overlapping tabs) that
didn't communicate trust. This pass replaces it with a Stripe
Dashboard-grade design system — restrained palette, light + dark
themes, a status-driven FOMO mechanic, and two purpose-built tabs.

### Highlights

- **Light by default, polished dark mode toggle.** Both themes use
  the same restrained Stripe-style token system. Theme persists via
  `chrome.storage.local`, syncs across popup ↔ sidebar, with
  inline boot scripts to prevent flash-of-wrong-theme on load.
- **2 tabs, not 4.** "My Profile" merges Overview + Fixes + Rewrites
  into one scrollable view. "Job Match" stays as a separate tab.
- **FOMO mechanic.** RiskBanner at the top of My Profile shows
  honest status: `"You're losing 23 points across 3 sections."`
  Each section gets a severity pill (Critical / Needs work / Good)
  using red/amber/green that work in both themes.
- **Soft Pro gating.** Free users see all tips and fix copy. AI
  rewrite buttons are the only Pro lock — clicking them as a free
  user expands an inline UpgradeCard (no page nav, no overlay).
- **Stripe-tight floating pill.** The toy "✨ Rezoomed 76" gradient
  pill is replaced with a precise data chip — severity dot,
  wordmark, tabular-numeral score, single 1px border + shadow-sm.
- **Severity model with unit tests.** New `src/scoring/severity.ts`
  derives Critical/Warning/Good per category with documented
  thresholds (≥80% good, ≥50% warning, <50% critical). 14 vitest
  unit tests cover threshold edges, empty profiles, and aggregation.
- **System fonts only.** Plus Jakarta Sans (28KB) dropped in favor
  of `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui`.
- **Bundle size dropped −33 kB** (683.56 kB → 650.41 kB) despite
  adding the new theme system and 11 new component primitives.

### Build verification

| Metric | Before | After |
|---|---|---|
| Total bundle | 683.56 kB | **650.41 kB** (−33 kB) |
| Popup CSS | 32.52 kB | **29.67 kB** (−2.85 kB) |
| Content script JS | 331.06 kB | **327.87 kB** (−3.19 kB) |
| TypeScript errors | 0 | **0** |
| Unit tests | 0 | **14 passing** |
| Permissions | `["storage"]` | **`["storage"]`** (unchanged) |

### Token system (before → after)

| Surface | Before | After (light) | After (dark) |
|---|---|---|---|
| Primary | `#10f084` (neon green) | `#059669` (emerald) | `#10b981` |
| Canvas | `#050907` (dark only) | `#f6f8fa` | `#0a0a0b` |
| Card | `rgba(255,255,255,0.045)` glass | `#ffffff` flat | `#111114` flat |
| Border | `rgba(255,255,255,0.085)` | `#e5e7eb` | `rgba(255,255,255,0.08)` |
| Critical | `#ff8a8a` only | `#dc2626` text + `#fef2f2` bg | `#fca5a5` + tinted bg |
| Warning | `#ffc857` only | `#d97706` text + `#fffbeb` bg | `#fcd34d` + tinted bg |
| Good | (same as primary) | `#059669` text + `#ecfdf5` bg | `#10b981` + tinted bg |
| Shadow stack | 5-tier with glow halos | 3-tier (xs/sm/md), no glow | same, deeper rgba |

### IA before → after

```
  Before                              After
  ──────                              ─────
  ├── Overview     (top wins)         ├── My Profile        (merged)
  ├── Fixes        (full list)        │     ├── RiskBanner   (FOMO)
  ├── Rewrites     (AI versions)      │     ├── ScoreHero    (severity)
  └── Match        (JD vs profile)    │     └── SectionRow×N (severity + inline rewrite)
                                      └── Job Match         (JD + consistency)
```

### Files added (19)

| File | Purpose |
|---|---|
| `src/scoring/severity.ts` | Severity model — `categorySeverity`, `aggregateSeverity` |
| `src/scoring/severity.test.ts` | 14 vitest unit tests |
| `src/ui/theme/ThemeProvider.tsx` | Theme context + `chrome.storage` persistence |
| `src/ui/theme/useTheme.ts` | Public re-export |
| `src/ui/components/Card.tsx` | Flat Stripe card |
| `src/ui/components/Button.tsx` | primary/secondary/tertiary/danger |
| `src/ui/components/Badge.tsx` | Tonal inline pills (incl. Pro variant) |
| `src/ui/components/StatusPill.tsx` | Critical/Needs work/Good pill |
| `src/ui/components/SeverityDot.tsx` | Inline color dot |
| `src/ui/components/Banner.tsx` | Top-of-page tonal banner |
| `src/ui/components/Stat.tsx` | Number + label + delta block |
| `src/ui/components/Divider.tsx` | 1px separator |
| `src/ui/components/IconButton.tsx` | Square icon-only button |
| `src/ui/components/Tabs.tsx` | Sliding-underline tab bar |
| `src/ui/components/ThemeToggle.tsx` | Sun/Moon segmented control |
| `src/ui/MyProfile/MyProfileView.tsx` | Merged profile view |
| `src/ui/MyProfile/SectionRow.tsx` | Per-category row + inline AI rewrite |
| `src/ui/MyProfile/RiskBanner.tsx` | Adaptive FOMO banner (4 states) |
| `src/ui/MyProfile/UpgradeCard.tsx` | Inline upgrade card (no page nav) |
| `src/ui/MyProfile/useRewrite.ts` | Centralised AI rewrite hook |

### Files removed (14)

```
src/ui/components/GlassPanel.tsx
src/ui/components/PremiumCard.tsx
src/ui/components/GlowButton.tsx
src/ui/components/AnimatedIcon.tsx
src/ui/components/BackgroundOrb.tsx
src/ui/components/MetricBlock.tsx
src/ui/components/SectionHeader.tsx
src/ui/components/NeonDot.tsx
src/ui/components/EmptyState.tsx
src/ui/TabNav.tsx                  → replaced by components/Tabs.tsx
src/ui/tabs/OverviewTab.tsx        → merged into MyProfileView
src/ui/tabs/FixesTab.tsx           → merged into MyProfileView
src/ui/tabs/RewritesTab.tsx        → merged into MyProfileView
public/fonts/PlusJakartaSans-VF.woff2  → dropped (system fonts)
```

### Files rewritten

```
src/styles.css                     Stripe-grade light + dark token system
src/ui/svg.tsx                     Trimmed to BrandMark + TrendArrow only
src/ui/atoms.tsx                   Shim layer routing to new primitives
src/ui/SidebarShell.tsx            New floating pill, ThemeToggle, no orbs
src/ui/ScoreHero.tsx               Severity-colored ring + Stat + legend
src/ui/OnboardingTour.tsx          Flat card, numbered steps, no gems
src/ui/ProfileOptimizerPanel.tsx   2 tabs, ThemeProvider, last-scan mirror
src/ui/Gating.tsx                  SignInPrompt + ProCta with new system
src/ui/RewriteCard.tsx             Helper-only (UI inlined into SectionRow)
src/ui/ConsistencyGap.tsx          Banner + Card primitives
src/ui/tabs/MatchTab.tsx           Card primitive, plain textarea
entrypoints/popup/App.tsx          Dashboard-widget layout
entrypoints/popup/index.html       Inline theme-flash prevention script
entrypoints/popup/main.tsx         ThemeProvider applied to <html>
entrypoints/content.tsx            Drop Plus Jakarta @font-face injection
src/ui/components/index.ts         Barrel for new primitives
```

### Theme switching architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  USER TOGGLES THEME (popup or sidebar header)                    │
│   ↓                                                              │
│  ThemeProvider.setTheme()                                        │
│   ├─ React state update                                          │
│   ├─ data-theme attribute on host element                        │
│   ├─ localStorage cache (for next-load synchronous boot)         │
│   └─ chrome.storage.local (cross-surface broadcast)              │
│                                                                  │
│  OTHER SURFACES (popup ↔ sidebar) listen via                     │
│  chrome.storage.onChanged → setThemeState() → re-apply.          │
│                                                                  │
│  ON LOAD: inline script in popup index.html / content.tsx        │
│  reads localStorage synchronously and sets data-theme BEFORE     │
│  React mounts. This eliminates flash-of-wrong-theme.             │
└──────────────────────────────────────────────────────────────────┘
```

### FOMO mechanic — adaptive copy

| State | Plan | Tone | Title | CTA |
|---|---|---|---|---|
| Critical sections present | free | red | "You're losing N points across M sections." | "Upgrade to Pro" |
| Critical sections present | pro | red | "M sections need attention." | "Jump to first issue" |
| Warnings only | any | amber | "M sections could use polish." | "See what's left" |
| All good | any | (banner not rendered) | — | — |

`pointsAtRisk` is intentionally counted from **critical** sections
only — warnings get separate softer copy. This avoids feeling
scammy when the profile is mostly fine.

### Accessibility

- Every interactive element has visible focus ring (`:focus-visible`
  outline at the emerald primary color in both themes).
- StatusPill always pairs color + text + icon — color is never the
  only signal.
- Tabs are a real `role="tablist"` with arrow-key navigation,
  roving tabindex, and `aria-selected`.
- ThemeToggle uses `aria-pressed` to expose active theme.
- OnboardingTour is `role="dialog" aria-modal` with Escape close
  and CTA auto-focus per step.
- ScoreHero has `role="img"` with full text label
  ("Score 91 of 100").
- `prefers-reduced-motion` zeroes every keyframe + transition.

### Out of scope (deliberately)

- Adding new scoring rules or check categories
- Changing auth flow or payment flow
- Backporting any neon/sparkle/glassmorphism elements
- Adding new permissions or hosts to manifest

---

## Earlier passes

### Zentra-inspired Premium UI/UX revamp — 2026-05-25

(Replaced by the Stripe-grade revamp above. Documented for archival.)

A premium dark fintech aesthetic adapted for the extension. Set up
the core primitive ladder (`GlassPanel`, `PremiumCard`, `GlowButton`,
`BackgroundOrb`, `AnimatedIcon`, `EmptyState`, `MetricBlock`,
`SectionHeader`, `NeonDot`) and an extensive SVG decoration library
(`SparkField`, `CrystalMotif`, `AuroraField`, `GradientBlob`,
`DotMatrix`, `ProfileGlyph`, etc.). Introduced `--rz-card-elev` halo
recipe, neon green primary `#10f084`, gradient-heavy CTAs, and
staggered fade-up animations. Onboarding tour, popup, and sidebar
all rebuilt around the dark canvas + green neon language.

### Logo Update — 2026-05-26

Replaced extension icons and internal branding with the Rezoomed
bunny mascot — generated 16/32/48/96/128 PNG sizes, integrated via
`BrandMark`'s `iconUrl` prop. No code changes required.
