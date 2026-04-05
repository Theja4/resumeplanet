# Landing Page Redesign — Bold & Elevated

**Date:** 2026-04-05  
**Direction:** Bold & Elevated (evolution of current green/white design, not a full overhaul)  
**Scope:** Full page — Nav, Hero, Logo Marquee, Feature Showcase, Testimonials, CTA, Footer

---

## Design Principles

- Sharper typography: tighter letter-spacing (`-0.04em` to `-0.05em`), heavier weights
- Italic green accent for the hero tagline — adds personality and movement
- Dual CTAs everywhere: a dark primary and a green ghost secondary
- Green radial glow + subtle grid background in hero instead of pure gradient
- Dark-to-green gradient in the CTA footer (replaces flat `#026d32`)
- Testimonials as auto-scrolling horizontal carousel with 8 reviews (pauses on hover, fade masks on edges)

---

## Section Specs

### 01 — Navigation (`app/page.tsx`)

**Current issues:** "Sign Up" button text feels plain, Sign In lacks hover clarity.

**Changes:**
- "Sign Up" → "Sign Up Free →" (arrow suffix)
- Sign In: keep ghost style, ensure hover state is clear (`hover:bg-black hover:text-white`)
- No structural changes to layout or links

---

### 02 — Hero Section (`app/page.tsx`)

**Current issues:** Single CTA, no trust line, hero tagline lacks visual interest, stat floats only visible on desktop.

**Changes:**
- **Badge:** add a pulsing green dot before "AI-Powered Career Revolution"
- **Heading:** wrap the green line in `<em>` (italic) — `font-style: italic` on `text-[#008f44]` span
- **CTAs:** change single black button to two buttons side-by-side:
  - Primary: `GET STARTED FREE →` (black pill, existing style)
  - Secondary: `Check My ATS Score` (green ghost — `bg-primary-container/20 text-primary-landing border border-primary-container`)
- **Trust line:** add below CTAs — `No credit card · Free plan · Cancel anytime` in `text-sm text-on-surface-variant`
- **Background:** keep existing grid-bg + gradient-glow-hero, add a radial green glow orb at top-center: `absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,rgba(163,255,179,0.25)_0%,transparent_70%)] pointer-events-none`
- **Floating stat cards:** add a third float card showing "5× More Callbacks" next to the existing ATS Score and AI Optimizing cards. Make all three visible on `md:` screens (not just `lg:`)

---

### 03 — Logo Marquee (`components/landing/LogoMarquee.tsx`)

**Current issues:** Hand-crafted letter-mark logos don't look like the real brands; heading typography is understated.

**Changes:**
- **Replace all custom LogoMark / LogoWordmark components** with real SVG logos fetched from Simple Icons CDN (`https://cdn.simpleicons.org/<slug>/<hex-color>`). Each company chip renders an `<img>` tag pointing to the CDN URL — no new npm packages needed.
  - Google → `google/4285F4`
  - Microsoft → `microsoft/00A4EF`
  - Amazon → `amazon/FF9900`
  - Meta → `meta/0866FF`
  - Stripe → `stripe/635BFF`
  - Figma → `figma/F24E1E`
  - Shopify → `shopify/96BF48`
  - Uber → `uber/000000`
- Chip layout: 40×40px white rounded square icon container + company name wordmark in `font-semibold`
- Heading: increase weight to `font-black`, tighten tracking to `-0.03em`
- Subtext: `text-sm text-on-surface-variant` for cleaner hierarchy
- Marquee animation and scroll behavior unchanged

---

### 04 — Feature Showcase (`components/landing/FeatureShowcase.tsx`)

**Current issues:** Section heading is missing an italic accent; copy is functional but not striking.

**Changes:**
- Section h2: italicize the second half — `into a system.` → `<em className="italic text-primary">into a system.</em>`
- Section badge: change icon from `WandSparkles` to `✦` text character (matches mockup)
- Left-column "Get Started" CTA: add arrow → `Get Started →`
- **No changes** to the carousel component itself (CarouselPreview, tabs, animations) — these are already high quality

---

### 05 — Testimonials (`app/page.tsx`)

**Current issues:** Four equal-height cards in 2-col grid lacks visual hierarchy and feels static.

**New layout — auto-scrolling carousel:**
- Expand `TESTIMONIALS` array to **8 reviews** (add 4 more with varied roles/industries)
- Replace the static grid with a **horizontal auto-scrolling marquee** (same CSS technique as the logo marquee): a `flex` row of cards in a `w-max` track that animates with `@keyframes scroll-left`, duplicated to create seamless loop
- Each card: white, `rounded-3xl`, `w-[340px]` fixed width, `shrink-0`, `p-7`, `border border-zinc-100 shadow-sm`
- Stars: use `★` character in `text-[#FFB800]` instead of Lucide Star
- The first card (Priya Sharma) uses the dark green featured style (`bg-[#026d32] text-white`) to anchor the carousel visually
- Carousel pauses on `hover` (`animation-play-state: paused`)
- Add `overflow-hidden` + left/right fade masks on the section wrapper (same `mask-image` linear-gradient technique used on logo marquee)
- CSS animation defined in `globals.css` as `testimonial-scroll` (or reuse the existing `logo-marquee-track` class if timing works)

---

### 06 — CTA Section (`app/page.tsx`)

**Current issues:** Flat `bg-[#026d32]` feels static.

**Changes:**
- Background: `bg-[linear-gradient(135deg,#022c14_0%,#026d32_50%,#019a47_100%)]`
- Add two glow orbs (existing pattern): top-right and bottom-left, `bg-white/10 blur-3xl`
- Heading: italicize "hired faster?" → `Ready to get <em>hired faster?</em>`
- Keep both existing CTAs ("Start for free" + "Check my ATS score") unchanged

---

### 07 — Footer (`app/page.tsx`)

**Current issues:** `bg-zinc-950` is fine but `border-t border-zinc-800` is subtle.

**Changes:**
- Background: change to `bg-[#0a0f0b]` (near-black with green tint)
- Border: `border-t border-zinc-800/60`
- Logo: increase to `text-xl font-black` and keep white

---

## Files to Edit

| File | Sections Touched |
|---|---|
| `app/page.tsx` | Nav, Hero, Testimonials, CTA, Footer |
| `components/landing/FeatureShowcase.tsx` | Section heading italic, badge, CTA arrow |
| `components/landing/LogoMarquee.tsx` | Heading weight/tracking |

No new npm dependencies needed. Simple Icons logos are loaded via CDN `<img>` tags.

---

## Out of Scope

- Dark mode variants
- Pricing section (exists in `components/landing/PricingSection.tsx` but not on main page)
- Mobile nav / hamburger menu
- Animation timing changes
- Any dashboard or auth pages
