# Feature: Duplicate Scheduling Control

## Summary
Control whether the same activity can be scheduled across multiple blocks/days. MVP default is "Soft Block": warn on duplicates and allow on explicit confirmation.

## Modes
- Soft Block (default): warn if committing an activity already committed elsewhere; Organizer can confirm to allow duplicate or choose another proposal.
- Prevent Duplicates: block committing the same activity in more than one block across the trip.
- Allow Duplicates: no restriction; duplicates are allowed without warnings.

## Functional Requirements
- FR-401 Trip setting "duplicate_policy" ∈ {soft_block, prevent, allow}; default soft_block.
- FR-402 On commit, enforce policy:
  - soft_block: show warning with prior commitments; allow confirm to proceed or cancel.
  - prevent: disallow commit; require deselect or copy-as-new-activity.
  - allow: proceed silently.
- FR-403 When an activity is committed in one block, any proposals of the same activity in other blocks are:
  - soft_block: tagged "already scheduled" and require explicit confirm to keep or remove.
  - prevent: automatically removed from other blocks.
  - allow: unchanged.

## Acceptance Criteria
Feature: Duplicate scheduling control
  Scenario: Soft block warning
    Given duplicate_policy is soft_block
    And an activity was already committed on Monday Morning
    When I try to commit the same activity on Tuesday Afternoon
    Then I see a warning "Already scheduled" and I can confirm or cancel

  Scenario: Prevent duplicates
    Given duplicate_policy is prevent
    When I try to commit an already committed activity elsewhere
    Then the commit is blocked with an explanation

  Scenario: Allow duplicates
    Given duplicate_policy is allow
    When I commit an already committed activity elsewhere
    Then the commit succeeds without warnings
