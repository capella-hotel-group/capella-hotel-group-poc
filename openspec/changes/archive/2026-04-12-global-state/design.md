## Context

AEM EDS blocks are isolated DOM decorators — each block calls `decorate(block)` independently with no built-in inter-block communication. The existing event-bus (`src/utils/event-bus/`) already provides a fire-and-forget pattern for side effects, but there is no way for a block to *read the current value* of shared state (e.g. "which section is active right now?"). Blocks that need this today must maintain private state and duplicate scroll / resize listeners.

## Goals / Non-Goals

**Goals:**
- Provide a single, synchronous source of truth for page-level state
- Allow any block to read state at any time via `getState()`
- Allow any block to subscribe to state changes and unsubscribe cleanly
- Keep `setState` shallow-merge only to reduce accidental full-state overwrites
- Avoid notifying listeners when nothing actually changed (shallow field equality)
- Ship with full TypeScript types for autocomplete in block authors' editors

**Non-Goals:**
- Replace the event-bus — the two utilities are complementary (state = current value; events = something happened)
- Persist state across page loads (no localStorage / sessionStorage)
- Support deep/nested state merging beyond the top-level `GlobalState` shape
- Support async reducers, middleware, or time-travel debugging
- Track per-block local state (slider index, open/closed toggles, etc.)

## Decisions

### 1. Plain closure module over a class

**Chosen:** A module-level closure (`let state = { … }`) with exported functions.

**Rationale:** A class instance introduces instantiation decisions (singleton vs. injection). A closure module *is* a singleton by Node/browser module semantics — no extra pattern needed. Simpler to tree-shake and test.

**Alternative considered:** `class GlobalStateStore` — rejected because it adds no value and requires `new` or a manual `export const store = new …` singleton.

---

### 2. `getState()` returns a shallow copy, not a reference

**Chosen:** Return `{ ...state }` — a new object each call.

**Rationale:** Returning the internal reference allows callers to mutate state without going through `setState`, silently corrupting the store and skipping listener notifications. The shallow-copy cost is negligible (5 scalar fields) and eliminates the entire class of accidental mutation bugs.

**Alternative considered:** Return the reference directly and document "don't mutate" — rejected because convention-only guarantees are too weak for a shared utility.

---

### 3. Shallow merge + shallow field equality for change detection

**Chosen:** `Object.assign({}, state, partial)` for merge; iterate `partial` keys and compare with `===` for change detection.

**Rationale:** The `GlobalState` shape is intentionally flat (one layer of nesting with `viewport` as the only nested object). Shallow comparison is O(n) on `partial` size, deterministic, and avoids the complexity of deep equality (special cases for `null`, arrays, circular refs). If `viewport` needs granular diffing later, that is a separate decision.

**Alternative considered:** JSON serialisation for equality — rejected (slower, loses `undefined`, breaks for non-JSON values).

---

### 4. Subscriber list stored in a `Set`

**Chosen:** `Set<StateListener>` for the subscriber collection.

**Rationale:** `Set.delete()` is O(1) — unsubscribe is cheap and does not require iterating/splicing an array. Iteration order is insertion order, same as `Array`. Using a snapshot copy (`[...listeners]`) during notification prevents issues if a listener unsubscribes mid-loop.

**Alternative considered:** `Array` with `splice` — rejected because O(n) delete is slightly worse and adds index-management code.

---

### 5. Listeners called synchronously on `setState`

**Chosen:** Call all listeners in the same microtask as `setState`.

**Rationale:** Blocks can update DOM immediately without a scheduler. AEM EDS blocks run in a simple waterfall model — there is no concurrent rendering that would require batching.

**Alternative considered:** `queueMicrotask` / `setTimeout(0)` batching — rejected as premature complexity.

---

### 6. Re-entrant `setState` calls are queued, not dropped or thrown

**Chosen:** A module-level `notifying` boolean guards the dispatch loop. If `setState` is called from inside a listener, the partial update is pushed onto a `pendingQueue`. After the current dispatch loop completes, the queue is drained — each queued partial triggers a normal merge + notify cycle.

**Rationale:** Silently dropping nested `setState` calls causes missed updates that are hard to debug. Throwing an error is too strict and prevents legitimate patterns (e.g. a listener that normalises state). Queuing preserves correctness: side-effecting listeners can update state without causing stack overflows.

**Alternative considered:** `notifying` flag that simply skips nested calls — rejected because it silently discards updates.

---

### 7. Field-level equality for known object-valued fields

**Chosen:** For the `viewport` field specifically, compare `width` and `height` individually rather than using `===` on the object reference. All other top-level fields use `===`.

**Rationale:** `viewport` is always set as a new object literal (`setState({ viewport: { width, height } })`), so a reference comparison would always report "changed" even when the dimensions are identical. This would cause spurious re-renders on every resize event debounce tick. Since `GlobalState` has a fixed, known shape, a targeted 2-level comparison is safe and avoids the complexity of a generic deep-equal utility.

**Implementation:** A private `fieldsChanged(prev, partial)` helper iterates `partial` keys; for the `viewport` key it delegates to a `viewportChanged(a, b)` sub-comparison.

**Alternative considered:** Generic recursive deep-equal — rejected as over-engineering for a 2-field nested object.

---

### 8. `reset()` exported for test and cleanup use cases

**Chosen:** Export a `reset()` function that restores state to the initial value and clears all listeners.

**Rationale:** In AEM EDS production, every page navigation is a full HTML reload — module state is naturally reset. But in test environments (Jest / Vitest with module caching) and during Vite HMR, the module is not re-evaluated between runs. Without `reset()`, listener leaks and stale state silently corrupt subsequent test cases. Exporting `reset()` explicitly scopes this as a non-production API and removes any ambiguity about intended usage.

**Convention:** README documents `reset()` as test/HMR-only. Block code in production SHALL NOT call it.

**Alternative considered:** Re-export the initial state constant and let callers call `setState(INITIAL_STATE)` — rejected because it does not clear listeners.

## Risks / Trade-offs

| Risk | Status |
|---|---|
| Block A calls `setState` inside a listener (re-entrant loop) | **Resolved** — Decision #6: `notifying` flag + drain queue ensures nested calls are applied after the current dispatch loop without stack overflow or dropped updates. |
| `viewport` false-positive on object reference change | **Resolved** — Decision #7: field-level equality for `viewport` compares `width`/`height` individually; no spurious notifications when dimensions are unchanged. |
| Subscriber leak on block re-decoration or in tests | **Resolved** — Decision #8: `reset()` exported for test/HMR cleanup; README explicitly documents caller responsibility for unsubscribing in production block lifecycle. |
