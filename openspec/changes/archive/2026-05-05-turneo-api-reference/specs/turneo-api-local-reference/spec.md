## ADDED Requirements

### Requirement: Local API reference document exists at docs/turneo-api-reference.md

The project SHALL contain a markdown file at `docs/turneo-api-reference.md` that consolidates the Turneo Experiences API documentation for local reference.

#### Scenario: File location and format

- **WHEN** a developer looks for Turneo API documentation in the project
- **THEN** they find `docs/turneo-api-reference.md` as a comprehensive markdown reference

### Requirement: Document includes API metadata

The reference document SHALL include the API version, base URL, mock server URL, and authentication method (x-api-key header) at the top.

#### Scenario: API metadata is present

- **WHEN** a developer opens the reference document
- **THEN** they see the production base URL (`https://api.pro.turneo.co`), mock server URL (`https://stoplight.io/mocks/turneo/turneo-experiences-api/45542131`), API version (v0.3), and auth header format (`x-api-key`)

### Requirement: Document covers the complete booking flow

The reference document SHALL document the full booking flow in sequential order: (1) Search Experiences, (2) Get Rates & Availabilities, (3) Create Order, (4) Confirm Order.

#### Scenario: Booking flow steps are documented

- **WHEN** a developer reads the reference document
- **THEN** they find sections for each flow step with HTTP method, endpoint path, required/optional parameters, and key response fields

### Requirement: Experiences search endpoints are documented

The reference SHALL document the `/experiences` GET endpoint with query parameters: `storeId`, `country`, `city`, `from`, `until`.

#### Scenario: Search by store

- **WHEN** a developer needs to list experiences for a hotel store
- **THEN** they find documentation for `GET /experiences?storeId={id}` with parameter descriptions

#### Scenario: Search by destination with date filter

- **WHEN** a developer needs to search experiences by location and dates
- **THEN** they find documentation for `GET /experiences?country={country}&from={ISO date}&until={ISO date}`

### Requirement: Rates and availabilities endpoints are documented

The reference SHALL document `GET /experiences/{experienceId}/rates` and `GET /experiences/{experienceId}/availabilities` endpoints with `from` and `until` parameters.

#### Scenario: Get rates for an experience

- **WHEN** a developer needs to retrieve pricing for an experience
- **THEN** they find documentation for `GET /experiences/{experienceId}/rates?from={date}&until={date}` including key response fields (`rateRules`, `bookingFields`, price calendar)

#### Scenario: Get availabilities for an experience

- **WHEN** a developer needs to check available slots
- **THEN** they find documentation for the availabilities endpoint returning bookable slots with `availabilityId`

### Requirement: Orders and bookings endpoints are documented

The reference SHALL document `POST /orders` (create order), `POST /orders/{id}/add`, `POST /orders/{id}/remove`, and `POST /orders/{orderId}/confirm`.

#### Scenario: Create order

- **WHEN** a developer needs to create a booking order
- **THEN** they find documentation for `POST /orders` including required fields (`travelerInformation`, booking objects with `availabilityId`)

#### Scenario: Confirm order

- **WHEN** a developer needs to finalize a purchase
- **THEN** they find documentation for `POST /orders/{orderId}/confirm` and the 30-minute ON_HOLD behavior

### Requirement: Document explains Order vs Booking distinction

The reference SHALL clearly explain that an Order is the parent object (purchased in one transaction) containing one or more Bookings (each corresponding to one availability slot / experience).

#### Scenario: Developer understands data model

- **WHEN** a developer reads the Orders section
- **THEN** they find a clear explanation of the Order → Booking relationship

### Requirement: Document includes a last-synced date and online reference link

The reference SHALL include a "Last synced" date and a link to the official online documentation for cross-referencing when the local doc may be outdated.

#### Scenario: Staleness check

- **WHEN** a developer suspects the local doc may be outdated
- **THEN** they see the last-synced date at the top and can follow the link to the online docs
