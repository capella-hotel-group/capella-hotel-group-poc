## Context

AEM EDS pages have a fixed DOM structure: `<header>` → `<main>` → `<footer>`. The masthead-sticky block is inside a `<main>` section, but needs to appear visually above the header. CSS `position: sticky` on the header already works — the challenge is visual ordering.

Current z-index convention:

- masthead-sticky: 50
- header: 100
- masthead-modal: 200

## Goals / Non-Goals

**Goals:**

- Masthead renders above header visually on pages that have the block
- Content sections scroll over the masthead (overlap effect)
- Header becomes sticky when it reaches the top of the viewport
- Zero side effects on pages without the masthead block
- Block can be added/removed per page via Universal Editor

**Non-Goals:**

- Changing the AEM EDS DOM structure (`<header>` before `<main>`)
- Making header transparent or overlaying it on the masthead
- Scroll-linked animations or parallax effects

## Decisions

### 1. Flex reorder on `<body>` for visual ordering

**Decision**: `body.has-masthead { display: flex; flex-direction: column }` with `main { order: 1 }`, `header { order: 2 }`, `footer { order: 3 }`.

**Rationale**: CSS flex order changes visual rendering without altering DOM structure. This preserves AEM EDS instrumentation and accessibility (DOM reading order stays header → main → footer). The class is only added at runtime when the block decorates.

**Alternatives considered**:

- Negative `margin-top` on `<main>` — hacky, breaks header sticky behavior, needs IntersectionObserver to re-enable
- `position: absolute` header — header floats over video, different UX than the requested masthead → header → content stack
- JS DOM manipulation (move header node) — breaks AEM UE instrumentation, risky for `data-aue-*` attributes

### 2. Per-page opt-in via body class

**Decision**: `decorate()` adds `body.has-masthead`. All layout CSS is scoped under this class.

**Rationale**: Pages without the block have no class — zero CSS impact. If the block is removed in UE, the page reloads and the class is not added.

### 3. Sibling selector for content overlap

**Decision**: `.masthead-section ~ div { position: relative; z-index: 51 }` gives content sections a higher z-index than the masthead's 50.

**Rationale**: As content scrolls up, it paints over the sticky masthead. No JS needed — pure CSS sibling selector. Only applies to sections after the masthead section.

## Risks / Trade-offs

- **Flex on body**: Some third-party scripts may not expect `display: flex` on `<body>`. → Low risk in AEM EDS context; no known conflicts.
- **Screen reader order**: DOM order (header → main) differs from visual order (main → header) on masthead pages. → Acceptable: header landmark is still first in DOM, which is standard for nav-first accessibility.
- **z-index 51 on all sibling sections**: If a block inside a content section uses z-index > 51, it may break layering. → Unlikely in practice; current blocks use z-index only for overlays (100+).
