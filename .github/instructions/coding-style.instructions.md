---
description: 'Use when writing TypeScript or CSS for this AEM Edge Delivery project. Covers import conventions, TypeScript strictness, DOM patterns, Prettier/ESLint rules, and CSS formatting standards.'
applyTo: 'src/**'
---

# Coding Style — Capella Hotel Group PoC

## TypeScript

### Compiler Settings

- Target: `ES2022`, module: `ESNext`
- `strict: false` globally, but **`strictNullChecks: true`** is enforced — never assume a querySelector result is non-null without a guard
- Decorators enabled via `experimentalDecorators`

### Imports

- Always use the `@/*` path alias (resolves to `src/*`) — never relative `../../` paths
- Named imports from AEM helpers: `import { loadHeader, decorateButtons } from '@/app/aem'`
- Utilities: `import { moveInstrumentation, moveAttributes } from '@/app/scripts'`

### Unused Variables

- Prefix intentionally unused parameters or variables with `_` to satisfy the ESLint rule
- The `no-unused-vars` rule ignores names matching `/^_/`

### `no-param-reassign`

- Do not reassign function parameters or their properties directly
- Build new objects/elements instead of mutating what was passed in

### Function Declaration Order

- Functions may be called before they are defined (`@typescript-eslint/no-use-before-define` allows functions; disallows classes and variables)

## Formatting (Prettier)

| Setting           | Value    |
| ----------------- | -------- |
| Print width       | 120      |
| Quotes            | Single   |
| Trailing commas   | All      |
| Semicolons        | Yes      |
| Line endings      | LF       |
| Tab width (JS/TS) | 2 spaces |
| Tab width (CSS)   | 4 spaces |

Do not manually configure these — Prettier enforces them automatically via `lint-staged`.

## ESLint (Flat Config v9)

- Config file: `eslint.config.js` using the new flat config format
- Scans: all `.js`, `.mjs`, `.ts` files except `dist/`, `blocks/`, `chunks/`, `assets/`, `styles/`
- Key rules:
  - `no-param-reassign` — disallow reassigning function parameters
  - `no-unused-vars` — allow `_`-prefixed names
  - `@typescript-eslint/no-use-before-define` — functions OK early, classes and vars not

Run `npm run lint:fix` to auto-fix; `npm run lint` to check only.

## CSS

### Tab Width

CSS files use **4 spaces** (Prettier CSS override), not 2.

### Media Query Syntax

Use modern range syntax — not legacy `min-width`/`max-width`:

```css
/* Correct */
@media (width >= 900px) {
}
@media (width < 600px) {
}

/* Avoid */
@media (min-width: 900px) {
}
```

### Layout

Prefer CSS Grid and Flexbox. Example grid pattern:

```css
display: grid;
grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
gap: 1rem;
```

### Custom Properties

Always use the project's design token variables — no hardcoded hex values or pixel sizes where a token exists:

```css
/* Correct */
color: var(--text-color);
background: var(--background-color);

/* Avoid */
color: #1a1a1a;
```

## Linting and Formatting Hooks

`lint-staged` runs automatically on `git commit` (enforced via Husky):

| Files                   | What Runs                   |
| ----------------------- | --------------------------- |
| `*.js`, `*.mjs`, `*.ts` | ESLint --fix, then Prettier |
| `src/**/*.css`          | Prettier                    |
| `*.html`, `*.md`        | Prettier                    |

Do not bypass hooks with `--no-verify`.

## Project-Wide Scripts

| Script               | Purpose                               |
| -------------------- | ------------------------------------- |
| `npm run build`      | Full production build (tsc + Vite)    |
| `npm run start`      | Dev mode: watchers + AEM local server |
| `npm run lint`       | Check all JS/TS and CSS               |
| `npm run lint:fix`   | Auto-fix lint issues                  |
| `npm run format`     | Run Prettier on all files             |
| `npm run build:json` | Merge AEM component model JSON files  |

## Security

- Always sanitize user-supplied or external HTML with `DOMPurify` before inserting it into the DOM
- `dompurify` is the only approved sanitization library — do not use `innerHTML` with unsanitized strings
