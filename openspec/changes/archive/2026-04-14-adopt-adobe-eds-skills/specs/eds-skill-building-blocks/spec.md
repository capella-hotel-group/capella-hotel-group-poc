## ADDED Requirements

### Requirement: Block files are TypeScript in src/blocks/

The skill SHALL create new block files at `src/blocks/{name}/{name}.ts` and `src/blocks/{name}/{name}.css`, not at `blocks/{name}/`, because `blocks/` is a generated output directory.

#### Scenario: Scaffolding a new block

- **WHEN** the skill scaffolds a new block named `dining-nav`
- **THEN** it SHALL create `src/blocks/dining-nav/dining-nav.ts` and `src/blocks/dining-nav/dining-nav.css`; it SHALL NOT create anything in `blocks/`

### Requirement: Block decorator uses TypeScript signature with HMTLElement parameter

The skill SHALL use the TypeScript function signature `export default async function decorate(block: HTMLElement): Promise<void>` for all block decorators.

#### Scenario: New block decorator

- **WHEN** the skill generates a block decorator
- **THEN** the function signature SHALL be `export default async function decorate(block: HTMLElement): Promise<void>` with no `eslint-disable` comments

### Requirement: Imports use @/\* alias

The skill SHALL use `@/*` alias (mapped to `src/*`) for all cross-module imports, never relative paths across module boundaries (e.g., `import { createOptimizedPicture } from '@/app/aem.js'`).

#### Scenario: Importing AEM utilities

- **WHEN** the block needs `moveInstrumentation` or `createOptimizedPicture`
- **THEN** the import SHALL be `import { moveInstrumentation } from '@/app/aem.js'`, not `../../scripts/aem.js`

### Requirement: DOM mutation uses replaceChildren, never innerHTML without sanitization

The skill SHALL build new DOM elements and call `block.replaceChildren(...newElements)` once. If `innerHTML` assignment is required, it SHALL use `DOMPurify.sanitize()` first.

#### Scenario: Rebuilding block DOM

- **WHEN** the skill generates decoration logic that rebuilds the block's children
- **THEN** it SHALL call `block.replaceChildren(wrapper)` once at the end, not reassign `block.innerHTML` without sanitization

#### Scenario: External HTML content

- **WHEN** the block renders HTML from an external or user-supplied source
- **THEN** the skill SHALL generate `el.innerHTML = DOMPurify.sanitize(externalHtml)` with DOMPurify imported from `@/app/scripts.js` or a direct import

### Requirement: Null safety guards before querySelector usage

The skill SHALL generate null guard checks (e.g., `if (!el) return;` or optional chaining) before accessing properties on `querySelector` results, because `strictNullChecks` is enabled.

#### Scenario: querySelector result usage

- **WHEN** the skill generates `const img = block.querySelector('picture')`
- **THEN** the next line SHALL guard: `if (!img) return;` or use optional chaining, never directly access `.src` or other properties without a check

### Requirement: CSS selectors are scoped to block

The skill SHALL scope all CSS selectors under `main .{block-name}` or `.{block-name}`, never using bare unscoped selectors.

#### Scenario: CSS for a block

- **WHEN** the skill generates CSS for `dining-nav`
- **THEN** all selectors SHALL start with `main .dining-nav` or `.dining-nav`, not bare `.title` or `h2`

### Requirement: CSS uses var(--token) from design system

The skill SHALL use CSS custom properties (`var(--token-name)`) from `:root` in `src/styles/styles.css` instead of hardcoded hex/px values for colors, font families, and spacing that belong to the design system.

#### Scenario: Block background color

- **WHEN** setting background color
- **THEN** the skill SHALL use `var(--background-color)` not `#ffffff`

### Requirement: Unused parameters prefixed with underscore

The skill SHALL prefix intentionally unused parameters with `_` (e.g., `_block`) to satisfy `noUnusedParameters` without disabling the rule.

#### Scenario: Decorated block with unused param

- **WHEN** a block's `decorate` function doesn't use the `block` parameter
- **THEN** the parameter SHALL be named `_block`
