## Context

The `turneo-experiences` block currently fetches experiences from the Turneo API and renders a card grid with a detail popup. It works but lacks visual polish (no fallback images, no min-height, no headline), the popup isn't fullscreen, there's no date filtering, and availability data isn't displayed. The block uses `src/utils/turneo-api.ts` for API calls and `src/configs/turneo.ts` for configuration.

Current stack: TypeScript + Vite, CSS-only styling, DOMPurify for sanitization, `@/*` import aliases.

## Goals / Non-Goals

**Goals:**

- Resilient image display with fallback for broken URLs
- Proper section sizing (min 100vh) with standard padding
- Author-configurable section headline via content model
- True fullscreen detail popup (100vw × 100vh)
- Date range filtering in the list view using `from`/`until` API params
- Dynamic mock responses via `Prefer` header for easier testing
- Availability slot display in the detail popup using `GET /availabilities`

**Non-Goals:**

- Full booking flow (order creation, confirmation) — stop at availability display
- Custom date picker component — use native HTML `<input type="date">`
- Rate display or pricing logic in the detail popup
- Pagination of availability results

## Decisions

### 1. Fallback image strategy

Use an `onerror` handler on `<img>` elements that replaces the `src` with a neutral placeholder SVG (inline data URI). This avoids an extra network request and works even offline.

**Alternative considered:** Hide broken images entirely with CSS `display:none`. Rejected because it causes layout shift and empty cards.

### 2. Section layout (min-height + padding)

Apply `min-height: 100vh` and padding via CSS on the block wrapper (`.turneo-experiences`). Use CSS custom properties for padding values: `var(--section-padding-y)` and `var(--section-padding-x)` falling back to `80px` and `24px` respectively.

### 3. Headline from content model

Add a first-row text cell in the AEM content model for the headline. The `decorate()` function reads the first cell as headline text and renders an `<h2>` element above the grid. If empty, no headline is rendered.

### 4. Fullscreen popup

Change the popup `.turneo-experiences-popup-content` to `width: 100vw; height: 100vh; max-width: none; max-height: none; border-radius: 0;` so it fills the entire viewport. The overlay remains as the backdrop.

### 5. Date range filter

Add two `<input type="date">` elements and a "Filter" button above the grid. Filtering only triggers on button click (not on input change) to avoid unintended UI reloads. Dates use ISO 8601 format (YYYY-MM-DD) as required by the Turneo API.

### 6. Prefer header for dynamic mock responses

Add `Prefer: code=200, dynamic={config.dynamicMock}` to the headers object in all API calls. The `dynamicMock` boolean is configurable in `src/configs/turneo.ts`. The retrieve-a-rate endpoint always uses `dynamic=true` to get varied availability data for testing.

### 7. Availability display in detail popup

Use a 2-step API flow:

1. `GET /experiences/{experienceId}/rates?from=...&until=...` — returns nested arrays of rate IDs.
2. For each rate ID: `GET /experiences/{experienceId}/rates/{rateId}?from=...&until=...` with `Prefer: code=200, dynamic=true` — returns full rate detail including `availableDates` array.

Render each rate's name, status, and available dates (startDate, startTime, availableQuantity). Default window: today → today+30 days. Failed individual rate fetches are skipped gracefully.

## Risks / Trade-offs

- **[Native date inputs on Safari/iOS]** → Acceptable since this is a PoC; a polyfill or custom picker can be added later.
- **[Availability data volume]** → Default to 30-day window; no pagination needed for PoC scope.
- **[Prefer header in production]** → Only affects mock server behavior; production API ignores unknown headers. Safe to leave in for now.
- **[Inline fallback SVG increases HTML size slightly]** → Negligible for a data URI placeholder.
