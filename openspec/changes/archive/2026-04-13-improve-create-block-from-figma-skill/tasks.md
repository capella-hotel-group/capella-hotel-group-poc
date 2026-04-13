## 1. Rename prompt and skill

- [x] 1.1 Rename `.github/prompts/create-block-from-figma.prompt.md` → `aem-create-block-from-figma.prompt.md`
- [x] 1.2 Update the invocation string inside the prompt body from `/create-block-from-figma` to `/aem-create-block-from-figma`
- [x] 1.3 Rename folder `.github/skills/create-block-from-figma/` → `aem-create-block-from-figma/`
- [x] 1.4 Update `name:` frontmatter in `SKILL.md` to `aem-create-block-from-figma`
- [x] 1.5 Update `description:` frontmatter in `SKILL.md` to reflect the new name

## 2. Add description/brief input to SKILL.md

- [x] 2.1 Update Step 1 (Parse and validate inputs) to document the optional `description` parameter — accepted alongside blockName and figmaUrl
- [x] 2.2 Add logic: if `description` is provided at invocation, store it for use in Steps 3–5; if not provided, skip silently
- [x] 2.3 After Step 2 (Figma fetch), add a conditional: if the fetched node's structure is ambiguous (no state naming, unclear interaction), offer to collect a description before continuing

## 3. Add multi-state detection to SKILL.md Step 3

- [x] 3.1 Add a "State detection" sub-section after the existing "Structure type detection" table in Step 3
- [x] 3.2 Define three detection paths in the sub-section: (a) auto-detect from frame names, (b) parse from description text, (c) multiple node IDs provided
- [x] 3.3 Add a frame-name pattern table: `default/hover/active` → CSS pseudo-class (no JS), `loading/empty/expanded` → JS-driven, `step-1/step-2/step-N` → multi-step sequence
- [x] 3.4 Document the mandatory confirmation step: always show detected states to developer and require approval before generating

## 4. Add state-aware code templates to SKILL.md Step 4

- [x] 4.1 Add state-managing TypeScript template variant using `block.dataset.state` for JS-driven states
- [x] 4.2 Add multi-step TypeScript template variant with `currentStep` variable and `goToStep(n)` helper
- [x] 4.3 Add CSS state modifier block using `[data-state="<state>"]` selectors for each JS-driven state
- [x] 4.4 Add CSS step selector block using `[data-step="<n>"]` selectors for step sequences

## 5. Update pre-write summary and guardrails in SKILL.md

- [x] 5.1 Update Step 5 (Confirm and write) summary block to include `description` (if provided) and detected states (if any)
- [x] 5.2 Add guardrail: `>3 JS-driven states → ask developer to confirm or reduce list before generating`

## 6. Create developer guide

- [x] 6.1 Create `docs/agents/aem-create-block-from-figma.md` with prerequisites (Figma MCP setup), invocation syntax, description/brief guidance, multi-state guidance, and examples
