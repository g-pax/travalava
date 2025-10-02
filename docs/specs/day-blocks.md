# Feature: Day Blocks (Morning / Afternoon / Evening)

## Summary
Auto-generate three planning blocks per day for the trip. Labels are editable per day.

## Scope
- Auto create Morning, Afternoon, Evening per day
- Rename block labels per day
- Reorder days (optional)

## Functional Requirements
- FR-101 On trip creation, create N days between start_date and end_date.
- FR-102 Each day has 3 blocks: "Morning", "Afternoon", "Evening".
- FR-103 Organizer can rename a block label for a specific day.
- FR-104 Display day list with blocks; show committed activity (if any) and proposals count.

## Non-Functional
- P95 render time of a 10-day itinerary view ≤ 250 ms when cached.

## Acceptance Criteria
Feature: Day blocks
  Scenario: Auto-generated blocks per day
    Given a trip from 2025-11-01 to 2025-11-07
    When I open the itinerary
    Then each day shows Morning, Afternoon and Evening blocks

  Scenario: Rename a block
    Given I am the Organizer
    When I rename Morning to Early for 2025-11-02
    Then the block label for that day displays "Early"
