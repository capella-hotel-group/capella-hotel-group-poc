## 1. Fix AEM UE Field Type

- [x] 1.1 In `_lighting-interaction.json`, change `"component": "checkbox"` to `"component": "boolean"` for the `advance` field
- [x] 1.2 Run `npm run build:json` and verify the `advance` field now shows `"component": "boolean"` in `component-models.json`

## 2. Debug Config File

- [x] 2.1 Create `src/blocks/lighting-interaction/debug-config.ts` exporting a typed `debugConfig` const with all fields set to `undefined`:
  - `advance?: boolean`
  - `showDecorLeft?: boolean`
  - `showDecorRight?: boolean`
  - `showForeground?: boolean`
  - `wireframeDecorLeft?: boolean`
  - `wireframeDecorRight?: boolean`
  - `wireframeForeground?: boolean`
  - `showVelocityVector?: boolean`
  - `velocityVectorScale?: number`
  - `velocityDecayRate?: number`
  - `velocityDecayThreshold?: number`
- [x] 2.2 In `lighting-interaction.ts`, import `debugConfig` from `./debug-config` and apply the `advance` override: `const advance = debugConfig.advance ?? (cmsAdvanceText === 'true');`

## 3. Module Split — scene-loader.ts

- [x] 3.1 Create `src/blocks/lighting-interaction/scene-loader.ts`
- [x] 3.2 Move texture loading + cover-UV logic into exported pure async function `loadTextureCoverUV(url: string): Promise<{ texture: Texture; imgAspect: number; updateCoverUV: (aspect: number) => void }>`
- [x] 3.3 Move `loadOverlayPlane` function from `scene.ts` to `scene-loader.ts`, exporting it, updating its signature to accept the `OverlayLayer` type (also moved here or to a shared types file)
- [x] 3.4 Export `OverlayLayer` interface from `scene-loader.ts` (or from a shared `scene-types.ts` if preferred)

## 4. Module Split — scene-animation.ts

- [x] 4.1 Create `src/blocks/lighting-interaction/scene-animation.ts`
- [x] 4.2 Export pure function `updateDecorLayer(params: { posAttr, restX, restY, vertCount, dispX, dispY, anchorX, anchorY, advAngle, sinAmplitude, phaseScale, velocityScale, smoothDeltaX, smoothDeltaY, pointerStrength }): void` — applies sin+pointer displacement for a single decoration plane
- [x] 4.3 Export pure function `updateForegroundLayer(params: { posAttr, restX, restY, vertCount, dispX, dispY, fgSeeds, advAngle, fgAmplitude, smoothDeltaX, smoothDeltaY, pointerStrength }): void`
- [x] 4.4 Export pure function `applyStandardDisplacement(params: { vertCount, restX, restY, dispX, dispY, dispZ, hitLocalX, hitLocalY, smoothDeltaX, smoothDeltaY, sMag, influenceRadius, displacementStrength, zFactor }): void`
- [x] 4.5 Export pure function `applySpringBack(params: { posAttr, vertCount, restX, restY, restZ, dispX, dispY, dispZ, springDamping }): boolean` — returns `true` if any displacement remains active

## 5. Module Split — scene-debug.ts

- [x] 5.1 Create `src/blocks/lighting-interaction/scene-debug.ts`
- [x] 5.2 Export `createDebugOverlayCanvas(container: Element): HTMLCanvasElement` — creates an absolutely-positioned 2D canvas over the container with `pointer-events: none`
- [x] 5.3 Export `drawVelocityVector(ctx: CanvasRenderingContext2D, pointerScreenX: number, pointerScreenY: number, smoothDeltaX: number, smoothDeltaY: number, scale: number): void` — clears the canvas and draws the velocity vector line

## 6. Refactor scene.ts to Use Modules

- [x] 6.1 Remove all moved logic from `scene.ts` and replace with imports from `scene-loader.ts`, `scene-animation.ts`, `scene-debug.ts`
- [x] 6.2 In the animation loop, replace inline advance/standard animation code with calls to the exported pure functions
- [x] 6.3 Replace inline background texture loading with a call to `loadTextureCoverUV`
- [x] 6.4 Keep cleanup state (`animationId`, `resizeObserver`, `boundPointerMove`, `boundContainer`) as module-level vars in `scene.ts` only
- [x] 6.5 Verify `initScene` and `cleanupScene` remain the only exports from `scene.ts`

## 7. Velocity Momentum Decay

- [x] 7.1 Add constants `VELOCITY_DECAY_RATE = 0.05` and `VELOCITY_DECAY_THRESHOLD = 0.0001` to the constants block in `scene.ts`
- [x] 7.2 Replace the current `smoothDelta.x = smoothDelta.x * VELOCITY_DECAY + pendingDelta.x` formula with the exponential decay model:
  ```
  smoothDelta.x = (smoothDelta.x + pendingDelta.x) * (1 - VELOCITY_DECAY_RATE)
  smoothDelta.y = (smoothDelta.y + pendingDelta.y) * (1 - VELOCITY_DECAY_RATE)
  if (|smoothDelta| < VELOCITY_DECAY_THRESHOLD) smoothDelta.set(0, 0)
  ```
- [x] 7.3 Apply `debugConfig.velocityDecayRate` / `debugConfig.velocityDecayThreshold` overrides when not `undefined`
- [x] 7.4 Remove the old `VELOCITY_DECAY` constant (no longer used)

## 8. Layer Visibility and Wireframe via Debug Config

- [x] 8.1 In `loadOverlayPlane` (or immediately after creating each layer), apply `wireframe` to `MeshBasicMaterial` if the corresponding `debugConfig.wireframe*` flag is `true`
- [x] 8.2 In the animation loop advance branch, skip a layer's update loop and set `mesh.visible = false` when the corresponding `debugConfig.show*` flag is `false`; set `mesh.visible = true` when the flag is `true` or `undefined`

## 9. Pointer Velocity Debug Overlay

- [x] 9.1 At scene init, if `debugConfig.showVelocityVector` is `true`, call `createDebugOverlayCanvas(container)` and store the returned canvas and its 2D context
- [x] 9.2 In the animation loop, if the debug canvas exists, call `drawVelocityVector(ctx, pointerScreenX, pointerScreenY, smoothDelta.x, smoothDelta.y, scale)` each frame — convert `currentNDC` to pixel coords for screen position
- [x] 9.3 In the `ResizeObserver` callback, update the overlay canvas `width`/`height` to match the new container dimensions
- [x] 9.4 In `cleanupScene`, remove the overlay canvas from the DOM if it exists

## 10. Verification

- [x] 10.1 Run `npm run lint` on changed files — no new errors
- [x] 10.2 Run `npm run build` — no type errors; scene chunk name may change hash, verify it still exists
- [ ] 10.3 Manual smoke-test: standard mode unaffected (pointer deforms background, velocity decays smoothly on stop)
- [ ] 10.4 Manual smoke-test: advance mode with all three overlays — decors and foreground animate, pointer velocity overlays them
- [ ] 10.5 Manual smoke-test: set `debugConfig.showVelocityVector = true` — velocity vector line visible, shortens on pointer stop
- [ ] 10.6 Manual smoke-test: set `debugConfig.showDecorLeft = false` — decor left invisible, no errors
- [ ] 10.7 Manual smoke-test: set `debugConfig.wireframeForeground = true` — foreground renders as wireframe
- [ ] 10.8 Manual smoke-test: set `debugConfig.advance = true` — advance mode active even if CMS flag is absent
- [ ] 10.9 Verify in Universal Editor that the `advance` toggle is visible and togglable in the block properties panel
