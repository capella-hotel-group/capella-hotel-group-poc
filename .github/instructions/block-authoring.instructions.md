---
description: "Use when creating, modifying, or reviewing AEM Edge Delivery blocks. Covers block structure, the decorate() pattern, CSS naming, AEM Universal Editor integration, and performance conventions."
applyTo: "src/blocks/**"
---

# Block Authoring — Capella Hotel Group PoC

## Block Structure

Every block lives at `src/blocks/{block-name}/` with three required files:

```
src/blocks/{block-name}/
  {block-name}.ts       # Block decorator function (entry point)
  {block-name}.css      # Block-scoped styles
  _{block-name}.json    # AEM component model (xwalk)
```

- Use **kebab-case** for all folder and file names (e.g., `video-photo-player`)
- Block CSS is automatically extracted at build time to `blocks/{block-name}/{block-name}.css`
- Block JS is compiled to `blocks/{block-name}/{block-name}.js`

## The Decorate Pattern

Every block exports a single default async function:

```typescript
export default async function decorate(block: HTMLElement): Promise<void> {
  // transform the block DOM here
}
```

- The function must be `async` and return `Promise<void>`
- Receive the block root element as `block: HTMLElement`
- Use `block.replaceChildren()` to swap out the DOM after building the new structure
- Use typed `querySelector<T>()` generics for type-safe DOM queries
- Prefix intentionally unused parameters with `_` (e.g., `_block`)

## DOM Manipulation

- Build new element structure, then replace in a single call: `block.replaceChildren(...newElements)`
- Use `moveInstrumentation()` from `@/app/scripts` to transfer AEM Universal Editor attributes (`data-aue-*`, `data-richtext-*`) when restructuring the DOM
- Use `moveAttributes()` from `@/app/scripts` to migrate attributes between elements
- Cast elements with generics: `querySelector<HTMLAnchorElement>('a')`
- Use `querySelectorAll<Type>()` and spread or `Array.from()` to iterate

```typescript
import { moveInstrumentation } from '@/app/scripts';

// Always preserve AEM instrumentation when restructuring
const picture = block.querySelector('picture');
const newContainer = document.createElement('div');
newContainer.className = 'hero-image';
moveInstrumentation(picture, newContainer); // transfer data-aue-* attrs
newContainer.append(picture);
```

## CSS Naming Convention

Use a BEM-adjacent pattern scoped to the block name:

```
.{block-name}                     → block root
.{block-name}-{element}           → element within block
.{block-name}-{element}--{mod}    → modifier / variant state
```

Examples:
- `.cards` → root
- `.cards-card` → a card item
- `.cards-card-image` → image inside card
- `.cards-card-body` → body inside card

CSS is not nested — keep selectors flat and use the block name prefix to avoid leakage.

## Media Queries

Use modern range syntax:

```css
/* Correct */
@media (width >= 900px) { ... }

/* Avoid */
@media (min-width: 900px) { ... }
```

## CSS Custom Properties

Use CSS variables from the global design tokens rather than hardcoded values:

```css
background-color: var(--background-color);
color: var(--text-color);
```

## Cross-Block Imports

Use the `@/*` path alias for all project imports — never use relative paths across blocks:

```typescript
// Correct
import { loadFragment } from '@/blocks/fragment/fragment';
import { decorateIcons } from '@/app/aem';

// Avoid
import { loadFragment } from '../../fragment/fragment';
```

## AEM Component Model (`_*.json`)

Each block needs a JSON model file for xwalk (Universal Editor):

- Max **4 cells per component row** (enforced by ESLint `xwalk` plugin)
- No duplicate field names within a component
- Follow the existing AEM component model schema patterns (see `src/models/` for field type references)

## Performance Phases

AEM EDS loads blocks in three phases — be aware of which phase applies:

| Phase | Function | Use For |
|-------|----------|---------|
| Eager | `loadEager()` | LCP-critical blocks (hero, first section) |
| Lazy | `loadLazy()` | Most blocks — header, all sections, footer |
| Delayed | `loadDelayed()` | Non-critical: analytics, chat, personalization (imported 3s after load) |

Blocks in the delayed phase should be in `src/app/delayed.ts`.

## Image Optimization

For blocks that render images, use `decoratePicture()` / `createOptimizedPicture()` from `@/app/aem` to generate responsive `<picture>` elements with correct breakpoints and formats.

## Fragment Blocks

If a block loads remote HTML fragments, use `loadFragment()` from `@/blocks/fragment/fragment` and always call `moveInstrumentation()` on the fragment root after loading.

## Common Pitfalls

Mistakes observed in this codebase or rooted in AEM EDS internals. Check these before writing a new block.

### 1. Do not use `{block-name}-wrapper` as an inner CSS class

`decorateBlock()` in `aem.ts` automatically adds `{block-name}-wrapper` to the **parent div** of every block element:

```typescript
// aem.ts — runs on every block before decorate() is called
if (blockWrapper) blockWrapper.classList.add(`${shortBlockName}-wrapper`);
```

If your `decorate()` creates an inner `div` with the same class name, you end up with two identically named wrappers in the DOM — the outer one from AEM and the inner one from your code. Style as `{block-name}-panel` or any other suffix instead:

```typescript
// ❌ Avoid — duplicates the class AEM already adds to the parent
const wrapper = document.createElement('div');
wrapper.className = 'my-block-wrapper';

// ✅ Use a different suffix for inner containers
const panel = document.createElement('div');
panel.className = 'my-block-panel';
```

### 2. `{block-name}-container` is also reserved

`decorateBlock()` adds `{block-name}-container` to the **closest `.section`** ancestor. Avoid using `-container` as a suffix for any inner element class.

### 3. AEM pre-wraps text nodes — don't assume raw text children

Before `decorate()` is called, `wrapTextNodes()` wraps loose inline content inside block cells in `<p>` tags. Your decorator receives `<p>` elements, not raw text nodes. Always read content from `block.querySelector('p')` or `row.querySelector('p')`, not `textContent` of the raw cell div.

### 4. `block.dataset.blockStatus` lifecycle — do not call `decorateBlock()` manually

AEM sets `data-block-status` to `"initialized"` → `"loading"` → `"loaded"` automatically. Never call `decorateBlock()` or `loadBlock()` on a block element yourself unless you are building a fragment or programmatic block via `buildBlock()`.

### 5. Listener cleanup — always remove handlers on disconnect

Blocks rendered in the Universal Editor can be added and removed dynamically. Any `on()` / `subscribe()` / `addEventListener()` call registered inside `decorate()` must be cleaned up when the block leaves the DOM. Use a `MutationObserver` on `document.body` (watching `childList + subtree`) or a custom `disconnectedCallback` pattern:

```typescript
const observer = new MutationObserver(() => {
  if (!document.contains(block)) {
    off('my-event', handler);
    unsubscribe();
    observer.disconnect();
  }
});
observer.observe(document.body, { childList: true, subtree: true });
```

### 6. No `innerHTML` without sanitisation

AEM content is author-controlled. Never assign untrusted HTML directly to `innerHTML`. Use `DOMPurify` (the only approved sanitiser in this project):

```typescript
import DOMPurify from 'dompurify';
el.innerHTML = DOMPurify.sanitize(rawHtml);
```

### 7. `block.replaceChildren()` must be the last call

Build your entire new DOM tree first, then call `block.replaceChildren(...newElements)` once at the end of `decorate()`. Mutating the block incrementally forces multiple reflows and can break `moveInstrumentation()` if instrumented elements are removed mid-way.

### 8. New blocks must be added to `_section.json` filters

Adding files under `src/blocks/` is not enough for the block to appear in the Universal Editor insert menu. The block's ID must also be listed in the `components` array of the `section` filter in `src/models/_section.json`, followed by `npm run build:json`.
