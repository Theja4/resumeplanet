# Design System Document

## 1. Overview & Creative North Star: "The Optic Curator"

This design system is built upon the concept of **"The Optic Curator."** It is a high-end light mode experience that rejects the cluttered, line-heavy aesthetic of traditional dashboards in favor of a breathable, editorial layout. We prioritize "Optic Precision"—the idea that every element is placed with surgical intentionality, using white space and tonal shifts rather than borders to define structure.

The system breaks the "template" look through:
*   **Intentional Asymmetry:** Using the Spacing Scale to create offset layouts that guide the eye naturally across the page.
*   **Overlapping Depth:** Treating the UI as a series of physical, stacked layers of fine paper and frosted glass.
*   **High-Contrast Scale:** Leveraging dramatic shifts between `display-lg` and `body-sm` to create an authoritative, editorial hierarchy.

## 2. Colors: Tonal Precision

Our palette is anchored by the mint green primary accent, balanced against a sophisticated range of "cool" grays that provide depth without introducing visual noise.

### The Palette
*   **Primary (`#026d32`) & Primary Container (`#A3FFB3`):** The mint green is our signature. Use the `primary_container` for high-visibility highlights and the `primary` green for actionable items to ensure AAA contrast.
*   **Surface Hierarchy:**
    *   **Background (`#f8f9fa`):** The clean, crisp canvas.
    *   **Surface Container Lowest (`#ffffff`):** Reserved for the highest level of "lifted" content, like primary cards.
    *   **Surface Container High (`#e7e8e9`):** Used for recessed areas or sidebars to create grounding.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section sitting directly on a `surface` background provides all the definition a user needs.

### The "Glass & Gradient" Rule
To elevate the experience beyond standard flat design:
*   **Glassmorphism:** For floating modals or navigation bars, use `surface` colors with a 70% opacity and a `20px` backdrop-blur. 
*   **Signature Gradients:** For Hero backgrounds or primary CTAs, use a subtle linear gradient transitioning from `primary_container` (`#A3FFB3`) to `primary_fixed_dim` (`#80da92`) at a 135-degree angle.

## 3. Typography: Plus Jakarta Sans

We use **Plus Jakarta Sans** for its modern, geometric clarity and high readability in light mode.

*   **Display (lg/md/sm):** Used for editorial headlines. Keep letter-spacing at `-0.02em` to feel tight and custom.
*   **Headline & Title:** Use these to establish authority. The transition from `headline-lg` to `title-md` should be used to move the reader from "the big idea" to "the details."
*   **Body (lg/md/sm):** Our workhorse. `body-md` (`0.875rem`) is the standard for content. Always use `on_surface_variant` (`#3f493f`) for long-form body text to reduce eye strain compared to pure black.
*   **Labels:** For technical data or "Optic Precision" metadata. Use `label-md` in all-caps with `+0.05em` letter-spacing for a "spec-sheet" aesthetic.

## 4. Elevation & Depth: Tonal Layering

We convey hierarchy through physical stacking rather than traditional drop shadows.

*   **The Layering Principle:** Place a `surface-container-lowest` card on top of a `surface-container-low` section. The subtle shift from `#ffffff` to `#f3f4f5` creates a soft, natural lift.
*   **Ambient Shadows:** If a floating element is required (e.g., a dropdown), use a shadow with a blur radius of `24px` and a Y-offset of `8px`. The color must be `on_surface` at `6%` opacity to mimic natural ambient light.
*   **The "Ghost Border" Fallback:** If a border is essential for accessibility, use the `outline_variant` token at `20%` opacity. **Forbid 100% opaque, high-contrast borders.**
*   **Precision Glass:** Overlapping elements should utilize backdrop blurs. This "frosted glass" effect allows the mint green accents to bleed through the surfaces, making the layout feel integrated.

## 5. Components

### The Brand Block
The logo (the slanted, stylized 'R') must always sit to the immediate left of the brand name 'Rezoomed'. 
*   **Placement:** Top-left of the primary navigation.
*   **Typography:** `title-lg` or `headline-sm`, semi-bold.

### Buttons
*   **Primary:** Background of `primary_container` (`#A3FFB3`), text color `on_primary_container` (`#19793c`). Roundedness: `md` (`0.375rem`).
*   **Secondary:** Background of `secondary_container`, no border.
*   **Tertiary:** No background. Use `label-md` styling. 

### Cards & Lists
*   **Forbid dividers:** Use vertical white space from the Spacing Scale (e.g., `spacing-8`) to separate list items.
*   **Card Styling:** Use `surface-container-lowest` with a `lg` (`0.5rem`) corner radius. No border.

### Precision Inputs
*   **Fields:** Use `surface-container-low` for the fill.
*   **Indicator:** A 2px bottom-bar of `primary` green appears only on `:focus`. This maintains a "clean" look until the user interacts.

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins (e.g., 80px left, 40px right) for hero sections to create an editorial feel.
*   **Do** use `primary_fixed_dim` for subtle background washes behind icons.
*   **Do** prioritize vertical rhythm by strictly adhering to the Spacing Scale.

### Don't
*   **Don't** use 1px solid black or dark grey borders. Ever.
*   **Don't** use standard "drop shadows" with high opacity. They break the "Optic Precision" feel.
*   **Don't** crowd the mint green. It is an accent; if used on more than 10% of the screen real estate, it loses its premium impact.