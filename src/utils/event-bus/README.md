# event-bus

Lightweight pub/sub utility for decoupled communication between AEM EDS blocks.
Module-level singleton — import directly, no instantiation required.

```
src/utils/event-bus/
├── index.ts  — on, off, emit, getRegisteredEvents
├── types.ts  — EventMap, EventName, PayloadOf, Handler
└── README.md
```

Import path: `@/utils/event-bus`

---

## Rules

- Blocks **must not** call each other directly. Use `emit` + `on` instead.
- Events carry data only — no business logic inside a payload.
- Event names follow `<source>:<action>` (e.g. `section:enter`, `slider:change`).
- Always `off` a handler if the block can be re-initialised to avoid duplicate listeners.
- `emit` is always safe to call — it is a no-op when no listeners are registered.

---

## API

| Function | Description |
|---|---|
| `on(eventName, handler)` | Subscribe a handler to an event |
| `off(eventName, handler)` | Remove a previously registered handler |
| `emit(eventName, payload?)` | Fire an event; safe when no listeners exist |
| `getRegisteredEvents()` | Return `{ eventName: listenerCount }` snapshot |

---

## Basic usage

```ts
import { on, off, emit } from '@/utils/event-bus';

function handleEnter(payload: { index: number }) {
  console.log('section entered:', payload.index);
}

on('section:enter', handleEnter);
emit('section:enter', { index: 2 });
off('section:enter', handleEnter);
```

---

## Typed events — `EventMap`

Declare your block's events via **declaration merging** to get autocomplete on event names and inferred payload types in `on()` / `emit()`.

```ts
// In your block file (e.g. menus.ts)
declare module '@/utils/event-bus' {
  interface EventMap {
    'menus:ready':   { block: HTMLElement };
    'slider:change': { index: number };
    'section:enter': { index: number };
    'section:leave': { index: number };
  }
}
```

Once declared, TypeScript will:
- Autocomplete known event names in `on()` and `emit()`
- Type-check the payload against the declared shape
- Infer `payload` type inside the handler without an explicit annotation

Undeclared event names are still accepted — they resolve to `unknown` payload.

---

## Naming convention

```
<source>:<action>
```

Use the block or feature name as the source and an imperative verb as the action.
Examples: `section:enter`, `section:leave`, `slider:change`, `menus:ready`.

---

## Debug

Enable event logging in the browser console (persists across reloads):

```js
localStorage.setItem('debug:events', 'true');   // enable
localStorage.removeItem('debug:events');          // disable
```

Each `emit` will log: `[EventBus] section:enter { index: 2 }`

Inspect all registered events at runtime:

```ts
import { getRegisteredEvents } from '@/utils/event-bus';
console.table(getRegisteredEvents());
// { 'section:enter': 2, 'menus:ready': 1 }
```

---

## Constraints

- No event queue or replay — late subscribers miss past events
- No wildcard or pattern matching on event names
- No async coordination — handlers are called synchronously
- Singleton is guaranteed by ESM module caching — no explicit setup needed
