import type { GlobalState, SetStateFn, StateListener, StateSelector, UnsubscribeFn } from './types';

export type { GlobalState, StateListener, StateSelector, SetStateFn, UnsubscribeFn };

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE: GlobalState = {
  // scrollProgress: 0,
  // currentSection: null,
  testCounter: 0,
  viewport: {
    width: window.innerWidth,
    height: window.innerHeight,
  },
};

// ─── Module-level closure ─────────────────────────────────────────────────────

let state: GlobalState = { ...INITIAL_STATE };
const listeners = new Set<StateListener>();

/** Guards against recursive dispatch; re-entrant setState calls are deferred. */
let notifying = false;
let hasPending = false;

// ─── Private helpers ──────────────────────────────────────────────────────────

function viewportChanged(a: GlobalState['viewport'], b: GlobalState['viewport']): boolean {
  if (a === b) return false;
  if (a == null || b == null) return true;
  return a.width !== b.width || a.height !== b.height;
}

function fieldsChanged(prev: GlobalState, partial: Partial<GlobalState>): boolean {
  return (Object.keys(partial) as Array<keyof GlobalState>).some((key) => {
    if (key === 'viewport') return viewportChanged(prev.viewport, partial.viewport);
    return prev[key] !== partial[key];
  });
}

function notify(): void {
  notifying = true;
  const snapshot = { ...state };
  try {
    for (const listener of [...listeners]) {
      listener(snapshot);
    }
  } finally {
    notifying = false;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns a shallow copy of the current global state.
 * Callers must not mutate the returned object.
 */
export function getState(): GlobalState {
  return { ...state };
}

/**
 * Shallow-merges `partial` into the current state.
 * Listeners are only notified when at least one field value changes.
 * Re-entrant calls (from inside a listener) are queued and applied after
 * the current dispatch loop completes.
 */
export const setState: SetStateFn = (partial) => {
  if (!fieldsChanged(state, partial)) return;
  state = { ...state, ...partial };

  if (notifying) {
    hasPending = true;
    return;
  }

  notify();

  // Drain deferred updates: re-notify once per batch of re-entrant setState calls.
  while (hasPending) {
    hasPending = false;
    notify();
  }
};

/**
 * Subscribe to state changes.
 *
 * **Overload 1** — full state listener (simple cases):
 * ```ts
 * subscribe((state) => { console.log(state.currentSection); });
 * ```
 *
 * **Overload 2** — selector + listener:
 * ```ts
 * subscribe(
 *   (state) => state.currentSection,
 *   (newVal, oldVal) => animate(newVal),
 * );
 * ```
 * The listener is only called when the selector's return value changes (`===`).
 *
 * Both overloads return an unsubscribe function.
 */
export function subscribe(listener: StateListener): UnsubscribeFn;
export function subscribe<T>(selector: StateSelector<T>, listener: (newVal: T, oldVal: T) => void): UnsubscribeFn;
export function subscribe<T>(
  selectorOrListener: StateSelector<T> | StateListener,
  maybeListener?: (newVal: T, oldVal: T) => void,
): UnsubscribeFn {
  if (maybeListener !== undefined) {
    const selector = selectorOrListener as StateSelector<T>;
    let prev = selector({ ...state });
    const wrapped: StateListener = (newState) => {
      const next = selector(newState);
      if (next !== prev) {
        const old = prev;
        prev = next;
        maybeListener(next, old);
      }
    };
    listeners.add(wrapped);
    return () => listeners.delete(wrapped);
  }

  const listener = selectorOrListener as StateListener;
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Resets state to initial values and removes all listeners.
 *
 * **Use only in tests or Vite HMR handlers — not in production block code.**
 */
export function reset(): void {
  state = { ...INITIAL_STATE };
  listeners.clear();
  hasPending = false;
  notifying = false;
}
