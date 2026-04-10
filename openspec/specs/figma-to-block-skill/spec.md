## ADDED Requirements

### Requirement: Skill is invocable by other agents
The skill SHALL be structured so that any Copilot agent (including OpenSpec apply workflows) can invoke it via the `runSubagent` tool with a block name and Figma URL as input.

#### Scenario: Agent invokes skill with valid inputs
- **WHEN** a parent agent calls the skill with `blockName` and `figmaUrl` arguments
- **THEN** the skill SHALL execute the same workflow as the prompt and return the file paths of the three generated files

#### Scenario: Skill invoked without Figma MCP
- **WHEN** the Figma MCP tools are not available at skill invocation time
- **THEN** the skill SHALL return an error message rather than proceeding

### Requirement: Skill has correct YAML frontmatter
The `SKILL.md` file SHALL have frontmatter that correctly identifies the skill and its requirements.

#### Scenario: Skill metadata is present
- **WHEN** the skill file is read
- **THEN** it SHALL include `name`, `description`, `license`, and `compatibility` (noting Figma MCP requirement) in YAML frontmatter

### Requirement: Skill logic mirrors the prompt
The skill's workflow steps SHALL mirror those in the prompt file so behavior is consistent regardless of invocation method.

#### Scenario: Both prompt and skill produce identical output
- **WHEN** given the same block name and Figma URL
- **THEN** invoking via the prompt command and via the skill SHALL produce structurally identical `_<block-name>.json`, `<block-name>.ts`, and `<block-name>.css` files
