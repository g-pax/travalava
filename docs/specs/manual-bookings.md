# Feature: Manual Bookings (Anchors)

## Summary
Allow users to add flight and lodging entries manually to anchor the itinerary. These appear above blocks for the relevant day(s).

## Scope
- Manual add of flights and lodgings
- Display on itinerary days

## Functional Requirements
- FR-1101 Flight: airline, flight number, depart datetime+airport, arrive datetime+airport, notes.
- FR-1102 Lodging: name, address, check-in datetime, check-out datetime, notes.
- FR-1103 Display bookings at top of corresponding day(s) in read-only form.

## Acceptance Criteria
Feature: Manual bookings
  Scenario: Add a flight anchor
    Given a trip
    When I add flight AB123 from LPA 10:00 to BCN 13:30 on 2025-11-04
    Then the flight appears above the day blocks for 2025-11-04

  Scenario: Add a lodging anchor
    Given a trip
    When I add lodging "Casa Azul" with check-in 2025-11-02 15:00 and check-out 2025-11-06 11:00
    Then the lodging appears on each relevant day above the blocks
