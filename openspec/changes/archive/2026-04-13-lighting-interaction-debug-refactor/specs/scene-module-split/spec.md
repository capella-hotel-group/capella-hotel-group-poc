## ADDED Requirements

### Requirement: scene.ts is split into focused sibling modules
The file `scene.ts` SHALL be refactored into four files in the same directory:
- `scene-loader.ts` — async pure functions for loading background texture and overlay planes.
- `scene-animation.ts` — pure functions for per-frame displacement calculations (advance decor, advance foreground, standard pointer displacement, spring-back).
- `scene-debug.ts` — pure function for drawing the debug overlay on a Canvas 2D context.
- `scene.ts` — thin orchestrator: imports from the above, holds cleanup state, exports `initScene` and `cleanupScene`.

#### Scenario: Public API unchanged
- **WHEN** `lighting-interaction.ts` imports `initScene` and `cleanupScene` from `./scene`
- **THEN** the block functions identically to before the refactor with no call-site changes

#### Scenario: scene-loader.ts exports pure async loaders
- **WHEN** a developer imports `loadBackgroundPlane` or `loadOverlayPlane` from `./scene-loader`
- **THEN** the functions accept only their explicit arguments (no module-level state) and return typed result objects

#### Scenario: scene-animation.ts exports pure frame-update functions
- **WHEN** a developer imports animation functions from `./scene-animation`
- **THEN** the functions accept all required state as arguments and produce no side effects other than mutating the provided typed arrays and `BufferAttribute`

#### Scenario: Build output unchanged
- **WHEN** running `npm run build`
- **THEN** all four source files are bundled into a single `chunks/scene-*.js` chunk (no new network requests compared to pre-refactor)

---

### Requirement: Animation functions in scene-animation.ts are pure
Each exported function in `scene-animation.ts` SHALL:
- Accept all inputs as parameters (no module-level mutable state reads).
- Return `void` (mutate only the passed-in `BufferAttribute` and displacement arrays).
- Be independently importable for testing without instantiating a Three.js scene.

#### Scenario: Advance decor update function signature
- **WHEN** `updateDecorLayer` is called with anchor coordinates, displacement arrays, angle, and config constants
- **THEN** it updates the provided `BufferAttribute` in-place and sets `needsUpdate = true`

#### Scenario: Standard background update function signature
- **WHEN** `updateStandardBackground` is called with pointer hit data, displacement arrays, and config constants
- **THEN** it mutates the provided displacement arrays without accessing any module-scope variable
