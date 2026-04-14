# CSS Guidelines for AEM EDS Blocks

> Adapted from [adobe/skills building-blocks/resources/css-guidelines.md](https://github.com/adobe/skills/tree/main/skills/aem/edge-delivery-services/skills/building-blocks/resources/css-guidelines.md)
>
> **Key change from upstream**: Token reference updated to `src/styles/styles.css` (not `styles/styles.css`). All other rules are the same.

## Scope Every Selector

**All selectors MUST be scoped to the block.** Never write global selectors in block CSS files.

```css
/* GOOD: scoped to block */
main .my-block {
  color: var(--text-color);
}

main .my-block .title {
  font-size: var(--heading-font-size-l);
}

/* BAD: unscoped selector */
.title {
  color: red;
} /* ❌ — affects the whole page */
h2 {
  font-size: 2rem;
} /* ❌ */
```

**Private classes/variables** — prefix with block name to prevent collisions:

```css
main .my-block .my-block-inner {
  /* ... */
}
```

## CSS Custom Properties (Design Tokens)

Never hardcode hex values, pixel sizes, or font names that belong to the design system. **Always use `var(--token-name)`.**

**Available tokens** are defined in `src/styles/styles.css`. Common ones:

```css
/* Colors */
var(--background-color)
var(--text-color)
var(--link-color)
var(--link-hover-color)
var(--heading-color)
var(--dark-color)
var(--light-color)

/* Typography */
var(--body-font-family)
var(--heading-font-family)
var(--fixed-font-family)
var(--body-font-size-m)
var(--heading-font-size-xxl)
var(--heading-font-size-xl)
var(--heading-font-size-l)
var(--heading-font-size-m)
var(--heading-font-size-s)
var(--heading-font-size-xs)

/* Layout */
var(--max-content-width)
var(--section-spacing)
var(--nav-height)
```

```css
/* GOOD: using design tokens */
main .hero {
  background-color: var(--background-color);
  color: var(--text-color);
  font-family: var(--body-font-family);
  max-width: var(--max-content-width);
}

/* BAD: hardcoded values */
main .hero {
  background-color: #fff; /* ❌ */
  color: #272727; /* ❌ */
  font-family: 'Helvetica Neue', sans-serif; /* ❌ */
  max-width: 1200px; /* ❌ */
}
```

## Mobile-First Responsive Design

Write base styles for mobile, then add media queries for larger viewports. Use the `>=` media query syntax (not deprecated `min-width`).

**Standard breakpoints:**

- Mobile: default (no media query)
- Tablet: `(width >= 600px)`
- Desktop: `(width >= 900px)`
- Large: `(width >= 1200px)`

```css
main .my-block {
  /* Mobile-first: base styles */
  padding: 1rem;
  flex-direction: column;
  font-size: var(--body-font-size-m);
}

@media (width >= 600px) {
  main .my-block {
    padding: 2rem;
  }
}

@media (width >= 900px) {
  main .my-block {
    flex-direction: row;
    padding: 4rem;
  }
}
```

**Never mix `min-width` and `max-width` in the same block:**

```css
/* BAD: inconsistent breakpoint direction */
@media (max-width: 600px) {
} /* ❌ */
@media (min-width: 900px) {
} /* ❌ — mixing directions */

/* GOOD: consistent mobile-first */
@media (width >= 600px) {
} /* ✅ */
@media (width >= 900px) {
} /* ✅ */
```

## CSS Variants

Most variants are CSS-only — no JavaScript needed. CSS class names come from the AEM block table header.

```css
/* Base styles */
main .my-block {
  /* ... */
}

/* Dark variant: <div class="my-block dark"> */
main .my-block.dark {
  background-color: var(--dark-color);
  color: var(--clr-white);
}

/* Wide variant */
main .my-block.wide {
  max-width: none;
  padding-inline: 0;
}

/* Combined variants */
main .my-block.dark.wide {
  /* Specific to dark + wide combination */
}
```

## No `!important`

**Avoid `!important` entirely.** If you need to override specificity, increase it instead.

```css
/* BAD: using !important */
.button {
  color: white !important;
} /* ❌ */

/* GOOD: increase specificity */
main .my-block .button {
  color: white;
} /* ✅ */
```

If you absolutely must use `!important`, add a comment explaining why.

## ARIA Attributes for Styling

Use ARIA attributes for state-dependent styles (more meaningful than class toggling):

```css
/* Use ARIA state for interactive styling */
main .my-block .panel[aria-hidden='true'] {
  display: none;
}

main .my-block .toggle[aria-expanded='true'] + .panel {
  max-height: 500px;
}
```

## No CSS Preprocessors or Frameworks

No Sass, Less, PostCSS, Tailwind, or other CSS tooling without explicit team consensus. Use native CSS features directly.

**OK to use (supported by evergreen browsers):**

- CSS Custom Properties (`var()`)
- CSS Grid and Flexbox
- CSS Logical Properties (`padding-inline`, `margin-block`)
- CSS Nesting (modern native CSS)
- Container Queries
- `:is()`, `:where()`, `:has()` pseudo-selectors

## Naming Conventions

Use simple, semantic class names:

```css
/* Structure */
main .my-block .wrapper {
}
main .my-block .content {
}
main .my-block .media {
}

/* Items */
main .my-block .item {
}
main .my-block .item-image {
}
main .my-block .item-title {
}

/* States */
main .my-block .item.active {
}
main .my-block .item[aria-selected='true'] {
}
```

## Common Patterns

### Card Grid

```css
main .cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (width >= 600px) {
  main .cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (width >= 900px) {
  main .cards {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Hero with Overlay Text

```css
main .hero {
  position: relative;
  overflow: hidden;
}

main .hero picture {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

main .hero .content {
  position: absolute;
  inset-block-end: 2rem;
  inset-inline-start: 2rem;
  color: var(--clr-white);
}
```

### Animated Transitions

```css
main .my-block .panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

main .my-block .panel.open {
  max-height: 500px;
}
```

## Anti-Patterns

```css
/* BAD: CSS injected via JS innerHTML */
element.innerHTML = '<style>.foo { color: red; }</style>'; /* ❌ */

/* BAD: Inline styles from JS when CSS class works */
element.style.display = 'flex'; /* ❌ — toggle a class instead */

/* BAD: Deeply nested selectors */
main .my-block div div div span { } /* ❌ — add a class */

/* BAD: Browser hacks */
_::-webkit-full-page-media, _:future, :root .hack { } /* ❌ */
*::-moz-placeholder { } /* ❌ — use standard ::placeholder */
```
