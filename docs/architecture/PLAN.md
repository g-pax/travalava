Step-by-Step Implementation Plan (no bootstrap steps)

Each step has: DB, server/edge, client, tests, and done criteria. Follow the phases; ship after Phase 2 for earliest validation.

Phase 1: Core planning loop
Step 1: Trips, Members, Invites, PIN

DB: trips, trip_members with RLS; invite_token_version, pin_hash.

Edge: invite.join

Inputs: tripId, displayName, pin, clientDeviceId.

Validates version & PIN; inserts member; returns scoped JWT.

Client: Trip create form; invite settings (PIN set/rotate); join page.

Tests: join with correct PIN; rotation invalidates old link; RLS denies non-members.

Done: organizer creates trip; collaborator joins via link+PIN and sees trip shell.

Step 2: Days & Blocks

DB: days, blocks seeded on trip creation. Unique (trip_id, date).

Client: Itinerary page rendering days with Morning/Afternoon/Evening; rename block label per day.

Tests: N-day generation correct; label rename persists.

Step 3: Activities & Proposals

DB: activities, activity_photos, block_proposals.

Client: Activity form (RHF+Zod), assign to multiple blocks, list with attributes.

Storage: photo upload via signed URL; client compress before upload.

Tests: create activity; assign to two blocks; proposal appears in both.

Step 4: Votes, Windows, Commit

DB: votes, commits; add optional vote_open_ts, vote_close_ts on block.

Edge: vote.cast (enforce window); block.commit (tally, tie manual).

Client: Voting UI with multi-select; block header shows tally; commit panel for organizer.

Tests: vote allowed inside window, rejected after close; commit picks highest; tie requires manual choice.

Phase 2: Hygiene & Context
Step 5: Duplicate Policy

DB: trips.duplicate_policy enum.

Edge: block.commit enforces soft|prevent|allow and updates other proposals accordingly.

Client: Trip setting; warning banners on soft; hard stop on prevent.

Tests: three policy modes exercised; side effects verified.

Step 6: Weather Overlay

Client: Weather adapter; show per-day badges; manual refresh.

Edge/Server: none required if fetching client-side; otherwise tiny edge proxy to hide keys.

Tests: cache age; manual refresh; provider fallback.

Phase 3: Utilities
Step 7: Expenses Lite + Receipts TTL

DB: expenses, expense_splits.

Edge: receipts.purge cron; signed URL generator.

Client: Add expense; equal/custom split; balances; receipt upload; expired badge after TTL.

Tests: split math; permissions; TTL purge idempotent.

Step 8: Checklists

DB: checklists, checklist_items.

Client: Trip checklist; activity checklist; assignee filter; “My items.”

Tests: CRUD; assignee view.

Step 9: Comments

DB: comments.

Client: Threads on activity/block; mentions; edit window.

Tests: mention resolves; delete own within 10 min; RLS.

Phase 4: Offline & Sync
Step 10: PWA, Cache, Queue, Conflicts

SW: Workbox routes for static, API GET; background sync for queued mutations.

Client: IDB queue with clientMutationId; conflict toasts; React Query persist.

Edge: accept client_mutation_id on all mutations; enforce idempotency.

Tests: offline add activity/vote; reconnect sync; conflict last-writer wins; additive merges.

Phase 5: Read-only Share
Step 11: Public View Link with PIN

DB: share_enabled, share_token_version, pin_hash reuse or separate field.

Edge: share.issue, share.revoke, share.viewAuth (validate token+PIN, mint viewer JWT).

Client: Toggle share, set PIN; public read-only route that hides edit controls.

Tests: viewer sees itinerary; revoked link stops working; PIN enforced; RLS read-only.

Implementation Notes & Patterns per Step

Validation: use Zod for all inbound payloads. Return typed errors the UI can map to toasts.

React Query:

Keys: ['trip', tripId], ['days', tripId], ['blocks', tripId], ['proposals', tripId], etc.

Mutations optimistic with rollbacks on error; invalidate relevant keys on settle.

Idempotency: all mutations include clientMutationId. Server stores it in a per-table unique column or a sidecar table and returns 409 on duplicate; client treats as success.

Edge Functions: keep them skinny; push as much as possible into SQL with SECURITY DEFINER RPC where safe, but prefer edge for token logic.

RLS: unit-test with anon keys to ensure leakage never happens.

Currency/Time: store money as numeric in trip currency; display with Intl APIs; store times in UTC with trip timezone field for display and window logic.

Images: compress client-side, enforce max dimensions (e.g., 2000px max side), strip EXIF.

“Definition of Done” per Phase

Phase 1 DoD: Two browsers can plan: create trip, join via link+PIN, add activities, assign, vote, commit. RLS tight. Ties manual.

Phase 2 DoD: Duplicate policy works, weather displays, and warnings make sense.

Phase 3 DoD: Expenses, checklists, comments usable and permissions correct.

Phase 4 DoD: Offline read/write works; queued actions sync; conflicts surfaced.

Phase 5 DoD: Public view link with PIN can be issued and revoked; read-only enforced.