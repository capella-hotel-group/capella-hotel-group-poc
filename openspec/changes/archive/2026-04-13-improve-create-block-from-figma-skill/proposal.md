## Why

The `create-block-from-figma` prompt and skill work well for straightforward Figma components, but two recurring gaps limit their usefulness: (1) Figma MCP cannot infer interaction semantics, animation timing, accessibility intent, or cross-block dependencies from visual data alone, and (2) components that have multiple display states (hover, loading, step-1/step-2/step-N) appear in Figma as separate frames — without a protocol, the agent either treats them as separate blocks or silently omits the states. Additionally, the current `create-block-from-figma` naming does not follow the `aem-*` prefix convention needed to group AEM-specific skills and prompts, and there is no developer-facing reference doc for how to use the skill.

## What Changes

- Rename prompt file: `create-block-from-figma.prompt.md` → `aem-create-block-from-figma.prompt.md`
- Rename skill folder: `create-block-from-figma/` → `aem-create-block-from-figma/`
- Update `name:` frontmatter and invocation strings to `aem-create-block-from-figma`
- Add optional `description` input parameter to the skill — collected at start, re-offered after Figma fetch if the component is ambiguous
- Add multi-state detection protocol to the skill — auto-detect from frame names, confirm with developer, or accept multiple Figma node IDs
- Add state-aware TypeScript and CSS code templates to the skill
- Create `docs/agents/aem-create-block-from-figma.md` developer guide

## Capabilities

### New Capabilities
- `aem-create-block-from-figma-skill`: Updated skill with description input and multi-state detection/generation support

### Modified Capabilities
- `figma-to-block-prompt`: Rename and invocation string update
- `figma-to-block-skill`: Rename, frontmatter update, and skill content improvements

## Impact

- `.github/prompts/create-block-from-figma.prompt.md` → renamed to `aem-create-block-from-figma.prompt.md`, invocation string updated
- `.github/skills/create-block-from-figma/SKILL.md` → folder renamed, frontmatter updated, Steps 1/3/4/5 and Guardrails extended
- `docs/agents/aem-create-block-from-figma.md` — new developer reference file
