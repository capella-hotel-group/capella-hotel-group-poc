## Context

`scene.ts` is a 430-line monolith that combines three concerns: asset loading, per-frame animation math, and debug rendering. All tunable constants live at the top, but they cannot be overridden at runtime without editing source files. The `advance` flag coming from the CMS is parsed as a text string comparison, but the CMS field uses `"component": "checkbox"` which is not a valid Universal Editor field type — the actual type is `"component": "boolean"`, which renders as a toggle. The velocity model currently uses a fixed per-frame additive strategy: `smoothDelta = smoothDelta * VELOCITY_DECAY + pendingDelta`. When the pointer stops, residual `smoothDelta` snaps to zero via `VELOCITY_DECAY` decay, but there is no explicit fade-out — rapid pointer movements can feel jittery because `VELOCITY_DECAY` also limits responsiveness.

## Goals / Non-Goals

**Goals:**
- Fix the AEM UE field type for `advance` to `boolean` so the toggle appears in Universal Editor.
- Add `debug-config.ts` as a build-time-only override mechanism: a single typed export that lets a developer set any subset of scene parameters (advance mode, layer visibility, wireframe, velocity vector drawing) without touching authored content.
- Implement a Canvas 2D overlay for pointer velocity vector debug — a line drawn from pointer position in the direction of `smoothDelta` with length proportional to magnitude, shown only when `debugConfig.showVelocityVector` is true.
- Replace the current velocity model with explicit exponential decay: `smoothDelta` fades to zero at a configurable rate `VELOCITY_DECAY_RATE` when no new pointer input arrives, clamped to zero once the magnitude falls below `VELOCITY_DECAY_THRESHOLD`.
- Split `scene.ts` into 4 files using pure functions: `scene-loader.ts` (async texture/plane loading), `scene-animation.ts` (advance + standard frame-update pure functions), `scene-debug.ts` (debug overlay), `scene.ts` (orchestrator).

**Non-Goals:**
- UI controls for debug settings (no debug panel, no runtime toggle UI).
- Promoting debug config fields to CMS-authored fields.
- Changing the block's visual output or animation feel for non-debug builds.

## Decisions

### Decision: `debug-config.ts` uses `undefined` as "not overriding"

All fields in the config type are optional (`T | undefined`). When a field is `undefined` the runtime falls back to the CMS value or the hardcoded constant default. This means that by default the file is a no-op — no behaviour change when fields are left unset.

**Alternative**: A separate `DEV` flag that entirely skips the config read. Rejected — less granular and requires more wiring.

---

### Decision: Velocity vector debug drawn on a separate 2D canvas overlay, not in the Three.js scene

The WebGL canvas uses an `OrthographicCamera` in NDC space. Projecting a screen-space arrow into that coordinate system requires inverse-projecting the pointer's screen position, which is complex and fragile. A `<canvas>` overlay positioned absolutely on top of the WebGL canvas with `pointer-events: none` and drawn with Canvas 2D API is far simpler: pixel coordinates are directly available.

**Alternative**: Add a Three.js `Line` object to the scene. Rejected — requires translating velocity units to world units, coupling debug state to the scene graph.

---

### Decision: Exponential decay with a floor threshold

The new velocity update:
```
smoothDelta.x *= (1 - VELOCITY_DECAY_RATE)
smoothDelta.y *= (1 - VELOCITY_DECAY_RATE)
if (|smoothDelta| < VELOCITY_DECAY_THRESHOLD) smoothDelta.set(0, 0)
```
This replaces the current additive formula. `VELOCITY_DECAY_RATE` (0–1, default 0.05) controls how fast the velocity fades per frame. `VELOCITY_DECAY_THRESHOLD` (default 0.0001) sets the snap-to-zero floor to avoid infinite sub-epsilon decay.

**Alternative**: Keep current model, add separate brake on pointer-stop. Rejected — two interacting parameters are harder to reason about than a single decay rate.

---

### Decision: Module split uses pure functions with explicit parameter passing

`scene-animation.ts` exports pure functions that take all required state as arguments (posAttr, restX/Y, dispX/Y, smoothDelta, config values) and return nothing (mutate typed arrays in-place, as Three.js `BufferAttribute` requires mutation). This keeps them testable and tree-shakeable.

`scene-loader.ts` exports async pure functions returning typed result objects (`OverlayLayer`, background state).

`scene-debug.ts` exports a single `drawDebugOverlay(ctx, pointerNDC, smoothDelta, width, height, cfg)` function.

`scene.ts` retains the global cleanup state (`animationId`, `resizeObserver`, etc.) and wires the orchestration.

---

### Decision: AEM field name `advance` uses `"component": "boolean"`

Per the [AEM EDS field-types documentation](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/universal-editor/field-types), the correct component type for a true/false toggle is `"component": "boolean"` with `"valueType": "boolean"`. The `checkbox` type is only valid as part of a `checkbox-group`. In AEM EDS xwalk authoring, a `boolean` field persists the value `true` or `false` directly into the block's document row — so the existing text comparison `=== 'true'` in `lighting-interaction.ts` remains correct after the model fix.

## Risks / Trade-offs

- **`debug-config.ts` committed to repo** → All team members who pull the branch will see whatever debug flags the committer left set. Mitigation: add `debug-config.ts` values reset to `undefined` as a pre-commit checklist item. Long-term: gitignore a local `debug-config.local.ts` pattern (out of scope this change).
- **Canvas 2D overlay flicker on resize** → The overlay canvas must resize together with the WebGL canvas. Mitigation: resize handler updates both canvases' `width`/`height` attributes simultaneously.
- **Module split increases bundle splitting risk** → Vite/Rollup should inline all four files into one `scene-*.js` chunk since they are imported synchronously within the same dynamic-import boundary (`import('./scene')`). No action needed — verify in post-build output.

## Migration Plan

- `scene.ts` continues to export `initScene` and `cleanupScene` — the `lighting-interaction.ts` call site is unchanged.
- `debug-config.ts` ships with all fields set to `undefined` — zero runtime change for production builds.
- No data in authored documents needs changing; only the component model JSON changes (field type swap).
