## ADDED Requirements

### Requirement: Skill designs table structure for UE authoring

The skill SHALL design the AEM table content model that authors will use to create block content in Google Docs/SharePoint/UE, following the conventions in `.github/instructions/block-authoring.instructions.md`.

#### Scenario: Simple block content model

- **WHEN** designing a model for a hero block with an image, heading, and CTA
- **THEN** the skill SHALL output a table structure showing: row 1 = block name, row 2 = image, row 3 = heading text, row 4 = CTA link — with clear labels for each row's purpose

### Requirement: Skill limits rows to ≤4 cells and avoids complex nesting

Per EDS content model best practices, the skill SHALL keep each row to at most 4 cells, use semantic formatting (bold for labels, links for URLs), and avoid deep nesting of tables.

#### Scenario: Too many fields

- **WHEN** a block has 6+ fields
- **THEN** the skill SHALL group related fields using semantic collapsing (e.g., `link` + `linkText` → one `<a>` element) rather than adding a 5th cell

### Requirement: Skill documents the model for authors

The skill SHALL produce a written content model document that an author can follow, not just a developer-facing schema. It SHALL include the table template, field descriptions, and an example populated table.

#### Scenario: Output for content-driven-development step 3

- **WHEN** invoked from CDD step 3
- **THEN** the skill SHALL return: (a) the table template markdown, (b) field descriptions, (c) a filled example, ready to be shared with a content author
