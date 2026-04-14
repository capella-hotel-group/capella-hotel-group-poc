## Context

This project is an AEM Edge Delivery Services (xwalk/UE) site using **TypeScript + Vite** instead of vanilla JS. The source of truth lives in `src/blocks/` (TypeScript) and is compiled to `blocks/` by Vite/Rollup — unlike standard EDS projects that only have `blocks/` with plain JS.

Adobe has published an EDS skills collection at `github.com/adobe/skills` (Apache-2.0). These skills are written for vanilla JS EDS projects. Using them in this project requires adapting several specific points without changing the core workflow logic of each skill.

The project already has `aem-skill-create-block-from-figma` as a reference for the `SKILL.md` pattern under `.github/skills/`. Seven new skills following the same pattern need to be created.

## Goals / Non-Goals

**Goals:**

- Create 7 skill files (`SKILL.md`) under `.github/skills/aem-skill-{name}/` — each an adaptation of the upstream adobe/skills skill
- Accurately adapt architectural differences (TypeScript, `src/`, `@/*` alias, DOMPurify, `npm run start`)
- Preserve the core workflow logic of each skill (dependency chains, step ordering, philosophy)
- Skills are immediately invocable via Copilot Chat

**Non-Goals:**

- No automatic sync with upstream `adobe/skills` on their updates
- No plugin or extension system
- No changes to project source code (skills are guidance only, not code)
- Not adopting all 18 skills — only the 7 with high relevance

## Decisions

### 1. Name skills with `aem-skill-` prefix

**Decision**: Use the `aem-skill-{name}` pattern (e.g., `aem-skill-building-blocks`) consistent with the existing `aem-skill-create-block-from-figma` pattern.

**Rationale**: Consistent with the existing Figma skill (`aem-skill-create-block-from-figma`). Clearly distinguishes from openspec skills (`openspec-` prefix). The `aem-skill-` prefix communicates these are AEM EDS workflow skills.

**Alternatives considered**: Use the upstream name directly (e.g., `building-blocks`) — rejected because it conflicts with the block folder name; use `adobe-skill-` — unnecessarily verbose.

### 2. Each SKILL.md is the primary entry point; auxiliary files within the skill directory are permitted

**Decision**: Each `SKILL.md` is the primary and self-sufficient entry point — it contains all context required for the common case. Auxiliary files (e.g., `resources/`, `references/`, `scripts/`) within the same skill directory are permitted when they extend coverage for advanced or reference scenarios, provided `SKILL.md` remains fully functional without them.

**Rationale**: Copilot reads skills from absolute paths in the workspace. Skills cross-reference each other via the `description` field so Copilot knows when to invoke them, not through file inclusion. Intra-skill resource files (within `.github/skills/aem-skill-{name}/`) are not cross-skill dependencies — they are optional depth layers that agents may be directed to read for completeness.

**Boundary**: `SKILL.md` MUST NOT reference files outside of its own skill directory (except standard project files under `.github/instructions/` and `src/`). Cross-skill file references remain prohibited.

**Alternatives considered**: Inline all content into `SKILL.md` — rejected for large reference tables (e.g., 17 UE field types) where inline content would bloat the file and reduce readability. Create a `shared-resources/` folder — rejected because it increases coupling and Copilot has no file-inclusion mechanism for skills.

### 3. Skill dependency chain via orchestrator

**Decision**: `content-driven-development` is the orchestrator — it invokes other skills in order. Skills like `building-blocks` and `testing-blocks` still work standalone but clearly document "SHOULD be invoked from CDD".

**Rationale**: Preserves the architecture of adobe/skills — CDD is the entry point, others are sub-skills. Developers can still invoke sub-skills directly when needed.

### 4. TypeScript-specific overrides

**Decision**: Replace all JS patterns with TypeScript equivalents throughout the `building-blocks` skill:

- `export default async function decorate(block: HTMLElement): Promise<void>`
- `import { ... } from '@/app/aem.js'` (using `@/*` alias)
- Guard pattern: `const el = block.querySelector('.foo'); if (!el) return;`
- `DOMPurify.sanitize()` required for every `innerHTML` assignment

**Rationale**: If JS patterns remain in the skill, developers will generate `.ts` files with JS syntax — causing linting and type errors.

### 5. Dev server command

**Decision**: Replace `aem up` with `npm run start` across all skills.

**Rationale**: The project does not expose the `aem` CLI directly; `npm run start` wraps `tsc --watch + vite + aem up` into a single command. Using `aem up` alone would skip TypeScript compilation.

### 6. `docs-search` — scoped to AEM docs URL patterns

**Decision**: `aem-skill-docs-search` focuses on `aem.live/docs` and `aem.live/developer`, prioritising official AEM documentation over Block Collection.

**Rationale**: The upstream skill includes a Block Collection search script (`search-block-collection-github.js`) that does not exist in this project. Simplifying to a fetch-based approach is cleaner.

## Risks / Trade-offs

- **[Risk] Skills drift from upstream** → Mitigation: Document source URL and reference date in frontmatter; review when there is a major EDS version bump
- **[Risk] `content-driven-development` invokes sub-skills but Copilot has no hard-wired invocation** → Mitigation: Each step in the CDD skill explicitly states "Invoke: `aem-skill-{name}`" — Copilot will read the correct skill when activated
- **[Risk] `testing-blocks` requires Playwright/MCP browser** → Mitigation: Skill documents all 3 options (MCP browser, Playwright script, manual) — developer can choose the available one
- **[Trade-off] Self-contained vs. DRY**: Some content is duplicated across skills (e.g., TypeScript patterns in both `building-blocks` and `code-review`) → accepted duplication in exchange for self-contained behavior

## Migration Plan

No migration required — this is an additive change. The new skills do not modify any existing files.

Deploy: create 7 directories under `.github/skills/`, each containing one `SKILL.md`. Copilot discovers them when they are listed in the `<skills>` section of `.github/copilot-instructions.md`.

Rollback: deleting the skill directory is sufficient.

## Open Questions

- Do skills need to be manually listed in the `copilot-instructions.md` skills section, or does Copilot auto-discover from `.github/skills/`? → Verify during implementation
- Does `docs-search` need MCP fetch tool integration, or is plain `fetch_webpage` available in Copilot sufficient?
