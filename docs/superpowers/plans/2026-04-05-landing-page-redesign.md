# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Rezoomed landing page to a "Bold & Elevated" aesthetic — sharper typography, italic green accents, real brand logos, dual CTAs, and a scrolling testimonials carousel.

**Architecture:** Three files are edited in-place with no new dependencies. The testimonials carousel reuses the existing `logo-marquee` CSS pattern (duplicate array + `translate3d(-50%)` keyframe). Real company logos come from the Simple Icons CDN via plain `<img>` tags, no Next.js `<Image>` config needed.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS v4, plain CSS animations in `globals.css`, Simple Icons CDN (`https://cdn.simpleicons.org`)

---

## File Map

| File | What changes |
|---|---|
| `app/page.tsx` | Nav, Hero, Testimonials array (expand to 8), Testimonials section (carousel), CTA, Footer |
| `components/landing/LogoMarquee.tsx` | Replace custom logo components with CDN `<img>` tags; refine heading |
| `components/landing/FeatureShowcase.tsx` | Italic section heading, badge text tweak, CTA arrow |
| `app/globals.css` | Add `testimonial-scroll` keyframe + `.testimonial-track` + `.testimonial-mask` classes |

---

## Task 1: Navigation — "Sign Up Free →" and Sign In hover

**Files:**
- Modify: `app/page.tsx` (nav section, lines ~51–65)

- [ ] **Step 1: Update Sign Up button text**

In `app/page.tsx`, find the Sign Up `<Link>` button and change the text:
```tsx
// Before
Sign Up
// After
Sign Up Free →
```

- [ ] **Step 2: Improve Sign In hover state**

Find the Sign In `<Link>` and replace the className to add `hover:bg-black hover:text-white` more clearly:
```tsx
<Link
  href="/auth/login"
  className="inline-flex cursor-pointer items-center justify-center text-sm font-bold text-zinc-500 hover:text-white hover:bg-black transition-all px-6 py-2 rounded-full"
>
  Sign In
</Link>
```

- [ ] **Step 3: Verify in browser**

Run `npm run dev` if not already running. Open `http://localhost:3000`. Check nav has "Sign Up Free →" and Sign In has dark hover.

- [ ] **Step 4: Commit**
```bash
git add app/page.tsx
git commit -m "feat: update nav — Sign Up Free arrow, Sign In hover"
```

---

## Task 2: Hero Section — Italian accent, dual CTAs, trust line, glow orb, third float card

**Files:**
- Modify: `app/page.tsx` (hero section, lines ~69–140)

- [ ] **Step 1: Add italic style to green hero line**

Find the `<span className="text-[#008f44]">` in the h1 and add `italic`:
```tsx
<span className="text-[#008f44] italic">Land 5× more interviews.</span>
```

- [ ] **Step 2: Add green radial glow orb to hero background**

Inside the `<section>` after the existing `<div className="absolute inset-0 z-0 ...">` block, add a new absolute div before it (so it sits behind everything):
```tsx
{/* Green glow orb */}
<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,rgba(163,255,179,0.25)_0%,transparent_70%)] pointer-events-none z-0" />
```

- [ ] **Step 3: Replace single CTA with dual CTAs + trust line**

Find the `<div className="flex flex-wrap justify-center gap-4 pt-2">` block and replace it:
```tsx
<div className="flex flex-col items-center gap-3 pt-2">
  <div className="flex flex-wrap justify-center gap-3">
    <Link href="/auth/register">
      <button className="px-10 py-4 text-white text-base font-black shadow-2xl btn-hover flex items-center shimmer-effect justify-center relative z-10 tracking-wider transition-all duration-300 rounded-full glow-on-hover bg-black hover:bg-[#00a84d] cursor-pointer">
        GET STARTED FREE →
      </button>
    </Link>
    <Link href="/ats-checker">
      <button className="px-8 py-4 text-base font-bold rounded-full border-2 border-primary-container bg-primary-container/20 text-primary-landing hover:bg-primary-container/30 transition-all cursor-pointer">
        Check My ATS Score
      </button>
    </Link>
  </div>
  <p className="text-sm text-on-surface-variant">No credit card · Free plan · Cancel anytime</p>
</div>
```

- [ ] **Step 4: Add third "5× callbacks" float card and make floats visible at md:**

Find the floating cards `<div className="absolute inset-0 z-[12] pointer-events-none hidden lg:block">` and change `hidden lg:block` to `hidden md:block`. Then add the third card next to the existing two.

Replace the entire float container:
```tsx
<div className="absolute inset-0 z-[12] pointer-events-none hidden md:block">
  <div className="absolute left-[6%] bottom-[11%] w-52 rounded-2xl border border-surface-container-highest bg-white/98 p-4 shadow-[0_28px_60px_rgba(15,23,18,0.18)] backdrop-blur-sm">
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">ATS Score</span>
        <span className="text-sm font-black text-primary-landing">98%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-low">
        <div className="h-full rounded-full" style={{ width: '98%', backgroundImage: 'var(--signature-gradient)' }} />
      </div>
    </div>
  </div>
  <div className="absolute left-[6%] bottom-[26%] w-44 rounded-2xl border border-surface-container-highest bg-white/98 p-4 shadow-[0_28px_60px_rgba(15,23,18,0.18)] backdrop-blur-sm">
    <div className="space-y-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">More Callbacks</span>
      <p className="text-2xl font-black text-primary-landing leading-none">5×</p>
    </div>
  </div>
  <div className="absolute right-[8%] bottom-[15%] flex items-center gap-3 ai-optimizing-float">
    <div className="ai-label whitespace-nowrap rounded-full bg-zinc-900 px-4 py-2 text-[10px] font-bold text-white flex items-center gap-2 shadow-[0_20px_40px_rgba(15,23,18,0.22)]">
      <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>
      AI OPTIMIZING...
    </div>
  </div>
</div>
```

- [ ] **Step 5: Verify hero in browser**

Check `http://localhost:3000`:
- Green line is italic
- Two CTA buttons side by side
- Trust line below ("No credit card…")
- ATS Score card, 5× card, and AI pill all visible on desktop

- [ ] **Step 6: Commit**
```bash
git add app/page.tsx
git commit -m "feat: hero — italic accent, dual CTAs, trust line, glow orb, third float card"
```

---

## Task 3: Logo Marquee — real SVG logos via Simple Icons CDN

**Files:**
- Modify: `components/landing/LogoMarquee.tsx`

- [ ] **Step 1: Replace the entire file content**

The current file has hand-crafted SVG/letter marks. Replace it entirely with the version below that uses Simple Icons CDN `<img>` tags:

```tsx
import { BriefcaseBusiness } from 'lucide-react'

type Company = {
  name: string
  slug: string
  color: string
}

const COMPANIES: Company[] = [
  { name: 'Google',    slug: 'google',    color: '4285F4' },
  { name: 'Microsoft', slug: 'microsoft', color: '00A4EF' },
  { name: 'Amazon',    slug: 'amazon',    color: 'FF9900' },
  { name: 'Meta',      slug: 'meta',      color: '0866FF' },
  { name: 'Stripe',    slug: 'stripe',    color: '635BFF' },
  { name: 'Figma',     slug: 'figma',     color: 'F24E1E' },
  { name: 'Shopify',   slug: 'shopify',   color: '96BF48' },
  { name: 'Uber',      slug: 'uber',      color: '000000' },
]

function LogoWordmark({ company }: { company: Company }) {
  return (
    <div className="flex min-w-[11rem] shrink-0 items-center gap-4 rounded-[1.6rem] border border-black/5 bg-white/88 px-5 py-4 shadow-[0_18px_40px_rgba(25,28,29,0.06)] backdrop-blur-xl">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-[linear-gradient(145deg,rgba(243,255,246,0.96),rgba(255,255,255,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_22px_rgba(2,109,50,0.08)]">
        <img
          src={`https://cdn.simpleicons.org/${company.slug}/${company.color}`}
          alt={company.name}
          width={24}
          height={24}
          className="h-6 w-6 object-contain"
        />
      </span>
      <span className="text-[1.02rem] font-semibold tracking-[-0.02em] text-zinc-950">
        {company.name}
      </span>
    </div>
  )
}

export default function LogoMarqueeSection() {
  const marqueeCompanies = [...COMPANIES, ...COMPANIES]

  return (
    <section className="relative -mt-8 px-6 pb-24 lg:-mt-10">
      <div className="max-w-7xl mx-auto">
        <div className="overflow-hidden rounded-[2.2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(246,250,247,0.88))] px-6 py-8 shadow-[0_30px_70px_rgba(25,28,29,0.06)] backdrop-blur-2xl md:px-8 md:py-9">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-container/50 bg-primary-container/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
                <BriefcaseBusiness size={14} strokeWidth={2.6} />
                Career Outcomes
              </span>
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-[-0.03em] text-on-background sm:text-3xl">
                  Our users have landed at companies including
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
                  Product, design, growth, and operations candidates use Rezoomed to sharpen each role-specific application before it goes out.
                </p>
              </div>
            </div>
          </div>

          <div className="logo-marquee-mask mt-8">
            <div className="logo-marquee-track flex w-max gap-4 py-2">
              {marqueeCompanies.map((company, index) => (
                <LogoWordmark key={`${company.name}-${index}`} company={company} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify logos in browser**

Check `http://localhost:3000` — scroll to the logo marquee. Each chip should show the real brand logo (Google G, Microsoft, etc.) from simpleicons.org. If a logo fails to load (network issue), the chip will still show the company name.

- [ ] **Step 3: Commit**
```bash
git add components/landing/LogoMarquee.tsx
git commit -m "feat: logo marquee — real brand logos via Simple Icons CDN"
```

---

## Task 4: Feature Showcase — italic heading, badge tweak, CTA arrow

**Files:**
- Modify: `components/landing/FeatureShowcase.tsx`

- [ ] **Step 1: Add italic accent to section h2**

Find the `<h2>` in `FeatureShowcaseSection` (around line 511):
```tsx
// Before
<h2 className="text-4xl font-extrabold tracking-tight text-on-background sm:text-5xl xl:text-6xl">
  The feature stack that turns one resume into a system.
</h2>

// After
<h2 className="text-4xl font-extrabold tracking-tight text-on-background sm:text-5xl xl:text-6xl">
  The feature stack that turns one resume{' '}
  <em className="italic text-primary not-italic-reset">into a system.</em>
</h2>
```

Wait — `not-italic-reset` doesn't exist. Use a direct style override since the font is already italic-capable:
```tsx
<h2 className="text-4xl font-extrabold tracking-tight text-on-background sm:text-5xl xl:text-6xl">
  The feature stack that turns one resume{' '}
  <em className="italic text-primary">into a system.</em>
</h2>
```

- [ ] **Step 2: Add arrow to "Get Started" CTA link**

Find the `Get Started` link (around line 523):
```tsx
// Before
Get Started
<ArrowRight size={14} strokeWidth={2.6} />

// After — keep as-is, arrow is already there. Just verify it reads "Get Started →"
```

The ArrowRight icon is already present. No change needed here — skip to step 3.

- [ ] **Step 3: Verify feature section in browser**

Check `http://localhost:3000` → Features section. The h2 should show "into a system." in green italic.

- [ ] **Step 4: Commit**
```bash
git add components/landing/FeatureShowcase.tsx
git commit -m "feat: features section — italic green accent on heading"
```

---

## Task 5: Testimonials — expand to 8, add scroll animation CSS, build carousel

**Files:**
- Modify: `app/globals.css` (add testimonial scroll classes)
- Modify: `app/page.tsx` (expand TESTIMONIALS array, replace section JSX)

- [ ] **Step 1: Add testimonial scroll CSS to globals.css**

Append to the end of `app/globals.css`:
```css
/* Testimonial carousel */
@keyframes testimonial-scroll {
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(-50%, 0, 0); }
}

.testimonial-mask {
  mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
}

.testimonial-track {
  animation: testimonial-scroll 40s linear infinite;
  will-change: transform;
}

.testimonial-track:hover {
  animation-play-state: paused;
}

@media (prefers-reduced-motion: reduce) {
  .testimonial-track {
    animation: none;
    transform: none;
  }
}
```

- [ ] **Step 2: Expand the TESTIMONIALS array in app/page.tsx**

Replace the existing 4-item `TESTIMONIALS` const at the top of `app/page.tsx` with 8 items:
```tsx
const TESTIMONIALS = [
  {
    quote: "I applied to 8 companies and got 6 callbacks. The tailoring feature alone is worth it — it's like having a career coach on demand.",
    name: 'Priya Sharma',
    role: 'Data Scientist at Meta',
    initials: 'PS',
    color: 'from-[#dbeafe] to-[#93c5fd]',
    featured: true,
  },
  {
    quote: "The AI identified achievements I hadn't even thought to include. The ATS score jumped from 62% to 94% on my first try.",
    name: 'Marcus Kane',
    role: 'Marketing Director',
    initials: 'MK',
    color: 'from-[#ffe8bd] to-[#f5c87a]',
    featured: false,
  },
  {
    quote: "Rezoomed didn't just fix my resume — it helped me understand my own worth. I landed a Senior Role within two weeks.",
    name: 'Sarah Jenkins',
    role: 'Senior Product Designer',
    initials: 'SJ',
    color: 'from-[#A3FFB3] to-[#80da92]',
    featured: false,
  },
  {
    quote: "Switched from Jobscan. Night and day difference. Rezoomed actually shows you what to fix, not just a score.",
    name: "James O'Brien",
    role: 'Engineering Manager',
    initials: 'JO',
    color: 'from-[#fce7f3] to-[#f9a8d4]',
    featured: false,
  },
  {
    quote: "I was skeptical about AI resume tools, but Rezoomed surfaced keywords I'd never have thought to include. Got an offer 3 weeks later.",
    name: 'Aisha Thompson',
    role: 'UX Researcher at Spotify',
    initials: 'AT',
    color: 'from-[#d1fae5] to-[#6ee7b7]',
    featured: false,
  },
  {
    quote: "Applied to 12 roles, heard back from 9. My recruiter actually complimented my resume format — that's never happened before.",
    name: 'Daniel Park',
    role: 'Software Engineer at Stripe',
    initials: 'DP',
    color: 'from-[#ede9fe] to-[#c4b5fd]',
    featured: false,
  },
  {
    quote: "The tailor feature is insane. I paste a job description and it tells me exactly what's missing. Interviews went from 10% to 60% callback rate.",
    name: 'Leila Nasser',
    role: 'Product Manager at Shopify',
    initials: 'LN',
    color: 'from-[#fff7ed] to-[#fed7aa]',
    featured: false,
  },
  {
    quote: "I used three other tools before this. Rezoomed is the only one that felt like it actually understood what recruiters are looking for.",
    name: 'Ryan Okafor',
    role: 'Operations Lead at Airbnb',
    initials: 'RO',
    color: 'from-[#fef9c3] to-[#fde047]',
    featured: false,
  },
]
```

- [ ] **Step 3: Replace the testimonials section JSX in app/page.tsx**

Find and replace the entire testimonials `<section>` (the one with `py-28 px-6 bg-[#f8faf9]`):
```tsx
{/* ── Testimonials ───────────────────────────────────────────────── */}
<section className="py-28 bg-[#f8faf9] overflow-hidden">
  <div className="max-w-7xl mx-auto px-6">
    <div className="text-center space-y-4 mb-16 reveal-on-scroll active">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#026d32]">What people say</p>
      <h2 className="text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
        Trusted by job seekers worldwide.
      </h2>
    </div>
  </div>

  <div className="testimonial-mask">
    <div className="testimonial-track flex w-max gap-6 px-6">
      {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
        <div
          key={i}
          className={`w-[340px] shrink-0 rounded-3xl p-7 flex flex-col justify-between space-y-5 ${
            t.featured
              ? 'bg-[#026d32] border border-[#026d32]'
              : 'bg-white border border-zinc-100 shadow-sm'
          }`}
        >
          <div className="space-y-4">
            <div className="flex">
              {[...Array(5)].map((_, j) => (
                <span key={j} className="text-[#FFB800] text-sm">★</span>
              ))}
            </div>
            <p className={`text-base leading-7 ${t.featured ? 'text-white/90' : 'text-zinc-700'}`}>
              &ldquo;{t.quote}&rdquo;
            </p>
          </div>
          <div className={`flex items-center gap-3 pt-2 border-t ${t.featured ? 'border-white/20' : 'border-zinc-100'}`}>
            <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-[11px] font-black text-zinc-800 shrink-0`}>
              {t.initials}
            </div>
            <div>
              <p className={`text-sm font-black ${t.featured ? 'text-white' : 'text-zinc-900'}`}>{t.name}</p>
              <p className={`text-xs ${t.featured ? 'text-white/60' : 'text-zinc-500'}`}>{t.role}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 4: Verify testimonials carousel in browser**

Check `http://localhost:3000` → scroll to testimonials. The 8 cards (duplicated to 16 for seamless loop) should auto-scroll horizontally. Hovering should pause. The first card (Priya Sharma) should be dark green.

- [ ] **Step 5: Commit**
```bash
git add app/page.tsx app/globals.css
git commit -m "feat: testimonials — 8 reviews, auto-scrolling carousel with pause-on-hover"
```

---

## Task 6: CTA Section — gradient background, italic heading

**Files:**
- Modify: `app/page.tsx` (CTA section, lines ~183–210)

- [ ] **Step 1: Update CTA section background and heading**

Find `<section className="py-28 px-6 bg-[#026d32] overflow-hidden relative">` and replace the section opening and its h2:

Background class change:
```tsx
// Before
<section className="py-28 px-6 bg-[#026d32] overflow-hidden relative">

// After
<section className="py-28 px-6 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #022c14 0%, #026d32 50%, #019a47 100%)' }}>
```

Heading change (find `<h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Ready to get hired faster?</h2>`):
```tsx
<h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
  Ready to get <em className="italic">hired faster?</em>
</h2>
```

- [ ] **Step 2: Verify CTA section**

Check `http://localhost:3000` → scroll to the bottom CTA. The background should fade from very dark green (#022c14) through mid green to bright green (#019a47). The heading should show "hired faster?" in italic.

- [ ] **Step 3: Commit**
```bash
git add app/page.tsx
git commit -m "feat: CTA section — dark-to-green gradient bg, italic heading"
```

---

## Task 7: Footer — near-black background with green tint

**Files:**
- Modify: `app/page.tsx` (footer, lines ~213–224)

- [ ] **Step 1: Update footer background and border**

Find `<footer className="w-full py-12 px-8 border-t border-zinc-800 bg-zinc-950">` and change to:
```tsx
<footer className="w-full py-12 px-8 border-t border-zinc-800/60 bg-[#0a0f0b]">
```

Find `<span className="font-black text-white text-lg">Rezoomed</span>` and change to:
```tsx
<span className="font-black text-white text-xl tracking-tight">Rezoomed</span>
```

- [ ] **Step 2: Verify footer**

Check `http://localhost:3000` → scroll to footer. The background should be very dark with a subtle green tint. Logo should be slightly larger.

- [ ] **Step 3: Commit**
```bash
git add app/page.tsx
git commit -m "feat: footer — near-black bg with green tint, larger logo"
```

---

## Task 8: Final visual QA pass

- [ ] **Step 1: Full page scroll check at 1440px width**

Open `http://localhost:3000` at full desktop width. Scroll from top to bottom, verify:
- Nav: "Sign Up Free →" visible, Sign In has dark hover
- Hero: italic green line, two CTAs, trust text, 3 float cards visible
- Logo marquee: real brand logos scrolling (check network tab if icons don't load — simpleicons.org must be reachable)
- Feature showcase: "into a system." in green italic
- Testimonials: auto-scrolling carousel, pauses on hover, dark green first card
- CTA: gradient background visible (dark→mid→bright green), italic "hired faster?"
- Footer: near-black tint

- [ ] **Step 2: Mobile check at 375px**

Resize browser to 375px width. Verify:
- Hero float cards hidden (they use `hidden md:block`)
- Dual CTAs stack to column on small screens (they use `flex-wrap`)
- Testimonial carousel still scrolls (fixed card width, overflow hidden)
- Logo marquee still scrolls

- [ ] **Step 3: Final commit**
```bash
git add -A
git commit -m "feat: landing page redesign complete — Bold & Elevated direction"
```
