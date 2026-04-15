---
description: 'Checklist for avoiding conflicts between Universal Editor content tree and JS-driven layout. Use when creating or modifying blocks that restructure DOM (sliders, carousels, tabs, accordions, etc.).'
applyTo: 'src/blocks/**'
---

# UE ↔ JS Layout Conflict Avoidance

When `decorate()` restructures DOM for visual layout (sliders, carousels, tabs, etc.),
the Universal Editor content tree can break. This file documents known pitfalls and
proven solutions from this project.

## Core Principle

UE persists content via `data-aue-resource` URN (JCR path) — **not** DOM structure.
`moveInstrumentation()` transfers these URNs to new elements. UE follows the URN,
so JS can freely restructure DOM as long as instrumentation is transferred correctly.

**Do NOT** duplicate DOM to keep a "source of truth". Use `moveInstrumentation()` instead.

## Proven Patterns

### 1. `model` + `filter` on `block/v1/block` — never put both in `template`

Putting both `model` and `filter` inside `template` in the component definition causes
UE to break the "Add" button or insert child components at the wrong level.

```jsonc
// ❌ BROKEN — model + filter both in template
"template": {
  "name": "My Block",
  "model": "my-block",
  "filter": "my-block"
}

// ✅ CORRECT — model at component level, filter in template
{
  "title": "My Block",
  "id": "my-block",
  "model": "my-block",        // ← component level (sibling of plugins)
  "plugins": {
    "xwalk": {
      "page": {
        "resourceType": "core/franklin/components/block/v1/block",
        "template": {
          "name": "My Block",
          "filter": "my-block" // ← only filter in template
        }
      }
    }
  }
}
```

If even the component-level `model` causes issues, remove it and set via instrumentation in TS:

```typescript
block.dataset.aueModel = 'my-block';
```

### 2. `block/v1/block/item` does NOT support `classes`, `id`, or custom attributes

The `template` object for `block/v1/block/item` only supports `name` and `model`.
Adding `classes`, `id`, or any other property will break the "Add" button silently.

```jsonc
// ❌ BROKEN — classes is not a valid item template property
"template": {
  "name": "Activity",
  "model": "activity",
  "classes": "activity"  // breaks Add button
}

// ✅ CORRECT — only name and model
"template": {
  "name": "Activity",
  "model": "activity"
}
```

To distinguish item types in code, use:

- `row.dataset.aueModel` in UE (set by instrumentation)
- Content-based checks in production (e.g., `row.querySelector('picture')`)

### 3. Cloned elements must strip instrumentation

When cloning DOM elements for infinite loops, carousels, or virtual slides,
clones must not carry `data-aue-*` attributes — otherwise UE counts them as
real content items and authoring breaks.

```typescript
function cloneWithoutInstrumentation(el: HTMLElement): HTMLElement {
  const clone = el.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll<HTMLElement>(
      '[data-aue-resource],[data-aue-prop],[data-aue-type],[data-aue-label],[data-aue-filter],[data-aue-behavior]',
    )
    .forEach((node) => {
      Object.keys(node.dataset)
        .filter((k) => k.startsWith('aue'))
        .forEach((k) => delete node.dataset[k]);
    });
  // Strip from the clone root too
  Object.keys(clone.dataset)
    .filter((k) => k.startsWith('aue'))
    .forEach((k) => delete clone.dataset[k]);
  return clone;
}
```

### 4. Never add hidden DOM to preserve content tree

Adding `display:none` containers to keep original rows as "source of truth"
pollutes the production DOM and hurts SEO/Core Web Vitals.

```typescript
// ❌ AVOID — hidden duplicate DOM
const sourceContainer = document.createElement('div');
sourceContainer.style.display = 'none';
sourceContainer.append(...originalRows);

// ✅ CORRECT — moveInstrumentation transfers data-aue-* URNs
// UE follows the URN, not DOM position
moveInstrumentation(originalRow, newVisualElement);
```

### 5. Duplicate entries in `_section.json` filter can break UE

If a block ID appears more than once in the `section` filter components array,
UE may fail to resolve the filter correctly. Always check for duplicates after
editing `src/models/_section.json`.

### 6. Identifying item rows without custom attributes

Since `block/v1/block/item` cannot carry custom classes/attributes, use this
priority chain to identify item types in `decorate()`:

| Method                                               | Works in        | Reliability                 |
| ---------------------------------------------------- | --------------- | --------------------------- |
| `row.dataset.aueModel === 'item-type'`               | UE only         | ✅ Exact                    |
| Content check (e.g., `row.querySelector('picture')`) | Production + UE | ✅ If field is required     |
| Position (`rows.slice(N)`)                           | Everywhere      | ⚠️ Fragile if fields change |

Best practice: combine UE check with content check:

```typescript
const itemRows = rows.filter((row) => row.dataset.aueModel === 'my-item' || row.querySelector('picture') !== null);
```

## Quick Checklist

Before shipping a block that restructures DOM:

- [ ] `moveInstrumentation(originalRow, newElement)` called for every restructured item
- [ ] No `model` + `filter` both inside `template` in the JSON definition
- [ ] Cloned elements stripped of `data-aue-*` attributes
- [ ] No duplicate block IDs in `_section.json` filter
- [ ] No hidden DOM added just for UE content tree
- [ ] `npm run build:json` run after any JSON model change
- [ ] Tested: Add/Delete items works in UE after restructure
