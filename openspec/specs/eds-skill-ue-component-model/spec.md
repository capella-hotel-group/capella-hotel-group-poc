## ADDED Requirements

### Requirement: Skill reads block TS to infer UE fields

The skill SHALL analyze a block's `src/blocks/{name}/{name}.ts` file to understand what content the `decorate(block)` function expects, then map those expectations to Universal Editor component model fields.

#### Scenario: New block with querySelector patterns

- **WHEN** the skill reads a `.ts` file that uses `block.querySelector('picture')`, `block.querySelector('a')`, and an `<h2>` heading
- **THEN** it SHALL generate a model with fields: `reference` (image), `aem-content` (link + linkText), and `text` (title) using correct `valueType` for each

#### Scenario: Container block detection

- **WHEN** the block's JS iterates over `block.children` or `Array.from(block.querySelectorAll(':scope > div'))` to build repeatable items
- **THEN** the skill SHALL classify it as a **container block** and generate both a container definition and an item definition with the appropriate filter

### Requirement: Skill uses centralized config (no distributed \_block.json in src/)

The skill SHALL edit the three root-level JSON files (`component-definition.json`, `component-models.json`, `component-filters.json`) rather than creating distributed `_block.json` files, because this project uses a Vite build that merges from `src/models/` using `npm run build:json`.

#### Scenario: Adding new block to UE

- **WHEN** the skill generates config for a new block
- **THEN** it SHALL insert entries into the three root-level JSON files AND inform the developer to run `npm run build:json` to sync with `src/models/`

### Requirement: Skill validates ID consistency across three files

After generating config, the skill SHALL verify that the `template.model` in `component-definition.json` matches the `id` in `component-models.json`, and that the block `id` appears in `component-filters.json`'s section filter.

#### Scenario: Mismatched model ID

- **WHEN** the proposed config has `"model": "my-block-model"` in the definition but `"id": "my-block"` in the models file
- **THEN** the skill SHALL flag the mismatch and correct it before outputting the final JSON

### Requirement: Skill provides field type guidance for TypeScript block patterns

The skill SHALL map TypeScript DOM patterns to UE field types:

- `block.querySelector('picture')` → `reference` with paired `text` (imageAlt)
- `block.querySelector('a')` → `aem-content` with optional `linkText`
- `block.querySelector('h1'–'h6')` → `text` (title) + `select` (titleType)
- `block.classList.contains(variant)` → `multiselect` (name: classes)
- `block.querySelector('p')` → `richtext` or `textarea` depending on expected formatting

#### Scenario: Title with level selector

- **WHEN** a block reads `block.querySelector('h2, h3')` and uses `tagName` to determine level
- **THEN** the skill SHALL generate a `text` field named `title` and a `select` field named `titleType` with options `h1`–`h6`, defaulting to `h2`
