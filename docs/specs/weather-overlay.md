# Feature: Weather Overlay

## Summary
Display per-day forecast (high/low temperature, precipitation chance, conditions icon) for the trip destination. Refresh up to every 12 hours.

## Provider
- Use a provider abstraction with preference order:
  1) AccuWeather free tier if feasible within usage/terms,
  2) Otherwise a reliable free provider (e.g., Open-Meteo).
- Show source attribution in UI.

## Functional Requirements
- FR-501 Fetch 7–16 day forecast by destination coordinates.
- FR-502 Cache results per trip/day; stale-while-revalidate every 12 hours; manual refresh allowed.
- FR-503 Display for each day: high/low temp, precip probability (if available), condition icon/label.
- FR-504 If no forecast available (outside range), show “Forecast unavailable yet.”

## Non-Functional
- Forecast fetch failure rate < 5% over 7 days with retries/backoff.

## Acceptance Criteria
Feature: Weather overlay
  Scenario: Show forecast for each day
    Given a trip with dates within provider range
    When I view the itinerary
    Then each day shows high/low temperature and a condition indicator

  Scenario: Manual refresh
    Given the forecast is older than 12 hours
    When I click Refresh
    Then the app refetches and updates the displayed forecast or shows an error if the provider fails
