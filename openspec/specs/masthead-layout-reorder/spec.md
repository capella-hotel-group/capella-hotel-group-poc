## ADDED Requirements

### Requirement: Body flex reorder when masthead is present

When the `masthead-sticky` block decorates, the `<body>` element SHALL receive `display: flex; flex-direction: column` with `<main>` at visual order 1, `<header>` at order 2, and `<footer>` at order 3. This reorder SHALL only activate when the `has-masthead` class is present on `<body>`.

#### Scenario: Page with masthead block

- **WHEN** the page contains a masthead-sticky block
- **THEN** the body has class `has-masthead` and visual order is masthead → header → content → footer

#### Scenario: Page without masthead block

- **WHEN** the page does not contain a masthead-sticky block
- **THEN** the body does not have class `has-masthead` and layout is the default header → content → footer

---

### Requirement: Masthead section is marked for sibling targeting

The block's parent section (`main > div`) SHALL receive the class `masthead-section` so subsequent sibling sections can be targeted by CSS.

#### Scenario: Parent section receives class

- **WHEN** the masthead-sticky block decorates
- **THEN** its closest `main > div` ancestor has class `masthead-section`

---

### Requirement: Content sections overlap the sticky masthead on scroll

All sections following `.masthead-section` SHALL have `position: relative` and a z-index higher than the masthead's z-index (50), so they render on top of the masthead as the user scrolls.

#### Scenario: Content scrolls over masthead

- **WHEN** the user scrolls down the page
- **THEN** content sections paint on top of the sticky masthead block

---

### Requirement: Header becomes sticky after masthead scrolls away

The `<header>` SHALL use `position: sticky; top: 0` and `z-index: 100`, becoming sticky when it reaches the top of the viewport during scroll. The header SHALL render above both the masthead and content sections.

#### Scenario: Header sticks at viewport top

- **WHEN** the header scrolls to the top of the viewport (after the masthead)
- **THEN** the header is sticky and remains visible above all other content
