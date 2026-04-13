## Context

The lighting-interaction block in advance mode composites up to four transparent overlay planes (decor-left, decor-right, foreground, and now headline) on top of a static background. Three animation quality gaps have been observed in production testing:

1. **Viewport coverage gap**: Advance-mode overlay planes (PlaneGeometry 2×2 covering NDC -1..1) can expose viewport edges when vertex displacement pushes outer vertices beyond the plane boundary. The fix is to clamp border-vertex displacement to zero, keeping the plane flush with the viewport edge.

2. **Mirror-sync on decors**: Left and right decors currently share the same `advAngle` with the same phase function, so they move in perfect mirror sync. Each decor needs its own phase offset seed.

3. **Uniform pointer strength across all planes**: Foreground's emotional role is different from decors — it typically frames foreground content. Having a shared `ADVANCE_POINTER_STRENGTH` prevents independent tuning.

4. **Headline composite plane**: Marketing copy (heading + tagline) currently lives in a DOM overlay (`lighting-interaction-content`). To allow smooth WebGL compositing effects over the text, a canvas-texture plane is needed that repaints the text content onto a `CanvasTexture`, allowing the DOM text to be hidden and the WebGL version to receive the same pointer-driven displacement as the background.

Current source references:
- `scene-animation.ts`: `updateDecorLayer`, `updateForegroundLayer` — need param extensions
- `scene-loader.ts`: `loadOverlayPlane` — needs edge-clamp metadata; new `createHeadlinePlane`
- `scene.ts`: orchestrator, wires all planes

## Goals / Non-Goals

**Goals:**
- Pin outer-edge vertices to zero for all overlay planes (decor and foreground) to prevent coverage gaps.
- Add per-plane `phaseOffset` seed to `updateDecorLayer` so left and right decorations animate independently.
- Attenuate pointer velocity influence on decor vertices by proximity to the anchor point.
- Add `ADVANCE_FG_POINTER_STRENGTH` as a separate constant (and `debugConfig.fgPointerStrength` override) for the foreground plane.
- Create a `createHeadlinePlane` function that renders heading + tagline DOM content onto a `CanvasTexture`, places a plane at `renderOrder = 4`, and wires pointer displacement identical to the background standard mode.

**Non-Goals:**
- No new CMS model fields — the headline plane reads from the existing DOM structure.
- No runtime toggle UI for any of these features.
- Not handling arbitrary multi-line text layout beyond what the browser font metrics provide via `measureText`.
- Not preserving headline plane text updates if the author edits content after scene init (init-time snapshot only).

## Decisions

### Decision: Edge clamping via a `borderMask` Float32Array

Each overlay plane vertex is assigned a `borderMask` value in `[0, 1]` at load time. Border vertices (those at the geometric extremes of the PlaneGeometry in UV space) receive mask `0`; interior vertices receive mask `1`. Displacement is multiplied by `borderMask[i]` before being applied.

**Alternative**: Clamp final position to rest position when it would exceed the plane bounds. Rejected — that would still allow the vertex to move before being snapped, creating a hard visual edge. The mask approach prevents any motion at the boundary.

**Implementation**: In `loadOverlayPlane`, after building `restX`/`restY`, compute min/max X and Y in the geometry, then assign `borderMask[i] = (x === minX || x === maxX || y === minY || y === maxY) ? 0 : 1`.

---

### Decision: Per-decor phase offset via a `phaseOffset` param in `updateDecorLayer`

`updateDecorLayer` accepts a new `phaseOffset: number` parameter. The orchestrator (`scene.ts`) passes distinct constant offsets: `decorLeft` uses `0`, `decorRight` uses `Math.PI * 0.7` (irrational fraction of π to avoid harmonic sync).

**Alternative**: Use a random seed per session. Rejected — non-deterministic, hard to tune visually.

---

### Decision: Proximity-weighted pointer influence on decors

In `updateDecorLayer`, the pointer contribution is scaled by `dist / maxDist` where `dist` is vertex distance from the anchor and `maxDist` is the diagonal of the plane in local space (a constant `Math.sqrt(8) ≈ 2.83` for a 2×2 plane). Vertices at the anchor receive zero pointer influence; vertices at the far corner receive full influence.

**Alternative**: Exponential fall-off `exp(-k * dist)`. Considered — heavier to compute, harder to tune. Linear distance ratio is sufficient.

---

### Decision: Headline plane uses `CanvasTexture` repainted at init and on resize

A `<canvas>` element is created (not appended to DOM), drawn onto using Canvas 2D API to mirror the heading/tagline text at the correct position within the canvas coordinate space, then wrapped in Three.js `CanvasTexture`. The canvas is sized to match the container at init and repainted in the `ResizeObserver` callback.

Text rendering strategy: read `getBoundingClientRect()` of the heading and tagline DOM elements at the time of init, then draw the text at the proportionally correct position within the canvas.

**Alternative**: Use DOM-to-canvas library (html2canvas). Rejected — adds a large dependency, overkill for 2 text elements.

**Alternative**: Keep HTML overlay, use CSS `mix-blend-mode`. Rejected — blending in CSS does not give WebGL displacement control over the text layer.

---

### Decision: Headline plane displacement is standard-mode Gaussian, not sin-wave

The headline plane is conceptually part of the "ground truth" content layer, not a decorative overlay, so it should respond to the pointer with the same physics as the background: Gaussian-weighted impulse on pointer move + spring-back. This reuses `applyStandardDisplacement` and `applySpringBack` from `scene-animation.ts` with a separate displacement array.

---

### Decision: DOM heading/tagline swap via CSS class toggle

When `createHeadlinePlane` resolves, `scene.ts` adds class `lighting-interaction--text-swapped` to the block element. The block CSS hides the `.lighting-interaction-content` div when this class is present (`opacity: 0; pointer-events: none`). This keeps the DOM text accessible (screen readers still see it) while visually hiding it.

## Risks / Trade-offs

- **Canvas text alignment drift on resize**: The canvas repaints text by re-reading `getBoundingClientRect()` from the DOM heading/tagline elements. If layout shifts during a resize (e.g., line wrapping changes), there's a one-frame lag before the texture reflects the new layout. Mitigation: repaint inside `ResizeObserver` after `renderer.setSize`.
- **`opacity: 0` DOM text and CLS**: Hiding the heading with opacity doesn't remove it from the layout flow, so there's no layout shift. However, accessibility tools will still read the hidden text, which is desired.
- **Canvas text anti-aliasing vs WebGL texture filtering**: Text rendered to canvas at 1:1 pixel ratio can appear soft when downsampled or scaled. Mitigation: create the canvas at `devicePixelRatio` scale and scale the Canvas 2D context.
- **`borderMask` increases Float32Array memory**: One extra `Float32Array` per overlay plane. For 33×33 vertices (1089 verts) this is ~4 kB per plane — negligible.
