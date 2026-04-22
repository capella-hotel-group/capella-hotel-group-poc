## ADDED Requirements

### Requirement: Block renders five-row content model

The `about-intro` block SHALL accept a five-row authored table and map rows to: heading (row 0), subtitle (row 1), image (row 2), body text (row 3), and optional CTA link (row 4).

#### Scenario: All five rows present

- **WHEN** an author provides all five rows in the block table
- **THEN** the block renders a heading, subtitle, full-width image, body paragraph, and CTA link

#### Scenario: CTA row is empty

- **WHEN** row 4 is absent or contains no hyperlink
- **THEN** the block renders without any CTA element and no empty anchor tag appears in the DOM

### Requirement: Two-column header row layout

The block SHALL render the heading and subtitle side-by-side in a horizontal row on viewport widths ≥ 768 px: heading occupying approximately 25% of the container width on the left, subtitle occupying approximately 33% on the right.

#### Scenario: Desktop two-column header

- **WHEN** the viewport is ≥ 768 px wide
- **THEN** heading and subtitle appear in the same horizontal row with heading left, subtitle right

#### Scenario: Mobile stacked header

- **WHEN** the viewport is < 768 px wide
- **THEN** heading and subtitle stack vertically, each taking full width

### Requirement: Full-width image

The block SHALL render the image element at 100% of the block container width.

#### Scenario: Image fills container

- **WHEN** the block is rendered
- **THEN** the image (or picture element) stretches to the full width of its parent container

#### Scenario: Image min-height on mobile

- **WHEN** the viewport is < 768 px wide
- **THEN** the image wrapper has a minimum height of 220 px with `object-fit: cover` to prevent a collapsed image

### Requirement: Left-offset body text

The body text and CTA link SHALL be indented from the left edge by a consistent CSS custom property (`--about-intro-text-indent`) matching the subtitle column start position.

#### Scenario: Body text indented on desktop

- **WHEN** the viewport is ≥ 768 px wide
- **THEN** the body text left edge aligns with the subtitle left edge above it

#### Scenario: Body text full-width on mobile

- **WHEN** the viewport is < 768 px wide
- **THEN** the body text has no left indent and spans full width

### Requirement: AEM picture element preserved

The block's `decorate()` function SHALL extract the `<picture>` element from the authored DOM and re-insert it into the rendered output without recreating an `<img>` tag, to preserve AEM's responsive image srcset.

#### Scenario: Picture element in output

- **WHEN** the block is decorated
- **THEN** the rendered DOM contains the original `<picture>` element from the authored content, not a plain `<img>`

### Requirement: External HTML sanitized

Any rich-text content inserted via `innerHTML` SHALL be sanitized with DOMPurify before insertion.

#### Scenario: Body text sanitized

- **WHEN** the block decorates body text from row 3
- **THEN** the text is passed through `DOMPurify.sanitize()` before being set as innerHTML

### Requirement: Universal Editor component model registered

The block SHALL be registered in `component-definition.json`, `component-models.json`, and `component-filters.json` so authors can insert and configure it in the Universal Editor.

#### Scenario: Block appears in UE block picker

- **WHEN** an author opens the Universal Editor block picker on a page
- **THEN** "About Intro" appears as an insertable block

#### Scenario: Fields editable in UE

- **WHEN** an author selects an existing `about-intro` block in Universal Editor
- **THEN** the heading, subtitle, image, body text, and CTA fields are editable in the properties panel
