# global-state

A lightweight, zero-dependency global state store for shared page-level state across AEM EDS blocks.

## Purpose

AEM EDS blocks are isolated DOM decorators with no built-in inter-block communication. This store
provides a **single source of truth** for page state that multiple blocks need to read or update —
such as the currently active section, scroll progress, or viewport dimensions.

It complements the [event-bus](../event-bus/README.md):
- **global-state** = *what is the current value right now?*
- **event-bus** = *something just happened*

## When to use

✅ Use global-state when:
- A block needs to **read** shared state at any point in time (e.g. "is the hero section active?")
- Multiple blocks need to react to the **same piece of page state**
- You want to avoid duplicating scroll/resize listeners across blocks

❌ Do not use global-state for:
- Block-internal state (slider index, open/closed toggles, animation phase) — keep that local
- One-off events / side effects — use the event-bus instead
- Storing boolean flags that mean "this event fired" (e.g. `heroDone: true`)
- State that only one block cares about

## API

```ts
import { getState, setState, subscribe } from '@/utils/global-state';
import type { GlobalState, StateSelector, StateListener, UnsubscribeFn } from '@/utils/global-state';
```

### `getState(): GlobalState`

Returns a shallow copy of the current state. Safe to call at any time.

```ts
const { currentSection, scrollProgress } = getState();
```

### `setState(partial: Partial<GlobalState>): void`

Shallow-merges `partial` into the current state. Listeners are only notified
when at least one field value actually changes.

```ts
setState({ currentSection: 'hero' });
setState({ scrollProgress: 0.42 });
setState({ viewport: { width: window.innerWidth, height: window.innerHeight } });
```

### `subscribe(listener): UnsubscribeFn`
### `subscribe(selector, listener): UnsubscribeFn`

Two overloads — use whichever fits your case.

**Overload 1 — full state** (simple cases, or when you need multiple fields at once):

```ts
const unsub = subscribe((state) => {
  if (state.currentSection === 'gallery') {
    startGalleryAnimation();
  }
});
```

**Overload 2 — selector + listener** (fires only when the selected value changes):

```ts
// Fires only when currentSection changes — cleanest for single-field reactions
const unsub = subscribe(
  (state) => state.currentSection,
  (newSection, prevSection) => {
    updateActiveNav(newSection);
  },
);

// Selector can return any derived primitive
const unsub = subscribe(
  (state) => state.scrollProgress > 0.5,
  (isPastMidpoint) => header.classList.toggle('compact', isPastMidpoint),
);
```

> **Note:** The selector overload uses `===` to detect changes. Return a **primitive** (string,
> number, boolean) from the selector — not a new object literal, which would always trigger.

Both overloads return an `UnsubscribeFn`. In production AEM EDS, blocks live for the entire
page lifetime so cleanup is rarely needed. The main exception is one-shot subscriptions:

```ts
// One-shot — unsubscribe from within the listener itself
const unsub = subscribe(
  (state) => state.currentSection,
  (section) => {
    if (section === 'hero') {
      runOnce();
      unsub();
    }
  },
);
```

### `reset(): void`

Restores state to initial values and removes all listeners.

> **Test / HMR use only.** Do not call this in production block code.

```ts
// In a test file:
afterEach(() => reset());
```

## State shape

```ts
type GlobalState = {
  currentSection: string | null; // ID/name of the active page section
  scrollProgress: number;        // 0 → 1, percentage scrolled through the page
  viewport?: {                   // Set once on load and on resize
    width: number;
    height: number;
  };
};
```

## Usage example — updating state from a block

```ts
// src/blocks/section-tracker/section-tracker.ts
import { setState } from '@/utils/global-state';

export default async function decorate(block: HTMLElement): Promise<void> {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        setState({ currentSection: block.dataset.sectionId ?? null });
      }
    }
  });

  observer.observe(block);
}
```

## Usage example — reading state in a block

```ts
// src/blocks/sticky-nav/sticky-nav.ts
import { subscribe } from '@/utils/global-state';

export default async function decorate(block: HTMLElement): Promise<void> {
  // Selector overload — only fires when currentSection changes
  subscribe(
    (state) => state.currentSection,
    (section) => {
      block.querySelectorAll('[data-section]').forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('data-section') === section);
      });
    },
  );
}
```
