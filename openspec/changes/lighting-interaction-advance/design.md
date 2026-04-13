## Context

The `lighting-interaction` block renders a Three.js WebGL scene where a single background plane deforms in response to pointer velocity. The plane has 64×64 subdivisions to support smooth per-vertex vertex displacement. The scene is controlled by a handful of constants (`INFLUENCE_RADIUS`, `DISPLACEMENT_STRENGTH`, etc.) at the top of `scene.ts`.

The new **advance mode** layers three additional transparent PNG planes (decoration-left, decoration-right, foreground) above the background. Because the background is now static in this mode, high-subdivision geometry is wasteful. The overlay planes are the only animated layers in advance mode — each with its own sin-loop animation on top of an additive pointer-velocity influence.

Relevant files:
- `src/blocks/lighting-interaction/lighting-interaction.ts` — block decorator, reads CMS rows
- `src/blocks/lighting-interaction/scene.ts` — Three.js scene, `initScene()` + `SceneConfig`
- `src/blocks/lighting-interaction/_lighting-interaction.json` — AEM component model

## Goals / Non-Goals

**Goals:**
- Introduce an `advance` boolean flag in the CMS model that gates all new behaviour;  existing experience is completely unchanged when the flag is absent.
- In advance mode, load three extra images (decor-left, decor-right, foreground) and create a corresponding Three.js `Mesh` per image, stacked above the background.
- Background geometry is reduced to minimal segments (4×4) since it no longer deforms in advance mode.
- Each overlay plane runs its own continuous sin-loop animation; Decoration planes rotate-like-wave around their respective anchors, foreground undulates on X only.
- All overlay planes additionally accumulate the pointer smoothDelta as a secondary displacement.
- Keep all tunable animation constants (amplitude, frequency, phase scale, pointer strength) as named `const` at the top of `scene.ts` so they can be promoted to authored fields later.

**Non-Goals:**
- Authoring the animation constants from Universal Editor (deferred).
- Replacing the pointer-displacement logic applied to the background plane in non-advance mode.
- Touch/mobile-specific pointer handling changes.

## Decisions

### Decision: Single `initScene()` function with an `advance` branch

**Rationale**: `scene.ts` already owns all Three.js state. Adding an `if (config.advance)` branch inside `initScene()` keeps the module consistent without creating a second entry point. The shared setup (renderer, camera, resize observer, pointer tracking) is reused in both paths.

**Alternative considered**: A separate `initAdvancedScene()` export. Rejected — it would duplicate the renderer/camera setup and complicate `cleanupScene()`.

---

### Decision: Reduce background segments to 4×4 in advance mode

**Rationale**: The background plane does not deform in advance mode, so 64×64 = 4 225 vertices are wasted. A 4×4 grid (25 vertices) draws the texture identically and saves ~16 000 attribute writes per frame.

**Alternative considered**: Keep 64×64 and just skip the displacement loop. This works too but wastes memory; 4×4 is cleaner.

---

### Decision: Sin-loop animation via accumulated angle + per-vertex wave phase

Each overlay mesh accumulates a global `angle` that increments by `freq * dt` every frame. Per-vertex displacement is:

```
dist = distance(vertex, anchor)           // local space
wave = sin(angle + dist * PHASE_SCALE)
dispY += wave * AMPLITUDE * dist * DECOR_VELOCITY_SCALE   // decor: grows with distance
```

For foreground (X only):
```
dispX += sin(angle + seed[i]) * FG_AMPLITUDE              // seed[i] is randomised once at init
```

**Rationale**: Accumulated angle avoids discontinuity (smooth infinite loop). Multiplying by `dist` means vertices closer to the anchor barely move — matching the natural appearance of a hanging/floating fabric pinned at the anchor. Pre-seeded per-vertex phase offset for the foreground creates pseudo-random wave phasing without any per-frame randomness.

**Alternative considered**: CSS `@keyframes` on DOM images. Rejected — cannot combine with pointer velocity in the same coordinate space.

---

### Decision: Pointer velocity influence added as a uniform push per overlay plane

In advance mode, `smoothDelta` is added to every overlay vertex displacement equally (no Gaussian falloff), scaled by a constant `ADVANCE_POINTER_STRENGTH`. This gives a simpler parallax-like feel rather than a localised ripple.

**Rationale**: The decor/foreground layers represent objects in the mid-ground/foreground of a scene. A uniform parallax response is more natural for large-format graphic elements. The intrinsic sin animation already provides per-vertex variation.

**Alternative considered**: Reuse the existing Gaussian-weighted impulse from the background plane. Rejected — looks too similar to the existing mode and obscures the sin-wave character.

---

### Decision: New `SceneConfig` fields typed as `string | undefined`

`imageUrl` for decors and foreground are passed as `decorLeftUrl`, `decorRightUrl`, `foregroundUrl` (all `string | undefined`). `initScene()` only creates a plane when the URL is defined — allowing partial advance configurations.

**Rationale**: Authors may not always provide all three overlay images. Missing image → no mesh created → no animation for that layer. Graceful degradation.

## Risks / Trade-offs

- **Performance with 3 extra draw calls** → Mitigated by the background segment reduction and the fact that overlay planes replace, not add to, the background deformation loop which was itself O(N vertices) per frame.
- **Transparent PNG blending order** → Three.js renders in scene-add order; decor-left is added before decor-right, foreground last. Depth test is irrelevant for orthographic+opaque arrangement, so alpha blending must rely on draw order. Mitigation: document the required add order in code comments.
- **Pointer velocity overdriving sin animation** → At high cursor speeds the additive overlay increase could look chaotic. Mitigated by keeping `ADVANCE_POINTER_STRENGTH` low (suggested default: 0.05) and documenting it.

## Migration Plan

- Flag defaults to `false`/absent — no existing authored pages are affected.
- New CMS fields are additive; old pages without them continue to render normally.
- No data migration required.
