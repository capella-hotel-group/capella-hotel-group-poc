## Context

The live Capella Hotels homepage (`capellahotels.com/en`) contains a brand introduction section (`#section_aboutcapella`) built with a bespoke template engine. The PoC project uses AEM Edge Delivery Services (EDS) with TypeScript + Vite and a Universal Editor (UE) authoring flow. All UI is expressed as blocks: one folder per block in `src/blocks/`, each with a `decorate(block)` function, a CSS file, and a JSON component model.

The section has a clear three-part vertical layout: a two-column header row (title | subtitle), a full-width image, and a text + optional CTA area beneath. No existing block covers this pattern. `text-with-image` uses a horizontal side-by-side grid — structurally different.

## Goals / Non-Goals

**Goals:**

- Faithfully replicate the visual layout of `#section_aboutcapella` as an AEM EDS block.
- Enable authors to configure all content (heading, subtitle, image, body text, CTA) via Universal Editor.
- Keep the block self-contained — no changes to shared utilities or `app/scripts.ts`.
- Responsive: stacks gracefully on mobile.

**Non-Goals:**

- Replicating the `.srv` JavaScript scroll-reveal animation from the original site (no shared animation system exists; adds complexity for marginal value at this PoC stage).
- Supporting multiple layout variants (e.g., image-right) — a single layout is sufficient.
- Pixel-perfect match to the live site's font stack or colour palette beyond what design tokens already cover.

## Decisions

### 1. Block name: `about-intro`

The pattern (heading + subtitle header row, full-bleed image, body + CTA) is not unique to the "About Capella" section. It appears on other homepage panels (Capella Sojourn, Stay Longer) with the same structure. Naming it `about-intro` is specific enough to be meaningful, general enough to be reused.

**Alternatives considered:**

- `editorial-feature` — too abstract, harder to discover in UE.
- `brand-story` — too brand-specific, not a structural description.
- `section-1image` (original class name) — too implementation-specific.

### 2. Content model: 5-row flat table

```
Row 0 | Heading text          (e.g. "ABOUT CAPELLA")
Row 1 | Subtitle text         (e.g. "Capella Hotels and Resorts embody...")
Row 2 | Image (picture)
Row 3 | Body rich-text
Row 4 | CTA link (optional)
```

AEM EDS `decorate()` receives rows from a Word/Google Doc table. Flat rows are the simplest, most author-friendly model. No nesting needed for this structure.

**Alternatives considered:**

- Nested cells (group image + text in one row): more complex authoring, no advantage.

### 3. Layout: CSS Grid for header row, block display for image/text

The two-column header (title ~25% | subtitle ~33%) uses CSS Grid. The image is `width: 100%` (full bleed within the block container). The synopsis text is offset from the left using a margin matching one grid column width, expressed as a CSS custom property.

The left-offset (`--about-intro-text-indent`) mirrors the original site's ~104px at 1252px container width (≈ 8.3%). Using a var allows easy adjustment without hardcoding.

### 4. Image: preserve AEM `<picture>` element

AEM EDS delivers images as `<picture>` elements with responsive `<source>` breakpoints. The `decorate()` function must extract and re-insert the `<picture>` from the authoring DOM rather than recreating an `<img>`. This gives free responsive image optimisation.

### 5. CTA: optional, gracefully absent

The live site has a CTA link that is currently empty. The block renders the CTA only when a valid `href` is present. Authors add a hyperlinked word in Row 4; if the row is empty the CTA area is omitted.

### 6. No scroll animation (deferred)

`IntersectionObserver`-based fade-in is desirable but not required for the PoC. Deferred to a future change to avoid scope creep. CSS `opacity/transform` hooks will be left in the stylesheet commented out, making it easy to wire up later.

## Risks / Trade-offs

- **Author confusion on Row 4 (CTA)**: If an author provides text without a hyperlink, the link won't render. → Mitigation: UE model uses a `reference` or `text` field with a helper tooltip; block silently omits the CTA if `href` is empty.
- **Left-offset magic number**: The 8.3% indent feels arbitrary without a grid spec. → Mitigation: expressed as `--about-intro-text-indent` CSS var; easy to adjust centrally.
- **Full-bleed image on narrow viewports**: A 2.5:1 landscape image becomes very short on mobile portrait. → Mitigation: set a `min-height` on the image wrapper at small breakpoints, using `object-fit: cover`.
