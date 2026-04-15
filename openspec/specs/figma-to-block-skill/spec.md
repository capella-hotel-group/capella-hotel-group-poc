## ADDED Requirements

### Requirement: Skill has correct YAML frontmatter

The `SKILL.md` file SHALL have frontmatter that correctly identifies the skill and its requirements.

#### Scenario: Skill metadata is present

- **WHEN** the skill file is read
- **THEN** it SHALL include `name: aem-create-block-from-figma`, `description`, `license`, and `compatibility` (noting Figma MCP requirement) in YAML frontmatter

### Requirement: Skill is invocable by other agents

The skill SHALL be structured so that any Copilot agent (including OpenSpec apply workflows) can invoke it via the `runSubagent` tool with a block name, a Figma URL, and an optional description as input.

#### Scenario: Agent invokes skill with valid inputs

- **WHEN** a parent agent calls the skill with `blockName` and `figmaUrl` arguments
- **THEN** the skill SHALL execute the same workflow as the prompt and return the file paths of the three generated files

#### Scenario: Skill invoked without Figma MCP

- **WHEN** the Figma MCP tools are not available at skill invocation time
- **THEN** the skill SHALL return an error message rather than proceeding

### Requirement: Skill is the canonical implementation

The skill is the canonical implementation of the Figma-to-block workflow. It SHALL be invocable both by developers (via the `aem-create-block-from-figma` prompt, which delegates to it) and by agents programmatically (e.g., an `openspec-apply-change` task that requires block scaffolding). In both invocation paths the skill executes the same workflow and produces the same three output files.

#### Scenario: Agent invokes skill with valid inputs

- **WHEN** a parent agent calls the skill with `blockName` and `figmaUrl` arguments
- **THEN** the skill SHALL execute the full workflow and return the file paths of the three generated files plus registration status flags

#### Scenario: Developer invokes skill via prompt

- **WHEN** the developer uses the `/aem-create-block-from-figma` prompt command
- **THEN** the prompt delegates to this skill, and the skill executes the full workflow as if invoked directly

### Requirement: Accept optional developer description

The skill SHALL accept an optional `description` parameter that supplements the Figma MCP data with interaction intent, animation notes, cross-block context, or accessibility requirements that cannot be inferred visually.

#### Scenario: Description provided at invocation

- **WHEN** the developer provides a description alongside blockName and figmaUrl
- **THEN** the skill SHALL use the description as context throughout Steps 3, 4, and 5

#### Scenario: Description not provided, component is clear

- **WHEN** no description is given and the fetched Figma node has unambiguous structure
- **THEN** the skill SHALL proceed without prompting for a description

#### Scenario: Description not provided, component is ambiguous

- **WHEN** no description is given and the Figma node has unlabelled states or unclear interaction semantics
- **THEN** the skill SHALL offer to collect a description from the developer before proceeding

### Requirement: Detect and handle multi-state components

The skill SHALL identify when a Figma node represents a component with multiple display states and generate matching TypeScript and CSS for those states.

#### Scenario: Auto-detect states from Figma child frame names

- **WHEN** child frames are named with state patterns (e.g., `default/hover/active`, `step-1/step-2`, `state=loading`)
- **THEN** the skill SHALL surface the detected state list, ask for confirmation, and proceed after approval

#### Scenario: States described in the developer brief

- **WHEN** the developer's description mentions states (e.g., "3 steps: menu closed, submenu open, full overlay")
- **THEN** the skill SHALL parse out the state names, show them to the developer for confirmation, and proceed after approval

#### Scenario: Multiple Figma node IDs provided

- **WHEN** the developer provides separate Figma URLs for each state frame
- **THEN** the skill SHALL fetch all nodes sequentially, merge the field analysis, and treat each node as a distinct state

#### Scenario: Trigger type confirmation required

- **WHEN** multiple states or frames are detected from any source
- **THEN** the skill MUST ask how states are triggered (CSS-only, JS-driven, or visual reference only) before generating any code
- **AND** the skill SHALL NOT assume trigger type from frame names alone

#### Scenario: More than 3 JS-driven states detected

- **WHEN** the state list has more than 3 states that require JavaScript (not CSS pseudo-classes)
- **THEN** the skill MUST pause and ask the developer to confirm or reduce the list before generating any code

#### Scenario: CSS-only states detected (hover, focus)

- **WHEN** states map to CSS pseudo-classes only (`:hover`, `:focus-visible`)
- **THEN** the skill SHALL NOT treat these as multi-state — they are handled via CSS with no JavaScript involvement

### Requirement: Generate state-aware TypeScript and CSS

When JS-driven multi-state is confirmed, the skill SHALL generate code using the `data-state` attribute pattern.

#### Scenario: JS-driven state transitions generated

- **WHEN** multi-state is confirmed with JS-driven states
- **THEN** the generated TypeScript SHALL use `block.dataset.state = '<state-name>'` to transition between states
- **AND** the generated CSS SHALL use `[data-state="<state-name>"]` selectors for each state

#### Scenario: Multi-step sequence generated

- **WHEN** states follow a `step-N` sequence pattern
- **THEN** the generated TypeScript SHALL include a `currentStep` variable and a `goToStep(n)` helper that updates `block.dataset.step`

#### Scenario: Visual reference only selected

- **WHEN** the developer selects "visual reference only" as the trigger type
- **THEN** the skill SHALL generate a standard CSS-only TypeScript template and comprehensive CSS covering all frames with no state logic
