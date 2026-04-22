## Why

The Capella brand experience requires a cinematic entry point on key landing pages — a full-viewport video masthead that sets the mood before the editorial content begins. No existing block provides sticky-above-header placement with full-screen background video, an inline watch-video CTA, and a modal player. The block must integrate cleanly with the luxury sticky header without z-index conflicts.

## What Changes

- Add new block `src/blocks/masthead-sticky/` with TypeScript decorator, CSS, and component model
- Block renders a full-viewport background video (autoplay, muted, loop, object-cover) authored from a single video field
- A "WATCH VIDEO" CTA in the lower-right corner (white, uppercase, underlined) opens a fullscreen modal with the same video playing with native controls
- Modal has an ✕ close button (top-right); closing pauses modal video while background video resumes autoplay
- Block uses `position: sticky; top: 0` with a z-index below the header — page content scrolls up and overlaps the masthead; when content reaches the top, the header becomes sticky above it
- Add `_masthead-sticky.json` component model with one `video` field (aem-content / link)

## Capabilities

### New Capabilities

- `masthead-sticky-block`: Full-viewport sticky video masthead with modal player — covers block structure, video playback behavior, CTA interaction, modal lifecycle, and z-index stacking relative to the header

### Modified Capabilities

<!-- none -->

## Impact

- New files: `src/blocks/masthead-sticky/masthead-sticky.ts`, `src/blocks/masthead-sticky/masthead-sticky.css`, `src/blocks/masthead-sticky/_masthead-sticky.json`
- `npm run build:json` must be run after adding the component model
- No changes to existing blocks or global styles
- z-index convention: masthead uses a value between 0 and the header's z-index (100) — document this in the block
