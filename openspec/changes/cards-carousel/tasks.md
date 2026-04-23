## 1. Content Model

- [x] 1.1 Create `src/blocks/cards-carousel/_cards-carousel.json` with block definition (`cards-carousel`), item definition (`carousel-card`), item model fields (image, title, subtitle, link), and filter
- [x] 1.2 Run `npm run build:json` and verify definitions/models/filters merge into root JSON files

## 2. Block Decorator (TypeScript)

- [x] 2.1 Create `src/blocks/cards-carousel/cards-carousel.ts` with `decorate()` function: parse rows into card data (image, title, subtitle, link), build DOM structure (slider > track > li > a.cc-card > .cc-card-image + .cc-card-body)
- [x] 2.2 Implement carousel engine: track position state, `computeTargetX()`, `go(idx, animated)` with cubic-out tween via RAF loop
- [x] 2.3 Implement drag interaction: pointerdown/pointermove/pointerup on track with pointer capture, `dragMoved` flag to distinguish click vs drag, snap-to-nearest on release
- [x] 2.4 Implement prev/next arrow buttons: render `<button>` elements, wire click handlers to `go(vIdx ± 1)`, disable at edges (vIdx === 0 / vIdx >= N - cardsPerView)
- [x] 2.5 Implement responsive resize: ResizeObserver on slider, recalculate `cardsPerView`, clamp `vIdx`, call `go(vIdx, false)`. Hide arrows and disable drag when all cards fit.
- [x] 2.6 Implement floating "Drag" cursor label: create `.cc-drag-cursor` element, track pointer position on `pointermove`, show/hide on `pointerenter`/`pointerleave`

## 3. Block Styles (CSS)

- [x] 3.1 Create `src/blocks/cards-carousel/cards-carousel.css`: section layout, headline, slider/track flex layout, card sizing (300px width, 5:7 image aspect ratio), card typography (title serif, subtitle uppercase tracking)
- [x] 3.2 Style arrow buttons (shaft + arrowhead pseudo-elements, disabled state opacity)
- [x] 3.3 Style floating "Drag" cursor label (absolute positioning, pointer-events: none, transition for show/hide)
- [x] 3.4 Add `touch-action: pan-y` on track, `cursor: grab`/`grabbing` fallback, `user-select: none` on drag

## 4. Validation

- [x] 4.1 Start dev server (`npm run start`), verify block renders with test content
- [x] 4.2 Run `npm run lint` and fix any issues
- [x] 4.3 Run `npm run build` to verify production build succeeds
