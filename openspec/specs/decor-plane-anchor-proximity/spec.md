## Purpose

Defines the animation behaviour for decor overlay planes in advance mode. Each decor plane animates independently via a per-plane phase offset and attenuates pointer velocity influence based on vertex distance from the plane's anchor point, producing a natural "branch tip moves more than the base" effect.

---

## Requirements

### Requirement: Decor planes animate with independent phase offsets

Each decor plane SHALL receive a `phaseOffset: number` parameter in its animation update. The left decor SHALL use `phaseOffset = 0` and the right decor SHALL use `phaseOffset = Math.PI * 0.7`. The `phaseOffset` is added to `advAngle` before the sin function is evaluated, so the two decors are visually out of sync.

#### Scenario: Left and right decors are visually distinct

- **WHEN** advance mode is running
- **THEN** the left and right decoration planes do not move in mirror synchrony — their peak and trough positions differ at any given frame

#### Scenario: Phase offset is constant per plane

- **WHEN** `initScene` is called
- **THEN** the phase offset for each decor is a fixed static value, not randomised, ensuring deterministic visual output

---

### Requirement: Pointer velocity influence on decor vertices is attenuated by anchor proximity

Within `updateDecorLayer`, the pointer contribution to each vertex SHALL be scaled by a composite weight: `pointerGaussian × (distFromAnchor / maxDist)`. `pointerGaussian = exp(−d²/r²)` where `d` is the distance from the vertex's rest position to the pointer and `r` is the configured Gaussian influence radius. `distFromAnchor / maxDist` attenuates by anchor proximity so that vertices near the anchor receive less pointer influence even when close to the pointer, while `maxDist = Math.sqrt(8)` is the diagonal of the 2×2 plane.

#### Scenario: Anchor-proximal vertices are unaffected by pointer

- **WHEN** the pointer moves rapidly
- **THEN** vertices near the anchor point (`distFromAnchor ≈ 0`) exhibit negligible pointer-driven displacement

#### Scenario: Far vertices receive full pointer influence

- **WHEN** the pointer moves rapidly
- **THEN** vertices at maximum distance from the anchor point receive the full `pointerStrength * smoothDelta` contribution when also close to the pointer

#### Scenario: Proximity weighting applies additively on top of sin displacement

- **WHEN** the sin-wave animation is running and the pointer moves
- **THEN** the proximity-weighted pointer term is added to (not replacing) the existing sin displacement
