---
description: 'Use for any task involving the Turneo Experiences API — searching experiences, checking rates/availability, creating orders, confirming bookings, or referencing Turneo data structures. Enforces local-first doc lookup and correct booking flow sequence.'
applyTo: '**'
---

# Turneo Experiences API — Integration Guide

## Documentation Lookup Order

1. **Local reference first**: Read `docs/turneo-api-reference.md` for endpoint details, flow steps, parameters, and schemas.
2. **Online docs second** (only if local doc is insufficient): Fetch from <https://turneo.stoplight.io/docs/turneo-experiences-api/bmnf53wld2cdf-getting-started-with-experiences>
3. **API Reference (Stoplight)**: <https://turneo.stoplight.io/docs/turneo-experiences-api/a7b2faa999fc0-turneo-api>

Do NOT guess or fabricate endpoints. If information is not in the local doc or online docs, ask the user.

## API Base URLs

| Environment | Base URL                                                            |
| ----------- | ------------------------------------------------------------------- |
| Production  | `https://api.pro.turneo.co`                                         |
| Mock Server | `https://stoplight.io/mocks/turneo/turneo-experiences-api/45542131` |

## Authentication

All requests require the `x-api-key` header:

```
x-api-key: <api-key>
```

## Booking Flow Sequence (MUST follow this order)

```
Step 1: GET /experiences              → returns experienceId
Step 2: GET /experiences/{id}/rates   → returns rateId, priceCalendar, rateRules, bookingFields
         GET /experiences/{id}/availabilities → returns availabilityId
Step 3: POST /orders                  → returns orderId (status: ON_HOLD, 30min hold)
Step 4: POST /orders/{id}/confirm     → finalizes the booking
```

**Rules:**

- Never create an order without first checking rates AND availabilities
- Never confirm an order without first creating it
- Always check `rateRules` to determine regular vs private rate flow
- Always check `bookingFields` for required additional booking info
- Availability is time-sensitive — always fetch fresh before order creation

## Accuracy Guardrails

- Every endpoint, HTTP method, and parameter suggested MUST exist in `docs/turneo-api-reference.md` or the official online docs
- Do not invent query parameters, response fields, or endpoints
- When unsure about a field or behavior, consult the docs — do not assume
- Use the mock server URL for development/testing examples; production URL for deployment code
