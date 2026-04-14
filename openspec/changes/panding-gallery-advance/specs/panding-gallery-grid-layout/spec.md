## ADDED Requirements

### Requirement: Grid is always exactly 20 images in 5 columns × 4 rows

The `panding-gallery` block SHALL lay out exactly 20 images. Images SHALL be distributed to columns in column-major order: image index `i` goes to column `i % 5`, row `Math.floor(i / 5)`.

If fewer than 20 image rows are provided in the block, the remaining slots SHALL be left empty (no placeholder). If more than 20 are provided, images beyond index 19 SHALL be ignored.

#### Scenario: 20 images produce a full 5×4 grid

- **WHEN** the block contains exactly 20 image rows
- **THEN** each of the 5 columns contains exactly 4 images
- **AND** no image is repeated or omitted

#### Scenario: Fewer than 20 images does not break layout

- **WHEN** the block contains fewer than 20 image rows
- **THEN** only the provided images are rendered
- **AND** the block renders without error

### Requirement: Column width produces 2.8 visible columns at the viewport width

The `panding-gallery-columns` container SHALL set each column's width so that exactly **2.8 columns** (including their gaps) span the full viewport width at the time the block initialises.

The column width formula SHALL be: `columnWidth = (containerWidth - gap * (COLS - 1)) / 2.8`, where `COLS = 5` and `gap` is the configured inter-column gap.

The column width SHALL be recomputed when the container is resized (via `ResizeObserver`) and applied to the column elements.

#### Scenario: Column width at standard viewport

- **WHEN** the block is rendered at 1440px viewport width
- **THEN** each column is approximately `(1440 - gap * 4) / 2.8` pixels wide
- **AND** only 2.8 columns are visible without scrolling

#### Scenario: Column width updates on resize

- **WHEN** the viewport width changes
- **THEN** column widths are recalculated and applied within one animation frame

### Requirement: Images within each column use a fixed aspect ratio

All `<img>` elements within the gallery columns SHALL use `aspect-ratio: 3 / 4` (portrait) applied via CSS. `object-fit: cover` SHALL preserve the image composition.

#### Scenario: Images are portrait aspect ratio

- **WHEN** the grid is rendered
- **THEN** all images display at 3:4 aspect ratio regardless of source dimensions
