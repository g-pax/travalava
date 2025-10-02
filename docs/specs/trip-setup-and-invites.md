# Feature: Trip Setup & Invites

## Summary
Create a trip, define basics (destination, dates, timezone, currency), and invite collaborators via link. Collaborators join without accounts using a PIN set by the organizer.

## Scope
- Trip CRUD (create, update basics, archive)
- Invite link generation and rotation
- Optional PIN gate on invite link
- Display name capture for collaborators
- Roles: Organizer, Collaborator

## Out of Scope (MVP)
- Multiple organizers per trip
- Email-based invites
- SSO

## Functional Requirements
- FR-001 Create trip with: name, destination (city/country), start_date, end_date, timezone, currency.
- FR-002 Generate invite link (unguessable id) at creation; allow regenerate/revoke.
- FR-003 Organizer can set a numeric PIN (4–8 digits). PIN required for first join per device.
- FR-004 Collaborator join flow: open link → enter display name → enter PIN if enabled → join trip.
- FR-005 Roles: Organizer can edit trip basics, rotate link, set PIN; Collaborators cannot.
- FR-006 Show member list with join times and role; Organizer can remove members.
- FR-007 Data retention: archive after 18 months of inactivity; hard delete after 30-day grace.

## Permissions
- Organizer: full trip config, member management.
- Collaborator: read trip basics, no config.

## Non-Functional
- Availability 99.5% monthly for read ops.
- Security: RLS by trip; TLS 1.2+; AES-256 at rest.

## Acceptance Criteria (Gherkin)
Feature: Trip setup and invites
  Scenario: Organizer creates a trip
    Given I am authenticated as an Organizer
    When I create a trip with name, destination, start/end dates, timezone and currency
    Then a trip is saved and an invite link is generated

  Scenario: Organizer sets a PIN for the invite link
    Given a trip exists
    When I set a 6-digit PIN
    Then subsequent joins via the link require that PIN

  Scenario: Collaborator joins by link with PIN
    Given a valid invite link with a PIN
    When I open the link, enter my display name and the correct PIN
    Then I am added to the trip as a Collaborator

  Scenario: Organizer rotates the invite link
    Given a trip with an active invite link
    When I rotate the link
    Then the previous link becomes invalid and a new link is issued

  Scenario: Organizer removes a member
    Given a member is in the trip
    When I remove the member
    Then the member loses access immediately
