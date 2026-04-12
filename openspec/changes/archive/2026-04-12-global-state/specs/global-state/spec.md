## ADDED Requirements

### Requirement: Read current global state
The module SHALL export a `getState()` function that returns the current `GlobalState` object synchronously.

#### Scenario: Initial state before any mutations
- **WHEN** `getState()` is called before any `setState()` call
- **THEN** it returns `{ currentSection: null, scrollProgress: 0, viewport: undefined }`

#### Scenario: State reflects latest mutation
- **WHEN** `setState({ currentSection: 'hero' })` has been called
- **THEN** `getState().currentSection` equals `'hero'`

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

---

### Requirement: Subscribe to state changes
The module SHALL export a `subscribe(listener)` function that registers a callback invoked whenever state changes.

#### Scenario: Listener receives updated state
- **WHEN** a listener is registered via `subscribe` and `setState({ scrollProgress: 0.25 })` is called
- **THEN** the listener is called with the new state containing `scrollProgress: 0.25`

#### Scenario: Unsubscribe stops future notifications
- **WHEN** a listener is registered, the returned unsubscribe function is called, and `setState(…)` is subsequently called
- **THEN** the listener is NOT called after unsubscription

#### Scenario: Multiple listeners can coexist
- **WHEN** two listeners are registered and state changes
- **THEN** both listeners are called

---

### Requirement: GlobalState type definition
The module SHALL export a `GlobalState` TypeScript type with fields: `currentSection` (`string | null`), `scrollProgress` (`number`, range 0–1), and `viewport` (optional `{ width: number; height: number }`).

#### Scenario: Type exported from types.ts
- **WHEN** a consumer imports `GlobalState` from the module
- **THEN** TypeScript resolves the type without error and provides autocomplete for all fields

---

### Requirement: Listener and setter type definitions
The module SHALL export `StateListener` (a function type `(state: GlobalState) => void`) and `SetStateFn` (a function type `(partial: Partial<GlobalState>) => void`) from `types.ts`.

#### Scenario: Types usable in block declarations
- **WHEN** a block author declares `const handler: StateListener = (state) => { … }`
- **THEN** TypeScript infers the `state` parameter as `GlobalState` without a cast
