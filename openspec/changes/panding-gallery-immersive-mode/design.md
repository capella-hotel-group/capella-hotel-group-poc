## Context

The `panding-gallery` block currently runs a two-phase loading strategy: Phase 1 produces a static HTML/CSS grid, Phase 2 dynamically imports `scroll-motion.ts` and starts a JS-driven infinity-scroll controller. All rendering is DOM-based (`translate` transforms on columns and items).

The `lighting-interaction` block demonstrates the project's established pattern for Three.js overlays: `OrthographicCamera` with pixel-exact frustum sizing, `WebGLRenderer` mounted on a `<canvas>` over the block, and dynamic imports keyed on user interaction to keep initial bundle size small.

Three.js (`^0.183.2`) is already a project dependency and is chunk-split as `chunks/three.js`. `EffectComposer` / `ShaderPass` from `three/examples/jsm/postprocessing/` are available but not yet used; they ship as part of the three package and will be dynamically imported alongside the scene.

## Goals / Non-Goals

**Goals:**

- Add a boolean `immersiveMode` UE toggle that authors can enable per-block instance.
- When `false` (default), zero code-path changes — existing behaviour is unchanged.
- When `true`, mount a Three.js rendering layer that pixel-matches the DOM grid and adds vertex deformation + radial RGB-shift post-processing driven by live scroll energy.
- Keep Phase 1 (static grid) unchanged and accessible in both modes.
- Follow the project's lazy-import pattern: all Three.js code is loaded only when Phase 2 activates with `immersiveMode = true`.

**Non-Goals:**

- Replacing the scroll-motion controller — the Three.js scene reads scroll state from it, but does not replicate its scroll logic.
- Supporting `immersiveMode` on mobile/touch (interaction is pointer/wheel-only, same as existing scroll motion).
- CSS-level animation fallback for browsers without WebGL.
- Supporting `inputMode: pointer` combined with `immersiveMode` in the initial implementation.

## Decisions

### Decision 1: Canvas overlay — DOM grid stays, canvas sits on top

**Choice**: When immersive mode activates, the HTML column grid is hidden via `visibility: hidden` (not `display: none`), and a `<canvas>` absolutely positioned over the block is inserted before the grid.

**Rationale**: Keeps Phase 1's static render valid for UE editing and graceful degradation. `visibility: hidden` preserves layout dimensions that the Three.js resize logic depends on. If WebGL context creation fails, restoring `visibility: visible` falls back to the working DOM grid without extra logic.

**Alternative considered**: Replace column children with a canvas, re-parsing images from stored references. Rejected because it breaks the Phase 1 accessibility contract and complicates cleanup.

---

### Decision 2: OrthographicCamera with pixel-space frustum

**Choice**: Camera left/right = `±blockWidth/2`, top/bottom = `±blockHeight/2`, near/far = `[-1000, 1000]`. One Three.js world unit = one CSS pixel. Plane sizes and positions map directly to `offsetLeft`, `offsetTop`, `offsetWidth`, `offsetHeight` values.

**Rationale**: Matches `lighting-interaction`'s camera pattern, eliminates all projection math from plane placement code, and keeps the vertex deformation radius unit (CSS pixels) interpretable by authors.

**Alternative considered**: Normalised device coordinates (NDC) space. Rejected because mixed pixel/NDC conversions would complicate per-vertex distance calculations and resize handling.

---

### Decision 3: Per-plane geometry — `PlaneGeometry(w, h, 8, 8)` CPU-side deformation

**Choice**: Each visible grid cell gets its own `PlaneGeometry`. Vertex positions are mutated in JS on the `position` BufferAttribute each frame; `needsUpdate = true` is set afterwards.

**Rationale**: 81 vertices per plane × up to 20 cells = 1 620 vertex updates per frame — well within JS budget for 60 fps on desktop. Avoids the complexity of a custom vertex shader uniform array, and stays consistent with the displacement pattern already used in `lighting-interaction`'s `scene-animation.ts`.

**Alternative considered**: Custom GLSL vertex shader with pointer/energy uniforms. Rejected for initial implementation due to added complexity; can be adopted as a follow-up optimisation.

---

### Decision 4: Scroll energy exposed as a public getter on `ScrollMotionController`

**Choice**: Add `get scrollEnergy(): number` to `ScrollMotionController`. The value is `Math.tanh(Math.hypot(dx, dy) / ENERGY_SCALE)` where `ENERGY_SCALE = 15`, producing a smooth 0→1 range.

**Rationale**: The Three.js scene needs a normalised scalar each frame. Exposing it on the controller is the minimal surface area change; the Three.js scene module simply reads `controller.scrollEnergy`.

**Alternative considered**: Pass a mutable `{ energy: number }` ref object at construction. More complex handshake with no benefit.

---

### Decision 5: Post-processing with `EffectComposer` + `ShaderPass`

**Choice**: Use `EffectComposer`/`ShaderPass` from `three/examples/jsm/postprocessing/` for the RGB-shift pass. The pass is added to the composer; when `scrollEnergy < threshold` the pass uniform `uEnergy` is set to `0` (pass becomes a no-op copy) rather than being removed from the composer.

**Rationale**: Standard Three.js post-processing chain; `EffectComposer` manages render targets automatically and integrates cleanly with `resize`. Avoids manual framebuffer management.

**Alternative considered**: Manual render-to-texture + full-screen quad. More control, but significantly more boilerplate with no UX difference.

---

### Decision 6: New files, minimal changes to existing modules

New files for the immersive path:

- `src/blocks/panding-gallery/immersive-scene.ts` — canvas mount, camera, plane creation, per-frame loop.
- `src/blocks/panding-gallery/vertex-deform.ts` — deformation math (pure function, no Three.js import; takes `BufferGeometry` reference).
- `src/blocks/panding-gallery/rgb-shift-pass.ts` — `ShaderPass` subclass with GLSL and uniform API.

Minimal changes to existing files:

- `scroll-motion.ts` — add `scrollEnergy` getter + expose `dx`/`dy` as last-frame values.
- `panding-gallery.ts` — read `immersiveMode` from config row, pass to Phase 2 activator.
- `_panding-gallery.json` — add `immersiveMode` checkbox + `deformRadius` + `deformStrength` number fields.

## Risks / Trade-offs

[WebGL context limit (browser allows ~8–16 simultaneous contexts)] → Mitigation: the scene is only created on Phase 2 activation (user click), and the renderer is destroyed on `cleanup()`. Multiple panding-gallery instances on a page will not all activate simultaneously in normal usage.

[Plane position drift if `totalColumnHeight` changes post-resize while immersive is active] → Mitigation: `ResizeObserver` in `immersive-scene.ts` re-snaps all plane base positions from the live DOM geometry after each resize, same frame.

[`three/examples/jsm` import path may change between Three.js patch versions] → Mitigation: version is pinned in package.json; JSM path is verified to exist at `^0.183.2`.

[`EffectComposer` copies the render target every frame even when energy ≈ 0] → Mitigation: when `scrollEnergy < 0.001` the scene skips the RAF tick entirely (early return), stopping the render loop; it resumes on the next non-zero energy frame via the scroll-motion callback.

## Migration Plan

1. Update `_panding-gallery.json` + run `npm run build:json` to merge new model fields.
2. Implement `scroll-motion.ts` changes (energy getter).
3. Implement `rgb-shift-pass.ts`, `vertex-deform.ts`, `immersive-scene.ts` (new files).
4. Update `panding-gallery.ts` to wire `immersiveMode` flag.
5. Verify in dev server (`npm run start`) with `immersiveMode` toggled both ways.
6. No deployment migration needed — `immersiveMode` defaults to `false`; existing authored content is unaffected.
