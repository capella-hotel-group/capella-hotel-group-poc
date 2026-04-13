## Why

Three targeted fixes for the lighting-interaction block's advance mode: an opt-in flag to control whether the headline canvas-texture interaction is active, a font-resolution bug that causes text on the canvas to render at the wrong size, and a visual quality improvement that replaces the "waving" decor animation with a physically accurate rotation model.

## What Changes

- Add `headlineInteraction?: boolean` flag to `SceneConfig`; creating the headline plane (and hiding DOM text) only occurs when the flag is `true`. Default behaviour changes to **no headline plane**, preserving the DOM text as-is.
- Fix `getTextRenderInfo` to traverse to the deepest text-bearing leaf element before calling `getComputedStyle`, ensuring the correct `fontSize` / `fontFamily` / `fontWeight` is read for canvas rendering.
- Replace the per-vertex sinusoidal wave in `updateDecorLayer` with a rigid-body rotation model: all vertices share a single frame angle `θ = rotAmplitude × sin(advAngle + phaseOffset)` and each vertex is displaced by rotating its offset vector `(ax, ay)` from the anchor — producing the "tree branch" feel where angular displacement increases with distance.
- Remove `phaseScale` and `velocityScale` from `UpdateDecorLayerParams` and the call sites (no longer needed in the rotation model).

## Capabilities

### New Capabilities
- `headline-interaction-flag`: Guards headline plane creation behind `SceneConfig.headlineInteraction`; replaces the unconditional "always create if elements exist" behaviour.

### Modified Capabilities
- `lighting-interaction-advance-mode`: Decor animation model changes from wave to rotation; `UpdateDecorLayerParams` interface drops `phaseScale` / `velocityScale`.

## Impact

- `src/blocks/lighting-interaction/scene-animation.ts` — `UpdateDecorLayerParams` interface + `updateDecorLayer` rewrite
- `src/blocks/lighting-interaction/scene-loader.ts` — `getTextRenderInfo` helper, leaf-element traversal
- `src/blocks/lighting-interaction/scene.ts` — `SceneConfig` interface, headline plane guard, `updateDecorLayer` call sites (remove two params)
