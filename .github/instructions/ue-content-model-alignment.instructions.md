---
description: 'Use when creating or modifying block content models (_<block>.json) or when writing/reviewing decorate() functions that read block.children cells. Ensures model field count stays aligned with cell index assumptions in TypeScript.'
applyTo: 'src/blocks/**'
---

# Content Model ↔ `decorate()` Cell Index Alignment

The AEM document table has **one column per model field**, in the order they are defined
in `_<block>.json`. The `decorate()` function reads content by cell index (`cells[0]`,
`cells[1]`, etc.). If the field count in the model and the index assumptions in code
diverge, every misaligned cell renders wrong data.

## The Risk

```
Model fields (4):   image | alt | title | description
Document columns:   [0]   | [1] | [2]   | [3]

decorate() written for 3 fields:
  cells[0] → picture  ✅
  cells[1] → title    ❌  (actually reads "alt text")
  cells[2] → desc     ❌  (actually reads "title")
```

This produces no error — content just silently renders in the wrong slot.
It typically surfaces only in UE-authored content, not production documents
where authors manually filled the table columns.

## Mandatory Checks

### When adding a field to the model

1. Note the index of the new field (its position in the `fields` array).
2. Open `decorate()` and find every `cells[N]` reference.
3. Increment indices for all cells **at or after** the new field's position.
4. Run `npm run build:json` to regenerate `component-models.json`.

### When removing a field from the model

1. Note which index is being removed.
2. Open `decorate()` and remove or update the corresponding `cells[N]` reference.
3. Decrement indices for all cells **after** the removed field's position.
4. Run `npm run build:json`.

### When writing a new `decorate()` function

Before reading any `cells[]`, count the fields defined in `_<block>.json` and
document the mapping as a comment:

```typescript
// Model fields → column indices:
//   cells[0] = image (reference)
//   cells[1] = title (text)
//   cells[2] = description (richtext)
const pictureEl = cells[0]?.querySelector('picture');
const title = cells[1]?.textContent?.trim() ?? '';
const desc = cells[2]?.innerHTML ?? '';
```

## Image `alt` Text — Don't Add a Separate Field

AEM image references carry alt text natively through the asset reference component.
Adding a separate `alt` text field in the model:

- Creates an extra column that shifts all subsequent cell indices
- Is never read by the AEM image pipeline
- Requires authors to fill in two places for the same semantic value

**Use the `reference` component for images.** Alt text comes from the asset.

## Real Case: `highlights-carousel`

The original model had 4 fields (`image`, `alt`, `title`, `description`) but
`decorate()` was written for 3 columns. Result: cards authored in UE showed
alt text in the title slot and title in the description slot.

Fix: removed the `alt` field so the model matched the code. See
[docs/ue-authoring-issues.md](../../docs/ue-authoring-issues.md) — Issue 2.
