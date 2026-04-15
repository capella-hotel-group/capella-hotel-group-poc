## MODIFIED Requirements

### Requirement: Invoke via prompt command

The prompt SHALL be invocable in Copilot Chat using `/aem-create-block-from-figma` followed by a block name (kebab-case), a Figma URL, and an optional description. When invoked, the prompt SHALL parse these inputs and delegate all workflow execution to the `aem-skill-create-block-from-figma` skill. From the developer's perspective the output (three generated block files, AEM registration) is identical to a direct skill invocation.

#### Scenario: Valid inputs provided

- **WHEN** the developer runs `/aem-create-block-from-figma my-block https://figma.com/design/...`
- **THEN** the prompt SHALL parse the block name, Figma URL, and optional description, then invoke the `aem-skill-create-block-from-figma` skill with those arguments

#### Scenario: No input provided

- **WHEN** the developer runs `/aem-create-block-from-figma` with no arguments
- **THEN** the prompt SHALL ask for the block name and Figma URL before delegating to the skill

## REMOVED Requirements

### Requirement: Fetch Figma design data via MCP

**Reason**: Implemented by the `aem-skill-create-block-from-figma` skill. The prompt delegates to the skill and inherits this behaviour.
**Migration**: No developer-visible change. The skill handles Figma MCP availability checks and all fetch logic.

### Requirement: Map Figma layers to AEM xwalk field types

**Reason**: Implemented by the `aem-skill-create-block-from-figma` skill. See `figma-to-block-skill` spec.
**Migration**: No developer-visible change.

### Requirement: Detect container vs simple block structure

**Reason**: Implemented by the `aem-skill-create-block-from-figma` skill. See `figma-to-block-skill` spec.
**Migration**: No developer-visible change.

### Requirement: Enforce 4-field limit per model

**Reason**: Implemented by the `aem-skill-create-block-from-figma` skill. See `figma-to-block-skill` spec.
**Migration**: No developer-visible change.

### Requirement: Scaffold three block files

**Reason**: Implemented by the `aem-skill-create-block-from-figma` skill. See `figma-to-block-skill` spec.
**Migration**: No developer-visible change.

### Requirement: Register block in AEM after scaffolding

**Reason**: Implemented by the `aem-skill-create-block-from-figma` skill. See `figma-to-block-skill` spec.
**Migration**: No developer-visible change.

> For full workflow requirements covering all REMOVED items above, see the `figma-to-block-skill` spec (`openspec/specs/figma-to-block-skill/spec.md`).

## ADDED Requirements

### Requirement: Prompt delegates all workflow logic to the skill

The prompt SHALL contain no block-creation workflow logic. Its sole responsibility is to parse user inputs (`blockName`, `figmaUrl`, optional `description`) and invoke the `aem-skill-create-block-from-figma` skill. The skill is the single source of truth for all workflow steps.

#### Scenario: Prompt delegates with all inputs

- **WHEN** the developer provides all required inputs
- **THEN** the prompt SHALL invoke the `aem-skill-create-block-from-figma` skill with `blockName`, `figmaUrl`, and `description` (if present) without executing any workflow steps itself

#### Scenario: Prompt does not duplicate skill logic

- **WHEN** the skill workflow is updated
- **THEN** the prompt SHALL NOT need to be updated to stay in sync — it delegates unconditionally
