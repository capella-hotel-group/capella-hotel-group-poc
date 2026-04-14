## ADDED Requirements

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

Within `updateDecorLayer`, the pointer contribution to each vertex SHALL be scaled by `dist / maxDist`, where `dist` is the Euclidean distance from the vertex's rest position to the anchor point, and `maxDist` is the maximum possible distance from the anchor to any vertex in the plane (the diagonal of the 2×2 plane from an anchor on its edge, approximately `Math.sqrt(8)`). Vertices at the anchor receive zero pointer influence; vertices at the far corner receive full influence.

#### Scenario: Anchor-proximal vertices are unaffected by pointer

- **WHEN** the pointer moves rapidly
- **THEN** vertices near the anchor point (`dist ≈ 0`) exhibit negligible pointer-driven displacement

#### Scenario: Far vertices receive full pointer influence

- **WHEN** the pointer moves rapidly
- **THEN** vertices at maximum distance from the anchor point receive the full `pointerStrength * smoothDelta` contribution

#### Scenario: Proximity weighting applies additively on top of sin displacement

- **WHEN** the sin-wave animation is running and the pointer moves
- **THEN** the proximity-weighted pointer term is added to (not replacing) the existing sin displacement
