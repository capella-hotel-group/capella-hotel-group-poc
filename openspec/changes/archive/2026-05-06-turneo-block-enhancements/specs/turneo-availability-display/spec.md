## ADDED Requirements

### Requirement: Display availability dates in detail popup

The system SHALL fetch and display rate availability data using a 2-step API flow when the experience detail popup is opened.

#### Scenario: Popup opens and fetches rates

- **WHEN** user opens an experience detail popup
- **THEN** the system calls `GET /experiences/{experienceId}/rates?from={today}&until={today+30days}` to get rate IDs, then for each rate ID calls `GET /experiences/{experienceId}/rates/{rateId}?from=...&until=...` with `Prefer: code=200, dynamic=true` to retrieve availability dates

#### Scenario: Availability display format

- **WHEN** rate detail data is returned
- **THEN** each rate SHALL display its name, status (rateStatus), and a list of available dates with startDate, startTime, and availableQuantity

#### Scenario: No rates found

- **WHEN** the list rates API returns zero rate IDs
- **THEN** the system displays a "No availability found" message in the popup

#### Scenario: Rate detail fetch fails

- **WHEN** an individual rate detail API call fails
- **THEN** that rate is skipped without breaking the rest of the popup

#### Scenario: All rate fetches fail

- **WHEN** the list rates API call itself fails
- **THEN** the system displays an error message in the availability section without breaking the rest of the popup

### Requirement: API requests use correct headers

The system SHALL include `Prefer` header with configurable `dynamic` value and `x-api-key` headers in all Turneo API requests.

#### Scenario: API request headers

- **WHEN** any Turneo API call is made
- **THEN** the request headers SHALL include `Accept: application/json`, `x-api-key`, and `Prefer: code=200, dynamic={config.dynamicMock}`

#### Scenario: Rate detail uses dynamic=true

- **WHEN** the retrieve-a-rate endpoint is called for availability dates
- **THEN** the `Prefer` header SHALL use `dynamic=true` to get varied availability data
