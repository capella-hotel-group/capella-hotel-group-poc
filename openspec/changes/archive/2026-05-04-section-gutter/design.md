## Context

AEM EDS section metadata is handled by `decorateSections()` in `aem.ts`. Fields named `style` are promoted to CSS classes; all other fields become `data-*` attributes via `section.dataset`. This mechanism is core EDS and must not be modified.

Currently, the section model has a `style` multiselect (values become CSS classes) and a `name` text field. There is no author-facing control for vertical spacing.

## Goals / Non-Goals

**Goals:**

- Give authors a single-select dropdown to choose vertical padding (gutter) for a section
- Zero changes to core EDS runtime (`aem.ts`, `scripts.ts`)
- CSS-only implementation, no JS required at runtime

**Non-Goals:**

- Per-breakpoint gutter control
- Horizontal padding / margin control
- Retrofitting existing pages (opt-in via authoring)

## Decisions

### `data-gutter` attribute over CSS class

Using a separate `select` field (not the `style` multiselect) means the value is stored as `data-gutter` on the section element, not as a class. This avoids the multiselect conflict problem (authors accidentally selecting multiple gutter sizes) and keeps the CSS selector explicit (`[data-gutter="sm"]` vs `.gutter-sm`).

Alternative considered: adding gutter values to the existing `style` multiselect. Rejected because `multiselect` allows selecting `gutter-sm` and `gutter-lg` simultaneously; no native UE constraint prevents this.

### Four values: none / sm / md / lg

`none` explicitly resets padding to 0 (useful when a block already manages its own spacing). `sm / md / lg` map to fixed pixel values tied to the design system scale. No default is set — if `gutter` is unset, the section inherits whatever padding the block or surrounding CSS applies.

## Risks / Trade-offs

- **Conflict with block-level padding**: If a block already applies `padding-block`, `data-gutter` will override it (higher specificity). Mitigation: document this in authoring guidelines.
- **No default**: Sections without a gutter selection inherit existing behavior. This is intentional but may surprise authors who expect a default.
