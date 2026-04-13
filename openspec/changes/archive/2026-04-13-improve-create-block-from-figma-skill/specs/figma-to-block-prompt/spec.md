## MODIFIED Requirements

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
