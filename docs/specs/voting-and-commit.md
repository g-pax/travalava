# Feature: Voting & Commit

## Summary
Collaborators vote on proposed activities per block. Majority (highest votes) wins at or after a voting window. Organizer commits the winner. Ties are resolved manually by Organizer.

## Scope
- Vote model: 1 user = 1 vote per activity per block; user may vote for multiple activities in a block
- Voting window: Organizer sets open/close times per block (optional)
- Manual tie-break by Organizer
- Commit winner, lock block

## Functional Requirements
- FR-301 Vote create/delete per user per activity per block.
- FR-302 Allow multiple selections per block per user.
- FR-303 Organizer can set a voting open and close time per block (timezone = trip timezone).
- FR-304 When voting window ends, mark block as "awaiting commit" if not committed.
- FR-305 Organizer can commit at any time; winner is activity with highest votes.
- FR-306 If tie exists, Organizer must choose one; no automatic tie-break.
- FR-307 On commit, block is locked for proposals and voting; comments remain open.

## Edge Cases
- Late votes after window are rejected.
- Organizer override of winner allowed with rationale note (stored).

## Acceptance Criteria
Feature: Voting and commit
  Scenario: Cast multiple votes in a block
    Given proposals exist in a block
    When I vote for two activities
    Then both votes are recorded for me in that block

  Scenario: Voting window enforcement
    Given a block voting window ended at 18:00
    When I attempt to vote at 18:05
    Then my vote is rejected with a message "Voting closed"

  Scenario: Organizer commits winner
    Given voting has ended and one activity has the highest votes
    When the Organizer commits the winner
    Then the block becomes locked and displays the committed activity

  Scenario: Manual tie-break
    Given two activities are tied for highest votes
    When the Organizer selects one and commits
    Then the selected activity is committed and the other remains uncommitted
