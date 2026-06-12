---
name: Travalava
description: Group trip planning that feels like the trip already started — propose, vote, commit.
colors:
  sunset-coral: "oklch(0.66 0.15 35)"
  coral-hover: "oklch(0.60 0.15 35)"
  coral-deep: "oklch(0.50 0.13 35)"
  sea-teal: "oklch(0.55 0.095 180)"
  ink: "oklch(0.129 0.042 264.7)"
  bg: "oklch(1 0 0)"
  surface-muted: "oklch(0.968 0.007 247.9)"
  muted-text: "oklch(0.554 0.046 257.4)"
  border: "oklch(0.929 0.013 255.5)"
  success: "oklch(0.55 0.15 150)"
  warning: "oklch(0.62 0.14 75)"
  destructive: "oklch(0.577 0.245 27.3)"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.sunset-coral}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.coral-hover}"
    textColor: "{colors.ink}"
  button-secondary:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-outline:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  card:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "24px"
  input:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
---

# Design System: Travalava

## 1. Overview

**Creative North Star: "The Group Table"**

Travalava's interface is the table a group of friends gathers around the night they decide the trip is really happening — maps unfolded, everyone's hands in the plan, snacks at the edges. It is a **product surface**: standard, trustworthy controls (shadcn/ui vocabulary, one sans family, flat bordered surfaces) carry the work, while warmth lives in deliberate moments — a vote landing, a block committing, a friend joining. The tool stays quiet so the group's energy is the loudest thing on screen.

The system explicitly rejects corporate SaaS density (KPI cards, gray enterprise chrome), Booking.com-style conversion pressure (urgency banners, deal badges), and the generic AI template (purple-gradient heroes, glassmorphism, identical icon-card grids). Migration note: the current code still carries hardcoded `blue-600` accents and blue→purple gradients from its scaffold era — these are **legacy**, replaced on touch by the palette below.

**Key Characteristics:**
- Warm coral accent on a calm, bordered, paper-white surface
- One type family (Geist) at a tight product scale
- Group state — who voted, what's winning, what's locked — always legible at a glance
- Delight reserved for moments (vote, commit, join), never ambient decoration
- Mobile-first: planned on a laptop, checked from a beach

## 2. Colors: The Sunset-and-Sea Palette

A retro travel-poster pairing — one warm voice over cool, quiet neutrals.

### Primary
- **Sunset Coral** (oklch(0.66 0.15 35)): the single saturated voice. Primary buttons, the current selection, active vote states, progress moments. Always paired with **Ink** text — never white. Hover deepens to **Coral Hover** (oklch(0.60 0.15 35)); on light backgrounds, links and accents use **Coral Deep** (oklch(0.50 0.13 35)), which holds ≥4.5:1 on white.

### Secondary
- **Sea Teal** (oklch(0.55 0.095 180)): sparing, informational. Location/map touches, the occasional secondary highlight. Never competes with coral on the same component.

### Neutral
- **Ink** (oklch(0.129 0.042 264.7)): all primary text.
- **Paper** (oklch(1 0 0)): page and card background.
- **Surface Muted** (oklch(0.968 0.007 247.9)): panels, secondary buttons, quiet wells.
- **Muted Text** (oklch(0.554 0.046 257.4)): metadata and captions only — never body copy.
- **Border** (oklch(0.929 0.013 255.5)): the 1px structural lines that do the work shadows don't.

### State
- **Success** (oklch(0.55 0.15 150)): committed blocks, confirmed joins.
- **Warning** (oklch(0.62 0.14 75)): pending windows, duplicate-activity warnings.
- **Destructive** (oklch(0.577 0.245 27.3)): errors, removals.

### Named Rules
**The One Warm Voice Rule.** Sunset Coral is the only saturated color on any screen and covers ≤10% of it. Its rarity is what makes a vote landing feel like something.
**The Gradient Ban.** Color gradients are prohibited — on text, buttons, avatars, icons, everywhere. The legacy blue→purple avatar gradients are scheduled for removal, not imitation.
**The State-Is-Sacred Rule.** Green, amber, and red mean committed, pending, and error. They are never used decoratively, and color is never the sole carrier — always pair with an icon or a word.

## 3. Typography

**Display Font:** Geist (with system-ui fallback)
**Body Font:** Geist — one family carries everything
**Mono Font:** Geist Mono (codes/PINs only)

**Character:** A single contemporary sans, tuned for product work: friendly at large sizes, invisible at small ones. Personality comes from the writing, not the letterforms.

### Hierarchy
- **Display** (700, 2.25rem, 1.1, -0.02em): trip names and page heroes only.
- **Headline** (700, 1.5rem, 1.2): section heads — "Itinerary", "Final Itinerary", day headings.
- **Title** (600, 1.125rem, 1.3): card titles, block labels, dialog headers.
- **Body** (400, 0.875rem, 1.5): the workhorse; prose capped at 65–75ch.
- **Label** (500, 0.75rem, 1.3): form labels, badges, metadata.

### Named Rules
**The One Family Rule.** Geist everywhere. No display fonts, no second sans, no script — at any size, for any occasion.

## 4. Elevation

Flat and bordered. Surfaces sit on the page at rest; structure comes from 1px borders and background tints (Surface Muted wells inside Paper cards), not from floating. Shadows exist solely to mark **overlay layers** — things that are literally above the page.

### Shadow Vocabulary
- **Overlay** (`box-shadow: 0 10px 30px -10px rgb(0 0 0 / 0.15)`): dialogs, dropdowns, popovers, toasts. Nothing else.

### Named Rules
**The Overlay-Only Rule.** If it doesn't float above the page, it doesn't cast a shadow. A card with a shadow at rest is a bug.

## 5. Components

Friendly and tactile: generous radii (10–14px on containers), visible hover feedback within 150ms, and standard affordances throughout — the shadcn/ui vocabulary is the single source of component truth.

### Buttons
- **Shape:** softly rounded (8px radius), 40px height, 8×16px padding.
- **Primary:** Sunset Coral background with Ink text — warm, confident, unmistakably the main action. Hover: Coral Hover.
- **Hover / Focus:** background shift ≤150ms; focus is a 2px ring in the ring token with offset — visible on every interactive element, no exceptions.
- **Secondary / Outline / Ghost:** Surface Muted fill / 1px Border with Paper fill / transparent with hover tint. Destructive uses the Destructive token.

### Cards / Containers
- **Corner Style:** generous (14px).
- **Background:** Paper, with Surface Muted for nested wells (never nested cards).
- **Shadow Strategy:** none at rest (see Elevation); 1px Border does the separation.
- **Internal Padding:** 24px desktop, 16px mobile.

### Inputs / Fields
- **Style:** 1px Border stroke on Paper, 8px radius, 40px height.
- **Focus:** 2px ring, same vocabulary as buttons.
- **Error:** Destructive border + message below in Destructive at Label size; never color alone.

### Vote Chip (signature)
The unit of group decision-making. A pill showing an activity's vote count and the voters' names; unvoted it is Surface Muted with Ink text, your own vote fills it Sunset Coral with Ink. The count change animates once, briefly (≤200ms scale-settle) — the one place ambient playfulness is allowed, because it *is* state.

### Navigation
- Top bar with the trip's tab nav (Itinerary / Activities / Restaurants); active tab marked by Coral Deep text + 2px underline, not a filled pill. Mobile collapses to the same tabs, horizontally scrollable.

## 6. Do's and Don'ts

### Do:
- **Do** pair Sunset Coral exclusively with Ink text (white-on-coral fails AA at this lightness).
- **Do** make group state instantly scannable: voter names beside counts, a green Committed badge with a lock icon, member avatars with initials.
- **Do** use skeletons that mirror layout while loading — never a lone centered spinner inside content.
- **Do** keep motion 150–250ms, ease-out, state-driven, with a `prefers-reduced-motion` fallback for every animation.
- **Do** design empty states that teach: a new trip's itinerary should invite "create your days," not say "no data."

### Don't:
- **Don't** build corporate SaaS dashboards — no KPI stat cards, no gray enterprise density (PRODUCT.md anti-reference).
- **Don't** imitate Booking.com / Expedia conversion UI — no urgency banners, deal badges, or countdown timers (PRODUCT.md anti-reference).
- **Don't** ship the generic AI template — no purple-gradient heroes, no glassmorphism, no identical icon-card grids (PRODUCT.md anti-reference).
- **Don't** use gradients anywhere (The Gradient Ban) — including the legacy blue→purple avatar gradients still in the code.
- **Don't** use `border-left` thicker than 1px as a colored accent stripe on cards, list items, or alerts.
- **Don't** put Muted Text in body copy or placeholders that must be read — it is metadata-only.
- **Don't** reinvent standard controls for flavor; if shadcn/ui has it, use it.
