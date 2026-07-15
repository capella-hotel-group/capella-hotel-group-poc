# Cinematic Hero Block — Design Specification

**Date:** 2026-07-15
**Block name:** `cinematic-hero`
**Status:** Approved, ready for implementation planning

---

## 1. Overview

A full-screen immersive hero block that plays cinematic video reels as background and presents an interactive sentence-based item selector:

```
See  [Inspiration]  with new eyes
     [Nature      ]
     [Relaxation  ]
     [Celebration ]
```

The user hovers (or taps on mobile) to change the active item. The background video crossfades to the item's reel. Prefix (`See`) and suffix (`with new eyes`) translate vertically to align with the active row — the item list itself never moves.

Two content modes (`Experiences` / `Destinations`) each maintain their own active item state.

---

## 2. Decisions Made

| Topic               | Decision                                                  |
| ------------------- | --------------------------------------------------------- |
| Block name          | `cinematic-hero`                                          |
| Animation engine    | Web Animations API (WAAPI) + vanilla RAF for cursor       |
| Content model       | Container + item (block-level config row + item children) |
| Focal position      | Select field (9 fixed options)                            |
| Module architecture | Multi-file with `lib/` subfolder                          |
| prefix / suffix     | Author-configurable (not hardcoded)                       |

---

## 3. Content Model

### Block definition: `cinematic-hero`

Has a **block model** with 4 fields AND a **filter** allowing `cinematic-hero-item` children.

Block model fields → rendered as `rows[0]` cells in `decorate()`:

| Index | Field name          | Component | Default         |
| ----- | ------------------- | --------- | --------------- |
| `[0]` | `prefix`            | `text`    | `See`           |
| `[1]` | `suffix`            | `text`    | `with new eyes` |
| `[2]` | `experiencesLabel`  | `text`    | `Experiences`   |
| `[3]` | `destinationsLabel` | `text`    | `Destinations`  |

### Item definition: `cinematic-hero-item`

Each item is a child row → `rows[1+]`:

| Index | Field name     | Component     | Notes                                                                                              |
| ----- | -------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| `[0]` | `label`        | `text`        | Display name, e.g. `Inspiration`                                                                   |
| `[1]` | `mode`         | `select`      | `experiences` \| `destinations`                                                                    |
| `[2]` | `video`        | `aem-content` | Renders as `<a href="...">`                                                                        |
| `[3]` | `poster`       | `reference`   | Renders as `<picture>`                                                                             |
| `[4]` | `link`         | `aem-content` | Optional navigation, `<a>`                                                                         |
| `[5]` | `focalDesktop` | `select`      | `center`, `top`, `bottom`, `left`, `right`, `top-left`, `top-right`, `bottom-left`, `bottom-right` |
| `[6]` | `focalMobile`  | `select`      | Same options as focalDesktop                                                                       |
| `[7]` | `hasAudio`     | `boolean`     | Controls sound toggle visibility                                                                   |

### Filter

`cinematic-hero` accepts only `cinematic-hero-item` as children.

### `decorate()` parsing

```typescript
// Model fields → column indices (block config row):
//   rows[0].children[0] = prefix (text)
//   rows[0].children[1] = suffix (text)
//   rows[0].children[2] = experiencesLabel (text)
//   rows[0].children[3] = destinationsLabel (text)

// Item rows: rows[1..n]
//   row.children[0] = label (text)
//   row.children[1] = mode (select → textContent)
//   row.children[2] = video (aem-content → a.href)
//   row.children[3] = poster (reference → picture)
//   row.children[4] = link (aem-content → a, optional)
//   row.children[5] = focalDesktop (select → textContent)
//   row.children[6] = focalMobile (select → textContent)
//   row.children[7] = hasAudio (boolean → textContent 'true'/'false')
```

---

## 4. File Structure

```
src/blocks/cinematic-hero/
  cinematic-hero.ts          ← entry: parse DOM, orchestrate, lifecycle
  cinematic-hero.css
  _cinematic-hero.json
  lib/
    types.ts                 ← HeroItem, HeroMode, HeroState, HeroConfig
    media-manager.ts         ← 2 video layers, crossfade, request cancellation
    selector-ui.ts           ← item list DOM, prefix/suffix anchor movement (WAAPI)
    intro.ts                 ← intro animation sequence (WAAPI + promise chaining)
    cursor.ts                ← custom cursor RAF loop (fine pointer only)
    analytics.ts             ← CustomEvent emitter, no external dependency
```

> **Build note:** `lib/*.ts` files are imported by `cinematic-hero.ts` and bundled into the block's single JS chunk by Rollup. `generateBlockEntries()` only discovers `{name}/{name}.ts` — it does not recurse into `lib/`, so these files are never registered as separate block entries.

---

## 5. DOM Structure

```html
<div class="cinematic-hero">
  <div class="cinematic-hero-media">
    <div class="cinematic-hero-poster"></div>
    <!-- z-index: 0, CSS bg-image -->
    <video class="cinematic-hero-video cinematic-hero-video--a" muted playsinline loop></video>
    <video class="cinematic-hero-video cinematic-hero-video--b" muted playsinline loop></video>
  </div>

  <div class="cinematic-hero-overlay"></div>
  <!-- z-index: 1, contrast gradient -->

  <div class="cinematic-hero-selector">
    <!-- z-index: 2 -->
    <div class="cinematic-hero-prefix" aria-hidden="true">See</div>
    <ul class="cinematic-hero-items" role="listbox">
      <li class="cinematic-hero-item" role="option" aria-selected="true" data-index="0" data-mode="experiences">
        <button class="cinematic-hero-item-btn">Inspiration</button>
      </li>
      <!-- … more items … -->
    </ul>
    <div class="cinematic-hero-suffix" aria-hidden="true">with new eyes</div>
  </div>

  <div class="cinematic-hero-controls">
    <!-- z-index: 3 -->
    <button class="cinematic-hero-sound" aria-label="Unmute video" aria-pressed="false"></button>
    <div class="cinematic-hero-mode" role="tablist">
      <button
        class="cinematic-hero-mode-btn cinematic-hero-mode-btn--active"
        role="tab"
        aria-selected="true"
        data-mode="experiences"
      >
        Experiences
      </button>
      <div class="cinematic-hero-mode-track" aria-hidden="true">
        <div class="cinematic-hero-mode-indicator"></div>
      </div>
      <button class="cinematic-hero-mode-btn" role="tab" aria-selected="false" data-mode="destinations">
        Destinations
      </button>
    </div>
  </div>

  <div class="cinematic-hero-cursor" aria-hidden="true"></div>
  <!-- z-index: 4, desktop only -->
</div>
```

`decorate()` calls `block.replaceChildren(...newElements)` once. `moveInstrumentation()` is called per item row to preserve `data-aue-*` attributes for the Universal Editor.

---

## 6. Layer Z-index

| Layer                               | z-index |
| ----------------------------------- | ------- |
| Media (poster + video A/B)          | `0`     |
| Contrast overlay                    | `1`     |
| Selector UI (prefix, items, suffix) | `2`     |
| Bottom controls (sound, mode)       | `3`     |
| Custom cursor                       | `4`     |

---

## 7. Animation

### Technology

Web Animations API (WAAPI) for all opacity/transform transitions. Vanilla `requestAnimationFrame` loop for cursor position. No external animation library.

### Intro sequence (~3.75s total)

| Time    | Action                                                          | Duration | Easing   |
| ------- | --------------------------------------------------------------- | -------- | -------- |
| `0.00s` | Poster visible, UI hidden                                       | —        | —        |
| `0.70s` | Prefix + suffix fade in (opacity 0→1)                           | 300ms    | linear   |
|         | Prefix/suffix at center (translateX=0) — appear as one sentence | —        | —        |
| `2.75s` | Prefix translateX → left; suffix translateX → right             | 250ms    | ease-out |
|         | Item list fade in (opacity 0→1)                                 | 250ms    | ease-out |
| `3.50s` | Prefix/suffix translateY → first item row (measured offset)     | 180ms    | ease-out |
| `3.75s` | Intro complete, interaction unlocked                            | —        | —        |

Only `transform` and `opacity` animated. No layout properties. No spring/bounce.

`skipIntro()`: sets all elements to final state immediately. Called when `prefers-reduced-motion`, in editor context, or config flag set.

### Item activation

```
pointer enter → hover timer 120ms
timer fires   →
  1. animation.cancel() on pending prefix/suffix animations
  2. prefix.animate([{transform: translateY(Npx)}], {duration: 310, easing: 'ease-out'})
  3. suffix.animate([{transform: translateY(Npx)}], {duration: 310, easing: 'ease-out'})
  4. old item.animate([{opacity: 0.35}], {duration: 190})
  5. new item.animate([{opacity: 1.0}], {duration: 190})
  6. MediaManager.switchTo(item)
  7. analytics.emit('item-select', {...})
pointer leave before timer → clearTimeout
```

Row offset `N` is measured via `getBoundingClientRect()`, cached after font load and recalculated on resize/orientation change.

Rapid hover: `animation.cancel()` at step 1 ensures latest selection always wins. No queue.

### Mode switch (~500–700ms, overlapping)

```
1. Lock interaction
2. indicator slide → new side (280ms)
3. item list opacity 0 (180ms) — await
4. swap visible item list (update DOM or toggle data-mode filter)
5. prefix/suffix translateY → new mode's active row (340ms)
6. item list opacity 1 (240ms) — parallel with step 5
7. MediaManager.switchTo(newModeActiveItem)
8. Unlock interaction
```

Each mode retains its own active index. Switching back restores previous selection (not first item), except on first visit to that mode.

### Media crossfade

```
sequenceId++ per request
load video into idle layer (A or B alternating)
await 'loadeddata' event
if sequenceId still current:
  incoming.animate([{opacity: 0}, {opacity: 1}], {duration: 360})
  outgoing.animate([{opacity: 1}, {opacity: 0}], {duration: 360})
  await both .finished
  outgoing.pause()
  outgoing.src = ''   // release decoder
else:
  discard (stale request)
```

Incoming video only fades in after `loadeddata` — no black frame risk. Outgoing video paused + src cleared after crossfade completes.

---

## 8. Module APIs

### `types.ts`

```typescript
interface HeroConfig {
  prefix: string;
  suffix: string;
  experiencesLabel: string;
  destinationsLabel: string;
}

interface HeroItem {
  label: string;
  mode: HeroMode;
  videoUrl: string;
  posterUrl: string;
  link: string | null;
  focalDesktop: string;
  focalMobile: string;
  hasAudio: boolean;
}

type HeroMode = 'experiences' | 'destinations';

interface HeroState {
  activeMode: HeroMode;
  activeIndex: Record<HeroMode, number>;
  introComplete: boolean;
  muted: boolean;
}
```

### `media-manager.ts`

```typescript
class MediaManager {
  constructor(container: HTMLElement);
  switchTo(item: HeroItem): void; // crossfade with sequence ID guard
  setMuted(muted: boolean): void;
  pause(): void;
  resume(): void;
  destroy(): void;
}
```

### `selector-ui.ts`

```typescript
class SelectorUI {
  constructor(elements: { prefix; suffix; items });
  activateItem(index: number, animate: boolean): void;
  measureRows(): void; // cache getBoundingClientRect per row
  onSelect(cb: (index: number) => void): void;
}
```

### `intro.ts`

```typescript
function runIntro(elements: IntroElements): Promise<void>;
function skipIntro(elements: IntroElements): void;
```

### `cursor.ts`

```typescript
class CursorController {
  constructor(container: HTMLElement, cursorEl: HTMLElement);
  mount(): void; // only if matchMedia('(pointer: fine)') && !reducedMotion
  destroy(): void;
}
```

### `analytics.ts`

```typescript
function emitHeroImpression(data): void;
function emitItemSelect(data): void;
function emitModeChange(data): void;
function emitItemNavigation(data): void;
function emitSoundToggle(data): void;
function emitMediaError(data): void;
```

Uses `new CustomEvent(name, { detail })` dispatched on `document`. No external dependency.

---

## 9. Responsive Behavior

### Desktop (≥ 1024px)

Three-column layout: `[prefix] [item list] [suffix]`. Custom cursor enabled on `pointer: fine`. Item column has fixed width (widest label + padding). Prefix/suffix columns sized to their content.

### Tablet (768px–1023px)

Same three-column structure, adjusted font size, column gap, and spacing.

### Mobile (< 768px)

Vertical stacked layout (Option A from spec):

```
              Inspiration
See           Nature
              Relaxation

with new eyes
```

Custom cursor disabled. Tap once to activate, tap again to navigate (if item has link). Touch target minimum 44px. `min-height: 100svh`. Bottom controls respect `env(safe-area-inset-bottom)`.

---

## 10. Accessibility

| Feature          | Implementation                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| Item controls    | `<button>` elements; Tab, Arrow Up/Down, Home/End, Enter, Space                                           |
| Mode controls    | `role="tablist"`; Arrow Left/Right between tabs                                                           |
| Active state     | `aria-selected="true"` on active item and mode tab                                                        |
| Background media | `aria-hidden="true"` on all media elements                                                                |
| Heading          | Block contains an `aria-label` or visible heading for screen readers                                      |
| Focus            | Hover never moves focus; mode switch retains focus on mode button                                         |
| Reduced motion   | `matchMedia('prefers-reduced-motion: reduce')` → skipIntro, instant transitions, poster-only, no autoplay |

---

## 11. Error Handling

| Error                            | Behavior                                                                    |
| -------------------------------- | --------------------------------------------------------------------------- |
| Video load failure               | Poster remains visible, UI still interactive, no rollback                   |
| Playback rejected                | Keep poster/paused frame, reflect state in sound control, no infinite retry |
| Missing poster                   | Black background, no broken-image icon, UI functional                       |
| WAAPI not available              | Catch + set elements to final state via `.style`, block remains visible     |
| Missing `label` or `video` field | Skip that item during parse, log warning                                    |

---

## 12. Lifecycle & Performance

### Visibility

- `IntersectionObserver` threshold `0.25` → pause when < 25% visible, resume when ≥ 25%
- `document.addEventListener('visibilitychange')` → pause on hidden, resume on visible

### Media loading

- Initial load: poster first (CSS background-image), only active item's video prepared
- After block stable: can preload metadata (`preload="metadata"`) for next item — not full video
- Maximum 2 videos playing simultaneously (only during crossfade window)

### `will-change`

Applied conservatively to: `.cinematic-hero-video`, `.cinematic-hero-prefix`, `.cinematic-hero-suffix`, `.cinematic-hero-mode-indicator`, `.cinematic-hero-cursor`.

### Cleanup (called on block disconnect / page unload)

- Cancel all active WAAPI animations
- Cancel cursor RAF loop
- Clear all hover timers
- Disconnect `IntersectionObserver`
- Remove `resize`, `visibilitychange`, font-load listeners
- Pause both videos, clear `src`
- Cancel pending media requests (via sequenceId invalidation)

---

## 13. Analytics Events

All events dispatched as `CustomEvent` on `document`:

| Event name                     | Key data                                         |
| ------------------------------ | ------------------------------------------------ |
| `cinematic-hero:impression`    | `blockId`, `mode`, `item`                        |
| `cinematic-hero:item-select`   | `previousItem`, `newItem`, `mode`, `inputSource` |
| `cinematic-hero:mode-change`   | `previousMode`, `newMode`, `newActiveItem`       |
| `cinematic-hero:item-navigate` | `item`, `href`                                   |
| `cinematic-hero:sound-toggle`  | `muted`                                          |
| `cinematic-hero:media-error`   | `item`, `mediaUrl`, `errorType`                  |

---

## 14. Acceptance Criteria

See original spec Sections 19 (Acceptance Criteria). All items apply. Key additions from design phase:

- `rows[0]` cell count must match block model field count (4 fields) — enforced by content model alignment instruction
- `decorate()` reads cells by index with comments documenting the mapping
- `moveInstrumentation()` called per item row before `replaceChildren()`
- Block renders correctly when 0 items are authored (no crash)
- Block renders correctly when `hasAudio=false` for all items (sound control hidden)

---

## 15. Out of Scope

- Global header / main navigation
- Video editing or multi-clip concatenation at runtime
- Scroll-based animation (no ScrollTrigger)
- Sync with other blocks on the page
- Page routing beyond item link navigation
- Analytics platform integration (events are emitted; consumption is up to the page layer)
