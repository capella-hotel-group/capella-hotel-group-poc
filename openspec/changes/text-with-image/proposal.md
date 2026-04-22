## Why

The `text-with-image` block was scaffolded as plain JavaScript (`.js`), which bypasses TypeScript type-checking, strict null-safety, and the project's security convention of sanitizing innerHTML with DOMPurify. This creates a latent XSS risk and diverges from every other block in the project.

## What Changes

- Rename `src/blocks/text-with-image/text-with-image.js` → `text-with-image.ts`
- Add `HTMLElement` and `void` type annotations to the `decorate` function signature
- Replace `block.innerHTML = ''` + `block.append(...)` with a single `block.replaceChildren(...)` call
- Sanitize `descriptionEl.innerHTML` through `DOMPurify.sanitize()` before assigning to `innerHTML`
- Apply all `strictNullChecks`-safe guards on every DOM query result
- Use `@/` import alias for any shared utilities pulled in

## Capabilities

### New Capabilities

- `text-with-image-ts`: TypeScript block implementation for the text-with-image block with proper type safety, DOMPurify sanitization, and replaceChildren DOM pattern

### Modified Capabilities

<!-- No existing spec-level behavior is changing -->

## Impact

- `src/blocks/text-with-image/text-with-image.js` → removed and replaced by `.ts`
- `component-definition.json`, `component-models.json`, `component-filters.json` — no change (already registered)
- Build pipeline: Vite already handles `.ts` entry discovery; no config changes required
- No API, dependency, or runtime behaviour changes for site visitors
