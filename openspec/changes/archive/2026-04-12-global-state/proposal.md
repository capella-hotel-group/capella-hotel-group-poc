## Why

Blocks currently lack a shared mechanism for reading cross-cutting page state (active section, scroll progress, viewport size). Without a single source of truth, each block must independently track and broadcast this data, leading to duplication and inconsistent behaviour.

## What Changes

- Introduce a lightweight, zero-dependency global state store in `src/utils/global-state/`
- Expose `getState`, `setState`, and `subscribe` as the public API
- Provide TypeScript types (`GlobalState`, `StateListener`, `SetStateFn`) for full editor autocomplete
- Ship a README for authors who consume or update global state

## Capabilities

### New Capabilities

- `global-state`: Shared, observable page state store (current section, scroll progress, viewport) consumed and updated by multiple blocks

### Modified Capabilities

None — this change introduces only new files.

## Impact

- New files only: `src/utils/global-state/index.ts`, `src/utils/global-state/types.ts`, `src/utils/global-state/README.md`
- No changes to existing blocks, app scripts, or build config
- No runtime dependencies added
