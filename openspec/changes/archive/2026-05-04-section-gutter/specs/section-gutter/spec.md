## ADDED Requirements

### Requirement: Author can set vertical gutter on a section

The section content model SHALL expose a `gutter` select field with options: `none`, `sm`, `md`, `lg`. The selected value SHALL be stored as a `data-gutter` attribute on the section element at runtime.

#### Scenario: Author selects gutter-sm

- **WHEN** an author sets `gutter` to `sm` on a section in the Universal Editor
- **THEN** the rendered section element has `data-gutter="sm"` and `padding-block: 24px` is applied

#### Scenario: Author selects gutter-none

- **WHEN** an author sets `gutter` to `none` on a section
- **THEN** the rendered section element has `data-gutter="none"` and `padding-block: 0` is applied

#### Scenario: Author selects gutter-md

- **WHEN** an author sets `gutter` to `md` on a section
- **THEN** the rendered section element has `data-gutter="md"` and `padding-block: 48px` is applied

#### Scenario: Author selects gutter-lg

- **WHEN** an author sets `gutter` to `lg` on a section
- **THEN** the rendered section element has `data-gutter="lg"` and `padding-block: 80px` is applied

#### Scenario: No gutter selected

- **WHEN** an author leaves `gutter` unset on a section
- **THEN** no `data-gutter` attribute is present and the section inherits default spacing
