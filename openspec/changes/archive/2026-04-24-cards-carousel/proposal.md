## Why

The Capella Hotel Group corporate site (capellahotelgroup.com) features an "Our Collection" section — a horizontal drag-scrollable strip of hotel property cards. The current AEM EDS project has no equivalent block. A dedicated `cards-carousel` block lets authors showcase a collection of linked cards (hotels, properties, highlights) in a horizontally scrollable carousel with drag interaction, matching the reference site's visual language.

## What Changes

- Add a new `cards-carousel` block (`src/blocks/cards-carousel/`) with TypeScript decorator, CSS, and AEM component model JSON.
- Carousel engine references the `activities` block's track-based drag/tween pattern but simplified: no clones, no infinite loop, snap-to-nearest on pointer release.
- Each card is a linked item with image (5:7 portrait), title, subtitle, and URL.
- Prev/next arrow navigation with edge-clamping (disabled at first/last position).
- Responsive: fixed card width, cards-per-view recalculated on viewport resize via ResizeObserver.
- Custom floating "Drag" cursor label on hover, replicating the reference site interaction.

## Capabilities

### New Capabilities

- `cards-carousel-block`: The carousel block implementation — DOM structure, drag/snap engine, arrow navigation, responsive layout, drag cursor, and CSS styling.
- `cards-carousel-content-model`: AEM Universal Editor component model — definitions, item model fields (image, title, subtitle, link), and section filter entry.

### Modified Capabilities

_(none — no existing spec requirements change)_

## Impact

- **New files**: `src/blocks/cards-carousel/cards-carousel.ts`, `cards-carousel.css`, `_cards-carousel.json`
- **Build**: Auto-discovered by Vite block entry scanner — no config changes needed.
- **JSON merge**: `npm run build:json` will pick up `_cards-carousel.json` and merge definitions/models/filters into root JSON files.
- **Dependencies**: No new npm dependencies. Carousel engine is vanilla TypeScript (RAF + tween), same pattern as `activities`.
- **Existing blocks**: No modifications to any existing block.
