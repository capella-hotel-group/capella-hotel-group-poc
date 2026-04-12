import type { EventName, Handler, PayloadOf } from './types';

export type { EventMap } from './types';

const listeners = new Map<string, Set<Handler>>();

function isDebug(): boolean {
  try {
    return localStorage.getItem('debug:events') === 'true';
  } catch {
    return false;
  }
}

/**
 * Subscribe to an event.
 *
 * @example
 *   on('section:enter', ({ index }) => console.log(index));
 */
export function on<E extends EventName>(
  eventName: E,
  handler: (payload: PayloadOf<E & string>) => void,
): void {
  const key = eventName as string;
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  (listeners.get(key) as Set<Handler>).add(handler as Handler);
}

/**
 * Remove a previously registered handler.
 *
 * @example
 *   off('section:enter', handleEnter);
 */
export function off<E extends EventName>(
  eventName: E,
  handler: (payload: PayloadOf<E & string>) => void,
): void {
  listeners.get(eventName as string)?.delete(handler as Handler);
}

/**
 * Emit an event. Safe to call when no listeners exist.
 *
 * @example
 *   emit('section:enter', { index: 2 });
 */
export function emit<E extends EventName>(
  eventName: E,
  payload?: PayloadOf<E & string>,
): void {
  const key = eventName as string;
  if (isDebug()) {

    console.debug(`[EventBus] ${key}`, payload ?? '(no payload)');
  }
  listeners.get(key)?.forEach((handler) => handler(payload));
}

/**
 * Returns a snapshot of all registered event names and their listener counts.
 * Useful for debugging in the browser console:
 *   console.table(getRegisteredEvents())
 */
export function getRegisteredEvents(): Record<string, number> {
  const result: Record<string, number> = {};
  listeners.forEach((handlers, name) => {
    result[name] = handlers.size;
  });
  return result;
}
