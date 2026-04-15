# TypeScript Guidelines for AEM EDS Blocks

> Adapted from [adobe/skills building-blocks/resources/js-guidelines.md](https://github.com/adobe/skills/tree/main/skills/aem/edge-delivery-services/skills/building-blocks/resources/js-guidelines.md)
>
> **Key changes from upstream**: All JS patterns replaced with TypeScript equivalents; imports use `@/*` alias (not `../../scripts/aem.js`); `DOMPurify.sanitize()` required for any `innerHTML` with external content; `replaceChildren()` preferred over `innerHTML =`.

## Block Decorator Pattern

Every block export follows this exact signature:

```typescript
export default async function decorate(block: HTMLElement): Promise<void> {
  // Your decoration logic here
}
```

- **Always `async`** — even if no async operations (allows future lazy-loading without refactoring)
- **`block: HTMLElement`** — the block div, already in the DOM
- **`Promise<void>`** — return type is always void, never anything else
- **Unused `block`** — prefix with underscore: `_block`

## Imports

**Always use `@/*` alias** (maps to `src/*`). Never use relative paths across modules.

```typescript
// GOOD: @/* alias
import { createOptimizedPicture, loadScript, fetchPlaceholders } from '@/app/aem.js';
import DOMPurify from 'dompurify';

// BAD: relative paths across modules
import { createOptimizedPicture } from '../../scripts/aem.js'; // ❌
import { createOptimizedPicture } from '../aem.js'; // ❌
```

**Within the same block folder**, you may use relative paths:

```typescript
// OK: within src/blocks/my-block/
import { setupSlider } from './slider-utils.js';
```

## Null Safety (strictNullChecks)

`strictNullChecks` is enabled. Every `querySelector` / `querySelectorAll` result must be null-guarded before use.

```typescript
// GOOD: guard before use
const heading = block.querySelector('h2');
if (!heading) return;
heading.textContent = 'safe'; // heading is HTMLElement here

// GOOD: with assertion (only when you are certain the element exists)
const nav = block.querySelector('.nav') as HTMLElement;

// BAD: unguarded access
const heading = block.querySelector('h2');
heading.textContent = 'unsafe'; // ❌ — TS error: Object is possibly null
```

**For `querySelectorAll`:**

```typescript
const items = [...block.querySelectorAll('.item')];
items.forEach((item) => {
  // item is Element here — cast if needed
  const el = item as HTMLElement;
  el.style.display = 'block';
});
```

## DOM Mutation — replaceChildren()

Build new elements first, then replace block children **once** at the end. Never reassign `block` itself.

```typescript
// GOOD: build structure, replace once
export default async function decorate(block: HTMLElement): Promise<void> {
  const picture = block.querySelector('picture');
  const text = block.querySelector('p');
  if (!picture || !text) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'hero-wrapper';
  wrapper.append(picture, text);

  block.replaceChildren(wrapper); // One call at the end
}

// BAD: mutating incrementally
block.innerHTML = ''; // ❌
block.appendChild(wrapper); // ❌ — use replaceChildren instead

// BAD: reassigning block (no-param-reassign lint rule)
block = document.createElement('div'); // ❌ — ESLint error
```

## DOMPurify — Required for External HTML

If `innerHTML` must be used with content from external sources or user input, **always** sanitize with DOMPurify. This is a **BLOCKING** security requirement.

```typescript
import DOMPurify from 'dompurify';

// GOOD: sanitized innerHTML
element.innerHTML = DOMPurify.sanitize(externalHtml);

// BAD: unsanitized innerHTML from external source
element.innerHTML = rawApiResponse; // ❌ — XSS vulnerability
element.innerHTML = block.dataset.htmlContent ?? ''; // ❌ — always sanitize

// OK: innerHTML with literal developer-written strings (no external content)
wrapper.innerHTML = '<span class="icon"></span>'; // OK — trusted, static string
```

## Helper Functions from aem.ts

These helpers are available from `@/app/aem.js`:

```typescript
import {
  createOptimizedPicture,
  loadScript,
  loadCSS,
  fetchPlaceholders,
  getMetadata,
  decorateIcons,
  decorateBlock,
  loadBlock,
  toClassName,
  toCamelCase,
} from '@/app/aem.js';
```

**`createOptimizedPicture(src, alt, eager, breakpoints)`** — generates responsive `<picture>` element with WebP/JPEG sources:

```typescript
const pic = createOptimizedPicture('/media/hero.jpg', 'Hero image', true, [
  { media: '(min-width: 600px)', width: '2000' },
  { width: '750' },
]);
block.prepend(pic);
```

**`loadScript(src, attrs?)`** — lazy-loads external scripts:

```typescript
await loadScript('https://cdn.example.com/lib.js', { type: 'module' });
```

**`fetchPlaceholders(prefix?)`** — loads localizable strings:

```typescript
const placeholders = await fetchPlaceholders();
const label = placeholders['my-key'] ?? 'default';
```

**`getMetadata(name)`** — reads page-level meta tags:

```typescript
const template = getMetadata('template'); // string | undefined
```

## Performance Patterns

**Lazy loading heavy libraries:**

```typescript
// Only load heavy library when block is visible
const observer = new IntersectionObserver(async (entries) => {
  if (entries[0].isIntersecting) {
    observer.disconnect();
    const { default: HeavyLib } = await import('@/utils/heavy-lib.js');
    HeavyLib.init(block);
  }
});
observer.observe(block);
```

**Dynamic imports:**

```typescript
// Lazy-load a CSS file
const { loadCSS } = await import('@/app/aem.js');
await loadCSS('/blocks/my-block/variant.css');
```

## Code Style Rules

This project uses ESLint. Key rules:

- `no-param-reassign` — do NOT reassign function parameters (including `block`)
- `no-console` — remove `console.log()` before committing (use only for temporary debugging)
- `import/extensions` — include `.js` extension in all import paths (even for `.ts` files at runtime)
- `@typescript-eslint/no-unused-vars` — prefix unused params with `_`

```typescript
// GOOD
export default async function decorate(_block: HTMLElement): Promise<void> {
  // _block intentionally unused
}

// BAD
export default async function decorate(block: HTMLElement): Promise<void> {
  // no-unused-vars error — block must be used or prefixed with _
}
```

**Run lint before committing:**

```bash
npm run lint         # check
npm run lint:fix     # auto-fix
```

## Common Anti-Patterns

```typescript
// BAD: CSS in TypeScript — use CSS classes instead
element.style.backgroundColor = 'blue'; // ❌

// GOOD: Use CSS classes
element.classList.add('highlighted');

// BAD: Hardcoded configuration
const maxItems = 5; // ❌

// GOOD: Use metadata or block dataset
const maxItems = parseInt(getMetadata('max-items') ?? '5', 10);

// BAD: Blocking render with synchronous heavy work
const data = await fetch('/large-dataset.json');
processLargeDataset(data); // ❌ — blocks paint

// GOOD: Defer with IntersectionObserver or requestAnimationFrame
requestAnimationFrame(() => processLargeDataset(data));
```
