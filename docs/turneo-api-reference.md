# Turneo Experiences API — Local Reference

> **API Version:** v0.3  
> **Last synced:** 2026-05-05  
> **Online docs:** <https://turneo.stoplight.io/docs/turneo-experiences-api/bmnf53wld2cdf-getting-started-with-experiences>  
> **API Reference:** <https://turneo.stoplight.io/docs/turneo-experiences-api/a7b2faa999fc0-turneo-api>

## API Metadata

| Key                 | Value                                                               |
| ------------------- | ------------------------------------------------------------------- |
| Production Base URL | `https://api.pro.turneo.co`                                         |
| Mock Server URL     | `https://stoplight.io/mocks/turneo/turneo-experiences-api/45542131` |
| Authentication      | Header: `x-api-key: <your-api-key>`                                 |

All requests require the `x-api-key` header and `Accept: application/json`.

---

## Booking Flow Overview

The Turneo booking flow is **sequential** — each step returns IDs needed for the next:

```
1. Search Experiences  →  experienceId
2. Get Rates & Availabilities  →  rateId, availabilityId
3. Create Order  →  orderId
4. Confirm Order  →  confirmed booking
```

---

## 1. Searching Experiences

### Endpoint

```
GET /experiences
```

### Query Parameters

| Parameter | Type              | Required | Description                                              |
| --------- | ----------------- | -------- | -------------------------------------------------------- |
| `storeId` | string            | No       | Filter by hotel/seller store ID (pre-curated collection) |
| `country` | string            | No       | Filter by country name (e.g., `Barbados`)                |
| `city`    | string            | No       | Filter by city (returns experiences within 50km radius)  |
| `from`    | string (ISO 8601) | No\*     | Start date for availability filter                       |
| `until`   | string (ISO 8601) | No\*     | End date for availability filter                         |

\* `from` and `until` must both be provided together for date filtering.

### Search Strategies

**By store** (most common for hotel integrations):

```bash
curl -X GET "https://api.pro.turneo.co/experiences?storeId=123456789" \
  -H "Accept: application/json" \
  -H "x-api-key: YOUR_KEY"
```

**By destination with dates:**

```bash
curl -X GET "https://api.pro.turneo.co/experiences?country=Barbados&from=2024-10-11&until=2024-10-17" \
  -H "Accept: application/json" \
  -H "x-api-key: YOUR_KEY"
```

### Key Response Fields

The response is an array of experience objects. Key fields per experience:

| Field         | Description                                   |
| ------------- | --------------------------------------------- |
| `id`          | Experience ID — used in subsequent steps      |
| `name`        | Display name of the experience                |
| `description` | Experience description                        |
| `location`    | Location details (city, country, coordinates) |
| `images`      | Array of image URLs                           |
| `categories`  | Experience categories/tags                    |

---

## 2. Rates & Availabilities

After selecting an experience, retrieve pricing and available slots.

### Get Rates

```
GET /experiences/{experienceId}/rates
```

| Parameter      | Type                     | Required | Description               |
| -------------- | ------------------------ | -------- | ------------------------- |
| `experienceId` | string (path)            | Yes      | Experience ID from step 1 |
| `from`         | string (ISO 8601, query) | Yes      | Start date                |
| `until`        | string (ISO 8601, query) | Yes      | End date                  |

**Example:**

```bash
curl -X GET "https://api.pro.turneo.co/experiences/{experienceId}/rates?from=2024-10-11&until=2024-10-17" \
  -H "Accept: application/json" \
  -H "x-api-key: YOUR_KEY"
```

**Key Response Fields (per rate):**

| Field           | Description                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| `id`            | Rate ID                                                                                                  |
| `name`          | Rate name                                                                                                |
| `priceCalendar` | Array of bookable units with price and rules                                                             |
| `rateRules`     | Specifies if rate is `regular` (individual) or `private` — private rates follow a different booking flow |
| `bookingFields` | Additional info required when booking (e.g., dietary restrictions)                                       |
| `currency`      | Price currency                                                                                           |

### Get Availabilities

```
GET /experiences/{experienceId}/availabilities
```

| Parameter      | Type                     | Required | Description               |
| -------------- | ------------------------ | -------- | ------------------------- |
| `experienceId` | string (path)            | Yes      | Experience ID from step 1 |
| `from`         | string (ISO 8601, query) | Yes      | Start date                |
| `until`        | string (ISO 8601, query) | Yes      | End date                  |

**Key Response Fields (per availability slot):**

| Field            | Description                                  |
| ---------------- | -------------------------------------------- |
| `availabilityId` | Slot ID — **required for creating an order** |
| `date`           | Date of the slot                             |
| `startTime`      | Start time                                   |
| `endTime`        | End time                                     |
| `quantity`       | Available quantity for this slot             |

> **Important:** Availability gets stale quickly. Always check availability before attempting to book.

---

## 3. Orders & Bookings

### Order vs Booking — Key Distinction

- **Order**: Parent object purchased in one transaction. Contains one or more bookings.
- **Booking**: Child object within an order. Each booking corresponds to one availability slot (typically one experience instance).

Orders follow a shopping-cart pattern: create → (optionally add/remove items) → confirm.

### Create Order

```
POST /orders
```

**Request Body:**

```json
{
  "travelerInformation": {
    "firstName": "Tim",
    "lastName": "Smith",
    "email": "tim@example.com"
  },
  "bookings": [
    {
      "availabilityId": "<from step 2>",
      "rateId": "<from step 2>",
      "units": [
        {
          "unitId": "<unit from priceCalendar>",
          "quantity": 2
        }
      ],
      "bookingFields": {
        // Additional fields as required by rate's bookingFields
      }
    }
  ]
}
```

**Key points:**

- `travelerInformation` is required at the order level
- Each booking needs `availabilityId` (from availabilities endpoint) and `rateId` (from rates endpoint)
- Check `rateRules` to determine if it's a regular or private rate (different flow)
- Check `bookingFields` on the rate for required additional information

**Response:** Returns the created order with `id` and status `ON_HOLD`.

### Add Booking to Order (optional)

```
POST /orders/{id}/add
```

Add additional booking objects to an existing order (shopping cart behavior). Only works while order is `ON_HOLD`.

### Remove Booking from Order (optional)

```
POST /orders/{id}/remove
```

Remove a booking from an order. Only works while order is `ON_HOLD`.

### Confirm Order

```
POST /orders/{orderId}/confirm
```

**Example:**

```bash
curl -X POST "https://api.pro.turneo.co/orders/{orderId}/confirm" \
  -H "Accept: application/json" \
  -H "x-api-key: YOUR_KEY"
```

**Important:** Orders are held `ON_HOLD` for **30 minutes**. If not confirmed within that window, the reserved availability is released. Typically, charge the customer before confirming.

---

## Mock Server

For development and testing, use the Turneo mock server:

```
Base URL: https://stoplight.io/mocks/turneo/turneo-experiences-api/45542131
```

The mock server returns example responses for all endpoints without requiring a real API key. Use it for:

- Local development without production credentials
- Testing integration flows end-to-end
- Prototyping UI against realistic response shapes

**Usage:** Replace the production base URL with the mock URL. The `x-api-key` header is still required but any value works.

```bash
curl -X GET "https://stoplight.io/mocks/turneo/turneo-experiences-api/45542131/experiences?storeId=123" \
  -H "Accept: application/json" \
  -H "x-api-key: mock"
```

---

## Quick Reference — All Endpoints

| Step | Method | Endpoint                           | Purpose                      |
| ---- | ------ | ---------------------------------- | ---------------------------- |
| 1    | GET    | `/experiences`                     | Search/list experiences      |
| 2a   | GET    | `/experiences/{id}/rates`          | Get pricing and rate rules   |
| 2b   | GET    | `/experiences/{id}/availabilities` | Get bookable slots           |
| 3a   | POST   | `/orders`                          | Create order (shopping cart) |
| 3b   | POST   | `/orders/{id}/add`                 | Add booking to order         |
| 3c   | POST   | `/orders/{id}/remove`              | Remove booking from order    |
| 4    | POST   | `/orders/{id}/confirm`             | Confirm and finalize order   |
