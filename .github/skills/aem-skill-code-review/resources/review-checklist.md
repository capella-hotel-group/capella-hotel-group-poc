# Code Review Checklist

Use this checklist to review AEM Edge Delivery Services TypeScript blocks in this project. Items marked **BLOCKING** must be resolved before merge.

---

## Critical (BLOCKING)

### Project Source Files

- [ ] All changes are in `src/` — NOT in generated `blocks/`, `scripts/`, `styles/`, `chunks/` directories
- [ ] No `blocks/hero/hero.js` or similar generated file has been edited

### Security

- [ ] No sensitive data committed (API keys, passwords, tokens, secrets)
- [ ] **DOMPurify used for any `innerHTML` assignment with external or user-supplied HTML** — `import DOMPurify from 'dompurify'; container.innerHTML = DOMPurify.sanitize(html);`
- [ ] External links have `rel="noopener noreferrer"`

### Linting

- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` passes (TypeScript type-check via `tsc --noEmit`)

---

## TypeScript (Should Fix)

### Block Signature

- [ ] Default export is `export default async function decorate(block: HTMLElement): Promise<void>`
- [ ] File is located at `src/blocks/{name}/{name}.ts`

### Imports

- [ ] All cross-module imports use `@/*` alias (e.g., `import { fn } from '@/app/aem.js'`)
- [ ] No relative paths across module boundaries (no `../../app/aem.js`)

### Null Safety

- [ ] All `querySelector` / `querySelectorAll` results are null-guarded before use
- [ ] Patterns like `const el = block.querySelector('.foo'); if (!el) return;` used consistently
- [ ] No `!` non-null assertions (`el!.textContent`) without clear justification

### DOM Patterns

- [ ] `block.replaceChildren(...newElements)` used for full DOM rebuild — NOT `block.innerHTML =`
- [ ] `block` parameter is not reassigned (no-param-reassign rule)
- [ ] New elements are built first, then appended once to avoid layout thrashing

### TypeScript Hygiene

- [ ] No `any` types without justification and an ESLint disable comment with reason
- [ ] Unused parameters prefixed with `_` (e.g., `_block`, `_event`, `_index`)
- [ ] No `eslint-disable` comments without justification

---

## CSS

### Scoping

- [ ] All selectors scoped to block: `.{block-name} .selector` or `main .{block-name}`
- [ ] No unscoped global selectors (e.g., `.title { ... }`)
- [ ] Private classes/variables prefixed with block name

### Design Tokens

- [ ] All color, typography, and spacing values use `var(--token-name)` from `src/styles/styles.css`
- [ ] No hardcoded hex values (e.g., `#272727`) that belong to the design system
- [ ] No hardcoded px values for spacing that have a token equivalent

### Responsive Design

- [ ] Mobile-first: base styles target mobile, media queries target larger screens
- [ ] Breakpoint syntax: `@media (width >= 600px)` (range syntax — not `min-width`)
- [ ] No mixing of `max-width` and `min-width` queries
- [ ] Layout works at 375px, 768px, and 1200px

### Best Practices

- [ ] No `!important` unless absolutely necessary (with justification)
- [ ] No CSS preprocessors (Sass, Less, PostCSS)
- [ ] No CSS frameworks (Tailwind, Bootstrap, etc.)
- [ ] ARIA attributes used for styling state: `[aria-expanded="true"]`

---

## Performance

- [ ] Lighthouse scores green (ideally 100) for mobile AND desktop
- [ ] No third-party libraries loaded synchronously in critical path
- [ ] Images use `createOptimizedPicture()` from `@/app/aem.js` (creates responsive `<picture>` with WebP)
- [ ] Heavy libraries loaded via `await import()` with `IntersectionObserver` where appropriate
- [ ] No layout shifts introduced (CLS impact checked)
- [ ] Fonts loaded via `src/styles/fonts.css` (not via JavaScript)

---

## Architecture

- [ ] `src/app/aem.ts` is NOT modified (submit upstream PRs for improvements)
- [ ] No build steps introduced without team consensus
- [ ] Existing AEM utilities reused from `@/app/aem.js` (e.g., `createOptimizedPicture`, `loadScript`, `decorateIcons`)
- [ ] New block follows auto-discovery: `src/blocks/{name}/{name}.ts` is enough to register a Vite build entry

---

## Content & Authoring

- [ ] Content model is author-friendly (≤4 cells per row, semantic formatting)
- [ ] `src/blocks/{name}/_block.json` updated if block structure changed
- [ ] `npm run build:json` run after updating `src/models/_*.json` or block JSON files
- [ ] Backward compatibility maintained with existing authored content
- [ ] No breaking changes requiring content migration (or documented if unavoidable)

---

## HTML & Accessibility

- [ ] Semantic HTML5 elements used appropriately
- [ ] Proper heading hierarchy maintained (H1 → H2 → H3)
- [ ] All images have meaningful `alt` text
- [ ] Interactive elements have keyboard accessibility
- [ ] ARIA labels present where needed

---

## Quick Reference: Common Fixes

| Issue                               | Fix                                                         |
| ----------------------------------- | ----------------------------------------------------------- |
| Cross-module relative import        | Change to `@/*` alias                                       |
| `querySelector` without null guard  | Add `if (!el) return;` or optional chaining with null check |
| `block.innerHTML = ...` for rebuild | Use `block.replaceChildren(...newElements)`                 |
| External HTML in `innerHTML`        | Wrap in `DOMPurify.sanitize()`                              |
| Hardcoded color                     | Replace with `var(--token-name)`                            |
| Editing `blocks/hero/hero.js`       | Edit `src/blocks/hero/hero.ts` instead                      |
| `@media (min-width: 600px)`         | Change to `@media (width >= 600px)`                         |
| Unused param lint error             | Prefix with `_`: `_block`, `_event`                         |
