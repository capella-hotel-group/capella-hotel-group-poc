## 1. debug-config.ts — Add fgPointerStrength field

- [x] 1.1 In `src/blocks/lighting-interaction/debug-config.ts`, add `fgPointerStrength?: number` to the `debugConfig` type and set it to `undefined` in the default export

## 2. scene-animation.ts — Edge clamping + decor phase offset + proximity weighting + fg pointer strength

- [x] 2.1 Add `borderMask: Float32Array` to `UpdateDecorLayerParams` interface
- [x] 2.2 Add `phaseOffset: number` to `UpdateDecorLayerParams` interface
- [x] 2.3 In `updateDecorLayer`, multiply each vertex's `dispX[i]` and `dispY[i]` by `borderMask[i]` before writing to `posAttr`
- [x] 2.4 In `updateDecorLayer`, add `phaseOffset` to `advAngle` in the sin function: `Math.sin(advAngle + phaseOffset + dist * phaseScale)`
- [x] 2.5 In `updateDecorLayer`, scale the pointer contribution by proximity weight: `const proxWeight = dist / maxDist` (where `maxDist` is passed as a new param or calculated inline as `Math.sqrt(8)`). Apply as `dispX[i] = smoothDeltaX * pointerStrength * proxWeight * borderMask[i]` and same for Y
- [x] 2.6 Add `borderMask: Float32Array` to `UpdateForegroundLayerParams` interface
- [x] 2.7 In `updateForegroundLayer`, multiply each vertex's displacement by `borderMask[i]` before writing to `posAttr`
- [x] 2.8 Rename `pointerStrength` to `fgPointerStrength` in `UpdateForegroundLayerParams` to make the param explicit

## 3. scene-loader.ts — Expose borderMask in OverlayLayer

- [x] 3.1 Add `borderMask: Float32Array` to the `OverlayLayer` interface in `scene-loader.ts`
- [x] 3.2 In `loadOverlayPlane`, after building `restX`/`restY`, compute `minX`, `maxX`, `minY`, `maxY` across all vertices, then build `borderMask`: `borderMask[i] = (restX[i] === minX || restX[i] === maxX || restY[i] === minY || restY[i] === maxY) ? 0 : 1`
- [x] 3.3 Include `borderMask` in the returned `OverlayLayer` object

## 4. scene-loader.ts — createHeadlinePlane

- [x] 4.1 Create an exported async function `createHeadlinePlane(headingEl: HTMLElement | null, taglineEl: HTMLElement | null, threeScene: Scene, container: Element, initAspect: number): Promise<HeadlinePlane | null>` — returns `null` if both elements are absent
- [x] 4.2 Define and export `HeadlinePlane` interface: `{ posAttr, restX, restY, restZ, vertCount, dispX, dispY, dispZ, hasActiveDisplacement: boolean, texture: CanvasTexture, repaint: () => void, onResize: (newAspect: number) => void }`
- [x] 4.3 In `createHeadlinePlane`, create an offscreen `<canvas>` sized to `container.clientWidth * dpr` × `container.clientHeight * dpr` (scale context by `dpr`)
- [x] 4.4 Implement `repaint()`: clear canvas, read `getBoundingClientRect()` of heading and tagline relative to container, read `fontFamily`, `fontSize`, `fontWeight`, `color` from `getComputedStyle`, draw text at the computed canvas coordinates
- [x] 4.5 Create `CanvasTexture` from the canvas, set `colorSpace = SRGBColorSpace`
- [x] 4.6 Create `PlaneGeometry(2, 2, 64, 64)`, wrap in `MeshBasicMaterial({ map: canvasTexture, transparent: true, depthTest: false, depthWrite: false })`, set `renderOrder = 4`, add to scene
- [x] 4.7 Build `restX`, `restY`, `restZ`, `dispX`, `dispY`, `dispZ` arrays for spring-back
- [x] 4.8 Build `borderMask` array for the headline plane (same edge-clamping logic as overlay planes)
- [x] 4.9 Set `mesh.scale.x = initAspect`
- [x] 4.10 Return the `HeadlinePlane` object

## 5. scene.ts — Wire new constants and update animation loop

- [x] 5.1 Add `ADVANCE_FG_POINTER_STRENGTH = 0.03` constant (separate from `ADVANCE_POINTER_STRENGTH = 0.05`)
- [x] 5.2 Add `DECOR_PHASE_RIGHT = Math.PI * 0.7` constant
- [x] 5.3 Update `updateDecorLayer` call for `decorLeft`: pass `borderMask: decorLeft.borderMask`, `phaseOffset: 0`
- [x] 5.4 Update `updateDecorLayer` call for `decorRight`: pass `borderMask: decorRight.borderMask`, `phaseOffset: DECOR_PHASE_RIGHT`
- [x] 5.5 Update `updateForegroundLayer` call: pass `borderMask: foreground.borderMask`, rename `pointerStrength` to `fgPointerStrength: debugConfig.fgPointerStrength ?? ADVANCE_FG_POINTER_STRENGTH`

## 6. scene.ts — Headline plane init and animation

- [x] 6.1 Import `createHeadlinePlane` and `HeadlinePlane` from `./scene-loader`
- [x] 6.2 In `initScene`, after overlay planes load, if `config.advance` is true, call `createHeadlinePlane(headingEl, taglineEl, scene, container, initAspect)` — pass heading and tagline element refs (read from `canvas.parentElement` via class selector)
- [x] 6.3 Store the resolved `HeadlinePlane | null` as `headlinePlane`
- [x] 6.4 If `headlinePlane` is non-null, add class `lighting-interaction--text-swapped` to the block element (`canvas.closest('.lighting-interaction')` or `container.closest`)
- [x] 6.5 In the advance mode animation branch, run standard-mode displacement and spring-back on `headlinePlane` using `applyStandardDisplacement` and `applySpringBack` — requires `hasHit`, raycaster result (reuse standard-mode raycaster logic within advance branch for headline only)
- [x] 6.6 In `ResizeObserver` callback, call `headlinePlane.onResize(newAspect)` (which calls `repaint()` and updates canvas dimensions)
- [x] 6.7 Expose `headlinePlane` `posAttr` `needsUpdate = true` after spring-back

## 7. CSS — Text swap class

- [x] 7.1 In `src/blocks/lighting-interaction/lighting-interaction.css`, add rule:
  ```css
  .lighting-interaction--text-swapped .lighting-interaction-content {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }
  ```

## 8. scene.ts — Pass heading/tagline elements from decorator to scene

- [x] 8.1 Add `headingEl?: HTMLElement | null` and `taglineEl?: HTMLElement | null` to `SceneConfig` interface in `scene.ts`
- [x] 8.2 In `lighting-interaction.ts`, query the heading and tagline DOM elements before calling `initScene` and pass them in `sceneConfig`

## 9. Verification

- [x] 9.1 Run `npm run build` — no type errors, scene chunk exists
- [x] 9.2 Run `npm run lint` — no new errors on changed files
- [x] 9.3 Manual smoke-test: in advance mode, move pointer rapidly — border vertices on decors and foreground stay still; interior vertices animate
- [x] 9.4 Manual smoke-test: decor-left and decor-right are visually out of phase (not mirrored)
- [x] 9.5 Manual smoke-test: vertices near decor anchor barely move on pointer swipe; far vertices move significantly
- [x] 9.6 Manual smoke-test: adjust `ADVANCE_FG_POINTER_STRENGTH` and observe foreground response differs from decors
- [x] 9.7 Manual smoke-test: block heading and tagline are visible in headline plane; DOM heading is hidden
- [x] 9.8 Manual smoke-test: headline plane vertices deform on pointer move and spring back on stop
- [x] 9.9 Manual smoke-test: browser window resize — headline canvas repaints text at correct new position
