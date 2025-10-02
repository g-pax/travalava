# Feature: Read-only Share (No PDF in MVP)

## Summary
Generate a read-only link for viewing the itinerary. Organizer can revoke/rotate the link. Optional PIN protection applies to share links.

## Scope
- Public read-only link with obfuscated id
- Optional PIN requirement
- Revoke/rotate controls

## Functional Requirements
- FR-1001 Organizer can enable/disable read-only sharing per trip.
- FR-1002 Share link uses a scoped token with read-only claims; no edit endpoints accessible.
- FR-1003 Optional PIN can be set for read-only link; required to view.
- FR-1004 Organizer can revoke or rotate share link; old links become invalid.

## Acceptance Criteria
Feature: Read-only share
  Scenario: Enable share link with PIN
    Given a trip exists
    When I enable sharing and set a 4-digit PIN
    Then a read-only link is created and requires the PIN to view

  Scenario: Revoke share link
    Given a share link is active
    When I revoke it
    Then the link stops working immediately
