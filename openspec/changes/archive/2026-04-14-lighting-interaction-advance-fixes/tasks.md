## 1. scene.ts — Headline interaction flag

- [x] 1.1 Add `headlineInteraction?: boolean` to the `SceneConfig` interface in `scene.ts`
- [x] 1.2 In `initScene`, wrap the `createHeadlinePlane(...)` call and the `--text-swapped` class addition in an `if (config.headlineInteraction)` guard
- [x] 1.3 In `lighting-interaction.ts`, pass `headlineInteraction: false` (or omit it) in the current `sceneConfig` object — no behaviour change, but makes the intent explicit

## 2. scene-loader.ts — Leaf-element font traversal

- [x] 2.1 In `getTextRenderInfo`, add a local variable `let leaf: HTMLElement = el`
- [x] 2.2 Add a `while (leaf.firstElementChild)` loop that advances `leaf = leaf.firstElementChild as HTMLElement`
- [x] 2.3 Change the `getComputedStyle(el)` call to `getComputedStyle(leaf)` — `fontSize`, `fontFamily`, `fontWeight`, `color` are now read from the leaf
- [x] 2.4 Keep the `el.getBoundingClientRect()` call on the original `el` (the wrapper) for positional measurement — only the style read moves to `leaf`

## 3. scene-animation.ts — Rotation model for decor layers

- [x] 3.1 Remove `phaseScale: number` from `UpdateDecorLayerParams` interface
- [x] 3.2 Remove `velocityScale: number` from `UpdateDecorLayerParams` interface
- [x] 3.3 Rewrite `updateDecorLayer` function body:
  - Compute shared frame angle: `const theta = p.sinAmplitude * Math.sin(p.advAngle + p.phaseOffset)`
  - Compute `sinT = Math.sin(theta)`, `cosT = Math.cos(theta)` once outside the loop
  - For each vertex: `ax = restX[i] - anchorX`, `ay = restY[i] - anchorY`, `dist = Math.sqrt(ax*ax + ay*ay)`
  - Rotation displacement: `rotDispX = ax*(cosT-1) - ay*sinT`, `rotDispY = ax*sinT + ay*(cosT-1)`
  - Proximity weight: `proxWeight = dist / maxDist`
  - Final (with pointer and edge clamp): `dispX[i] = (rotDispX + smoothDeltaX * pointerStrength * proxWeight) * borderMask[i]`; same for Y

## 4. scene.ts — Remove removed params from call sites

- [x] 4.1 Remove `phaseScale: ADVANCE_PHASE_SCALE` from the `updateDecorLayer` call for `decorLeft`
- [x] 4.2 Remove `velocityScale: ADVANCE_DECOR_VELOCITY_SCALE` from the `updateDecorLayer` call for `decorLeft`
- [x] 4.3 Remove `phaseScale: ADVANCE_PHASE_SCALE` from the `updateDecorLayer` call for `decorRight`
- [x] 4.4 Remove `velocityScale: ADVANCE_DECOR_VELOCITY_SCALE` from the `updateDecorLayer` call for `decorRight`
- [x] 4.5 Remove the `ADVANCE_PHASE_SCALE` and `ADVANCE_DECOR_VELOCITY_SCALE` constant declarations from `scene.ts` (they are no longer referenced)

## 5. Verification

- [x] 5.1 Run `npm run build` — no TypeScript errors
- [x] 5.2 Run `npm run lint` — no new errors on changed files
- [x] 5.3 Manual smoke-test: with `headlineInteraction` absent/false, advance mode renders without headline plane; DOM text is visible
- [x] 5.4 Manual smoke-test: with `headlineInteraction: true`, headline plane appears and DOM text is hidden
- [x] 5.5 Manual smoke-test: canvas text renders at the expected visual size matching the DOM heading
- [x] 5.6 Manual smoke-test: decor layers appear to pivot/rotate around their anchor edges like a branch, not wave across the plane
- [x] 5.7 Manual smoke-test: left and right decors are visually out of phase with each other
