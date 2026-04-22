## ADDED Requirements

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
- `uInfluenceRadius` (float) — radius of effect in UV space (author-configurable, default `0.6`).
- `uMaxShift` (float) — maximum channel shift in UV space (author-configurable, default `0.008`).
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

#### Scenario: Outward pixels blend toward cyan, inward pixels blend toward violet

- **WHEN** `shiftMag > 0` and a pixel is outside the pointer position
- **THEN** the outward (green) sample SHALL blend 16% toward a cyan tint `(0.24, 0.82, 1.28)`
- **AND** the inward (blue) sample SHALL blend 16% toward a violet tint `(0.88, 0.12, 0.68)`
- **AND** the tint factor `t = distFactor × uEnergy` so tinting is zero at the pointer and zero when stationary

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

### Requirement: Render loop renders every frame; RGB-shift effect is a no-op when energy is negligible

The immersive scene frame callback SHALL call `composer.render()` every frame to ensure textures remain visible (e.g. on first load and when stationary). The RAF loop SHALL NOT be cancelled.

When `scrollEnergy < 0.001`, the `RadialRGBShiftPass` uniform `uEnergy` SHALL be set to `0`, making the pass a transparent copy with no visual chromatic effect.

When `scrollEnergy >= 0.001`, `uEnergy` is updated to the live value and the full RGB-shift effect is applied.

#### Scenario: composer.render() called every frame

- **WHEN** the grid has been stationary for several frames (`scrollEnergy = 0`)
- **THEN** `composer.render()` SHALL still be called each frame so the canvas remains up to date
- **AND** `uEnergy` SHALL be `0`, so the RGB-shift pass outputs the unmodified render

#### Scenario: Rendering resumes immediately on new scroll input

- **WHEN** `scrollEnergy` rises above `0.001` after a stationary period
- **THEN** `composer.render()` SHALL be called in that frame without any extra initialisation
- **AND** the full chromatic aberration effect SHALL be visible
