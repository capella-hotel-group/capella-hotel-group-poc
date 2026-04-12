## Context

This project uses AEM Edge Delivery Services (EDS) with TypeScript + Vite; `strictNullChecks` is on, `noUnusedParameters` is enforced (unused params must be prefixed `_`), and all cross-module imports must use the `@/*` alias. The `src/utils/` directory already exists; `constants.ts`, `helper.ts`, and `math.ts` are empty stubs, while `env.ts` contains environment helpers using module-level exports (not a class). There is currently no inter-block communication layer.

The EventBus must be a single shared instance for the lifetime of the page — but must not require explicit initialisation by any central orchestrator.

## Goals / Non-Goals

**Goals:**
- API surface: `on(eventName, handler)`, `off(eventName, handler)`, `emit(eventName, payload)`
- Support multiple independent handlers per event name
- Generic type parameter on each function (`T = unknown`) so callers get payload type safety without a centralised event registry
- `emit` must be safe when no listeners exist (no throw, no log noise)
- Module-level singleton — no class export, no `new EventBus()` at call sites
- Pure TypeScript, no runtime dependencies

**Non-Goals:**
- Event queue or replay for late subscribers
- Async/promise-based coordination
- Wildcard listeners or pattern matching on event names
- Removing all listeners for an event name at once (not needed for current use cases)
- Integration or unit tests (no test infrastructure exists in this project)

## Decisions

### Decision 1: Module-level Map singleton (not a class)

**Choice**: Export three functions that close over a module-level `Map`. Do not export a class or a class instance.

**Rationale**: Consistent with the existing `env.ts` pattern (module-level exports, no instantiation at call sites). A module-level Map is created once when the module is first imported and shared across all importers via standard ESM module caching — no singleton pattern boilerplate needed.

**Alternatives considered**: Export a `class EventBus` and a default instance — rejected because it requires consumers to know whether to import the class or the instance, and adds unused class machinery.

---

### Decision 2: `Map<string, Set<Handler>>` as internal store

**Choice**: Use a `Map` keyed by event name, with a `Set` of handlers as the value.

**Rationale**: `Map` gives O(1) keyed lookup without prototype pollution. `Set` automatically deduplicates identical handler references (prevents double-firing if a block accidentally calls `on` twice with the same function), and `Set.delete` is the correct API for `off` without needing an index.

**Alternatives considered**: Plain object with arrays — rejected; array requires `indexOf` + `splice` for removal, and accidental double-registration causes duplicate fires.

---

### Decision 3: Centralised `EventMap` interface with declaration merging

**Choice**: Export an empty `interface EventMap {}` from `types.ts`. Blocks extend it via `declare module '@/utils/event-bus' { interface EventMap { ... } }` in their own files. Each exported function uses `<E extends EventName>` where `EventName = keyof EventMap | (string & {})` and `PayloadOf<E>` resolves the payload type.

**Rationale**: Declaration merging lets each block own its event declarations without modifying the core utility. TypeScript merges all augmentations automatically, giving autocomplete on declared event names and inferred payload types across the codebase — with zero coupling between blocks. Undeclared event names still work, resolving to `unknown` payload, which keeps the API permissive while rewarding declaration.

**Alternatives considered**: Per-function generics `<T = unknown>` with no shared registry — simpler initially, but provides no cross-file autocomplete and no way to discover all registered events from types alone. Deferred to see if usage patterns warranted the upgrade; they did.

---

### Decision 4: Event naming convention: `<source>:<action>`

**Choice**: Enforce `<source>:<action>` kebab segments as the naming convention (e.g., `section:enter`, `slider:change`, `menus:ready`).

**Rationale**: Namespace prevents collisions between blocks that might use generic verbs. The colon separator is idiomatic (matches DOM `CustomEvent` conventions and common Node.js EventEmitter practices).

---

## Risks / Trade-offs

| Risk | Likelihood | Mitigation |
|---|---|---|
| Memory leak if handler references captured in closures are never `off`-ed | Low (EDS blocks don't unmount) | `off` is provided; document in inline comments |
| Cross-block coupling via event strings (naming conflicts) | Low | Convention enforced in this spec; lint rule could be added later |
| TypeScript drift if callers cast payload incorrectly | Low | Per-function generics make correct usage the path of least resistance |
