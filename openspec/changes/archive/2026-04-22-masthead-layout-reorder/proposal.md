## Why

AEM EDS renders `<header>` before `<main>` in the DOM. The `masthead-sticky` block lives inside `<main>`, so the header always renders above it. On pages with the masthead, the visual order should be **masthead → header → content** — the masthead fills the full viewport first, the header appears below it, and when the header scrolls to the top of the viewport it becomes sticky. Content sections should scroll over the masthead (overlap effect). This cannot be achieved with CSS alone using the default DOM order.

## What Changes

- When the `masthead-sticky` block decorates, add `has-masthead` class to `<body>` and `masthead-section` class to its parent section
- `body.has-masthead` becomes a flex column with reordered children: `main` (order 1) → `header` (order 2) → `footer` (order 3), visually placing masthead before header
- Content sections following the masthead section receive `position: relative; z-index: 51` via CSS sibling selector (`.masthead-section ~ div`), so they overlap the sticky masthead on scroll
- Header keeps `position: sticky; top: 0; z-index: 100` — works naturally when it reaches the top of the viewport
- Pages without the masthead block are unaffected (no `has-masthead` class = no flex reorder)

## Capabilities

### New Capabilities

- `masthead-layout-reorder`: Body-level flex reorder when masthead-sticky block is present — covers DOM order, z-index stacking, scroll overlap behavior, and per-page opt-in

### Modified Capabilities

- `masthead-sticky-block`: The block now adds body/section classes for layout reorder, changing the stacking and scroll requirements

## Impact

- `src/blocks/masthead-sticky/masthead-sticky.ts` — adds `body.has-masthead` + `.masthead-section` classes
- `src/blocks/masthead-sticky/masthead-sticky.css` — adds flex reorder rules and sibling z-index rules
- No changes to header, footer, or any other block
- z-index convention: masthead = 50, content sections = 51, header = 100, modal = 200
