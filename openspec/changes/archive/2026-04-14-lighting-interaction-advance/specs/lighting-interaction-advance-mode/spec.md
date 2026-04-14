## ADDED Requirements

### Requirement: Block supports an advance mode flag

The block SHALL read a boolean `advance` field from the authored CMS content. When this field is absent or `false`, the block SHALL behave identically to the existing implementation. When `true`, the block SHALL activate the advance animation layer system.

#### Scenario: Flag absent — existing behaviour preserved

- **WHEN** the block is rendered on a page where no `advance` field has been authored
- **THEN** the block functions exactly as the non-advance version: single background plane with pointer-driven vertex displacement, no overlay planes loaded

#### Scenario: Flag present and true — advance mode activated

- **WHEN** the block is rendered with `advance` set to `true` in the authored CMS content
- **THEN** `initScene()` is called with `config.advance === true`
- **AND** the background plane is created with minimal geometry (4×4 segments)
- **AND** no vertex displacement is applied to the background plane

---

### Requirement: Three overlay image fields available in advance mode

The block model SHALL expose three additional image-reference fields: `decoration-left`, `decoration-right`, and `foreground`. When the block is in advance mode, each field whose image URL is defined SHALL result in a corresponding transparent-capable `Mesh` plane added to the Three.js scene above the background.

#### Scenario: All three overlay images authored

- **WHEN** `advance` is `true` and all three overlay image fields (`decoration-left`, `decoration-right`, `foreground`) have authored image references
- **THEN** three additional `Mesh` planes are created and added to the scene in order: decor-left, decor-right, foreground (highest in stack)

#### Scenario: Partial overlay images authored

- **WHEN** `advance` is `true` but only some overlay image fields are provided
- **THEN** only the planes whose image URL is defined are created
- **AND** planes for missing URLs are omitted without error

---

### Requirement: Decoration planes animate with sin-loop rotation around their anchor

Each decoration plane SHALL run a continuous sin-loop animation. The animation accumulates an angle that increases at a configurable frequency per frame. Per-vertex displacement on the Y axis SHALL be computed as `sin(angle + dist * PHASE_SCALE) * AMPLITUDE * dist * VELOCITY_SCALE`, where `dist` is the Euclidean distance from the vertex to the plane's anchor point in local space. The anchor for `decoration-left` SHALL be `(-1, 0)` and for `decoration-right` SHALL be `(1, 0)`.

#### Scenario: Decoration left animates from left-center anchor

- **WHEN** the scene is running in advance mode with a `decoration-left` plane
- **THEN** vertices near `(-1, 0)` in local space experience near-zero Y displacement
- **AND** vertices far from `(-1, 0)` experience proportionally larger Y displacement
- **AND** the displacement follows a smooth, continuous sin wave with no discontinuity across frames

#### Scenario: Decoration right mirrors decoration left

- **WHEN** the scene is running in advance mode with a `decoration-right` plane
- **THEN** the same sin-loop logic is applied with anchor `(1, 0)` instead of `(-1, 0)`

---

### Requirement: Foreground plane animates with per-segment X-axis wave

The foreground plane SHALL translate vertices on the X axis only. Each vertex SHALL receive a phase seed at initialisation (randomly assigned once). Per-vertex displacement SHALL be `sin(angle + seed[i]) * FG_AMPLITUDE`. The accumulated angle SHALL advance at the same frequency as the decoration planes.

#### Scenario: Foreground plane creates wave undulation

- **WHEN** the scene is running in advance mode with a `foreground` plane
- **THEN** different vertices move at different X phases creating a wave-like undulation
- **AND** no Y or Z displacement is applied to foreground vertices by the foreground's own animation
- **AND** the animation loops infinitely with no reset discontinuity

---

### Requirement: Pointer velocity applies additive displacement to all overlay planes

In advance mode, the existing `smoothDelta` (pointer velocity) SHALL be applied as a uniform additive displacement to every vertex on all constructed overlay planes, scaled by `ADVANCE_POINTER_STRENGTH`. This is stacked on top of the intrinsic sin-loop animation for each plane.

#### Scenario: Pointer movement shifts overlay planes

- **WHEN** the user moves the pointer over the block in advance mode
- **THEN** all overlay planes' vertices receive an additional uniform displacement in the pointer movement direction
- **AND** the background plane is NOT affected by pointer movement in advance mode

---

### Requirement: Animation constants are named and configurable

All advance-mode animation tuning values SHALL be declared as named `const` at the top of `scene.ts` with clear names reflecting their role. These constants SHALL cover at minimum: sin amplitude for decorations, sin frequency, phase scale (distance-to-phase multiplier), decoration velocity scale, foreground amplitude, and pointer influence strength.

#### Scenario: Constants are found at the top of scene.ts

- **WHEN** a developer opens `scene.ts`
- **THEN** all advance-mode animation constants are visible as named `const` declarations in the same constant block as existing non-advance constants
