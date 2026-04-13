## ADDED Requirements

### Requirement: Invoke via prompt command
The prompt SHALL be invocable in Copilot Chat using `/aem-create-block-from-figma` followed by a block name (kebab-case), a Figma URL, and an optional description.

#### Scenario: Valid inputs provided
- **WHEN** the developer runs `/aem-create-block-from-figma my-block https://figma.com/design/...`
- **THEN** the agent parses the block name and Figma URL and proceeds to fetch design data

#### Scenario: Block name is not kebab-case
- **WHEN** the developer provides a name with spaces or uppercase (e.g., `My Block`)
- **THEN** the agent SHALL convert it to kebab-case (`my-block`) and confirm with the developer before proceeding

#### Scenario: Block folder already exists
- **WHEN** `src/blocks/<block-name>/` already exists in the workspace
- **THEN** the agent MUST ask the developer whether to overwrite or abort before generating any files

#### Scenario: No input provided
- **WHEN** the developer runs `/aem-create-block-from-figma` with no arguments
- **THEN** the agent SHALL ask for the block name and Figma URL before proceeding

### Requirement: Fetch Figma design data via MCP
The prompt SHALL use the Figma MCP server to retrieve node data from the provided Figma URL.

#### Scenario: URL contains a nodeId
- **WHEN** the Figma URL includes `node-id=<nodeId>`
- **THEN** the agent SHALL call `mcp_com_figma_mcp_get_design_context` with `fileKey` and extracted `nodeId`

#### Scenario: URL has no nodeId
- **WHEN** the Figma URL contains only a `fileKey` with no node selection
- **THEN** the agent SHALL call `mcp_com_figma_mcp_get_metadata` to list top-level frames and ask the developer to select one

#### Scenario: Figma MCP is unavailable
- **WHEN** the Figma MCP tools are not present in the agent's tool set
- **THEN** the agent SHALL stop and display: "Figma MCP is not connected. Please ensure the Figma MCP server is running in your VS Code MCP settings."

### Requirement: Map Figma layers to AEM xwalk field types
The agent SHALL apply the following deterministic mapping when analysing the fetched Figma node:

| Figma layer type | AEM `component` | Notes |
|---|---|---|
| Short text / label | `text` | Single-line, e.g., alt text, subtitle |
| Long text / body copy | `richtext` | Multi-line or styled text |
| Image / asset frame | `reference` (multi: false) | Gallery pattern → multi: true |
| Link / button | `aem-content` | Internal CTA links |
| Toggle / boolean variant | `boolean` | Feature flags, display options |
| Style variant property | `select` | Block display variant selector |
| Repeating child frames | container + filter pattern | See requirement below |

#### Scenario: Text layer detected
- **WHEN** the Figma node contains a text layer with ≤80 characters and no formatting
- **THEN** the agent SHALL map it to a `text` component field

#### Scenario: Rich text / body copy detected
- **WHEN** the Figma node contains a text layer longer than 80 characters or with heading/bold formatting
- **THEN** the agent SHALL map it to a `richtext` component field with `value: ""`

#### Scenario: Image / asset layer detected
- **WHEN** the Figma node contains an image fill or a designated asset frame
- **THEN** the agent SHALL map it to a `reference` component field with `multi: false`

### Requirement: Detect container vs simple block structure
The agent SHALL determine whether to generate a simple model or a container+filter model based on the Figma node structure.

#### Scenario: Single content area
- **WHEN** the Figma node has no repeating child components of the same type
- **THEN** the agent SHALL use the simple model pattern (like `_hero.json`) with `"model": "<block-name>"` in the definition template

#### Scenario: Repeating children detected
- **WHEN** the Figma node contains 3 or more visually similar child frames or instances of the same component
- **THEN** the agent SHALL use the container+filter pattern (like `_cards.json`) with a parent definition using `"filter"` and a child item definition using `"model"`

#### Scenario: Ambiguous structure
- **WHEN** the structure is unclear (e.g., 2 children, mixed types)
- **THEN** the agent MUST ask the developer to choose between simple and container pattern before generating

### Requirement: Enforce 4-field limit per model
The agent SHALL enforce the xwalk maximum of 4 fields per model row.

#### Scenario: 4 or fewer fields inferred
- **WHEN** the Figma analysis yields 4 or fewer content fields
- **THEN** the agent SHALL generate the `_<block-name>.json` with all fields in one model

#### Scenario: More than 4 fields inferred
- **WHEN** the Figma analysis yields more than 4 content fields
- **THEN** the agent MUST inform the developer of the 4-field limit and ask how to prioritize or split the fields before generating

### Requirement: Scaffold three block files
The agent SHALL generate exactly three files in `src/blocks/<block-name>/`:

1. `<block-name>.ts` — TypeScript decorator
2. `<block-name>.css` — Block-scoped styles
3. `_<block-name>.json` — AEM xwalk component model

#### Scenario: All files generated successfully
- **WHEN** the analysis completes and the developer confirms (or no confirmation is needed)
- **THEN** the agent SHALL create all three files at `src/blocks/<block-name>/`

#### Scenario: Generated TypeScript is CSS-only block
- **WHEN** the block has no dynamic DOM manipulation (layout is purely CSS)
- **THEN** the `.ts` file SHALL use the non-async signature: `export default function decorate(_block: HTMLElement): void {}`

#### Scenario: Generated TypeScript needs DOM restructuring
- **WHEN** the block needs to restructure DOM elements (e.g., move image, wrap items)
- **THEN** the `.ts` file SHALL be async, import `moveInstrumentation` from `@/app/scripts`, and call `block.replaceChildren()` once

#### Scenario: CSS follows project conventions
- **WHEN** CSS is generated
- **THEN** all selectors SHALL follow BEM-adjacent naming (`.{block-name}`, `.{block-name}-{element}`, `.{block-name}-{element}--{mod}`)
- **THEN** all color/spacing values SHALL use `var(--token-name)` CSS variables — no hardcoded hex or px values
- **THEN** media queries SHALL use modern range syntax: `@media (width >= 900px)`

### Requirement: Register block in AEM after scaffolding
After generating the three block files, the agent SHALL add the new block to `src/models/_section.json` and regenerate the root AEM component JSON files so the block becomes available in the Universal Editor.

#### Scenario: Block added to section filter
- **WHEN** the three block files are generated successfully
- **THEN** the agent SHALL add `"<block-name>"` to `filters[0].components` in `src/models/_section.json` in alphabetical order

#### Scenario: AEM component JSON regenerated
- **WHEN** `src/models/_section.json` is updated
- **THEN** the agent SHALL run `npm run build:json` to regenerate `component-models.json`, `component-definition.json`, and `component-filters.json`

#### Scenario: Block unavailable without registration
- **WHEN** `npm run build:json` has not been run after file generation
- **THEN** the new block SHALL NOT appear as an insertable component in the Universal Editor
