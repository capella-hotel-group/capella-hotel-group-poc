## Why

The turneo-experiences block has several UX and functionality gaps: broken images show no fallback, the section lacks proper min-height and spacing, there's no section headline, the detail popup isn't fullscreen, and there's no date filtering or availability display. These issues affect visual polish and prevent the block from being usable for real booking flows.

## What Changes

- Add fallback image handling for broken/missing experience image URLs
- Set section min-height to 100vh with standard padding (top, bottom, sides)
- Add a configurable headline to the section (authored via content model)
- Make the detail popup fullscreen (100vw × 100vh viewport coverage)
- Add a date range picker (from/until) to the experience list view that passes `from` and `until` query params to the Turneo API
- Add `Prefer: 'code=200, dynamic=true'` header to all Turneo API requests for dynamic mock responses
- Integrate the `GET /availabilities` endpoint in the detail popup to display available time slots for the selected experience

## Capabilities

### New Capabilities

- `turneo-date-filter`: Date range selection UI in the list view that filters experiences by availability dates via API params
- `turneo-availability-display`: Fetch and display availability slots (from `GET /availabilities`) inside the experience detail popup

### Modified Capabilities

_(none — no existing spec-level requirements are changing)_

## Impact

- **Files modified:** `src/blocks/turneo-experiences/turneo-experiences.ts`, `src/blocks/turneo-experiences/turneo-experiences.css`, `src/utils/turneo-api.ts`, `src/models/_turneo-experiences.json`
- **APIs:** Turneo `GET /experiences` (new query params), `GET /availabilities` (new integration)
- **Dependencies:** None added
- **Breaking:** None — all changes are additive
