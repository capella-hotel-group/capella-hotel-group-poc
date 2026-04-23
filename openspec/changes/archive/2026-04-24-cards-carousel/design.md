## Context

The project uses AEM Edge Delivery Services with TypeScript + Vite. Blocks follow the `decorate(block)` pattern, mutating AEM-delivered DOM into the final structure via `block.replaceChildren()`. The `activities` block already implements a track-based drag carousel with clone-based infinite scrolling and per-slide scale transitions. The new `cards-carousel` block reuses the same tween/RAF engine but simplifies it: no clones, no infinite wrap, uniform card scale, and snap-to-nearest on release.

The reference design comes from capellahotelgroup.com section "Our Collection" — a Flickity-powered horizontal strip of hotel property cards with drag-to-scroll, prev/next arrows, and a custom "Drag" cursor label.

## Goals / Non-Goals

**Goals:**

- Horizontal card carousel with drag-to-scroll and snap-on-release
- Prev/next arrow buttons, disabled at edges (no infinite loop)
- Responsive: fixed card width (~300px), cards-per-view adjusts on resize
- Custom "Drag" floating cursor on hover
- Clean AEM content model with separate fields per card item (image, title, subtitle, link)
- Follow all project conventions (@/ imports, replaceChildren, moveInstrumentation, CSS tokens)

**Non-Goals:**

- Infinite/wrap-around scrolling
- Per-slide scale or opacity transitions (all cards rendered uniformly)
- Touch velocity / momentum (snap is based on nearest position, not flick speed)
- Autoplay or timed rotation
- Three.js or immersive overlays

## Decisions

### 1. Carousel engine: simplified activities pattern over CSS scroll-snap

**Decision**: Vanilla TS with RAF tween loop, referencing `activities` architecture.

**Alternatives considered**:

- **CSS `overflow-x: auto` + `scroll-snap`**: Simplest, but no custom "Drag" cursor, no arrow-disable-at-edge control, browser inconsistencies with snap alignment across viewports. Hard to animate track position programmatically for arrow clicks.
- **Reuse `activities` directly as variant**: The activities block has domain-specific logic (video bg, categories, scaling, clones) that would need stripping. Cleaner to extract the tween primitives and build a focused block.

**Rationale**: The tween/RAF pattern is proven in the project, lightweight (~150 lines for the engine), and gives full control over snap behavior, arrow state, and cursor effects.

### 2. No clones — finite track with edge clamping

**Decision**: Track contains only real card elements. `vIdx` clamped to `[0, N - cardsPerView]`.

**Rationale**: The reference site does not loop. Simpler DOM, no `data-aue-*` stripping needed for clones (avoids UE conflicts), fewer edge cases.

### 3. Snap-to-nearest on release (not swipe-threshold)

**Decision**: On `pointerup`, compute nearest snap index from current track offset and tween to it. No minimum swipe threshold — even a 1px drag snaps to the nearest valid position.

**Rationale**: Matches the Flickity "settle to nearest" behavior from the reference. Simpler than threshold-based direction detection. Arrow buttons use the same `go(idx)` function.

### 4. Content model: separate fields per card item

**Decision**: Each card item has 4 explicit fields: `image` (reference), `title` (text), `subtitle` (text), `link` (aem-content/link).

**Alternative**: Richtext blob (like existing `cards` block) — rejected because it gives authors less structure and makes the carousel harder to render predictably.

### 5. Card sizing: fixed width, variable cards-per-view

**Decision**: Card width ~300px, gap ~36px. `cardsPerView = floor(sliderWidth / (CARD_W + GAP))`, minimum 1. ResizeObserver recalculates on viewport change.

### 6. Arrow styling: shaft + block pattern from reference

**Decision**: Prev/next arrows rendered as `<button>` elements with CSS pseudo-elements forming the shaft/arrowhead. Disabled state via `[disabled]` attribute with reduced opacity.

## Risks / Trade-offs

- **[Pointer capture on links]** Each card is an `<a>` tag. Pointer capture during drag must prevent navigation; clicks (no drag movement) must allow navigation. → Mitigation: Track `dragMoved` flag; call `e.preventDefault()` on click only when drag occurred.
- **[ResizeObserver thrashing]** Rapid resizing could cause excessive recalculations. → Mitigation: Debounce or use `go(vIdx, false)` (instant, no animation) on resize — same pattern as `activities`.
- **[Cards fewer than viewport]** If N ≤ cardsPerView, arrows should be hidden and drag disabled. → Mitigation: Add `cc-no-scroll` class when track fits entirely.
