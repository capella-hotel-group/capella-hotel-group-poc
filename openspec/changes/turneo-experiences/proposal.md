## Why

The Capella Hotel Group PoC needs to showcase curated guest experiences powered by the Turneo Experiences API. Currently there is no block to display available experiences, making it impossible for guests to browse and initiate bookings from the website. Adding a dedicated experience listing block enables the marketing team to surface experiences directly on property pages.

## What Changes

- Add a new `turneo-experiences` block that fetches and displays experiences from the Turneo API (`GET /experiences`)
- Render experiences as a responsive card grid with thumbnail, title/headline, description, and a "Book" CTA
- Implement a fullscreen detail popup (triggered on CTA click) with:
  - Image slider showing all experience thumbnails
  - Complete experience information (location, duration, categories, included/excluded items, pricing, organizer details)
  - Layout styled like an e-commerce product detail page
- Console log the selected experience's full data on CTA click for debugging/integration purposes
- Use the Turneo mock server for development; production API key configured via environment

## Capabilities

### New Capabilities

- `turneo-experiences-listing`: Card grid block that fetches experiences from Turneo API and renders them with images, titles, descriptions, and booking CTAs
- `turneo-experience-detail`: Fullscreen popup overlay displaying complete experience details with image slider, structured as a product detail page

### Modified Capabilities

## Impact

- New block: `src/blocks/turneo-experiences/` (`.ts`, `.css`, `_turneo-experiences.json`)
- New utility for Turneo API calls (fetch wrapper with `x-api-key` header)
- New CSS for card grid layout and fullscreen detail popup/slider
- Must register block in `src/models/_section.json` filter
- Depends on: `DOMPurify` (sanitizing API response HTML), environment config for API base URL
