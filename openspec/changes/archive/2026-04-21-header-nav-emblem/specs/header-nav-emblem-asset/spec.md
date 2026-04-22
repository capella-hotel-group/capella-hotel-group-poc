## ADDED Requirements

### Requirement: Capella crest SVG asset exists at canonical path

The file `/icons/capella-emblem.svg` SHALL exist in the project and contain the brand two-polygon star/crest SVG. The SVG fill MUST use either the original hardcoded brand color (`#242F3A`) or `currentColor` to allow CSS-driven theming.

#### Scenario: Asset file is present

- **WHEN** the project is built or the dev server is running
- **THEN** a GET request to `/icons/capella-emblem.svg` returns a valid SVG document

#### Scenario: SVG contains the two-polygon crest shape

- **WHEN** the SVG file is opened
- **THEN** it contains two `<polygon>` elements forming the star/crest motif with the correct points data

---

### Requirement: Emblem renders at 16px width in the header center nav

The header center-nav zone SHALL render the Capella crest emblem as an `<img>` element with `class="header-emblem"`, `width` constrained to 16px via CSS, and `alt=""` (decorative). The emblem SHALL be positioned between the DESTINATIONS and EXPERIENCES navigation links.

#### Scenario: Emblem appears between nav links

- **WHEN** the header block is decorated and rendered on a page
- **THEN** the emblem image appears horizontally between the DESTINATIONS link (left) and the EXPERIENCES link (right)

#### Scenario: Emblem width is exactly 16px

- **WHEN** the header is rendered on any desktop viewport
- **THEN** the computed width of the `.header-emblem` element is 16px

#### Scenario: Emblem height scales proportionally

- **WHEN** the header is rendered
- **THEN** the emblem height is auto-calculated from the SVG aspect ratio (no fixed height overrides)

#### Scenario: Emblem has empty alt text

- **WHEN** the emblem `<img>` element is inspected
- **THEN** it has `alt=""` marking it as decorative, with no visible tooltip or screen-reader announcement

---

### Requirement: Center nav zone uses flexbox alignment for vertical centering

The center nav container SHALL use `display: flex; align-items: center` so the emblem and nav links are vertically centered on the same axis.

#### Scenario: Emblem and links are vertically aligned

- **WHEN** the header is rendered and inspected in DevTools
- **THEN** the midpoint of the emblem image and the midpoint of the nav link text are on the same horizontal axis

#### Scenario: Horizontal gap between elements is consistent

- **WHEN** the header is rendered
- **THEN** the spacing between DESTINATIONS and the emblem, and between the emblem and EXPERIENCES, uses the same CSS gap token value
