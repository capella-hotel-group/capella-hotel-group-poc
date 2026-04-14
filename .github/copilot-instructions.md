# Capella Hotel Group PoC — Copilot Instructions

AEM Edge Delivery Services project using the WYSIWYG authoring stack (Universal Editor).
Built with TypeScript + Vite; CSS-only styling with design tokens; no frontend framework.

## Architecture

```
src/                ← Source of truth — ONLY edit files here
  app/              ← AEM EDS runtime (scripts.ts, aem.ts, delayed.ts)
  blocks/           ← One folder per block ({name}.ts + {name}.css + _{name}.json)
  models/           ← AEM component model JSON fragments (merged by build:json)
  styles/           ← Global CSS (styles.css, lazy-styles.css, fonts.css)
  types/            ← Global TypeScript declarations
  utils/            ← Shared utilities (currently stub; shared helpers are in app/scripts.ts)

blocks/             ← GENERATED — do not edit
scripts/            ← GENERATED — do not edit
styles/             ← GENERATED — do not edit
chunks/             ← GENERATED — do not edit
```

New blocks are **auto-discovered** — adding `src/blocks/{name}/{name}.ts` is enough to register a build entry.

## Build & Dev Commands

```sh
npm i                  # install dependencies
npm run start          # dev: TS watch + Vite watch + aem up (localhost:3000)
npm run build          # production: tsc type-check → vite build → editor build
npm run build:json     # merge src/models/_*.json fragments into root AEM JSON files
npm run lint           # ESLint (JS/TS) — run before committing
npm run lint:fix       # auto-fix lint errors
npm run format         # Prettier on all files
```

> `tsc` is type-check only (`noEmit: true`). Vite/Rollup compiles and emits all output.
> There are currently **no unit tests**.

## Key Conventions

- **Imports**: always use the `@/*` alias (maps to `src/*`). Never use relative paths across modules.
- **Block decorator**: default export `async function decorate(block: HTMLElement): Promise<void>`.
- **DOM mutation**: build new elements, then call `block.replaceChildren(...newElements)` once. Do not reassign `block` itself (`no-param-reassign`).
- **Null safety**: `strictNullChecks` is enabled — always guard `querySelector` / `querySelectorAll` results before use.
- **CSS tokens**: use `var(--token-name)` from `:root` in `src/styles/styles.css`; never hardcode hex/px values that belong to the design system.
- **Security**: sanitize any external or user-supplied HTML with `DOMPurify` before assigning to `innerHTML`. This is the only approved sanitizer.
- **Unused parameters**: prefix with `_` (e.g., `_block`) to satisfy `noUnusedParameters` without disabling the rule.

## Detailed Guidance

- Block authoring rules (structure, AEM model JSON, loading phases, images): see [block-authoring.instructions.md](.github/instructions/block-authoring.instructions.md)
- TypeScript, CSS formatting, import style, DOM patterns: see [coding-style.instructions.md](.github/instructions/coding-style.instructions.md)
- AEM EDS developer docs: https://www.aem.live/docs/
