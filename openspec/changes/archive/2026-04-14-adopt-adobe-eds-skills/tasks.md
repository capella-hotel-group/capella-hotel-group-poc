## 1. Understand full upstream structure before writing anything

Each upstream skill contains not only a `SKILL.md` but also `scripts/` and/or `resources/` (or `references/`) subdirectories. Fetch and read all of them before adapting.

- [x] 1.1 Read `ue-component-model`: `SKILL.md` + `references/architecture.md` + `references/field-types.md` + `references/examples.md`
- [x] 1.2 Read `content-driven-development`: `SKILL.md` + `resources/cdd-philosophy.md` + `resources/html-structure.md`
- [x] 1.3 Read `building-blocks`: `SKILL.md` + `resources/js-guidelines.md` + `resources/css-guidelines.md`
- [x] 1.4 Read `testing-blocks`: `SKILL.md` + `resources/testing-philosophy.md` + `resources/troubleshooting.md` + `resources/unit-testing.md` + `resources/vitest-setup.md`
- [x] 1.5 Read `content-modeling`: `SKILL.md` + `resources/canonical-models.md` + `resources/advanced-scenarios.md`
- [x] 1.6 Read `code-review`: `SKILL.md` + `resources/review-checklist.md` + `scripts/capture-screenshots.js`
- [x] 1.7 Read `docs-search`: `SKILL.md` + `scripts/search.js` (Node.js script that queries `aem.live/docpages-index.json`)

## 2. Implement aem-skill-ue-component-model

Upstream structure: `SKILL.md` + `references/` (3 files: `architecture.md`, `field-types.md`, `examples.md`)

- [x] 2.1 Write `SKILL.md` with frontmatter `name: aem-skill-ue-component-model`, `applyTo: src/blocks/**`; adapt 5-step workflow (paths `src/blocks/`, `.ts` extension, centralized config, `npm run build:json`)
- [x] 2.2 Write `references/architecture.md`: adapt upstream to reflect this project's JSON config pipeline — source at root JSON files + `src/models/` merged by `npm run build:json`; keep the AEM→Markdown→HTML pipeline explanation
- [x] 2.3 Write `references/field-types.md`: copy upstream content (it's stack-agnostic); add note that `valueType` and TypeScript DOM patterns map as documented in `aem-skill-ue-component-model` spec
- [x] 2.4 Write `references/examples.md`: replace upstream block examples (Hero, Cards, etc.) with examples using **this project's actual blocks** from `src/blocks/` (e.g., `hero`, `cards`, `video-photo-player`, `menus`)

## 3. Implement aem-skill-content-driven-development

Upstream structure: `SKILL.md` + `resources/` (2 files: `cdd-philosophy.md`, `html-structure.md`)

- [x] 3.1 Write `SKILL.md`: adapt 8-step workflow — `npm run start` (not `aem up`), reference adapted sub-skills (`aem-skill-building-blocks`, `aem-skill-content-modeling`, `aem-skill-testing-blocks`), add Conventional Commits format and no-`git add .` rule in step 8
- [x] 3.2 Write `resources/cdd-philosophy.md`: copy upstream content as-is (philosophy is stack-agnostic); add one note about TypeScript compilation being part of the workflow
- [x] 3.3 Write `resources/html-structure.md`: copy upstream content; adapt the draft file path from `drafts/tmp/` to match this project's dev server setup; confirm `npm run start` serves `drafts/` folder

## 4. Implement aem-skill-building-blocks

Upstream structure: `SKILL.md` + `resources/` (2 files: `js-guidelines.md`, `css-guidelines.md`)

- [x] 4.1 Write `SKILL.md`: adapt block implementation steps — file paths `src/blocks/{name}/{name}.ts`, TypeScript decorator signature, `@/*` imports, `replaceChildren()`, DOMPurify for `innerHTML`, null guards; keep step 5 reference to `aem-skill-testing-blocks`
- [x] 4.2 Write `resources/js-guidelines.md`: start from upstream content; replace every JS pattern with TypeScript equivalent:
  - Function signature: `export default async function decorate(block: HTMLElement): Promise<void>`
  - Imports: `import { createOptimizedPicture } from '@/app/aem.js'` (not `../../scripts/aem.js`)
  - Null safety: add `if (!el) return;` guard pattern after every `querySelector`
  - Unused params: `_block` prefix convention
  - DOMPurify: replace the "don't use innerHTML" bad-pattern warning with "use `DOMPurify.sanitize()` if innerHTML is required"
  - Update ESLint config note to reference `eslint.config.js` (not airbnb-base directly)
  - Dynamic imports: keep `await import()` patterns but use `@/*` paths
- [x] 4.3 Write `resources/css-guidelines.md`: copy upstream content (rules are stack-agnostic); update the token list reference from `styles/styles.css` → `src/styles/styles.css`; verify all breakpoint examples already use `(width >= Xpx)` syntax (they do — no change needed)

## 5. Implement aem-skill-testing-blocks

Upstream structure: `SKILL.md` + `resources/` (4 files: `testing-philosophy.md`, `troubleshooting.md`, `unit-testing.md`, `vitest-setup.md`)

- [x] 5.1 Write `SKILL.md`: adapt linting commands (already `npm run lint` — no change), keep 3 browser testing options (MCP, Playwright script, manual), add mandatory screenshot requirement; update unit test path to `test/` and note "Vitest" for this project
- [x] 5.2 Write `resources/testing-philosophy.md`: copy upstream content; add note that the project has no existing unit tests — new tests go in `test/`
- [x] 5.3 Write `resources/troubleshooting.md`: copy upstream content; add a TypeScript-specific section: "TypeScript watch errors during testing — run `npm run build` to check compilation errors; `tsc` is `noEmit: true` so errors show in terminal but don't block Vite"
- [x] 5.4 Write `resources/unit-testing.md`: copy upstream content; update import style to `@/*` alias; confirm Vitest config path (`vitest.config.ts` or inline in `vite.config.ts`)
- [x] 5.5 Write `resources/vitest-setup.md`: adapt upstream setup guide for TypeScript — use `.ts` test files, ensure `tsconfig.json` includes `test/` in `include`, update any `jsdom` or `@vitest/browser` config references

## 6. Implement aem-skill-content-modeling

Upstream structure: `SKILL.md` + `resources/` (2 files: `canonical-models.md`, `advanced-scenarios.md`)

- [x] 6.1 Write `SKILL.md`: document AEM table content model design workflow — table structure rules from `block-authoring.instructions.md` (row 1 = block name, subsequent rows = content), ≤4 cells per row, semantic collapsing (link+linkText, image+imageAlt); output format: template table + field descriptions + filled example
- [x] 6.2 Write `resources/canonical-models.md`: adapt upstream canonical model examples to use **this project's actual blocks** (`hero`, `cards`, `menus`, `video-photo-player`); each model should include the markdown table template used in Google Docs/SharePoint and the UE property panel fields
- [x] 6.3 Write `resources/advanced-scenarios.md`: adapt upstream advanced scenarios; focus on container blocks (e.g., `cards`) and key-value blocks; reference this project's `src/models/` structure

## 7. Implement aem-skill-code-review

Upstream structure: `SKILL.md` + `resources/review-checklist.md` + `scripts/capture-screenshots.js` + `scripts/package.json`

- [x] 7.1 Write `SKILL.md`: adapt self-review mode to add TypeScript checklist; add DOMPurify BLOCKING rule; add `blocks/` (generated) = error check; keep PR review mode and GitHub Suggestions workflow unchanged
- [x] 7.2 Write `resources/review-checklist.md`: extend upstream checklist with TypeScript-specific items:
  - `[ ]` All `querySelector` results null-guarded
  - `[ ]` No `any` type without justification
  - `[ ]` Imports use `@/*` alias (not relative paths across modules)
  - `[ ]` `export default async function decorate(block: HTMLElement): Promise<void>` signature
  - `[ ]` `block.replaceChildren()` used for DOM rebuild (not `block.innerHTML =`)
  - `[ ]` DOMPurify used for any `innerHTML` with external/user content (BLOCKING)
  - `[ ]` Changes are in `src/blocks/` not `blocks/` (generated)
  - `[ ]` Unused params prefixed with `_`
- [x] 7.3 Copy `scripts/capture-screenshots.js` from upstream **as-is** (Playwright script is stack-agnostic); update the URL pattern comment to reference this project: `{branch}--capella-hotel-group-poc--ogilvy.aem.page`
- [x] 7.4 Write `scripts/package.json` with `playwright` as a dev dependency (same as upstream)

## 8. Implement aem-skill-docs-search

Upstream structure: `SKILL.md` + `scripts/search.js` + `scripts/package.json` + `scripts/package-lock.json`

- [x] 8.1 Write `SKILL.md`: define primary sources (`aem.live/docs`, `aem.live/developer`), secondary source (Block Collection), add rule to surface `.github/instructions/` project overrides alongside AEM docs; reference `scripts/search.js` for CLI usage
- [x] 8.2 Copy `scripts/search.js` from upstream **as-is**: the script queries `https://www.aem.live/docpages-index.json` and `https://www.aem.live/query-index.json` — these are public AEM documentation indexes and require no project-specific changes
- [x] 8.3 Copy `scripts/package.json` from upstream as-is (only uses built-in Node.js `https` and `fs` modules — no external dependencies)

## 9. Register skills in copilot-instructions.md

- [x] 9.1 Verify how Copilot discovers skills: check whether `.github/copilot-instructions.md` requires manual listing or auto-discovers from `.github/skills/`
- [x] 9.2 Add 7 new skills to the `<skills>` section in `.github/copilot-instructions.md` if required (following the existing skill pattern with `<name>`, `<description>`, `<file>` fields)

## 10. Verify and smoke test

- [x] 10.1 Check that all 7 `SKILL.md` files have valid frontmatter (`name`, `description`)
- [x] 10.2 Check that all `resources/` and `references/` files exist and are non-empty for each skill
- [x] 10.3 For `docs-search`: run `node .github/skills/aem-skill-docs-search/scripts/search.js block decoration` to confirm the search script works against the live AEM docs index
- [x] 10.4 For `code-review`: verify `scripts/capture-screenshots.js` has correct Playwright imports and updated project URL prefix
- [x] 10.5 Manually invoke `aem-skill-ue-component-model` with an existing block (e.g., `hero`) to confirm field inference and JSON config output
- [x] 10.6 Invoke `aem-skill-code-review` on a block file to confirm the TypeScript checklist fires correctly
- [x] 10.7 Commit: `feat(skills): add 7 adapted adobe EDS skills for typescript/vite project`
