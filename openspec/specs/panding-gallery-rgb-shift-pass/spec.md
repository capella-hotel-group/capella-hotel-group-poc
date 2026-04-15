## Purpose

Defines the `RadialRGBShiftPass` post-processing shader and its integration into the `panding-gallery` immersive scene's `EffectComposer` pipeline.

---

## Requirements

### Requirement: RadialRGBShiftPass implements outward-green / inward-blue radial chromatic aberration

The `RadialRGBShiftPass` SHALL be a `ShaderPass` subclass with the following GLSL fragment shader logic applied per pixel:

1. Compute the radial direction vector from the current UV to the pointer UV position: `dir = normalize(uv - uPointerUV)`. If `length(uv - uPointerUV) < 0.0001`, `dir = vec2(0.0)` (no shift at pointer center).
2. Compute the normalised distance: `distFactor = clamp(length(uv - uPointerUV) / uInfluenceRadius, 0.0, 1.0)`.
3. Compute final shift magnitude: `shiftMag = uMaxShift × distFactor × uEnergy`.
4. Sample channels:
   - Red: `texture2D(tDiffuse, uv).r` (unmodified)
   - Green: `texture2D(tDiffuse, uv + dir × shiftMag).g` (shifted **outward**, away from pointer)
   - Blue: `texture2D(tDiffuse, uv - dir × shiftMag).b` (shifted **inward**, toward pointer)
5. Output: `vec4(r, g, b, alpha_from_uv_sample)`.

Uniforms:

- `tDiffuse` (sampler2D) — the upstream render target texture (managed by `EffectComposer`).
- `uPointerUV` (vec2) — pointer position in UV space `[0, 1]²`, derived from the block-relative pointer NDC.
- `uInfluenceRadius` (float) — radius of effect in UV space (author-configurable, default `0.4`).
- `uMaxShift` (float) — maximum channel shift in UV space (author-configurable, default `0.006`).
- `uEnergy` (float) — current `scrollEnergy` value `[0, 1]`; updated every frame.

#### Scenario: Pixel exactly at pointer position has no color shift

- **WHEN** a pixel's UV equals `uPointerUV`
- **THEN** `distFactor = 0` and `shiftMag = 0`
- **AND** all three channels SHALL be sampled from the original UV with no offset

#### Scenario: Pixel at influenceRadius boundary receives maximum shift scaled by energy

- **WHEN** `distFactor = 1.0` and `uEnergy = 1.0`
- **THEN** `shiftMag = uMaxShift`
- **AND** the green channel SHALL be sampled `uMaxShift` units further from the pointer
- **AND** the blue channel SHALL be sampled `uMaxShift` units closer to the pointer

#### Scenario: Effect is zero when scrollEnergy is zero

- **WHEN** `uEnergy = 0`
- **THEN** `shiftMag = 0` for all pixels
- **AND** the output SHALL be identical to the unmodified render

#### Scenario: Green channel shifts outward, blue channel shifts inward

- **WHEN** a pixel is to the right of the pointer (`dir ≈ (1, 0)`) and `shiftMag > 0`
- **THEN** the green channel SHALL be sampled from a UV position to the **right** of the pixel's UV
- **AND** the blue channel SHALL be sampled from a UV position to the **left** of the pixel's UV

#### Scenario: Effect fades with energy as scroll decelerates

- **WHEN** scroll velocity decays over multiple frames, reducing `scrollEnergy` from `1.0` toward `0`
- **THEN** `uEnergy` uniform SHALL be updated each frame
- **AND** the visible RGB separation SHALL progressively decrease toward zero

---

### Requirement: EffectComposer integrates the RadialRGBShiftPass in the render pipeline

The immersive scene SHALL use an `EffectComposer` with two passes:

1. `RenderPass(scene, camera)` — renders the Three.js scene to a render target.
2. `RadialRGBShiftPass` — applies the chromatic aberration post-process.

The composer SHALL call `composer.setSize(width, height)` in the same `ResizeObserver` callback that updates the renderer and camera.

Every frame, the scene SHALL call `composer.render()` instead of `renderer.render()`.

#### Scenario: Resize updates composer render targets

- **WHEN** the block is resized
- **THEN** `composer.setSize(newWidth, newHeight)` SHALL be called
- **AND** the render target resolution SHALL match the new block dimensions

---

### Requirement: Render loop suspends when scrollEnergy is negligible

When `scrollEnergy < 0.001` for the current frame, the immersive scene frame callback SHALL:

1. Skip calling `composer.render()`.
2. NOT cancel the `requestAnimationFrame` loop (the loop continues checking energy).

When `scrollEnergy >= 0.001` again, rendering SHALL resume automatically in the same RAF loop.

#### Scenario: No GPU work when grid is stationary

- **WHEN** the grid has been stationary for several frames (`scrollEnergy = 0`)
- **THEN** `composer.render()` SHALL NOT be called in those frames

#### Scenario: Rendering resumes immediately on new scroll input

- **WHEN** `scrollEnergy` rises above `0.001` after a stationary period
- **THEN** `composer.render()` SHALL be called in that frame without any extra initialisation
