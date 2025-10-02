1) Architecture Overview (MVP-ready, scalable, maintainable)
Objectives

Collaborative vacation planning with per-day blocks, proposals, voting, manual tie-break, duplicate policy, weather overlay, expenses with receipt TTL, checklists, scoped comments, offline PWA, link+PIN access, read-only share+PIN.

Group size < 10 per trip. No PDF export. No push notifications.

High-level Topology

Client (PWA, Next.js 15)
UI, service worker, offline cache, IndexedDB for queue/persist, React Query for server state, Zustand for ephemeral UI, Zod for validation, RHF for forms.

Supabase
Postgres (+RLS), Auth (organizer email magic-link), Storage (private bucket), Edge Functions (invite/share token ops, commit enforcement, cleanup).

External Providers
Weather adapter (prefer AccuWeather free tier; fallback Open-Meteo). Optional later: maps/geocoding.

[Browser PWA]
  ├─ React app (Next.js)
  ├─ Service Worker (Workbox)
  ├─ IndexedDB (Dexie/idb) ← offline queue + persisted cache
  └─ React Query (with persist)
        │
        ▼
[Supabase]
  ├─ Postgres (RLS by trip_id)
  ├─ Auth (organizer)
  ├─ Storage (receipts, photos; signed URLs)
  └─ Edge Functions (JWT invite/share, commit, receipt TTL purge)
        │
        ▼
[Weather Provider Adapter]
Feature Modules (domain slices)

Organize by feature folders under /src/features/*:

trip (create, invite, PIN, members, read-only share)

itinerary (days, blocks, bookings)

activities (CRUD, assign to blocks, photos)

voting (votes, windows, tally, commit)

duplicatePolicy (soft|prevent|allow)

weather (provider abstraction, cache)

expenses (splits, balances, receipts TTL)

checklists (trip/activity items, assignees)

comments (scoped threads, mentions)

offline (SW strategies, queue, conflict toasts)

Each feature owns:

UI components

Hooks (use*Query, use*Mutation)

Zod schemas

Minimal API client (Supabase queries + edge-function calls)

Types and tests

Data Model (Postgres, key columns only)

All tables include: id uuid pk, trip_id uuid, created_at, updated_at.
RLS policy: only members of trip_id may read/write, scoped by role.

trips(id, name, destination_text, lat, lon, start_date, end_date, timezone, currency,
      duplicate_policy enum('soft_block','prevent','allow') default 'soft_block',
      invite_token_version int default 1,
      share_enabled bool default false, share_token_version int default 0,
      pin_hash text null)

trip_members(id, trip_id, role enum('organizer','collaborator'), display_name text, user_id uuid null, joined_at)

days(id, trip_id, date date unique(trip_id, date))
blocks(id, day_id, label text, position int, unique(day_id, label))

activities(id, trip_id, title, category, cost_amount numeric(10,2) null, cost_currency char(3) null,
           duration_min int null, notes text, link text, location jsonb)

activity_photos(id, activity_id, storage_path text)

block_proposals(id, trip_id, block_id, activity_id, created_by, unique(block_id, activity_id))

votes(id, trip_id, block_id, activity_id, member_id, unique(block_id, activity_id, member_id))

commits(id, trip_id, block_id unique, activity_id, committed_by, committed_at)

bookings(id, trip_id, type enum('flight','lodging'), start_ts timestamptz, end_ts timestamptz, details jsonb)

expenses(id, trip_id, payer_member_id, amount numeric(10,2), currency char(3), occurred_on date, category, note, receipt_path text null, receipt_expires_at timestamptz null)

expense_splits(id, expense_id, member_id, share_percent numeric(5,2) null, share_amount numeric(10,2) null)

checklists(id, trip_id, activity_id uuid null)
checklist_items(id, checklist_id, title, assignee_member_id uuid null, due_date date null, status enum('todo','done'))

comments(id, trip_id, activity_id uuid null, block_id uuid null, author_member_id, body_md text, edited_at timestamptz null)

Indexes

days (trip_id, date), blocks (day_id), block_proposals (block_id), votes (block_id, activity_id), commits (block_id).

expenses (trip_id, occurred_on), expense_splits (expense_id).

comments (activity_id), comments (block_id).

Security Model

RLS everywhere: check trip_id plus role for writes.

Invite link + PIN: join via edge function invite.join that validates token version and PIN, creates trip_member with display_name, returns a scoped JWT limited to that trip_id.

Share link: edge function share.issue creates a read-only JWT with trip_id, role='viewer', ver=share_token_version, optional PIN check. share.revoke increments version.

Signed URLs for receipts/photos; expiry ≤ 15 min.

Rate limit PIN attempts per IP/device (edge function guard).

Audit: append-only log of material actions (commit, link rotate, member remove) in a simple audit table.

Offline & Conflict Strategy

Caching:

Static assets: StaleWhileRevalidate.

GET API: NetworkFirst with cache fallback.

Persist React Query cache to IndexedDB using @tanstack/react-query-persist-client.

Offline mutations: queue in IndexedDB with deterministic clientMutationId.
Server stores client_mutation_id to ensure idempotency.

Conflict policy:

Scalar fields: last-writer-wins (compare updated_at).

Additive lists (proposals, votes, comments): merge by id; duplicates ignored.

Commit is authoritative and locks the block.

Voting & Commit Logic (server-enforced)

Voting window stored per block (open_ts, close_ts). Edge function vote.cast rejects outside window.

Edge function block.commit:

Reads current votes; selects highest count.

If tie, requires organizer to specify activity_id.

Enforces duplicate_policy:

soft_block: allow with warning tag; mark other proposals “already scheduled.”

prevent: block if same activity_id committed elsewhere.

allow: proceed.

Writes commits row and locks block.

Weather Adapter

Interface: getForecast(lat, lon, dates[]) -> { date, tMin, tMax, precipProb?, icon, source }[]

Provider implementations: AccuWeatherProvider, OpenMeteoProvider.

Cache per trip/day in DB or client; SWR every 12h; manual refresh.

Expenses & TTL

Store receipt receipt_path, set receipt_expires_at = now() + interval '6 months'.

Edge function receipts.purge runs daily (cron) to delete files and null the path, set a status flag.

UX Flows (essential)

Invite & Join

Organizer creates trip → gets link → sets PIN → shares link.

Collaborator opens link → enters display name → enters PIN → joins as collaborator.

Plan

Days auto-generated with three blocks.

Users add activities with attributes; assign to blocks; others see proposals.

Vote

Users cast multiple votes per block; see counts in real time on refresh.

When window closes, block shows “awaiting commit.”

Commit & Duplicates

Organizer commits winner; duplicate policy enforced; block locks.

Activity instances elsewhere flagged or removed based on policy.

Weather

Per-day forecast badges on day cards; manual refresh.

Expenses

Add expense, select participants, split equal/custom; balances view.

Receipt shows; after 6 months expires.

Checklists & Comments

Trip/activity checklists with assignees.

Comments thread per activity/block; mentions with in-app cue.

Read-only Share

Organizer enables public view link plus PIN; can revoke at will.

Coding Patterns & Practices

Feature-first foldering, keep UI state local and server state in React Query.

Zod schemas co-located with forms and server payloads.

Optimistic updates for proposals, votes, comments; server reconciliation on settle.

Idempotent mutations using clientMutationId.

Strict types from Supabase (supabase gen types typescript …).

Accessibility: keyboard navigation, focus rings, ARIA on interactive components.

Internationalization ready: currency/timezone already per trip; isolate copy.

Performance & Scalability (within MVP constraints)

P95 ≤ 250 ms for cached itinerary: prefetch trip, days, blocks, proposals in parallel.

Use composite indexes listed above.

Avoid N+1: fetch proposals by trip_id batched, denormalize counts for votes view via small server view or client aggregation.

Store small photos (≤ 1.5 MB) to keep bandwidth sane.

Pagination isn’t critical with <10 users and small per-trip datasets, but structure queries to be limit/offset ready.

Testing Strategy

Unit: Zod schemas, utility functions (vote tally, duplicate checks).

Integration: Edge functions with Supabase test DB.

E2E: Playwright flows: create→invite→join→add activity→vote→commit; expense add/split; read-only link view.

Offline test: Playwright with network throttling/offline toggles.