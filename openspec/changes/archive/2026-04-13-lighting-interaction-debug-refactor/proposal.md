## Why

The lighting-interaction advance mode was built but is difficult to iterate on: all constants live buried in a large `scene.ts` with no way to override authoring flags locally, no debug visualisations, and no way to inspect animation layers in isolation. Additionally, the `advance` CMS field uses an incorrect component type (`checkbox` instead of `boolean`), so the toggle is invisible in Universal Editor. The block's `scene.ts` has also grown to ~430 lines — it needs to be broken up before further animation work.

## What Changes

- **Fix AEM UE field type**: Replace `"component": "checkbox"` with `"component": "boolean"` in `_lighting-interaction.json` so the advance toggle actually appears in Universal Editor.
- **Add a local debug config file** (`debug-config.ts`) that exports a typed overrides object; when a field is set the value takes precedence over whatever the CMS sends. Allows toggling advance mode, hiding layers, enabling wireframe and velocity-vector debug without touching authored content.
- **Layer visibility and wireframe toggles**: Per-layer booleans in `debug-config.ts` that hide/show decor-left, decor-right, foreground planes and optionally switch their material to wireframe.
- **Pointer velocity vector debug**: An optional Canvas 2D overlay drawn on top of the WebGL canvas that draws a line from the current pointer position in the direction of `smoothDelta`, with length proportional to velocity magnitude.
- **Velocity momentum decay**: Replace the current hard-stop velocity model with a configurable exponential decay so the velocity naturally bleeds to zero after the pointer stops moving. Adds `VELOCITY_DECAY_THRESHOLD` constant to control the cutoff.
- **Refactor `scene.ts`** into focused modules: `scene-loader.ts` (texture/overlay loading), `scene-animation.ts` (per-frame update functions as pure functions), `scene-debug.ts` (debug overlay rendering), with `scene.ts` becoming a thin orchestrator that glues them together.

## Capabilities

### New Capabilities

- `scene-debug-config`: Local debug config file for overriding scene behaviour during development — advance flag, layer visibility, wireframe mode, velocity vector drawing.
- `scene-velocity-momentum`: Configurable exponential velocity decay that smoothly bleeds pointer momentum to zero instead of cutting off.
- `scene-module-split`: Decomposition of `scene.ts` into `scene-loader.ts`, `scene-animation.ts`, `scene-debug.ts` pure-function modules.

### Modified Capabilities

- `lighting-interaction-advance-mode`: AEM UE field fix (`boolean` component) and wiring to the new debug-config override.

## Impact

- `src/blocks/lighting-interaction/_lighting-interaction.json` — field type fix.
- `src/blocks/lighting-interaction/scene.ts` — **BREAKING** internal refactor: split into 4 files (scene.ts stays as entry point, 3 new sibling modules).
- `src/blocks/lighting-interaction/debug-config.ts` — new file; imported only by `scene.ts`, zero runtime cost when all fields are `undefined`.
- `src/blocks/lighting-interaction/scene-loader.ts` — new file (pure async loaders).
- `src/blocks/lighting-interaction/scene-animation.ts` — new file (pure frame-update functions).
- `src/blocks/lighting-interaction/scene-debug.ts` — new file (debug overlay drawing).
- No new npm dependencies.
