## Context

`panding-gallery` is currently a stub (`decorate()` returns immediately). A previous CSS-only version exists in `blocks/panding-gallery/` (the compiled output) but has no TypeScript source logic. The block needs a full interactive implementation.

`lighting-interaction/scene.ts` contains a tightly-coupled pointer-velocity/momentum model. Extracting it into `src/utils/pointer-velocity.ts` removes duplication and allows `panding-gallery` (and any future block) to share the same physics without importing Three.js internals.

The grid interaction layer is intentionally a **CSS/DOM animation** (RAF + `translateX`/`translateY`), not a Three.js scene. Three.js is only bootstrapped in phase 2 as an optional advanced layer; the core infinite-scroll grid runs without it.

## Goals / Non-Goals

**Goals:**

- Extract pointer-velocity momentum tracker into a standalone, dependency-free utility in `src/utils/`.
- Update `lighting-interaction/scene.ts` to delegate to the new utility (zero behaviour change).
- Implement `panding-gallery` as a two-phase block: phase 1 = static HTML grid, phase 2 = interactive scroll layer.
- Fixed 20-image grid (5 columns × 4 rows). Column width = `viewport / 2.8`.
- Bidirectional infinite scroll — wheel/scroll delta as default input; pointer-velocity as an opt-in alternative.
- Per-column Y-axis speed multipliers (configurable, hardcoded defaults).
- Infinity-loop swapping in both axes with a configurable out-of-viewport padding threshold.

**Non-Goals:**

- Variable image count (future work; currently locked to 20).
- Three.js vertex displacement on the gallery images in this change.
- Touch gesture disambiguation beyond `wheel` events.
- AEM author real-time interaction preview.
- Responsive breakpoints that change the column count.

## Decisions

### D1 — Extract velocity utility as a plain class, not a composable function

**Chosen**: `PointerVelocityTracker` class in `src/utils/pointer-velocity.ts` with `attach(element)`, `detach()`, and read-only `smoothDelta` property.

**Rationale**: Class instance owns the event listener reference needed for cleanup, matches the lifetime management pattern already used in `lighting-interaction` (`boundPointerMove` / `boundContainer`). A functional approach would require the caller to hold the listener reference externally.

**Alternatives considered**: Plain exported functions with a shared state object — rejected because it would require the caller to manage listener registration manually.

---

### D2 — Grid animation via CSS `transform` in a RAF loop, not Three.js

**Chosen**: Each column has a `translateY` accumulator updated per frame in a `requestAnimationFrame` loop driven by the input velocity. Columns are absolutely positioned; `translateX` is a single shared value offsetting all columns.

**Rationale**: The infinite-loop mechanic is fundamentally about DOM node reordering near viewport edges — a job CSS/DOM handles well. Adding a Three.js renderer solely for 2D image translation would be unnecessary overhead and make the infinity-swap logic more complex (texture atlas management vs. DOM node move).

**Alternatives considered**: Three.js `Sprite` grid — rejected for the reason above.

---

### D3 — Phase 2 trigger: block click (same as lighting-interaction)

**Chosen**: Clicking anywhere on the block starts phase 2 (imports the scroll-motion module, attaches velocity tracker, begins RAF loop).

**Rationale**: Matches the existing two-phase convention in `lighting-interaction` — consistent UX, avoids loading JS on scroll-past.

**Alternatives considered**: IntersectionObserver auto-trigger — deferred to a future enhancement.

---

### D4 — Column width derived from `2.8` visible-column ratio

**Chosen**: `columnWidth = containerWidth / 2.8`. Gap is part of the 2.8-column budget (i.e., the visual rhythm achieved by choosing the gap constant naturally fits). Column width is recalculated on ResizeObserver update.

**Rationale**: Hard-coding `100vw / 2.8` as a CSS `calc()` keeps the visual ratio responsive without JavaScript needing to reposition elements.

---

### D5 — Infinity loop via translate cycling (no DOM node re-parenting)

**Chosen**: Each column maintains an array of per-item cumulative `offsetY` values. When an item's effective screen Y falls outside `[-paddingPx, viewportH + paddingPx]`, its logical offset is shifted by `totalColumnHeight` (wrapping it to the opposite end).

Horizontal infinity: each column's logical `offsetX` is similarly wrapped by `totalGridWidth` when it exits `[-paddingPx, viewportW + paddingPx]`.

**Rationale**: Avoids DOM mutations (appendChild/insertBefore) in the RAF loop which would cause layout recalculation. Pure transform updates keep the loop cheap.

---

### D6 — Input mode: scroll/wheel default, pointer-velocity opt-in

**Chosen**: The block's `decorate()` reads an `input-mode` field from the block's second row (or AEM model). Value `"pointer"` enables the velocity tracker. Default (empty / `"scroll"`) uses `wheel` event delta.

Wheel delta is normalised: `deltaY / 100` for `deltaMode === 0` (pixels), `deltaY * 20` for `deltaMode === 1` (lines). Both X and Y wheel delta are consumed.

**Rationale**: Scroll/wheel is universally available and intuitive; pointer velocity requires deliberate drag which is less discoverable. The scroll-driven default gives immediate interactivity with zero friction.

## Risks / Trade-offs

- [Risk] **Infinity-loop seam visible on slow devices** — if a frame is dropped exactly as an item teleports, a brief gap could appear. → Mitigation: use an ample `swapPadding` (default 200px) so the teleport is always off-screen.
- [Risk] **ResizeObserver recalculating column width mid-scroll** — can cause a frame of misalignment. → Mitigation: pause RAF during resize and re-derive all positions synchronously before resuming.
- [Risk] **`lighting-interaction` regressions from utility refactor** — the momentum behaviour must be identical. → Mitigation: delta spec for `scene-velocity-momentum` explicitly requires the utility to satisfy the same scenarios; no behavioural change is allowed.
- [Trade-off] **20-image cap is hardcoded** — simplifies layout math significantly (known column heights allow pre-computing infinity-loop thresholds). Removing the cap is future work.
