## Why

AEM EDS blocks are intentionally isolated units — each block decorates its own DOM subtree independently. Currently there is zero mechanism for inter-block communication: `scripts.ts` exports only DOM attribute helpers, all block-level events (pointer, animation, media) are scoped locally, and no block dispatches or listens to `CustomEvent` for coordination.

As interactive patterns grow (e.g., a section navigation driving a content slider, a menus block signalling when it is ready for dependent layout shifts), blocks need to coordinate without calling each other directly. Direct cross-block function calls would create hard coupling that breaks the EDS isolation model and makes blocks impossible to reuse independently.

A lightweight, pure-TypeScript EventBus singleton at the `src/utils/` layer solves this cleanly: blocks can emit named events with a typed payload, and any other block can subscribe — without either knowing the other exists.

## What Changes

- **New utility** `src/utils/event-bus/` — module-level singleton with exports: `on`, `off`, `emit`, `getRegisteredEvents`
- No existing block is modified as part of this change
- No new dependencies or build configuration changes

## Capabilities

### New Capabilities

- `EventBus` utility importable via `@/utils/event-bus` — provides `on`, `off`, `emit`, and `getRegisteredEvents`; supports typed events via `EventMap` declaration merging; includes debug logging via `localStorage` flag

### Modified Capabilities

*(none — no existing spec-level behavior changes)*

## Impact

- New folder `src/utils/event-bus/` (`index.ts`, `types.ts`, `README.md`) only — no changes to block output, styles, or AEM models
- No runtime side-effects before any block imports the module (Map initialises lazily on first call)
- Builds into the `utils/` chunk; zero bundle impact on blocks that do not import it (Rollup tree-shakes unused exports)
