## Context

The `masthead-sticky` block renders a full-viewport (`100vh`) sticky video banner. Content sections scroll over it, with the header becoming sticky after the masthead scrolls away. When scroll stops at an intermediate position (e.g. 30-60% of masthead covered), the page looks awkward — neither showing the full video experience nor cleanly transitioning to the content.

Current layout (from `masthead-sticky.ts`):

- Masthead: `position: sticky; top: 0; height: 100vh; z-index: 50`
- Header: moved into `<main>` after `.masthead-section`, `position: sticky; top: 0; z-index: 100`
- Content sections: `position: relative; z-index: 51` (overlap masthead on scroll)

## Goals / Non-Goals

**Goals:**

- Auto-snap to clean boundary (fully visible or fully hidden) when scroll idles in the masthead zone
- Respect user interaction — never fight with active scrolling
- Minimal code addition (~25 lines) inside existing `decorate()` function

**Non-Goals:**

- CSS `scroll-snap-type` (insufficient threshold control — always snaps, can't limit to masthead zone only)
- Custom easing or RAF-based animation (unnecessary complexity; native `smooth` is sufficient)
- Snap behavior when user is scrolling through content below the masthead

## Decisions

### 1. Threshold calculation: `scrollY / section.offsetHeight`

**Choice:** Use `window.scrollY` divided by the masthead section's `offsetHeight` to compute coverage ratio.

**Alternatives considered:**

- `getBoundingClientRect()` on masthead — unnecessary overhead for a sticky element where `scrollY` directly correlates to coverage
- `IntersectionObserver` — designed for visibility detection, not ratio-based snapping; would need custom thresholds and doesn't give a single clean ratio number

**Rationale:** `scrollY` is free (no layout thrash), and `offsetHeight` is read once. Simple division gives a 0–1 ratio with clean semantics.

### 2. Snap trigger: 300ms scroll idle debounce

**Choice:** `setTimeout` with 300ms delay, reset on every scroll event.

**Rationale:** 300ms balances responsiveness (user doesn't see the awkward state for long) with stability (doesn't fire during slow continuous scrolling). Matches typical scroll-end detection timing.

### 3. Animation: `window.scrollTo({ top, behavior: 'smooth' })`

**Choice:** Native smooth scroll API.

**Alternatives considered:**

- RAF-based custom animation with easing — more control but 15+ extra lines for minimal visual benefit
- `scroll-behavior: smooth` CSS global — can't be scoped to only snap events

**Rationale:** Browser-native smooth scroll handles acceleration, deceleration, and frame timing. Crucially, **it auto-cancels when the user interacts** (wheel, touch, keyboard), which is the exact user-interrupt behavior we need for free.

### 4. Re-trigger guard: `isSnapping` flag + `scrollend` event

**Choice:** Set `isSnapping = true` before `scrollTo()`, clear on `scrollend` event. While `isSnapping`, skip the debounce timer reset.

**Rationale:** Without this guard, the programmatic scroll fires scroll events → resets the debounce → triggers another snap evaluation → potential loop. `scrollend` is supported in all modern browsers (Chrome 114+, Firefox 109+, Safari 17.4+) and fires exactly once when scrolling completes (whether programmatic or user-interrupted).

### 5. Zone guard: only snap when `scrollY` is within `(0, mastheadHeight)`

**Choice:** Skip snap logic when `scrollY <= 0` (already at top) or `scrollY >= mastheadHeight` (already past masthead).

**Rationale:** User scrolling through content below the masthead should never be affected. The snap is purely a masthead-zone UX enhancement.

### 6. Listener cleanup: `MutationObserver` on `document.body`

**Choice:** Follow the block-authoring instruction pattern — observe `document.body` for `childList + subtree` changes, and when `!document.contains(block)`, remove all listeners and disconnect.

**Rationale:** UE can dynamically add/remove blocks. Leaked listeners would cause errors and memory issues.

## Risks / Trade-offs

**[Risk] `scrollend` not supported on older browsers** → Falls back gracefully: `isSnapping` is never cleared, so snap fires only once per page load. Acceptable degradation. Can add a `setTimeout(1000)` fallback if needed later.

**[Risk] Rapid scroll-stop-scroll cycles could feel jarring** → 300ms delay means snap won't fire during quick scroll adjustments. User must truly idle for it to trigger.

**[Trade-off] No `prefers-reduced-motion` check** → `behavior: 'smooth'` respects OS-level reduced motion settings natively in most browsers. No extra code needed.
