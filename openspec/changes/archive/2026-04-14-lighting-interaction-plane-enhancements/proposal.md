## Why

The advance mode overlay planes currently have several animation quality issues: edge vertices can move outside the plane boundary causing viewport coverage gaps; decor-left and decor-right animate in perfect mirror sync; pointer velocity influence is uniform across all vertex distances from the anchor; foreground shares the same pointer strength constant as decors despite having a different visual role. The planned canvas-texture headline plane also requires a clear implementation contract before it can be built.

## What Changes

- **Edge vertex clamping**: Vertices on the outer border of decor and foreground planes are pinned at zero displacement so the plane always fully covers the viewport.
- **Decor anchor proximity weighting**: Pointer velocity influence on decor vertices is attenuated by proximity to the anchor point — vertices near the anchor barely move, vertices far from it move fully. Each decor plane also receives an independent phase seed offset so left and right are out of sync.
- **Foreground pointer strength**: A dedicated constant `ADVANCE_FG_POINTER_STRENGTH` (separate from `ADVANCE_POINTER_STRENGTH` used by decors) controls how much pointer velocity influences the foreground plane.
- **Headline canvas plane**: A new render-order-4 `PlaneGeometry` plane uses a `CanvasTexture` that mirrors the block's heading and tagline text at correct screen position, font, and color. When the plane is active the DOM heading/tagline is set to `opacity: 0`. The plane's vertex displacement logic is identical to the background in standard mode (pointer-driven Gaussian displacement + spring-back).
- **AEM model**: No new CMS fields — the headline plane is always present in advance mode and driven by the existing DOM heading/tagline content.

## Capabilities

### New Capabilities

- `overlay-plane-edge-clamping`: Pinning outer-border vertices of overlay planes to zero displacement to prevent viewport coverage gaps.
- `decor-plane-anchor-proximity`: Attenuating pointer velocity influence by proximity to the anchor point and adding per-plane phase seed offsets.
- `foreground-pointer-strength`: Separate pointer velocity scale constant for the foreground plane.
- `headline-canvas-plane`: A Three.js plane that composites the heading/tagline text onto a `CanvasTexture` and responds to pointer displacement like the background in standard mode.

### Modified Capabilities

- `scene-debug-config`: Add `fgPointerStrength?: number` override field to `debugConfig` for the new foreground-specific pointer strength.

## Impact

- `src/blocks/lighting-interaction/scene-animation.ts` — `updateDecorLayer`, `updateForegroundLayer` signatures extend with new params; new `applyEdgeClamp` helper
- `src/blocks/lighting-interaction/scene-loader.ts` — `loadOverlayPlane` extended to accept edge-clamp metadata; new `createHeadlinePlane` async function
- `src/blocks/lighting-interaction/scene.ts` — wires new plane, canvas texture, DOM opacity swap, resize handler for canvas texture repaint
- `src/blocks/lighting-interaction/debug-config.ts` — add `fgPointerStrength?: number`
- No changes to CMS model JSON, block CSS, or `lighting-interaction.ts` call site
