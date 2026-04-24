## Why

When authors add a card to the `highlights-carousel` block via the Universal Editor, nothing appears in the content tree and the new card is invisible after saving. The block's `decorate()` function tears down the original DOM without transferring UE instrumentation URNs, so the editor loses all awareness of the items it just inserted.

## What Changes

- Call `moveInstrumentation(row, li)` for every card item in `highlights-carousel.ts` so that `data-aue-resource` URNs survive the DOM rebuild.
- Import `moveInstrumentation` from `@/app/scripts`.
- Remove the redundant `alt` field from `_highlights-carousel.json` (image alt text is carried by the asset reference natively; the extra field shifts cell indices and causes `decorate()` to read the wrong columns).
- Fix cell-index mapping in `decorate()` to correctly read `image → cells[0]`, `title → cells[1]`, `description → cells[2]` after removing the `alt` field.

## Capabilities

### New Capabilities

- `highlights-carousel-ue-authoring`: Authors can add, reorder, and delete Carousel Cards in the Universal Editor and see changes reflected immediately in the content tree.

### Modified Capabilities

<!-- None — no existing spec-level behavior changes -->

## Impact

- `src/blocks/highlights-carousel/highlights-carousel.ts` — add import, call `moveInstrumentation` per card row.
- `src/blocks/highlights-carousel/_highlights-carousel.json` — remove `alt` field from `carousel-cards` model.
- Run `npm run build:json` after JSON change to regenerate root `component-models.json`.
