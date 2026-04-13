## Context

The lighting-interaction block's advance mode now has a headline canvas-texture plane that composites DOM heading/tagline text onto a Three.js mesh with pointer-driven spring displacement. Three issues surfaced from first-look testing:

1. The headline plane is always created when heading/tagline elements exist — there is no way to opt out of the effect without modifying code.
2. `getTextRenderInfo` reads `getComputedStyle` on the wrapper `<div class="lighting-interaction-heading">` rather than the child element (`h1`, `h2`, `p`) that actually carries the font rules. The wrapper inherits the font declarations, but in practice the resolved `fontSize` from the wrapper can differ from the visual text — the real font size (e.g., `4rem` from the heading rule) is bound to the `h1`/`h2`/`p` selector.
3. The decor animation formula produces a vertical wave (Y displacement ∝ `sin × dist`), but the desired visual is a rotating branch — where the whole plane pivots around the anchor edge: vertices further from the anchor sweep more, and the displacement is tangential (perpendicular to the radius vector), not purely vertical.

## Goals / Non-Goals

**Goals:**
- Add an explicit `headlineInteraction` boolean flag to `SceneConfig`; the headline plane is only created (and DOM text hidden) when it is `true`.
- Fix canvas text size: resolve the actual text-bearing leaf element before reading CSS for canvas rendering.
- Rewrite `updateDecorLayer` to use a rotation model: single shared angle `θ` per frame, displacement is the rotated offset vector minus the original offset vector.
- Remove `phaseScale` and `velocityScale` from `UpdateDecorLayerParams` as they have no role in the rotation model.

**Non-Goals:**
- Changing the foreground layer animation.
- Animating the headline plane's rotation (it retains standard Gaussian spring displacement).
- Modifying how the headline plane canvas size is computed.

## Decisions

### D1 — `headlineInteraction` flag defaults to `false`

**Decision**: The new field is `headlineInteraction?: boolean` on `SceneConfig`. When absent or `false`, the block behaves as before the headline plane was introduced (DOM text stays visible, no canvas mesh created, no `--text-swapped` class). When `true`, full current behaviour.

**Rationale**: Opt-in is safer for a new experimental feature — existing page configurations that don't set the flag keep working without visible change. The alternative (defaulting to `true`) risks regressing live pages.

**Alternative considered**: A separate `headlineMode: 'dom' | 'canvas'` enum. Rejected — overkill for a binary choice.

---

### D2 — Leaf-element traversal for font resolution

**Decision**: In `getTextRenderInfo`, walk down the DOM using `firstElementChild` until no further element child exists. Use the resulting element for `getComputedStyle`.

**Rationale**: CSS rules targeting `h1`, `h2`, `p` (font-size: 4rem; font-family: ...) apply to those elements directly. Reading `getComputedStyle` on a parent `<div>` returns the inherited/cascaded value which may not match the actual rendered font in browsers that apply dimension-specific overrides (e.g., `:is(h1, h2)` resets).

Walking to the leaf is safe: heading rows always contain exactly one text element.

**Alternative considered**: Querying for `:is(h1, h2, p)` directly. Rejected — too brittle if authors use non-standard elements.

---

### D3 — Pure rotation model for `updateDecorLayer`

**Decision**: Replace the current per-vertex wave formula with:

```
θ(t) = sinAmplitude × sin(advAngle + phaseOffset)
dispX[i] = ax × (cos θ − 1) − ay × sin θ
dispY[i] = ax × sin θ + ay × (cos θ − 1)
```

where `(ax, ay) = (restX[i] − anchorX, restY[i] − anchorY)`.

**Rationale**: A rotation model is physically coherent — every vertex in the same rigid plane rotates by the same angle around the anchor; tangential displacement naturally scales with distance. The previous model displaced vertices in Y only with per-vertex phase differences, producing visible "waves" across the mesh rather than a branch-bending motion.

`sinAmplitude` is reinterpreted as max rotation angle in radians (current value `0.06` rad ≈ 3.4° is acceptable; tune as needed). `phaseScale` and `velocityScale` are removed because they are wave-specific concepts. The two call sites in `scene.ts` drop these two params.

**Alternative considered**: Keeping the wave model and just increasing Y dominance. Rejected — does not produce the rotating-branch feel regardless of tuning.

---

## Risks / Trade-offs

- **`sinAmplitude` semantic change**: Existing callers that tuned `sinAmplitude` as a wave amplitude now interpret it as a rotation angle in radians. At small values the visual change is minimal, but at large values the plane could rotate far off-screen. Mitigation: keep `sinAmplitude` at its current `0.06` value; it maps to ~3.4° which is visually close to the previous wave magnitude.
- **Leaf traversal edge case**: If `headingEl` is already a leaf element (no child elements), the loop is a no-op — correct. If somehow a heading has deeply nested elements (e.g., `<div><p><span>text</span></p></div>`), the traversal reaches the span. The span may not carry the headline font rules. Mitigation: the spec requires traversal stops at the first element that has no element-children, not strictly at the text node.
- **Headline flag migration**: Any existing `SceneConfig` that was relying on the unconditional headline plane creation will need `headlineInteraction: true` added. For the current project this is only `lighting-interaction.ts`, which will be updated in the same change.
