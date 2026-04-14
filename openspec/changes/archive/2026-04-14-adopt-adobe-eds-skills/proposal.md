## Why

Adobe has published an [open-source EDS skills library](https://github.com/adobe/skills/tree/main/skills/aem/edge-delivery-services/skills) containing well-structured workflows for block creation, code review, content modeling, and testing. This project currently lacks automated guidance for these tasks — developers rely on static instruction files with no invocable skills in Copilot Chat. Adopting and adapting these skills to fit the project's TypeScript/Vite architecture is a high-value, low-risk improvement.

## What Changes

- **7 new skills** added to `.github/skills/` — each is an adaptation of the upstream `adobe/skills` skill, adjusted for this project's TypeScript/Vite architecture
- **`ue-component-model`**: Create/edit `component-definition.json`, `component-models.json`, `component-filters.json` for Universal Editor blocks
- **`content-driven-development`**: 8-step orchestrator workflow for all code changes — from dev server start to PR ship
- **`building-blocks`**: Implement block TypeScript + CSS following CDD step 5
- **`testing-blocks`**: Lint + browser validation after implementation
- **`content-modeling`**: Design content model (table structure) for UE authoring
- **`code-review`**: Self-review or PR review against EDS standards + TypeScript rules
- **`docs-search`**: Search AEM EDS documentation

Key adapter changes vs. upstream skills:

- Dev command: `aem up` → `npm run start`
- File paths: `blocks/{name}/*.js` → `src/blocks/{name}/*.ts`
- Import style: relative paths → `@/*` alias
- Sanitizer: raw `innerHTML` → `DOMPurify.sanitize()` (required)
- DOM pattern: `block.innerHTML =` → `block.replaceChildren()`
- TypeScript strictness: `strictNullChecks` guard before every `querySelector` usage
- Build: `tsc --noEmit` type check + `vite build` (not vanilla EDS)

## Capabilities

### New Capabilities

- `aem-skill-ue-component-model`: Guides creation/editing of the 3 Universal Editor JSON config files — analyzes block TS to infer fields, classifies block type (simple / container / key-value), validates ID consistency
- `aem-skill-content-driven-development`: 8-step CDD orchestrator adapted for TypeScript/Vite — starts server with `npm run start`, invokes sub-skills, ships PR with conventional commit
- `aem-skill-building-blocks`: Implements TypeScript blocks — `src/blocks/{name}/` file structure, `@/*` imports, `decorate()` pattern, `replaceChildren()`, DOMPurify
- `aem-skill-testing-blocks`: Post-implementation testing — `npm run lint`, browser validation with Playwright/MCP browser, mandatory screenshots
- `aem-skill-content-modeling`: Designs content model for UE authoring — table structure and row/column conventions per `block-authoring.instructions.md`
- `aem-skill-code-review`: Code review before PR — TypeScript patterns, CSS scoping, security (DOMPurify), performance, EDS best practices
- `aem-skill-docs-search`: Searches AEM EDS documentation at `aem.live/docs`

### Modified Capabilities

<!-- No existing specs change requirements — these are entirely new capabilities -->

## Impact

- **Added**: 7 skill directories in `.github/skills/`, each containing a `SKILL.md`
- **Unchanged**: Source code in `src/`, existing instruction files, openspec config
- **Dependencies**: Upstream `github.com/adobe/skills` is a reference only, not a runtime dependency
- **Compatibility**: All new skills can be invoked alongside the existing `aem-skill-create-block-from-figma` and openspec skills
