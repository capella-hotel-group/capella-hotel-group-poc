## Context

This project uses AEM Edge Delivery Services (EDS) with the Universal Editor (xwalk) authoring stack. Every block consists of three files: a TypeScript decorator, a CSS stylesheet, and a JSON model that defines the editable fields exposed to content authors.

Currently, no automated path exists from a Figma design to a block scaffold. A developer must manually inspect the design, decide on field types, and write boilerplate. The Figma MCP server (`mcp_com_figma_*`) is available in the project's VS Code environment and can return structured node data from any Figma URL.

## Goals / Non-Goals

**Goals:**
- Provide a Copilot Chat prompt (`/create-block-from-figma`) that reads a Figma node and scaffolds all three block files
- Map Figma layer/component types to AEM xwalk field types deterministically
- Detect repeating-item structures and apply the container+filter model pattern automatically
- Enforce all project conventions so generated output passes `npm run lint` and `npm run build` without modification
- Bundle the same logic as a reusable skill for invocation by other agents

**Non-Goals:**
- Generating pixel-perfect CSS (layout structure only — tokens and selectors, not fine-tuned spacing)
- Creating SharePoint/Google Drive content pages for preview
- Automating git commits or PR creation
- Supporting Figma files outside the `mcp_com_figma_*` tool's access scope

## Decisions

### Decision 1: Prompt file + Skill file (two deliverables)

**Choice**: Produce both `.github/prompts/create-block-from-figma.prompt.md` and `.github/skills/create-block-from-figma/SKILL.md`.

**Rationale**: The prompt is the developer-facing entry point invoked via `/create-block-from-figma` in Chat. The skill wraps the same logic so future OpenSpec workflows (e.g., `/opsx:apply` implementing a change that includes a block) can invoke it as a subagent without copy-pasting the logic.

**Alternatives considered**: Prompt-only (simpler) — rejected because it creates duplication risk if the logic is needed in an agent context later.

---

### Decision 2: Inline field-type mapping table in the prompt (no separate instruction file)

**Choice**: Embed the Figma-layer-to-AEM-component mapping table directly in the prompt file.

**Rationale**: The mapping is specific to this workflow. Adding a new `.instructions.md` file would couple it to `src/blocks/**` via `applyTo`, which is the wrong scope — this prompt applies to Figma analysis, not block source editing. A self-contained prompt is cleaner.

**Alternatives considered**: New `figma-block-mapping.instructions.md` — rejected due to wrong `applyTo` scope.

---

### Decision 3: Structure decision tree — simple vs container

**Choice**: Detect repeating child frames in the Figma node as the signal for a container+filter model.

**Rationale**: The xwalk pattern for repeating content (like Cards) requires a parent block with a `filter` in its definition, a child item defined with a separate model, and a `filters` array in the JSON. A single content block uses a `model` key instead. This is deterministic from Figma structure: a frame containing multiple instances of the same component → container; otherwise → simple model.

**Rule applied**: If the immediate children of the target node are all the same Figma component or if there are 3+ visually similar child frames → propose container pattern. If ambiguous → ask the developer before generating.

---

### Decision 4: Max 4 fields enforcer

**Choice**: The prompt must warn when Figma analysis yields more than 4 content fields and ask the developer how to split them across models.

**Rationale**: The xwalk ESLint plugin enforces a maximum of 4 cells per block row. A generated JSON that exceeds this will fail `npm run lint`. Rather than silently truncating, the prompt surfaces this constraint and asks the developer to prioritize.

---

### Decision 5: Figma MCP tool selection

**Choice**: Use `mcp_com_figma_mcp_get_design_context` as the primary tool, falling back to `mcp_com_figma_mcp_get_metadata` if `nodeId` is not present in the URL.

**Rationale**: `get_design_context` returns structured component/layer data plus a screenshot and code hints — it gives the most complete picture for field inference. `get_metadata` is sufficient when only the file-level structure is needed (e.g., listing top-level frames to let the user pick).

## Risks / Trade-offs

- **Figma MCP unavailable** → The prompt fails gracefully with a clear message ("Figma MCP is not connected. Please ensure the Figma MCP server is running in your VS Code settings."). No files are generated.
- **Figma node has non-standard layers** (e.g., complex nested components with no clear text/image hierarchy) → The mapping may suggest generic `richtext` + `reference` fields. The developer should review before accepting. The prompt explicitly says "review the generated model before committing."
- **Block name collision** (folder already exists in `src/blocks/`) → The prompt checks for existing folders and asks the developer whether to overwrite or abort.
- **More than 4 fields** → Prompt enforces the split decision (see Decision 4). Trade-off: requires developer input, adding a step. Mitigation: the prompt suggests a sensible default split.
- **CSS tokens**: Generated CSS uses placeholder `var(--token-name)` references. The developer must map these to the actual token names from `src/styles/styles.css`.
