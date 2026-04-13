## 1. CMS Model

- [x] 1.1 Add `advance` boolean field to `_lighting-interaction.json` (component `checkbox`, label "Advance Mode")
- [x] 1.2 Add `decoration-left` image reference field to the model
- [x] 1.3 Add `decoration-right` image reference field to the model
- [x] 1.4 Add `foreground` image reference field to the model
- [x] 1.5 Run `npm run build:json` and verify the four new fields appear in `component-models.json`

## 2. Block Decorator

- [x] 2.1 In `lighting-interaction.ts`, detect the `advance` flag from the first cell of the fourth content row (boolean text `"true"`)
- [x] 2.2 Read and extract `decorLeftUrl`, `decorRightUrl`, `foregroundUrl` from rows 4–6 (picture elements), using `createOptimizedPicture` where available
- [x] 2.3 Pass the new fields into `SceneConfig`: `advance`, `decorLeftUrl`, `decorRightUrl`, `foregroundUrl`

## 3. SceneConfig Type Update

- [x] 3.1 Extend the `SceneConfig` interface in `scene.ts` with `advance?: boolean`, `decorLeftUrl?: string`, `decorRightUrl?: string`, `foregroundUrl?: string`

## 4. Background Geometry in Advance Mode

- [x] 4.1 Replace the hardcoded `PlaneGeometry(2, 2, 64, 64)` with a variable that is `PlaneGeometry(2, 2, 4, 4)` when `config.advance` is `true`, `PlaneGeometry(2, 2, 64, 64)` otherwise
- [x] 4.2 Skip the vertex displacement loop and spring-back loop for the background plane when `config.advance` is `true`

## 5. Advance Animation Constants

- [x] 5.1 Add named `const` group in `scene.ts` for advance mode: `ADVANCE_SIN_AMPLITUDE`, `ADVANCE_SIN_FREQ`, `ADVANCE_PHASE_SCALE`, `ADVANCE_DECOR_VELOCITY_SCALE`, `ADVANCE_FG_AMPLITUDE`, `ADVANCE_POINTER_STRENGTH` with sensible initial values documented in comments

## 6. Overlay Plane Loading

- [x] 6.1 Create helper `loadOverlayPlane(url, scene, aspect)` inside `scene.ts` that loads a texture (transparent PNG), creates a `MeshBasicMaterial` with `transparent: true`, builds a `PlaneGeometry` scaled to aspect, adds the mesh to the scene, and returns `{ mesh, restX, restY, restZ, dispX, dispY, vertCount }`
- [x] 6.2 In `initScene()`, when `config.advance` is `true`, call the helper for each defined overlay URL (`decorLeftUrl`, `decorRightUrl`, `foregroundUrl`) — skipping undefined URLs
- [x] 6.3 Ensure overlay textures use `SRGBColorSpace` and `object-fit: cover` UV setup identical to the background texture

## 7. Sin-Loop Animation — Decoration Planes

- [x] 7.1 Initialise a shared `let advAngle = 0` accumulator outside the animation loop
- [x] 7.2 In the animation loop, increment `advAngle` by `ADVANCE_SIN_FREQ` each frame (dt-independent first pass; can refine with clock later)
- [x] 7.3 For each decoration mesh (left anchor `(-1, 0)`, right anchor `(1, 0)`), compute per-vertex displacement: `dist = distance(restX[i], restY[i], anchorX, anchorY)`, `dispY[i] = sin(advAngle + dist * ADVANCE_PHASE_SCALE) * ADVANCE_SIN_AMPLITUDE * dist * ADVANCE_DECOR_VELOCITY_SCALE`
- [x] 7.4 Apply computed `dispY` to `posAttr` and set `posAttr.needsUpdate = true` for both decoration meshes

## 8. Sin-Loop Animation — Foreground Plane

- [x] 8.1 At init time, allocate a `fgSeeds` Float32Array of length `fgVertCount` populated with `Math.random() * Math.PI * 2` per vertex
- [x] 8.2 In the animation loop, for each foreground vertex compute `dispX[i] = sin(advAngle + fgSeeds[i]) * ADVANCE_FG_AMPLITUDE`
- [x] 8.3 Apply computed `dispX` to `posAttr.setX(i, restX[i] + dispX[i])` and set `posAttr.needsUpdate = true`

## 9. Pointer Velocity Overlay on Advance Planes

- [x] 9.1 After the per-plane sin animation, iterate all overlay plane verts and add `smoothDelta.x * ADVANCE_POINTER_STRENGTH` to `dispX[i]` and `smoothDelta.y * ADVANCE_POINTER_STRENGTH` to `dispY[i]`
- [x] 9.2 Ensure pointer influence is applied AFTER the sin displacement so it stacks additively

## 10. Resize Handling

- [x] 10.1 In the `ResizeObserver` callback, update `plane.scale.x = newAspect` and `updateCoverUV(newAspect)` for each overlay mesh (same logic as the background plane)

## 11. Cleanup

- [x] 11.1 Ensure `cleanupScene()` cancels the animation frame and removes the pointer listener regardless of advance mode (no changes needed if shared path; verify)

## 12. Verification

- [x] 12.1 Smoke-test non-advance page: block activates on click, background deforms on pointer move — no regression
- [x] 12.2 Smoke-test advance mode: all three overlay images load and animate; background is static
- [x] 12.3 Verify partial overlay (only two images authored) — no console errors, two planes animate correctly
- [x] 12.4 Run `npm run lint` and `npm run build` — no type errors or lint violations
