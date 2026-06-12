# Product

## Register

product

## Users

A small group of friends planning a trip together — one organizer creates the trip and invites the rest via a link + PIN. Everyone proposes activities and restaurants, votes on what to do in each day-block (morning / afternoon / evening), and the organizer commits the winners into a final itinerary. Used in two contexts: relaxed evening planning on a laptop before the trip, and quick on-the-go checks from a phone during it.

## Product Purpose

Travalava turns group trip planning from a chaotic chat thread into a structured, fair process: propose → vote → commit. Success looks like a group reaching a final itinerary everyone feels ownership of, without one person doing all the work or one loud voice deciding everything. The committed itinerary is the prize — a single clean source of truth for the trip.

## Brand Personality

Warm, playful, communal. Planning should feel like the trip has already started — anticipation, not administration. Voice is informal and friendly ("Who's in?" energy), never corporate. The fun comes from the group dynamic the UI makes visible: votes landing, a block getting committed, friends joining.

## Anti-references

- **Corporate SaaS dashboards** — no enterprise gray density, KPI stat cards, or B2B sterility.
- **Booking.com / Expedia-style conversion UI** — no urgency banners, deal badges, countdown timers, or cluttered upsell chrome.
- **Generic AI template** — no purple-gradient heroes, decorative glassmorphism, or identical icon-card grids.

## Design Principles

1. **Planning is part of the trip.** Every screen should carry anticipation. Moments that matter (a vote cast, a block committed, a friend joining) deserve warmth and feedback; the rest stays quiet.
2. **The group state is the interface.** Who proposed, who voted, what's winning, what's locked — collective state must be legible at a glance, because consensus is the product.
3. **Earned familiarity.** Standard affordances and one consistent component vocabulary (shadcn/ui). Personality comes from tone, color moments, and microcopy — never from reinvented controls.
4. **Converge to one truth.** The UI always pulls toward the committed itinerary. Planning surfaces can be busy; the final itinerary is calm, clean, and shareable.
5. **Works from a beach with two bars of signal.** Mobile-first responsiveness, fast loads, readable in sunlight. Mid-trip use is a first-class context, not an afterthought.

## Accessibility & Inclusion

WCAG AA baseline: ≥4.5:1 body-text contrast, full keyboard navigability with visible focus rings, labelled controls, `prefers-reduced-motion` alternatives for all animation. Color never the sole carrier of voting/commit state (pair with icons or text).
