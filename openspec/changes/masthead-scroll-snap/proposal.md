## Why

When page content partially covers the sticky masthead (e.g. scrolled to ~40% of masthead height), the page looks awkward — the masthead is neither fully visible nor fully hidden. Adding scroll-snap behavior that auto-corrects to a clean state after a brief idle delay eliminates this half-covered visual artifact.

## What Changes

- Add scroll-snap logic inside `masthead-sticky` block: after 300ms of scroll idle, if `scrollY` is between 0 and masthead height, snap to nearest clean boundary (fully visible or fully hidden)
- Snap threshold at 50%: `scrollY / mastheadHeight < 0.5` → snap down (show full masthead); `>= 0.5` → snap up (hide masthead, header at top)
- Use native `window.scrollTo({ behavior: 'smooth' })` for the snap animation
- Guard against re-triggering during programmatic snap via `isSnapping` flag + `scrollend` event
- Snap only activates within masthead zone (`scrollY < mastheadHeight`); no effect when user is deeper in content

## Capabilities

### New Capabilities

- `masthead-scroll-snap`: Scroll-snap behavior that auto-corrects partial masthead visibility after scroll idle, using debounced threshold detection and native smooth scrolling

### Modified Capabilities

_(none — this is additive behavior within the existing masthead-sticky block; no existing spec requirements change)_

## Impact

- `src/blocks/masthead-sticky/masthead-sticky.ts`: Add ~25-30 lines of scroll/scrollend event listeners at end of `decorate()`
- No new dependencies
- No CSS changes required
- Only affects pages with `masthead-sticky` block
