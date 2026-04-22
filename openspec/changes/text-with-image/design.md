## Context

The `text-with-image` block was added to `src/blocks/text-with-image/` as a `.js` file. Every other block in the project is authored in TypeScript (`.ts`), benefiting from strict null-checking, type annotations, and the security convention of running DOM innerHTML assignments through `DOMPurify.sanitize()`. The current file escapes these checks and contains a latent XSS vector where richtext HTML from the author is written directly into the DOM without sanitization.

Current state: `src/blocks/text-with-image/text-with-image.js` (untyped, unsanitized)  
Target state: `src/blocks/text-with-image/text-with-image.ts` (typed, sanitized, follows all project DOM patterns)

## Goals / Non-Goals

**Goals:**

- Replace the `.js` file with a `.ts` file that passes `tsc --noEmit`
- Add `HTMLElement` return-type annotation to `decorate`
- Sanitize richtext innerHTML with `DOMPurify.sanitize()`
- Replace `block.innerHTML = ''` + `block.append()` with a single `block.replaceChildren()` call
- Guard every nullable DOM query (`querySelector`, `firstElementChild`) before use

**Non-Goals:**

- No visual or layout changes — CSS is untouched
- No new block features or new model fields
- No changes to `_text-with-image.json` or the AEM Universal Editor config

## Decisions

### Use `decorate(block: HTMLElement): void` (synchronous)

The block contains no async operations (no `fetch`, no dynamic imports). Making the function `async` would add unnecessary overhead. All other synchronous blocks in the project use `void`, not `Promise<void>`.

_Alternatives considered:_ `async` — rejected; no async work performed.

### Sanitize `descriptionEl.innerHTML` with DOMPurify

The description field is a richtext component in the UE model. Authors can paste arbitrary HTML. Per the project security convention, any `innerHTML` assignment sourced from content must go through `DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })`.

_Alternatives considered:_ `textContent` only — rejected; richtext formatting (bold, italic, links) would be stripped.

### Use `block.replaceChildren(...nodes)` for DOM update

The project convention (enforced by `no-param-reassign` ESLint rule and coding-style instructions) requires building new elements then calling `block.replaceChildren(...)` once, rather than mutating `block.innerHTML` or calling `block.append` after clearing.

_Alternatives considered:_ `block.innerHTML = ''` + `block.append()` — rejected; violates project convention and triggers lint error.

## Risks / Trade-offs

- [Low risk] File rename may confuse editors with open tabs → Mitigation: the old `.js` file is simply deleted; the build auto-discovers the new `.ts` entry.
- [No risk] Runtime behavior is identical — the generated JS output from Vite is functionally equivalent.

## Migration Plan

1. Delete `src/blocks/text-with-image/text-with-image.js`
2. Create `src/blocks/text-with-image/text-with-image.ts` with typed, sanitized implementation
3. Run `npm run lint` and `tsc --noEmit` to confirm zero errors
4. Run `npm run build` to confirm the compiled output appears in `blocks/text-with-image/`

Rollback: restore the `.js` file from git history (`git checkout HEAD -- src/blocks/text-with-image/text-with-image.js`).

## Open Questions

None — this is a straight migration with no ambiguous requirements.
