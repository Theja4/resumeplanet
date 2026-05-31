# LinkedIn Extension — Mascot image prompts (Imagen)

The `/linkedin-optimizer` landing page ships working today using existing assets:

| Slot | Current file | Used in |
|---|---|---|
| Hero | `/public/ats-mascot.webp` (bunny with magnifying glass) | `Hero()` |
| CTA | `/public/Brands/mascot-hero-pink.webp` (bunny + checklist) | `CTA()` |

The prompts below generate **LinkedIn-specific upgrades**. Feed Imagen your existing
mascot as the reference image (recommended seed: `public/Brands/mascot-hero-pink.png`
or `public/ats-mascot.webp`) so the character stays on-model.

## Locked character description (paste into every prompt)

> A cute chubby 3D-rendered cartoon rabbit mascot, glossy soft-clay / Pixar style.
> Pure white body, large rounded head, tall upright ears with soft pink inner ears,
> big glossy black oval eyes with a single white highlight, small pink blush cheeks,
> tiny content smile. Smooth matte-plastic surface, soft studio lighting, gentle
> ambient occlusion. Brand green accents only (`#026d32` deep green / `#A3FFB3` mint).
> **Transparent background (PNG with alpha).** No text, no logos, no LinkedIn
> wordmark or "in" logo, no human hands. Centered, full body unless noted.

## Render settings
- Aspect ratio: **3:4** (portrait) for hero/CTA; **1:1** for badges.
- Output: PNG with transparent background.
- After generating, export a **`.webp`** (quality ~82) to match the other site assets and keep it light, then drop it in `public/linkedin-extension/`.

---

### 1. Hero — "Profile inspector" (`public/linkedin-extension/hero-inspect.webp`)
> [locked description] + The rabbit leans in holding a large silver magnifying glass
> up to one eye, inspecting a floating translucent profile card (a generic person
> silhouette circle + a few green-checkmarked list lines, NO LinkedIn branding).
> The eye behind the glass is comically enlarged. Curious, focused expression.
> Three small mint-green sparkles float nearby. 3:4 portrait, transparent background.

### 2. CTA — "Optimized & celebrating" (`public/linkedin-extension/cta-celebrate.webp`)
> [locked description] + The rabbit floats mid-air in a triumphant pose, one paw
> raised in a fist pump, wearing a small flowing green superhero cape tied with a
> green neckerchief knot. A floating profile card with a green "98" score ring and
> green checkmarks hovers beside it. Green confetti ribbons and sparkles around it.
> Joyful open smile. 3:4 portrait, transparent background.

### 3. Score-ring mascot — "Holding the gauge" (`public/linkedin-extension/score-hold.webp`)
> [locked description] + The rabbit hugs / holds a large circular progress-ring gauge
> in front of its body, the ring filled about two-thirds with a green-to-mint gradient
> arc. Proud, encouraging expression, looking at the viewer. 1:1 square, transparent
> background. (Use as the floating score-card character.)

### 4. Privacy strip — "Guardian" (`public/linkedin-extension/privacy-shield.webp`)
> [locked description] + The rabbit stands confidently holding a softly glowing
> rounded green shield with a small white padlock emblem (no text). Calm, reassuring,
> slightly protective stance. Works on a dark background, so add a subtle mint rim
> light on the edges. 3:4 portrait, transparent background.

### 5. Empty-state / 404 (optional) — "Searching" (`public/linkedin-extension/searching.webp`)
> [locked description] + The rabbit shrugs with both paws up, ears slightly drooped,
> a small question mark sparkle above its head, magnifying glass tucked under one arm.
> Gentle puzzled-but-friendly expression. 1:1 square, transparent background.

---

## Wiring new images in

Once exported to `public/linkedin-extension/`, update
`components/landing/LinkedInExtensionLanding.tsx`:

- `Hero()` → swap `src="/ats-mascot.webp"` for `"/linkedin-extension/hero-inspect.webp"`.
- `CTA()` → swap `src="/Brands/mascot-hero-pink.webp"` for `"/linkedin-extension/cta-celebrate.webp"`.
- (optional) `PrivacyStrip()` → add the guardian image; `ScoreRing` card → add `score-hold`.

Keep the `width`/`height` props proportional to the new file's aspect ratio so
Next.js reserves correct layout space (no CLS).
