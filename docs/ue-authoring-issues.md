# Universal Editor Authoring Issues — Field Guide

Real-world issues encountered in this project when blocks fail to work correctly
in the Universal Editor. Each entry has: **symptom → root cause → fix**.

---

## Issue 1: Added card/item is invisible in content tree and doesn't appear after save

**Blocks affected:** Any block that calls `block.replaceChildren()` to rebuild its DOM  
**First seen in:** `highlights-carousel`

### Symptom

Author clicks "Add" inside a block in UE, fills in fields, saves — but the
content tree stays empty and the new item never renders on the page.

### Root Cause

`decorate()` tears down the original AEM-delivered DOM with `block.replaceChildren()`
and builds new visual elements. The original rows carry `data-aue-resource` URNs that
UE uses to track content items. When the rows are discarded without transferring those
URNs, UE loses all awareness of the items — content tree goes blank, Add/Delete
operations have no visible effect.

```
BEFORE replaceChildren():
  block
  ├─ div.row  [data-aue-resource="urn:...item-1"]  ← UE tracks this
  ├─ div.row  [data-aue-resource="urn:...item-2"]
  └─ div.row  [data-aue-resource="urn:...item-3"]

AFTER replaceChildren() WITHOUT moveInstrumentation():
  block
  ├─ div.cc-arrows          ← no URN
  ├─ div.cc-slider-wrapper
  │   └─ ul.cc-track
  │       ├─ li             ← URN gone
  │       ├─ li             ← URN gone
  │       └─ li             ← URN gone
  └─ div.cc-drag-cursor
                            → UE finds no data-aue-resource → content tree empty
```

### Fix

Call `moveInstrumentation(originalRow, newElement)` for every restructured item,
**before** calling `replaceChildren()`. Import from `@/app/scripts`.

```typescript
import { moveInstrumentation } from '@/app/scripts';

itemRows.forEach((row) => {
  const li = document.createElement('li');
  moveInstrumentation(row as HTMLElement, li); // ← transfers data-aue-* URNs
  // ... build card content ...
  track.append(li);
});

block.replaceChildren(slider, arrows); // safe — URNs already on new elements
```

### Reference

`ue-layout-conflicts.instructions.md` — Pattern #4 (moveInstrumentation), Pattern #1–3

---

## Issue 2: Card fields render with wrong data (title shows alt text, etc.)

**Blocks affected:** Any block whose content model field count doesn't match
the cell index assumptions in `decorate()`  
**First seen in:** `highlights-carousel`

### Symptom

Cards authored in UE show wrong content in each slot: title field displays the
alt text value, description is off, etc. The issue doesn't appear in production
(where content was authored in a document table directly).

### Root Cause

The AEM document table has one column per model field. `decorate()` reads cells
by index (`cells[0]`, `cells[1]`, etc.). If the model has a field that `decorate()`
doesn't account for, every subsequent cell index is off by one.

```
Model with 4 fields:           What decorate() assumed (3 fields):
┌────────┬─────┬───────┬──────┐   ┌────────┬───────┬──────┐
│ image  │ alt │ title │ desc │   │ image  │ title │ desc │
│ [0]    │ [1] │  [2]  │ [3]  │   │  [0]   │  [1]  │ [2]  │
└────────┴─────┴───────┴──────┘   └────────┴───────┴──────┘

cells[1] → reads "alt text"        cells[1] → reads title ✅
cells[2] → reads "title" as desc   cells[2] → reads desc ✅
```

### Fix Options

**Option A (preferred):** Remove the redundant field from the model so field count
matches `decorate()`. Run `npm run build:json` after.

**Option B:** Keep the field and fix cell indices in `decorate()` to skip it:

```typescript
// If model is: image(0) | alt(1) | title(2) | desc(3+)
const pictureEl = cells[0]?.querySelector('picture');
// cells[1] = alt — skip, not rendered
const title = cells[2]?.textContent?.trim() ?? '';
const contentCells = cells.slice(3);
```

### Prevention

Whenever you add or remove a field in `_<block>.json`, immediately check
`decorate()` to verify all cell indices are still correct.

See: `ue-content-model-alignment.instructions.md`

---

## Quick Diagnosis Checklist

When UE authoring behaves unexpectedly for a block:

| Symptom                                          | Check first                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------- |
| Content tree empty, Add does nothing             | `moveInstrumentation()` missing                                             |
| Content tree shows items but fields render wrong | Cell index mismatch — count model fields vs `cells[]` usage                 |
| "Add" button missing entirely                    | `filter` not set in `_<block>.json`, or `model`+`filter` both in `template` |
| Add button present but inserted item wrong type  | `block/v1/block/item` template has unsupported properties (`classes`, `id`) |
| Duplicate ghost items in content tree            | Cloned elements carry `data-aue-*` attributes — strip them                  |
