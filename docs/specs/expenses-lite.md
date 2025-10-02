# Feature: Expenses (Lite)

## Summary
Log shared expenses, split among selected participants, attach a receipt photo. Maintain per-person balances. Receipt retention TTL = 6 months.

## Scope
- Expense CRUD
- Payer selection, participants selection
- Equal split or custom shares
- Receipt photo upload
- Balances summary

## Functional Requirements
- FR-601 Create expense: amount, currency (trip default), payer, participants[], date, category, note, receipt(optional).
- FR-602 Split logic: equal split by default; allow custom shares that sum to 100%.
- FR-603 Balances view per person: net owed or to receive across all expenses.
- FR-604 Receipt images stored in private bucket with signed URLs; client-side compression ≤ 1.5 MB.
- FR-605 Receipt retention: auto-delete images after 6 months; expense record remains with "receipt expired".

## Non-Functional
- Upload P95 ≤ 3 s on typical 4G.
- Access control: only trip members can view expenses of that trip.

## Acceptance Criteria
Feature: Expenses
  Scenario: Add shared expense with equal split
    Given a trip with 4 participants
    When I add a 100 EUR expense paid by Alice split among all
    Then each participant owes 25 EUR and balances update

  Scenario: Custom shares
    Given a trip with 3 participants
    When I set splits 50/30/20
    Then balances reflect those shares exactly

  Scenario: Receipt upload and retention
    Given I attach a receipt photo
    Then the photo is viewable by trip members
    And after 6 months the receipt is deleted and the expense shows "receipt expired"
