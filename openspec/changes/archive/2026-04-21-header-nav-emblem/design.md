## Context

The `luxury-header-block` change specifies a small monochrome brand emblem centered between DESTINATIONS and EXPERIENCES in the header nav. The emblem asset was previously described as "authored from the content model" but the brand team has now supplied the canonical two-polygon star/crest SVG. This change locks down the exact asset and its rendering specification (16px width, CSS-theming via `currentColor`).

The existing `/icons/` directory follows the AEM EDS convention where SVG files are served as static assets and referenced as `<img src="/icons/capella-emblem.svg">` or fetched/inlined by the block decorator.

## Goals / Non-Goals

**Goals:**

- Save the provided crest SVG to `/icons/capella-emblem.svg` with hardcoded fill replaced by `currentColor` for CSS color control
- Render it at exactly `width: 16px` inside the header center-nav zone
- Center it vertically and horizontally relative to the two nav links using flexbox alignment

**Non-Goals:**

- Animated or interactive emblem behavior
- Multiple emblem sizes or responsive scaling beyond the fixed 16px
- Replacing any other icon usage across the project
- Changing the emblem based on authored content (it is a static brand asset)

## Decisions

### 1. Static file vs. authored image field

**Decision**: Ship the emblem as a hardcoded static asset at `/icons/capella-emblem.svg`. The `decorate()` function references it directly — no content model field.

**Rationale**: The emblem is a brand constant, not editable per-page content. Putting it in the content model would let authors accidentally remove or replace it, breaking brand compliance. Static asset delivery is faster (no UE round-trip) and matches how other project icons (`/icons/*.svg`) are handled.

**Alternative considered**: Authored `<picture>` field in the header block model. Rejected — adds authoring complexity with no benefit for a locked brand element.

---

### 2. `<img>` reference vs. inline SVG

**Decision**: Use `<img src="/icons/capella-emblem.svg" class="header-emblem" alt="">` initially. If CSS `currentColor` theming is needed in the future, upgrade to `fetch()`-based inline injection.

**Rationale**: An `<img>` tag is simpler, avoids a runtime fetch, and renders correctly at 16px. The SVG fill color is already the dark brand color (`#242F3A`) which matches the monochrome palette. `currentColor` conversion is deferred unless a light-on-dark header variant is required.

**Alternative considered**: Inline the SVG markup directly in `decorate()`. Rejected for initial implementation — inline SVG is harder to maintain and unnecessary when a single fixed color is acceptable.

---

### 3. Size and alignment

**Decision**: `width: 16px; height: auto; display: block` on `.header-emblem`. The center nav zone uses `display: flex; align-items: center; gap: var(--spacing-nav-gap)`.

**Rationale**: `height: auto` preserves the SVG's 48×79 viewBox aspect ratio. Flex alignment ensures the emblem sits on the same baseline as the nav link text without extra margin hacks.

## Risks / Trade-offs

- **SVG aspect ratio**: The viewBox is 48×79 (portrait). At 16px width, height renders at ~26px. This is intentional for a tall crest motif but may appear taller than expected alongside short nav text → Mitigation: If the visual balance is off, apply `max-height: 20px; width: auto` as a follow-up tweak.
- **Color mismatch on dark backgrounds**: The hardcoded `#242F3A` fill will be invisible on dark header variants → Mitigation: Document the `currentColor` upgrade path and track as a follow-up if a dark header variant is introduced.
