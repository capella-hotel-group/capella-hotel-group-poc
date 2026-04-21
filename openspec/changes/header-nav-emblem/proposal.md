## Why

The luxury header block's center emblem placeholder needs a concrete asset. The brand SVG (a two-polygon star/crest motif) has been provided and must be saved as the canonical icon file and rendered at 16px width, centered between the DESTINATIONS and EXPERIENCES nav links.

## What Changes

- Add the brand crest SVG as `/icons/capella-emblem.svg` in the project's icon directory
- Update the header center-nav zone to render the emblem at exactly 16px width, vertically and horizontally centered between the two navigation links
- Ensure the SVG color is controlled by CSS (currentColor or a CSS variable) so it integrates with the monochrome luxury palette

## Capabilities

### New Capabilities

- `header-nav-emblem-asset`: The Capella crest SVG is saved as a versioned icon asset and rendered inline at 16px width, centered between DESTINATIONS and EXPERIENCES in the header navigation zone

### Modified Capabilities

<!-- No existing spec-level requirements are changing outside the header-luxury-layout spec already under luxury-header-block -->

## Impact

- `/icons/capella-emblem.svg` — new file (the provided SVG with `.st0{fill}` converted to `currentColor` for CSS-driven theming)
- `src/blocks/header/header.ts` — update emblem rendering to use `<img src="/icons/capella-emblem.svg">` (or inline SVG) at `width: 16px`
- `src/blocks/header/header.css` — add `.header-emblem` sizing and centering rules
- No model changes required; the emblem is a static brand asset, not authored content
- No new npm dependencies
