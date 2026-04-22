## Why

The header block currently only supports desktop layout. On mobile viewports (<600px) nav links and lang selector are too cramped or invisible. A mobile menu panel is needed to provide proper navigation on small screens, matching the production Capella Hotels site pattern.

## What Changes

- **Mobile header bar**: Replace lang selector + nav links with "MENU" text button (left), keep emblem (center) and CTA shortened to "BOOK" (right)
- **Mobile menu panel**: Slide-down panel below header containing nav links stacked vertically, "LANGUAGES" accordion with lang options, and a close button at bottom center
- **Desktop**: No changes — existing three-zone layout preserved, mobile elements hidden via CSS

## Capabilities

### Modified Capabilities

- `header-block`: Add mobile responsive layout with slide-down menu panel, MENU toggle, lang accordion, and close button

## Impact

- `src/blocks/header/header.ts`: Add mobile menu panel DOM (MENU toggle, panel with nav links, lang accordion, close button); toggle logic
- `src/blocks/header/header.css`: Add mobile media query (<600px) hiding desktop elements, showing mobile elements; slide-down transition; lang accordion styles; close button styles
- No model changes — same authored content (nav fragment)
