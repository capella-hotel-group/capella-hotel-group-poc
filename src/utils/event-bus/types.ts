/**
 * Extend this interface via declaration merging in any block file
 * to register typed event names and their payload shapes.
 *
 * @example
 *   // menus.ts
 *   declare module '@/utils/event-bus' {
 *     interface EventMap {
 *       'menus:ready': { block: HTMLElement };
 *     }
 *   }
 */
export interface EventMap {}

export type KnownEvent = keyof EventMap;

/** Accepts declared event names with autocomplete, plus any arbitrary string. */
export type EventName = KnownEvent | (string & {});

/** Resolves to the declared payload type for known events, or `unknown` otherwise. */
export type PayloadOf<E extends string> = E extends KnownEvent ? EventMap[E] : unknown;

/** Internal handler signature — all handlers share a single concrete type to simplify the Map. */
export type Handler = (payload: unknown) => void;
