## Why

The `panding-gallery` block is currently a stub with no interaction. The product needs an immersive, infinite-scrolling image grid that reacts to user input — matching the same interaction quality as `lighting-interaction`. The pointer-velocity logic in `lighting-interaction` is also tightly coupled to that block's Three.js scene and cannot be reused; extracting it enables future interactive blocks to share the same momentum model.

## What Changes

- Extract the pointer-velocity/momentum tracker from `lighting-interaction/scene.ts` into `src/utils/pointer-velocity.ts` as a reusable, framework-agnostic utility.
- Implement two-phase loading for `panding-gallery`: phase 1 renders the static HTML grid from the block's own DOM + raw images immediately; phase 2 bootstraps the Three.js layer for advanced parallax interaction after a trigger (same pattern as `lighting-interaction`).
- Lay out exactly 20 images in a **5-column × 4-row CSS grid**, sized so the viewport shows **2.8 columns** wide at all times.
- Drive the grid with **bidirectional X/Y scrolling**: X moves all columns uniformly; Y moves each column independently weighted by a per-column multiplier (hardcoded defaults, configurable at initialisation).
- Support two **input modes**: scroll/wheel delta as the **default** driving input, and pointer-velocity as an alternative — switchable per block instance.
- Implement **infinity-loop** for both axes: items that travel beyond a configurable out-of-viewport padding threshold are teleported to the opposite end, creating a seamless loop in Y (per column); columns that exit viewport bounds in X are teleported to the opposite side.

## Capabilities

### New Capabilities

- `pointer-velocity-util`: Reusable pointer-velocity momentum tracker — exponential decay, `pendingDelta` accumulation, configurable decay rate and snap threshold. Extracted from `lighting-interaction` so any block can consume it.
- `panding-gallery-two-phase`: Two-phase loading contract for `panding-gallery` — phase 1 produces a fully accessible static grid from raw DOM; phase 2 initialises the Three.js scene on trigger.
- `panding-gallery-grid-layout`: Fixed 20-image grid (5 cols × 4 rows). Column width is derived so that **2.8 columns** fill the viewport width. Images use a fixed aspect ratio column.
- `panding-gallery-scroll-motion`: Bidirectional scroll motion system — input modes (wheel/scroll default, pointer-velocity alternative), per-column Y-speed weights, uniform X speed, and infinity-loop swapping (items in Y, columns in X) with a configurable out-of-viewport padding threshold.

### Modified Capabilities

- `scene-velocity-momentum`: The exponential-decay momentum implementation moves to the new `pointer-velocity-util`. The `lighting-interaction` scene SHALL delegate to the shared utility rather than maintaining its own inline copy; behavioural requirements remain unchanged.

## Impact

- **New file**: `src/utils/pointer-velocity.ts` — shared by `lighting-interaction` and `panding-gallery`.
- **Modified file**: `src/blocks/lighting-interaction/scene.ts` — replace inline velocity tracking with a call to the new utility.
- **Modified files**: `src/blocks/panding-gallery/panding-gallery.ts` and `panding-gallery.css` — full implementation of the two-phase grid block.
- **AEM model**: `src/blocks/panding-gallery/_panding-gallery.json` — updated to accept 20 image slots and the input-mode flag.
- No new npm dependencies; Three.js is already a workspace dependency.
