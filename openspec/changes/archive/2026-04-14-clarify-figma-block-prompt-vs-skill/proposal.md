## Why

The `figma-to-block-skill` v2.0 upgrade added multi-state detection, trigger-type confirmation, multi-URL support, and devBrief handling — improvements that were never backported to the `.prompt.md`. The two files now duplicate logic with diverging content, and neither file explains why both exist, so developers ask "which one do I use?" and maintenance becomes a two-file problem every time the workflow evolves.

## What Changes

- `.github/prompts/aem-create-block-from-figma.prompt.md` — replaced with a thin delegation wrapper: it parses the developer's inputs and invokes the `aem-create-block-from-figma` skill. No workflow logic lives here.
- `.github/skills/aem-create-block-from-figma/SKILL.md` — promoted as the single canonical implementation. A purpose header is added to explain that it is invoked by both the prompt (human entry point) and other agents (machine entry point). No logic changes.
- `docs/agents/aem-create-block-from-figma.md` — updated with an Architecture section explaining the two-entry-point model and when each path is used.

## Capabilities

### New Capabilities

### Modified Capabilities

- `figma-to-block-prompt`: The prompt no longer implements workflow logic itself. Its requirement changes from "matches the skill step-by-step" to "delegates to the skill with parsed inputs". Developer-visible behaviour (slash command, input format, file output) is unchanged.
- `figma-to-block-skill`: The "Skill logic mirrors the prompt" requirement is removed and replaced with "Skill is the canonical implementation" — invokable both by humans (via prompt delegation) and by agents programmatically.

## Impact

- `.github/prompts/aem-create-block-from-figma.prompt.md` — rewritten (developer UX unchanged)
- `.github/skills/aem-create-block-from-figma/SKILL.md` — purpose header added only (logic unchanged)
- `docs/agents/aem-create-block-from-figma.md` — Architecture section added
