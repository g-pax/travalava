# Feature: Offline & Sync (PWA)

## Summary
The app works offline after first load. Edits are queued and synchronized on reconnect with deterministic conflict handling.

## Scope
- PWA install
- Caching of static assets and recent trip data
- Offline queue for mutations
- Conflict handling

## Functional Requirements
- FR-901 Installable PWA with service worker.
- FR-902 Cache static assets and last N=3 opened trips for offline viewing.
- FR-903 Queue mutations offline with deterministic client mutation IDs; retry with backoff.
- FR-904 Conflict policy: last-writer-wins per field; list merges for additive sets (votes, proposals); show conflict toast when overwriting occurs.

## Non-Functional
- Cold offline load ≤ 2 s for a cached trip.
- Sync failure rate ≤ 0.2% over 7 days.

## Acceptance Criteria
Feature: Offline & Sync
  Scenario: Offline view
    Given I opened a trip online previously
    When I go offline and open the PWA
    Then I can view itinerary, proposals, votes, expenses and checklists

  Scenario: Offline edit and sync
    Given I am offline
    When I add an activity and cast a vote
    Then the actions are queued
    And when I reconnect
    Then the actions are synced and visible to others

  Scenario: Conflict resolution
    Given another user edited the same activity title
    When my offline edit syncs later
    Then last-writer-wins applies and I see a conflict notification
