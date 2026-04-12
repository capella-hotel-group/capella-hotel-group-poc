## Purpose

Shared, observable page-level state store consumed and updated by multiple AEM EDS blocks.
Provides a single source of truth for cross-cutting state (active section, scroll progress,
viewport dimensions) without duplicating listeners across blocks.

## Requirements

### Requirement: Read current global state
The module SHALL export a `getState()` function that returns a **shallow copy** of the current `GlobalState` object synchronously.

#### Scenario: Initial state before any mutations
- **WHEN** `getState()` is called before any `setState()` call
- **THEN** it returns `{ currentSection: null, scrollProgress: 0, viewport: undefined }`

#### Scenario: State reflects latest mutation
- **WHEN** `setState({ currentSection: 'hero' })` has been called
- **THEN** `getState().currentSection` equals `'hero'`

#### Scenario: Returned object is a copy, not a reference
- **WHEN** a caller mutates the object returned by `getState()`
- **THEN** the internal store state is not affected

---

### Requirement: Set partial global state with shallow merge
The module SHALL export a `setState(partial)` function that shallow-merges `partial` into the current state without overwriting unrelated fields.

#### Scenario: Partial update preserves other fields
- **WHEN** state is `{ currentSection: 'hero', scrollProgress: 0.5 }` and `setState({ currentSection: 'gallery' })` is called
- **THEN** `getState()` returns `{ currentSection: 'gallery', scrollProgress: 0.5 }`

#### Scenario: No listener notification when value unchanged
- **WHEN** `getState().currentSection` is already `'hero'` and `setState({ currentSection: 'hero' })` is called
- **THEN** no subscribed listeners are invoked

#### Scenario: Listener notified when at least one field changes
- **WHEN** `setState({ scrollProgress: 0.8 })` changes an existing field value
- **THEN** all active listeners are called once with the updated state

#### Scenario: viewport field uses field-level equality
- **WHEN** `setState({ viewport: { width: 1440, height: 900 } })` is called and width/height are unchanged from current state
- **THEN** no listeners are notified

#### Scenario: Re-entrant setState is queued, not dropped
- **WHEN** a listener calls `setState(...)` during a dispatch loop
- **THEN** the nested update is applied and listeners are notified after the current dispatch loop completes

---

### Requirement: Subscribe to state changes
The module SHALL export a `subscribe` function with two overloads.

**Overload 1** accepts a full-state listener called on every state change.

**Overload 2** accepts a selector and a listener; the listener is only called when the selector's return value changes (`===`).

Both overloads return an `UnsubscribeFn`.

#### Scenario: Full-state listener receives updated state
- **WHEN** a listener is registered via `subscribe(listener)` and `setState({ scrollProgress: 0.25 })` is called
- **THEN** the listener is called with the new state containing `scrollProgress: 0.25`

#### Scenario: Selector listener fires only on selected value change
- **WHEN** `subscribe((s) => s.currentSection, handler)` is registered and `setState({ scrollProgress: 0.5 })` is called without changing `currentSection`
- **THEN** `handler` is NOT called

#### Scenario: Selector listener fires when selected value changes
- **WHEN** `subscribe((s) => s.currentSection, handler)` is registered and `setState({ currentSection: 'gallery' })` is called
- **THEN** `handler` is called with `('gallery', <previous value>)`

#### Scenario: Unsubscribe stops future notifications
- **WHEN** a listener is registered, the returned unsubscribe function is called, and `setState(…)` is subsequently called
- **THEN** the listener is NOT called after unsubscription

#### Scenario: Multiple listeners can coexist
- **WHEN** two listeners are registered and state changes
- **THEN** both listeners are called

---

### Requirement: Reset state and listeners
The module SHALL export a `reset()` function that restores state to initial values and clears all registered listeners.

#### Scenario: State is restored after reset
- **WHEN** `setState({ currentSection: 'hero' })` has been called and then `reset()` is called
- **THEN** `getState()` returns the initial state `{ currentSection: null, scrollProgress: 0 }`

#### Scenario: Listeners are cleared after reset
- **WHEN** a listener is registered and `reset()` is called, then `setState(...)` is called
- **THEN** the listener is NOT called

---

### Requirement: TypeScript type definitions
The module SHALL export the following types from `types.ts`:
- `GlobalState` — shape of the state object
- `StateListener` — `(state: GlobalState) => void`
- `StateSelector<T>` — `(state: GlobalState) => T`
- `SetStateFn` — `(partial: Partial<GlobalState>) => void`
- `UnsubscribeFn` — `() => void`

#### Scenario: Types resolve without error
- **WHEN** a consumer imports any of the above types from the module
- **THEN** TypeScript resolves each type without error and provides autocomplete for all fields

#### Scenario: Selector overload infers types correctly
- **WHEN** `subscribe((s) => s.scrollProgress, (newVal) => { })` is called
- **THEN** TypeScript infers `newVal` as `number` without a cast
