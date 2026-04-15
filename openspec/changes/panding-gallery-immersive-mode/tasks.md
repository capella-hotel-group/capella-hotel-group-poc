## 1. Content Model Update

- [x] 1.1 Add `immersiveMode` checkbox field (boolean, default `false`) to `src/blocks/panding-gallery/_panding-gallery.json`
- [x] 1.2 Add `deformRadius` number field (default `200`) to `_panding-gallery.json`
- [x] 1.3 Add `deformStrength` number field (default `40`) to `_panding-gallery.json`
- [x] 1.4 Run `npm run build:json` to merge model fragments into root `component-models.json`

## 2. ScrollMotionController — Energy Getter

- [x] 2.1 Store last-frame `dx`/`dy` as private properties on `ScrollMotionController`
- [x] 2.2 Add `get scrollEnergy(): number` computing `Math.tanh(Math.hypot(dx, dy) / 15)`
- [x] 2.3 Verify `scrollEnergy` returns `0` when grid is stationary and approaches `1` under fast scroll

## 3. RGB-Shift Post-Processing Pass

- [x] 3.1 Create `src/blocks/panding-gallery/rgb-shift-pass.ts` exporting `RadialRGBShiftPass extends ShaderPass`
- [x] 3.2 Write the GLSL vertex shader (pass-through UV)
- [x] 3.3 Write the GLSL fragment shader: compute `dir`, `distFactor`, `shiftMag`; sample R unchanged, G outward, B inward
- [x] 3.4 Declare uniforms: `tDiffuse`, `uPointerUV` (vec2), `uInfluenceRadius` (float, default `0.4`), `uMaxShift` (float, default `0.006`), `uEnergy` (float)
- [x] 3.5 Add `update(pointerUV: Vector2, energy: number)` helper method to `RadialRGBShiftPass`

## 4. Vertex Deformation Module

- [x] 4.1 Create `src/blocks/panding-gallery/vertex-deform.ts` exporting `applyVertexDeform(geometry, pointerWorld, deformRadius, deformStrength, scrollEnergy)`
- [x] 4.2 Implement per-vertex distance calculation (world-space XY, ignoring Z)
- [x] 4.3 Apply `proximityFactor = dist / deformRadius` for vertices within radius; `0` for vertices outside
- [x] 4.4 Set `position.z = deformStrength × proximityFactor × scrollEnergy` for each vertex
- [x] 4.5 Set `geometry.attributes.position.needsUpdate = true` after all vertices are updated
- [x] 4.6 Early-return without any mutations when `scrollEnergy < 0.001`

## 5. Immersive Scene Module

- [x] 5.1 Create `src/blocks/panding-gallery/immersive-scene.ts` exporting `ImmersiveScene` class
- [x] 5.2 Implement constructor accepting `{ block, columns, controller, deformRadius, deformStrength }` config
- [x] 5.3 Create `<canvas>` element, apply `position: absolute; inset: 0` via inline style, insert as first child of block
- [x] 5.4 Initialise `WebGLRenderer({ canvas, antialias: true, alpha: true })` with `setPixelRatio(devicePixelRatio)` and `setSize(W, H, false)`
- [x] 5.5 Create `OrthographicCamera(-W/2, W/2, H/2, -H/2, -1000, 1000)` with `position.z = 1`
- [x] 5.6 Create `Scene`, `TextureLoader`; for each column item create `PlaneGeometry(cellW, cellH, 8, 8)`, load texture, create `MeshBasicMaterial({ map })`, create `Mesh` and add to scene
- [x] 5.7 Compute and set each mesh's base position from DOM `offsetLeft`/`offsetTop` using the pixel-space formula from `panding-gallery-threejs-planes` spec
- [x] 5.8 Create `EffectComposer(renderer)`, add `RenderPass(scene, camera)`, add `RadialRGBShiftPass` instance
- [x] 5.9 Implement `start()` method: attach `ResizeObserver`, listen for pointer movement on block, start RAF loop
- [x] 5.10 Implement RAF callback: read scroll-motion offsets from controller, update each mesh world position (base + scroll offset), call `applyVertexDeform` for each mesh, update `RadialRGBShiftPass` uniforms, call `composer.render()` only when `scrollEnergy >= 0.001`
- [x] 5.11 Convert pointer block-relative coordinates to world-space using `pointerNDC × [blockWidth/2, blockHeight/2]` formula
- [x] 5.12 Implement `ResizeObserver` callback: `renderer.setSize`, update camera frustum and `camera.updateProjectionMatrix()`, `composer.setSize`, recompute all mesh base positions from live DOM
- [x] 5.13 Implement `cleanup()` method: cancel RAF, disconnect `ResizeObserver`, dispose all geometries and materials, dispose `WebGLRenderer`, remove canvas from DOM

## 6. Wire Immersive Mode into panding-gallery.ts

- [x] 6.1 Parse `immersiveMode` from the config row in `panding-gallery.ts` (a `"true"` string value → `boolean`)
- [x] 6.2 Parse `deformRadius` and `deformStrength` numeric values from config row (with fallbacks to `200` and `40`)
- [x] 6.3 Pass `immersiveMode`, `deformRadius`, `deformStrength` to the Phase 2 activation closure
- [x] 6.4 In Phase 2 click handler: after `ScrollMotionController.start()`, conditionally `import('./immersive-scene')` when `immersiveMode === true`
- [x] 6.5 On successful immersive init: set `columnsContainer.style.visibility = 'hidden'`; store `ImmersiveScene` reference for cleanup
- [x] 6.6 On immersive init error: reset `columnsContainer.style.visibility = ''`, remove loading class, reset `initialized = false`
- [x] 6.7 Include the `ImmersiveScene` instance in the `MutationObserver` cleanup path alongside the motion controller

## 7. Verification

- [ ] 7.1 Start dev server (`npm run start`) and verify `immersiveMode = false` (default) — grid works as before with no regressions
- [ ] 7.2 Set `immersiveMode = true` in UE or locally; click the block; verify Three.js canvas appears and planes pixel-match the original grid layout
- [ ] 7.3 Scroll the block and verify vertex deformation: vertices near pointer push up less, vertices at `deformRadius` push up more
- [ ] 7.4 Observe RGB-shift effect during scroll — green channel shifted outward, blue inward, red unchanged; effect fades when scroll stops
- [ ] 7.5 Resize the viewport and verify planes, camera, and composer all update without drift
- [ ] 7.6 Navigate away (block removed from DOM) and verify `cleanup()` is called: canvas removed, columns visibility restored, no memory leaks from dangling RAF
- [x] 7.7 Run `npm run lint` and verify zero lint errors
