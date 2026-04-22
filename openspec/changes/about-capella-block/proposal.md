## Why

The homepage of capellahotels.com features a prominent editorial section (`#section_aboutcapella`) that introduces the brand story with a heading/subtitle row, a full-width image, and a body text/CTA area. This pattern exists in the live site but has no equivalent AEM EDS block in this PoC, leaving that section of the homepage unrepresentable in the Universal Editor.

## What Changes

- Add a new `about-intro` block under `src/blocks/about-intro/` with `.ts`, `.css`, and `_about-intro.json` files.
- The block renders: a two-column heading row (title left, subtitle right), a full-width image, and a body text + optional CTA link beneath it.
- Register the block in `component-definition.json`, `component-models.json`, and `component-filters.json` via the build:json merge pipeline.

## Capabilities

### New Capabilities

- `about-intro-block`: An editorial block that displays a brand introduction section: two-column heading (title + subtitle), full-width image, body text, and an optional CTA link. Intended for homepage or brand-story pages.

### Modified Capabilities

<!-- No existing capability specs change. -->

## Impact

- **New files**: `src/blocks/about-intro/about-intro.ts`, `src/blocks/about-intro/about-intro.css`, `src/models/_about-intro.json`
- **JSON config files**: `component-definition.json`, `component-models.json`, `component-filters.json` regenerated via `npm run build:json`
- **No breaking changes** to existing blocks or shared utilities
- **No new npm dependencies** required
