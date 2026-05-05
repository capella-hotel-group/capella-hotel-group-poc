## 1. Local API Reference Document

- [x] 1.1 Create `docs/turneo-api-reference.md` with header section (title, last-synced date, online doc link, API version, base URLs, auth pattern)
- [x] 1.2 Write Section 1: Searching Experiences — document `GET /experiences` endpoint with all query parameters (`storeId`, `country`, `city`, `from`, `until`) and key response fields
- [x] 1.3 Write Section 2: Rates & Availabilities — document `GET /experiences/{experienceId}/rates` and `GET /experiences/{experienceId}/availabilities` with parameters, key response fields (`rateRules`, `bookingFields`, `availabilityId`, price calendar)
- [x] 1.4 Write Section 3: Orders & Bookings — document `POST /orders`, `POST /orders/{id}/add`, `POST /orders/{id}/remove`, `POST /orders/{orderId}/confirm` with required fields and the Order vs Booking distinction
- [x] 1.5 Add a Mock Server section with the mock base URL and usage notes for development

## 2. Copilot Instruction File

- [x] 2.1 Create `.github/instructions/turneo-api.instructions.md` with YAML frontmatter (`description`, `applyTo: "**"`)
- [x] 2.2 Write the instruction body: local-first lookup rule, embedded base URLs, auth pattern, mock server URL
- [x] 2.3 Document the booking flow sequence (experiences → rates/availabilities → orders → confirm) in the instruction
- [x] 2.4 Add accuracy guardrails: no fabricated endpoints, must match documented API, reference local doc path

## 3. Validation

- [x] 3.1 Verify all endpoints in the local reference match the official Turneo Stoplight docs
- [x] 3.2 Confirm the instruction file is picked up by Copilot (correct frontmatter format, valid `applyTo` glob)
