## Why

The current header block lacks the refined, editorial aesthetic required for a luxury hospitality brand. A redesigned header that balances whitespace, typography, and symmetry will establish the visual tone expected by high-end guests and align the site with Capella's brand positioning.

## What Changes

- Replace the existing header block layout with a three-section sticky header (language selector · centered nav + emblem · CTA button)
- Add a language selector dropdown (English, 简体中文, 日本語) with fade/slide animation — no flag icons
- Center the primary navigation around a small monochrome brand emblem with DESTINATIONS and EXPERIENCES links
- Add a "BOOK YOUR STAY" rectangular CTA button with taupe/warm-gray background
- Make the header sticky/fixed at `position: fixed`, full-width, height ~70px
- Apply subtle box-shadow divider at the bottom; no shrink-on-scroll behavior

## Capabilities

### New Capabilities

- `header-luxury-layout`: Three-zone fixed header with language selector, centered brand navigation, and CTA button, implementing the luxury hospitality design system

### Modified Capabilities

<!-- No existing spec-level requirements are changing -->

## Impact

- `src/blocks/header/header.ts` — full rewrite of decorate logic
- `src/blocks/header/header.css` — full rewrite of styles using CSS tokens
- `component-models.json` / `component-definition.json` — header block model fields (language options, nav links, CTA label)
- No new npm dependencies
- No breaking changes to other blocks or the AEM model schema beyond the header component itself
