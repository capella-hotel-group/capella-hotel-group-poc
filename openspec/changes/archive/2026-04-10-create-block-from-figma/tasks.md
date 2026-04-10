## 1. Create the Prompt File

- [x] 1.1 Create `.github/prompts/create-block-from-figma.prompt.md` with YAML frontmatter (`description`, no `applyTo`)
- [x] 1.2 Add the input section: parsing block name (kebab-case conversion) and Figma URL (`fileKey` + `nodeId` extraction)
- [x] 1.3 Add the Figma MCP invocation step: call `mcp_com_figma_mcp_get_design_context` when `nodeId` is present, else `mcp_com_figma_mcp_get_metadata`
- [x] 1.4 Add the unavailability guard: stop with a clear message if Figma MCP tools are not available
- [x] 1.5 Add the field-type mapping table (Figma layer → AEM component type) with the 7 mapping rules
- [x] 1.6 Add the structure decision tree: simple model vs container+filter pattern, with the 3+ repeating children rule and the ask-if-ambiguous guardrail
- [x] 1.7 Add the 4-field limit enforcer: warn and ask developer to prioritize if analysis yields >4 fields
- [x] 1.8 Add the block-name collision check: detect existing `src/blocks/<name>/` folder and ask to overwrite or abort
- [x] 1.9 Add the file generation templates for all three files (`_<block-name>.json`, `<block-name>.ts`, `<block-name>.css`) with:
  - Simple model JSON template (hero-style)
  - Container+filter JSON template (cards-style)
  - CSS-only TS template
  - DOM-restructuring TS template (async, with `moveInstrumentation` import)
  - CSS template (BEM selectors, `var(--token-name)`, range media queries)
- [x] 1.10 Add Step 6 to the prompt and skill: run `npm run build:json` after writing the block files to regenerate the root `component-models.json`, `component-definition.json`, and `component-filters.json`

## 2. Create the Skill File

- [x] 2.1 Create `.github/skills/create-block-from-figma/SKILL.md` with YAML frontmatter: `name: create-block-from-figma`, `description`, `license: MIT`, `compatibility: Requires Figma MCP server`
- [x] 2.2 Mirror the full workflow from the prompt file into the skill body so agent-to-agent invocation produces identical output

## 3. Verify

- [x] 3.1 Run `/create-block-from-figma` in Copilot Chat (Agent mode) with a Figma URL to confirm all three files are generated at `src/blocks/<name>/`
- [x] 3.2 Run `npm run lint` on the generated block and confirm it passes (≤4 fields, no duplicate names, valid CSS)
- [x] 3.3 Run `npm run build` and confirm the generated TypeScript compiles without errors
