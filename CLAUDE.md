# CLAUDE Guidelines

Guidelines for AI agents contributing to this codebase. Follow these rules strictly. When in doubt, prefer established patterns here over ad-hoc solutions.

---

## 0. Prime Directives
- Build for performance, maintainability, and scalability in every change.
- Ship strictly typed **TypeScript**; document meaningful logic with concise comments or docstrings.
- Rely on **Tailwind CSS** for styling and respect **React** + **Next.js App Router** conventions.
- Lean on **Serena MCP** helpers for scaffolding, automation, and code generation.
- Deliver predictable, testable code that the team can own long-term.

---

## 1. Core Tech Stack
- **Next.js 15 (App Router)** with Server Actions disabled for now; favor Supabase JS from the client and edge functions for privileged work.
- **TypeScript** in strict mode with comprehensive type coverage.
- **Tailwind CSS** + **shadcn/ui** primitives imported from `@/components/ui/*`.
- **TanStack Query (React Query)** for server state, caching, and offline mutations.
- **Zustand** strictly for ephemeral UI state (e.g., modals, wizards, filters).
- **Zod** everywhere you accept input; share schemas across app, API, and tests.
- **Supabase** (Postgres with trip-scoped RLS, Auth with magic links, Storage, Edge Functions).
- **Workbox**-powered service worker for PWA/offline flows.
- **idb** or **dexie** to manage IndexedDB persistence and offline queues.
- **Sentry** (client + edge) for error tracking.

---

## 2. Folder Structure
```text
src/
  app/               # Routes, layouts, server components
  features/<name>/   # Feature slices (logic, UI, tests, docs)
  components/
    ui/              # shadcn/ui primitives only
    common/          # Composed primitives shared across features
  hooks/
  lib/
    serena/          # Serena MCP helpers
  supabase/
  utils/
  workers/
  types/
  api/
  schemas.ts
  types.ts
README.md
```
- Organize by feature under `src/features/<name>` with colocated hooks, schemas, and tests.
- Keep shared UI composites in `components/common` to avoid duplication.

---

## 3. React & Next.js Practices
- Default to server components inside `app/` unless interactivity demands a client boundary.
- Mark client components with `"use client"` at the top of the file.
- Route loaders and metadata should stay minimal; delegate work to feature modules.
- Prefer composition over inheritance; memoize only when profiling proves a need.

---

## 4. State Management
- **React Query** owns server-backed data: fetching, caching, optimistic updates, and invalidation.
- **Zustand** manages short-lived UI state; never mirror server data here.
- Derive state from props or queries whenever possible to avoid duplication.

---

## 5. Styling & Components
- Compose **shadcn/ui** primitives; do not fork their source.
- Author styles exclusively with Tailwind utility classes.
- Uphold accessibility: semantic markup, labelled controls, focus rings, and aria attributes.
- Import UI primitives explicitly, e.g. `import { Button } from "@/components/ui/button"`.

---

## 6. Serena MCP Usage
- Use Serena MCP for scaffolding forms, mutations, queries, tests, and docs.
- Store Serena-specific utilities in `src/lib/serena/`.
- Serena MCP must never install unauthorized packages, bypass security, or alter CI/CD without consent.

---

## 7. Supabase & Security
- Enforce RLS on every table keyed by `trip_id` and role.
- Handle authentication with magic links for organizers and signed invite tokens for collaborators.
- Perform sensitive mutations through edge functions; client code should call them rather than direct privileged queries.
- Generate signed URLs for Storage with 10-15 minute expirations.
- Rate-limit join/PIN attempts (e.g., `rate-limiter-flexible`) within edge functions.
- Require `clientMutationId` on all mutations for idempotency and offline retries.
- Issue share/invite tokens as JWTs with minimal claims (trip, role, exp) signed in an edge function.

---

## 8. Offline & PWA Strategy
- Use Workbox (or `workbox-window`) for service worker management; skip magic abstractions.
- Caching policies:
  - Static assets -> `StaleWhileRevalidate`.
  - API GET requests -> `NetworkFirst` with offline fallback.
  - Mutations -> enqueue in IndexedDB and replay with deterministic `clientMutationId`.
- Persist React Query cache using `react-query-persist-client`.
- Implement a background sync queue in IndexedDB with records `{ id, entity, op, payload, createdAt }`.
- Keep offline UX explicit: toast sync status, disable conflicting actions, provide retry hints.

---

## 9. Forms & UX
- Build forms with `react-hook-form` + `@hookform/resolvers/zod`.
- Use `react-dropzone` for file inputs and `browser-image-compression` to keep uploads <= 1.5 MB and fix EXIF rotation.
- Provide optimistic UX and toast feedback for success/failure.

---

## 10. Dates, Timezones, and Locale
- Standardize on **Luxon** (or Day.js + timezone plugin) but do not mix libraries.
- Work in the trip's timezone for scheduling, reminders, and voting windows.
- Use `Intl` for currency, numbers, and date formatting; avoid manual string formatting.

---

## 11. Maps, Geocoding, and Weather
- MVP ships without maps; when needed, use **Leaflet** + **OpenStreetMap** tiles (self-host if usage scales).
- Consider **LocationIQ** for higher-volume geocoding; respect Nominatim rate limits if used.
- Abstract weather providers behind a `WeatherProvider` interface; start with AccuWeather (free tier) or Open-Meteo.

---

## 12. Markdown & Rich Text
- Keep markdown support minimal: bold, italics, links.
- Sanitize user-generated content with `dompurify` or a remark/rehype whitelist.
- Avoid exposing raw HTML or unsafe markdown plugins.

---

## 13. Validation & Error Handling
- Validate every external input with Zod before use.
- Normalize Supabase and edge errors into user-friendly toasts; never surface raw stack traces.
- Log structured JSON with sensitive fields masked.

---

## 14. Documentation Standards
- Each feature directory maintains a `README.md` describing goals, schemas, key hooks, and components.
- Components and modules include a top-level comment summarizing responsibility when logic is non-trivial.
- Edge functions begin with a header comment covering purpose, inputs/outputs, and RLS expectations.

---

## 15. Testing & Quality
- **Vitest** + **React Testing Library** for units and integration tests.
- **Playwright** for happy-path E2E: create trip -> invite -> join -> add activity -> vote -> commit.
- Cover idempotency, RLS enforcement, offline sync conflicts, and serialization edge cases.
- Keep ESLint/Biome outputs clean; no unchecked warnings.

---

## 16. Performance, Accessibility, and i18n
- Ship small, composable components; code-split or lazy-load heavyweight blocks.
- Audit accessibility: keyboard flows, skip links, aria-live for async status.
- Prefetch critical data when beneficial but avoid unnecessary network chatter.
- Default to trip timezone and locale-aware formatting for all date/time displays.

---

## 17. Logging & Observability
- Instrument client and edge code with **Sentry**; capture release + environment metadata.
- Forward structured logs to Tinybird, Logflare, or Supabase logs for lightweight analytics.
- Ban `console.log` in production bundles.

---

## 18. Coding Standards
- Maintain strict TypeScript; justify any `any` usage inline.
- Follow naming conventions: components in `PascalCase`, hooks prefixed with `use`, types as `SomethingInput`, schemas as `SomethingSchema`.
- Favor pure functions and deterministic outputs; isolate side effects.

---

## 19. Git & PR Process
- Use Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).
- PR checklist:
  - [ ] Tests added or updated
  - [ ] Docs updated
  - [ ] RLS respected
  - [ ] No conflicting dependencies
- Attach screenshots for UI changes and note any migration steps.

---

## 20. Allowed Utilities
- **nanoid** for opaque identifiers in URLs.
- **dompurify** for markdown sanitization.
- **browser-image-compression** for media uploads.

---

## 21. Example Component
```tsx
// src/features/activities/components/activity-form.tsx
"use client";

/**
 * ActivityForm handles create/update flows for activities.
 * - Validated with Zod schema via react-hook-form resolver.
 * - Enqueues offline mutations with clientMutationId for idempotency.
 */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActivitySchema, type ActivityInput } from "../schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ActivityForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useForm<ActivityInput>({ resolver: zodResolver(ActivitySchema) });

  const onSubmit = async (values: ActivityInput) => {
    // Serena MCP helper scaffolds mutation + background queue.
    // Enqueue mutation with deterministic clientMutationId and invalidate queries.
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Input placeholder="Title" {...form.register("title")}/>
      <Button type="submit">Save</Button>
    </form>
  );
}
```

---

## 22. When in Doubt
- Follow precedent already in the repository.
- Preserve composition over premature abstraction.
- Keep PRs small and reviewable.
- Default to this document as the source of truth until updated.

