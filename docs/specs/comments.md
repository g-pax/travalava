# Feature: Comments (Scoped)

## Summary
Lightweight comments on activities and blocks to discuss proposals. No global chat.

## Scope
- Per-activity and per-block comment threads
- Mentions by display name
- Markdown-lite

## Functional Requirements
- FR-801 Add comment on activity or block with text (markdown-lite).
- FR-802 Mention @DisplayName to notify in-app.
- FR-803 Edit/delete own comments within 10 minutes; Organizer can moderate (remove).

## Acceptance Criteria
Feature: Comments
  Scenario: Comment on an activity with mention
    Given an activity exists
    When I post "Prefer early start @Dana"
    Then the comment appears under the activity and Dana is notified in-app

  Scenario: Delete own comment within window
    Given I posted a comment 2 minutes ago
    When I delete it
    Then it no longer appears in the thread
