# Feature: Activities (Proposals)

## Summary
Create activities with attributes and assign them as proposals to one or more blocks across days.

## Scope
- Activity CRUD
- Attributes: title, location, category, cost_estimate, duration_estimate, notes, external_link, photos
- Assign to blocks across multiple days

## Functional Requirements
- FR-201 Create activity with required: title; optional: lat/lng+address, category, cost (amount+currency), duration (minutes), notes, external_link, photos (images).
- FR-202 Assign an activity to one or more blocks across days.
- FR-203 Activity can be proposed in multiple blocks until a commit occurs elsewhere.
- FR-204 Show where an activity is proposed and any conflicts/commits.
- FR-205 Delete activity only if not committed; otherwise require uncommit or copy.

## Data Model (high level)
- activities(id, trip_id, title, category, cost_amount, cost_currency, duration_min, notes, link, location_json)
- block_proposals(id, activity_id, day_id, block_label)

## Acceptance Criteria
Feature: Activities
  Scenario: Add an activity with attributes
    Given I am in a trip
    When I add an activity with title, category, duration and location
    Then the activity is saved and visible in the activity list

  Scenario: Assign activity to multiple blocks
    Given an activity exists
    When I assign it to Morning on Monday and Afternoon on Tuesday
    Then it appears as a proposal in both blocks
