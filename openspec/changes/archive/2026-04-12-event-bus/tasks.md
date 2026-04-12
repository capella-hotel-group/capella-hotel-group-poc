## 1. Implement the EventBus utility

- [x] 1.1 Create `src/utils/event-bus/` folder with `index.ts`, `types.ts`, and `README.md`
- [x] 1.2 Define `type Handler = (payload: unknown) => void` and export `EventMap`, `EventName`, `PayloadOf` from `types.ts`
- [x] 1.3 Export `on<E extends EventName>(eventName: E, handler): void` in `index.ts` — lazily creates the Set on first subscription for a given event name
- [x] 1.4 Export `off<E extends EventName>(eventName: E, handler): void` — uses optional chaining; safe if event name has no listeners
- [x] 1.5 Export `emit<E extends EventName>(eventName: E, payload?): void` — iterates listeners with `forEach`; safe if no listeners exist
- [x] 1.6 Add usage example and debug instructions in `README.md` and JSDoc comments in `index.ts`

## 2. Validate

- [x] 2.1 Run `npm run lint` — confirm no new ESLint or Stylelint errors introduced
- [x] 2.2 Run `npm run build` — confirm TypeScript type-check (`tsc --noEmit`) passes with no new errors
