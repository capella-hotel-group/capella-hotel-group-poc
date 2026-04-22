## 1. File Migration

- [x] 1.1 Delete `src/blocks/text-with-image/text-with-image.js`
- [x] 1.2 Create `src/blocks/text-with-image/text-with-image.ts` with the typed implementation

## 2. TypeScript Implementation

- [x] 2.1 Add `import DOMPurify from 'dompurify';` at the top of `text-with-image.ts`
- [x] 2.2 Type the `decorate` function as `(block: HTMLElement): void`
- [x] 2.3 Guard all nullable DOM queries (`firstElementChild`, `querySelector`) with optional chaining or null checks
- [x] 2.4 Replace `descriptionEl.innerHTML` assignment with `DOMPurify.sanitize(descriptionEl.innerHTML, { USE_PROFILES: { html: true } })`
- [x] 2.5 Replace `block.innerHTML = ''` + `block.append(textCol, imageCol)` with `block.replaceChildren(textCol, imageCol)`

## 3. Validation

- [x] 3.1 Run `npm run lint` — confirm zero errors in `text-with-image.ts`
- [x] 3.2 Run `tsc --noEmit` (via `npm run build` type-check step) — confirm no TypeScript errors
- [x] 3.3 Run `npm run build` — confirm `blocks/text-with-image/text-with-image.js` is emitted successfully
