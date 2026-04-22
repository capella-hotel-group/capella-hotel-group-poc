## Context

The header block (`src/blocks/header/header.ts`) builds a three-zone sticky header from a nav fragment with 3 sections: lang list (section 0), nav list (section 1), CTA anchor (section 2). Desktop layout uses `display: flex` with `header-inner`. No mobile breakpoint exists yet.

Current DOM structure:

```
header
  .header (block)
    .header-inner
      .header-lang (dropdown trigger)
      .header-nav (display: contents → nav links inline)
      .header-emblem (abs center)
      .header-cta
  body > .header-lang-dropdown (fixed positioned)
```

## Goals / Non-Goals

**Goals:**

- Responsive header with mobile menu panel at `<600px`
- Slide-down panel animation
- Lang accordion within panel
- Close button at bottom center of panel
- Desktop layout unchanged

**Non-Goals:**

- Destinations submenu (future work)
- Search functionality
- Booking widget integration
- Changing nav fragment authoring structure

## Decisions

### 1. Separate mobile DOM elements alongside desktop elements

**Choice:** Build mobile-specific elements (MENU toggle, mobile panel) in the decorator alongside existing desktop elements. Use CSS `display: none` to toggle visibility per viewport. Both DOMs read from the same authored nav fragment.

**Rationale:** Avoids complex JS viewport switching. CSS handles show/hide cleanly. Both desktop and mobile elements exist in DOM but only one set is visible. No `matchMedia` JS needed for layout toggle.

### 2. Mobile panel as sibling of header-inner inside the block

**Choice:** Append `.header-mobile-panel` as a sibling of `.header-inner` inside the block element. Panel slides down via `max-height` transition.

**Rationale:** Keeping panel inside the block means it inherits the header's `z-index: 100` stacking. The panel sits below the header bar visually but above all page content. `max-height` transition with `overflow: hidden` provides smooth slide-down without needing to measure content height.

### 3. MENU toggle replaces lang zone on mobile

**Choice:** On mobile, `.header-lang` is hidden and a new `.header-menu-toggle` button appears in the same left position. The button text is "MENU" and does not change when panel is open.

**Rationale:** Matches production site pattern. "MENU" as text (not hamburger icon) is the established Capella brand pattern.

### 4. Lang accordion inside panel

**Choice:** A "LANGUAGES ▾" button in the panel that toggles a sub-list of lang options with slide-down animation. Clicking a lang option selects it (same behavior as desktop dropdown).

**Rationale:** Production site uses this pattern. Avoids a separate dropdown positioned outside the panel.

### 5. Close button at panel bottom center

**Choice:** A close button (✕) centered at the bottom of the panel. Clicking it closes the panel (same as clicking MENU again).

**Rationale:** User requested. Provides clear affordance to dismiss the panel without scrolling back to MENU.

### 6. CTA text shortens to "BOOK" on mobile

**Choice:** CSS truncates or JS sets shorter text. Since the authored CTA text is "BOOK YOUR STAY", use CSS to hide overflow text on mobile, or set a `data-mobile-label` attribute.

**Rationale:** Space constraint on mobile header bar. Production site uses "BOOK" on mobile.

## Risks / Trade-offs

**[Trade-off] Duplicate nav links in DOM** → Desktop nav links and mobile panel nav links are separate DOM elements reading from the same source. Increases DOM size but simplifies CSS and avoids complex responsive restructuring.

**[Risk] `max-height` transition needs a large enough max value** → Using `max-height: 100vh` as the open state ensures it works for any content length, but the transition speed varies with actual content height. Acceptable for this use case.
