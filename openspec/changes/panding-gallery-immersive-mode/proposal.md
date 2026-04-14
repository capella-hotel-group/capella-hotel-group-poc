## Why

The panding-gallery block currently renders its image grid exclusively as an HTML/CSS layout. Adding an optional Three.js immersive mode unlocks GPU-accelerated plane rendering, per-vertex deformation tied to scroll energy, and a radial RGB-shift post-processing effect — creating a visually striking experience that differentiates the gallery on campaign pages while preserving the existing DOM-based path for authors who need it.

## What Changes

- Add an `immersiveMode` boolean toggle to the `panding-gallery` AEM model (UE field), defaulting to `false`.
- When `immersiveMode` is `false`, the block behaves exactly as today (no code-path changes).
- When `immersiveMode` is `true`, after Phase 2 activation:
  - A Three.js `WebGLRenderer` + `Scene` + `OrthographicCamera` overlay is mounted over the block.
  - Each grid cell is replaced by a `PlaneGeometry(w, h, 8, 8)` mesh textured with the cell's image; mesh positions are calculated to match the DOM layout pixel-for-pixel.
  - Two configurable parameters are exposed in the AEM model: `deformRadius` (distance from pointer within which vertices are displaced) and `deformStrength` (maximum vertex displacement magnitude).
  - During scroll-motion updates, each vertex of each plane is displaced along Z proportional to its proximity to the pointer (within `deformRadius`) and to the current scroll energy magnitude — vertices closer to the pointer are displaced less, those farther are displaced more, capping at `deformStrength × energyNormalised`.
  - A custom post-processing pass (`RadialRGBShiftPass`) samples each output pixel's distance from the pointer's clip-space position and applies: green channel shifted outward (away from pointer) and blue channel shifted inward (toward pointer) along the radial direction, with shift magnitude = `maxRGBShift × (distance / influenceRadius) × energyNormalised`; the red channel is unmodified.
  - The Three.js canvas is sized to the block's bounding rect and kept in sync via `ResizeObserver`.

## Capabilities

### New Capabilities

- `panding-gallery-immersive-mode`: Top-level toggle and lifecycle — Three.js canvas mount/unmount, camera-to-DOM mapping, resize sync, and co-existence with existing scroll-motion controller.
- `panding-gallery-threejs-planes`: Per-cell `PlaneGeometry(w, h, 8, 8)` meshes matching DOM layout; texture loading from existing `<img>` elements; per-frame position sync with scroll-motion offsets.
- `panding-gallery-vertex-deform`: Per-vertex displacement driven by pointer proximity, `deformRadius`, `deformStrength`, and current scroll energy.
- `panding-gallery-rgb-shift-pass`: Custom post-processing pass implementing radial RGB channel separation (green out / blue in) scaled by energy and pixel-to-pointer distance.

### Modified Capabilities

- `panding-gallery-two-phase`: Phase 2 activation must branch on the `immersiveMode` flag — when enabled, it additionally initialises the Three.js scene after the scroll-motion controller is ready.

## Impact

- **`src/blocks/panding-gallery/panding-gallery.ts`** — reads new `immersiveMode` flag from the config row; passes it to Phase 2 loader.
- **`src/blocks/panding-gallery/_panding-gallery.json`** — adds `immersiveMode` checkbox + `deformRadius` / `deformStrength` number fields.
- **`src/blocks/panding-gallery/scroll-motion.ts`** — exposes current scroll energy (magnitude of velocity vector) as a public getter for the Three.js scene to consume.
- **New files**: `immersive-scene.ts` (Three.js scene + plane management), `vertex-deform.ts` (deformation logic), `rgb-shift-pass.ts` (post-processing shader), each lazily imported on Phase 2 when immersive mode is on.
- **Dependencies**: Three.js (`three`) — already bundled in the project (`chunks/three.js`). EffectComposer / ShaderPass from `three/examples/jsm/postprocessing/` — to be dynamically imported with Three.js.
- No changes to existing block CSS, the static grid (Phase 1), or any other block.
