## ADDED Requirements

### Requirement: Date range filter in experience list

The system SHALL display date range inputs (from/until) and a Filter button above the experience grid that filter experiences by availability dates when the button is clicked.

#### Scenario: User selects a date range and clicks Filter

- **WHEN** user sets `from` and/or `until` date inputs and clicks the Filter button
- **THEN** the system re-fetches experiences with `from` and `until` query parameters (ISO 8601 format YYYY-MM-DD) passed to `GET /experiences`

#### Scenario: Date range is cleared and Filter is clicked

- **WHEN** user clears the date inputs and clicks Filter
- **THEN** the system re-fetches experiences without date params (shows all)

#### Scenario: Only one date is set

- **WHEN** user sets only `from` or only `until` and clicks Filter
- **THEN** the system passes the single date param to the API (partial filter)

#### Scenario: Dates do not trigger auto-fetch

- **WHEN** user changes a date input without clicking Filter
- **THEN** the system does NOT re-fetch (avoids unintended UI reloads)
