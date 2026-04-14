---
name: aem-skill-building-blocks
description: Guide for implementing code changes in AEM Edge Delivery Services for this TypeScript/Vite project. Handles block development (new or modified in src/blocks/), core functionality changes (src/app/scripts.ts, src/styles/, etc.), or both. Use this skill for all implementation work guided by the aem-skill-content-driven-development workflow. Enforces TypeScript patterns, @/* imports, replaceChildren(), and DOMPurify.
license: Apache-2.0
metadata:
  source: https://github.com/adobe/skills/tree/main/skills/aem/edge-delivery-services/skills/building-blocks
  adapted-for: TypeScript + Vite project (capella-hotel-group-poc)
---

# Building Blocks

This skill guides you through implementing AEM Edge Delivery blocks following established patterns and best practices for this **TypeScript + Vite** project.

This skill works best when invoked from `aem-skill-content-driven-development` during Step 5 (Implementation), but can also be used standalone for quick block changes.

## Related Skills

- **aem-skill-content-driven-development**: Recommended — ensures content and content models are ready before implementation
- **aem-skill-testing-blocks**: Automatically invoked during Step 5 for comprehensive testing

## When to Use This Skill

This skill is typically invoked by `aem-skill-content-driven-development` during Step 5, but can be used directly. It handles:

**Block Development:**

- Creating new block files and structure in `src/blocks/`
- Implementing TypeScript decoration
- Adding CSS styling

**Core Functionality:**

- `src/app/scripts.ts` modifications (decoration, utilities, auto-blocking)
- Global styles (`src/styles/styles.css`, `src/styles/lazy-styles.css`)
- Delayed functionality (`src/app/delayed.ts`)
- Configuration changes

Recommended before starting:

- Dev server running (`npm run start`)
- Some test content to validate against (local drafts or CMS page)

## Block Implementation Workflow

Track your progress:

- [ ] Step 1: Find similar blocks for patterns (if new block or major changes)
- [ ] Step 2: Create or modify block structure (files and directories)
- [ ] Step 3: Implement TypeScript decoration (skip if CSS-only)
- [ ] Step 4: Add CSS styling
- [ ] Step 5: Test implementation (invokes `aem-skill-testing-blocks`)

---

## Step 1: Find Similar Blocks

**When to use:** Creating new blocks or making major structural modifications

**Skip this step when:** Making minor modifications to existing blocks (CSS tweaks, small decoration changes)

1. Search the source blocks:

   ```bash
   ls src/blocks/
   ```

2. Review patterns from similar blocks:
   - DOM manipulation strategies
   - CSS architecture
   - Variant handling
   - Performance optimizations

---

## Step 2: Create or Modify Block Structure

### For New Blocks

1. Create the block directory and files:

   ```bash
   mkdir -p src/blocks/{block-name}
   touch src/blocks/{block-name}/{block-name}.ts
   touch src/blocks/{block-name}/{block-name}.css
   ```

2. Basic TypeScript structure:

   ```typescript
   export default async function decorate(block: HTMLElement): Promise<void> {
     // Your decoration logic here
   }
   ```

   > The block is **auto-discovered** — no build config changes needed. Vite finds `src/blocks/{name}/{name}.ts` automatically.

3. Basic CSS structure:
   ```css
   /* All selectors scoped to block */
   main .{block-name} {
     /* block styles */
   }
   ```

### For Existing Blocks

1. Locate the block directory: `src/blocks/{block-name}/`
2. Review current implementation before making changes
3. Understand existing decoration logic and styles

---

## Step 3: Implement TypeScript Decoration

**Essential pattern — re-use existing DOM elements:**

```typescript
import { createOptimizedPicture } from '@/app/aem.js';

export default async function decorate(block: HTMLElement): Promise<void> {
  // Platform delivers images as <picture> elements with <source> tags
  const picture = block.querySelector('picture');
  const heading = block.querySelector('h2');

  // Always null-guard querySelector results (strictNullChecks is enabled)
  if (!picture || !heading) return;

  // Create new structure, re-using existing elements
  const figure = document.createElement('figure');
  figure.append(picture); // Re-uses picture element

  const wrapper = document.createElement('div');
  wrapper.className = 'content-wrapper';
  wrapper.append(heading, figure);

  // Replace block children ONCE at the end
  block.replaceChildren(wrapper);

  // Only check variants when they affect decoration logic
  // CSS-only variants like 'dark', 'wide' don't need JS
  if (block.classList.contains('carousel')) {
    setupCarousel(block);
  }
}
```

**Key TypeScript rules:**

1. **Function signature** — always this exact TypeScript form:

   ```typescript
   export default async function decorate(block: HTMLElement): Promise<void>;
   ```

2. **Imports** — always use `@/*` alias (NEVER relative paths across modules):

   ```typescript
   import { createOptimizedPicture, loadScript } from '@/app/aem.js';
   import DOMPurify from '@/utils/dompurify.js'; // if needed
   ```

3. **Null safety** — guard every `querySelector` result:

   ```typescript
   const el = block.querySelector('.my-selector');
   if (!el) return; // or: if (!el) throw new Error('...');

   // Now el is guaranteed non-null
   el.textContent = 'safe';
   ```

4. **DOM mutation** — use `replaceChildren()`, not `innerHTML =`:

   ```typescript
   // GOOD: build new elements, then replace
   const newDiv = document.createElement('div');
   newDiv.textContent = 'content';
   block.replaceChildren(newDiv);

   // BAD: do not reassign block.innerHTML unless using DOMPurify
   block.innerHTML = '<div>content</div>'; // ❌
   ```

5. **DOMPurify for innerHTML** — if `innerHTML` is absolutely needed with external/user content:

   ```typescript
   import DOMPurify from 'dompurify';
   element.innerHTML = DOMPurify.sanitize(externalHtml);
   ```

   > This is **BLOCKING** — never skip sanitization for external HTML.

6. **Unused parameters** — prefix with `_`:

   ```typescript
   export default async function decorate(_block: HTMLElement): Promise<void> {
     // _block is intentionally unused
   }
   ```

7. **Dynamic imports** — use `@/*` paths:
   ```typescript
   const { default: Swiper } = await import('@/utils/swiper.js');
   ```

**For complete TypeScript patterns:** Read `resources/js-guidelines.md`

---

## Step 4: Add CSS Styling

**Essential patterns — scoped, responsive, using custom properties:**

```css
/* All selectors MUST be scoped to block */
main .my-block {
  /* Use CSS custom properties for consistency */
  background-color: var(--background-color);
  color: var(--text-color);
  font-family: var(--body-font-family);

  /* Mobile-first styles (default) */
  padding: 1rem;
  flex-direction: column;
}

main .my-block h2 {
  font-family: var(--heading-font-family);
  font-size: var(--heading-font-size-m);
}

/* Tablet and up */
@media (width >= 600px) {
  main .my-block {
    padding: 2rem;
  }
}

/* Desktop and up */
@media (width >= 900px) {
  main .my-block {
    flex-direction: row;
    padding: 4rem;
  }
}

/* Variants — most are CSS-only */
main .my-block.dark {
  background-color: var(--dark-color);
  color: var(--clr-white);
}
```

**For complete CSS guidelines:** Read `resources/css-guidelines.md`

---

## Step 5: Test Implementation

**After implementation is complete, invoke `aem-skill-testing-blocks`.**

Provide the skill with:

- Block name being tested
- Test content URL(s) (from CDD Step 4)
- Any variants that need testing
- Screenshots of existing implementation/design to verify against
- Acceptance criteria (from CDD Step 2)

---

## When Modifying Core Files

If your changes require modifying core files (`src/app/scripts.ts`, `src/styles/styles.css`, `src/app/delayed.ts`):

1. **Make core changes first** (before block changes that depend on them)
2. **Test core changes independently** with existing content
3. **Consider impact** — core changes can affect multiple blocks/pages
4. **Keep it minimal** — only add what's necessary

**Key core files in this project:**

- `src/app/scripts.ts` — Decoration utilities, auto-blocking logic, page loading
- `src/styles/styles.css` — Global styles (eager), CSS custom properties
- `src/styles/lazy-styles.css` — Global styles (lazy loaded)
- `src/app/delayed.ts` — Marketing, analytics, third-party integrations

**For detailed patterns:**

- TypeScript: See `resources/js-guidelines.md`
- CSS: See `resources/css-guidelines.md`

## Reference Materials

- `resources/js-guidelines.md` — Complete TypeScript patterns and best practices
- `resources/css-guidelines.md` — Complete CSS patterns and best practices
