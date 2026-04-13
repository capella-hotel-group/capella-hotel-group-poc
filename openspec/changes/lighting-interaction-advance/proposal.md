## Why

The current `lighting-interaction` block animates only the background plane in response to pointer movement, which limits creative expression. Designers need a richer layered composition where decorative and foreground elements animate with their own continuous motion curves (sin loops) while still reacting to pointer velocity — without changing how the block works for authors who haven't opted in.

## What Changes

- Add an `advance` boolean toggle field to the block's CMS model so authors can explicitly opt into the new behaviour.
- In **advance mode**:
  - Three new image fields are introduced: `decoration-left`, `decoration-right`, and `foreground`.
  - The background plane is reduced to minimal geometry (it no longer deforms) so it acts as a static layer.
  - Three additional Three.js planes are created and stacked above the background, each with its own animation:
    - **Decoration Left**: rotates around its left-center anchor using an accumulated sin loop; vertices further from the anchor rotate faster.
    - **Decoration Right**: mirrors Decoration Left but pivots from right-center.
    - **Foreground**: translates only on the X axis via a sin function; each segment row receives a phase-seed offset creating a wave undulation effect.
  - All three overlay planes accumulate an additional displacement driven by pointer velocity, layered on top of their intrinsic animation.
- Animation tuning constants (sin amplitude, frequency, anchor influence radius, pointer strength) are hardcoded but exposed as named constants for future authoring.
- Without the `advance` flag the block behaves exactly as today — no regression.

## Capabilities

### New Capabilities

- `lighting-interaction-advance-mode`: Multi-layer advance animation mode for the lighting-interaction block — new image fields, sin-loop animations per layer, and pointer-velocity overlay that activates only when the `advance` flag is set.

### Modified Capabilities

<!-- None — existing behaviour is unchanged when the flag is absent -->

## Impact

- `src/blocks/lighting-interaction/lighting-interaction.ts` — reads the new `advance` flag and three extra image rows; passes new config to `initScene`.
- `src/blocks/lighting-interaction/scene.ts` — new `SceneConfig` fields; logic branches on `advance` to build overlay planes and run the multi-layer animation loop. Background geometry segments reduced in advance mode.
- `src/blocks/lighting-interaction/_lighting-interaction.json` — four new fields added to the model (`advance`, `decoration-left`, `decoration-right`, `foreground`).
- No new npm dependencies; uses existing Three.js import.
