## 1. Types

- [x] 1.1 Create `src/utils/global-state/types.ts` and define `GlobalState`, `StateListener`, `StateSelector`, `SetStateFn`, and `UnsubscribeFn` types

## 2. Core Implementation

- [x] 2.1 Create `src/utils/global-state/index.ts` with module-level state closure initialised to `{ currentSection: null, scrollProgress: 0 }`
- [x] 2.2 Implement `getState()` — returns a shallow copy of current state (`{ ...state }`) to prevent external mutation
- [x] 2.3 Implement `setState(partial)` — shallow-merge, field-level equality check (incl. `viewport` width/height comparison), notify listeners only on change; use `notifying` flag + `pendingQueue` to safely handle re-entrant calls
- [x] 2.4 Implement `subscribe(listener)` — registers listener in a `Set`, dispatches using a snapshot copy (`[...listeners]`) to handle mid-loop unsubscription; returns `UnsubscribeFn`
- [x] 2.5 Implement `reset()` — restores state to initial value and clears all listeners (test/HMR use only)
- [x] 2.6 Export `getState`, `setState`, `subscribe`, `reset`, and all types from `index.ts`

## 3. Documentation

- [x] 3.1 Create `src/utils/global-state/README.md` covering purpose, when to use / not use, and usage examples for `setState` and `subscribe`

## 4. Validation

- [x] 4.1 Run `npm run lint` — confirm zero ESLint and Stylelint errors
- [x] 4.2 Run `npm run build` — confirm TypeScript type-check passes with no errors
