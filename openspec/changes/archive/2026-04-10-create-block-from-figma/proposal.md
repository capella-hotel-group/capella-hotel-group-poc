## Why

Translating a Figma component into an AEM EDS xwalk block currently requires a developer to manually inspect the design, decide on field types, and write three boilerplate files from scratch. This is repetitive and error-prone. A prompt-driven workflow that reads the Figma design directly via MCP eliminates that manual gap and ensures consistent xwalk model structure from the start.

## What Changes

- **New prompt command** `/create-block-from-figma` accepts a block name and a Figma URL, queries the design via Figma MCP, and scaffolds all three required block files automatically.
- **New skill** `create-block-from-figma` wraps the same logic for agent-to-agent invocation by other OpenSpec workflows.
- The prompt enforces all existing project conventions (kebab-case names, max 4 fields per model, BEM CSS, `@/*` imports, xwalk JSON schema) so generated output is lint-clean out of the box.
- For ambiguous structures (e.g., unclear whether a section is a container+items pattern or a single model), the prompt asks the developer before generating.

## Capabilities

### New Capabilities

- `figma-to-block-prompt`: A Copilot Chat prompt file (`.github/prompts/create-block-from-figma.prompt.md`) that orchestrates: Figma URL parsing → MCP data fetch → content analysis → field-type mapping → block file generation.
- `figma-to-block-skill`: A companion skill file (`.github/skills/create-block-from-figma/SKILL.md`) that exposes the same workflow for use by other agents.

### Modified Capabilities

*(none — no existing spec-level behavior changes)*

## Impact

- New files added under `.github/prompts/` and `.github/skills/` — no changes to `src/` or build output.
- No runtime impact; the prompt/skill is a developer tooling artifact only.
- Requires the Figma MCP server to be configured in the developer's VS Code instance (`mcp_com_figma_mcp_*` tools available).
