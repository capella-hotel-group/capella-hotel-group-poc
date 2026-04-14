## MODIFIED Requirements

### Requirement: Skill is the canonical implementation

The skill is the canonical implementation of the Figma-to-block workflow. It SHALL be invocable both by developers (via the `aem-create-block-from-figma` prompt, which delegates to it) and by agents programmatically (e.g., an `openspec-apply-change` task that requires block scaffolding). In both invocation paths the skill executes the same workflow and produces the same three output files.

#### Scenario: Agent invokes skill with valid inputs

- **WHEN** a parent agent calls the skill with `blockName` and `figmaUrl` arguments
- **THEN** the skill SHALL execute the full workflow and return the file paths of the three generated files plus registration status flags

#### Scenario: Developer invokes skill via prompt

- **WHEN** the developer uses the `/aem-create-block-from-figma` prompt command
- **THEN** the prompt delegates to this skill, and the skill executes the full workflow as if invoked directly

#### Scenario: Skill invoked without Figma MCP

- **WHEN** the Figma MCP tools are not available at skill invocation time
- **THEN** the skill SHALL return an error message rather than proceeding
