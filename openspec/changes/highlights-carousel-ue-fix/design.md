## Context

The `highlights-carousel` block tears down the original AEM-delivered DOM inside `decorate()` and rebuilds a new slider structure. The Universal Editor tracks content items via `data-aue-resource` URNs stamped onto the original row elements. When `block.replaceChildren()` discards those rows, the URNs are gone — UE can no longer see, add, or delete cards.

A sibling block (`cards-carousel`) already solves this correctly by calling `moveInstrumentation(row, li)` for each item row before discarding it. `highlights-carousel` was scaffolded without that step.

Additionally, the `_highlights-carousel.json` model defines an `alt` field between `image` and `title`, creating a 4-column table. The `decorate()` function was written for a 3-column table (image / title / content), so column indices are off-by-one when UE-authored content is loaded.

## Goals / Non-Goals

**Goals:**

- UE content tree shows Carousel Card items after authoring.
- Add / delete card operations work correctly in UE.
- Card data (image, title, description) maps to correct DOM elements.
- No visual regression in production rendering.

**Non-Goals:**

- Refactoring the carousel engine.
- Adding new card fields.
- Changing the visual design of the block.

## Decisions

**Decision 1: Use `moveInstrumentation()` — same pattern as `cards-carousel`**

The project already has a proven pattern. Calling `moveInstrumentation(originalRow, newLiElement)` transfers all `data-aue-*` attributes from the original DOM row to the new `<li>` before `replaceChildren()` is called. UE follows the URN, not the DOM position.

Alternative considered: keeping original rows in a hidden container as a "source of truth". Rejected — explicitly documented as an anti-pattern in `ue-layout-conflicts.instructions.md` (pollutes DOM, hurts SEO/CWV).

**Decision 2: Remove `alt` field from model, fix cell indices**

The `alt` value for an image reference is natively available via the asset reference in AEM; a separate text field is redundant. Removing it simplifies the model to 3 columns (image / title / description), aligning with how `decorate()` already reads cells. No data migration needed — the field was never actually rendered by the current `decorate()` logic.

Alternative considered: keeping `alt` and adjusting cell indices to `cells[2]` for title, `cells[3]` for description. Rejected — adds unnecessary complexity and an orphaned field that authors would fill in but that never renders.

## Risks / Trade-offs

- **Existing authored content with alt text**: Any pages where authors have already filled in the `alt` field will have that data silently dropped. Risk is low — the field was never rendered, so no visual change. → Mitigation: none required; data loss is for a field that had no effect.
- **`npm run build:json` required**: After JSON change, the root `component-models.json` must be rebuilt. Forgetting this step leaves UE serving stale model. → Mitigation: tracked as an explicit task.

## Open Questions

- None.
