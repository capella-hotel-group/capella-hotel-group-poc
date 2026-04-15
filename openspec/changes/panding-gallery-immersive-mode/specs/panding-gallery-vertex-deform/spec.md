## ADDED Requirements

### Requirement: Per-vertex Z-displacement driven by pointer proximity and scroll energy

Every animation frame, when `scrollEnergy > 0.001`, the immersive scene SHALL displace the Z component of each vertex in each plane's `position` BufferAttribute according to the following rule:

1. Compute the vertex's current world-space XY position (base position + scroll-motion offset).
2. Compute `dist = distance(vertexWorldXY, pointerWorldXY)` in CSS pixel units.
3. If `dist >= deformRadius`: displacement = `0` (vertex is at rest Z = 0).
4. If `dist < deformRadius`: `proximityFactor = dist / deformRadius` (0 at pointer, 1 at edge). `displacement = deformStrength × proximityFactor × scrollEnergy`.
5. Set vertex `position.z = displacement`.
6. After mutating all vertices of a geometry, set `geometry.attributes.position.needsUpdate = true`.

The deformation is applied additively over the base Z of `0` each frame (not accumulated).

#### Scenario: Vertex directly under pointer has zero Z displacement

- **WHEN** a plane vertex world position exactly coincides with the pointer world position
- **THEN** `proximityFactor = 0` and the vertex `position.z` SHALL be `0`

#### Scenario: Vertex at the deformRadius boundary receives maximum displacement

- **WHEN** a vertex is at `dist = deformRadius` from the pointer
- **AND** `scrollEnergy = 1.0`
- **THEN** the vertex `position.z` SHALL be `deformStrength × 1.0 × 1.0`

#### Scenario: Vertex beyond deformRadius is unaffected

- **WHEN** a vertex is at `dist = deformRadius × 1.5` from the pointer
- **THEN** the vertex `position.z` SHALL be `0`

#### Scenario: Deformation scales with scroll energy

- **WHEN** `scrollEnergy = 0.5` and a vertex is at `dist = 0.5 × deformRadius`
- **THEN** `displacement = deformStrength × 0.5 × 0.5 = deformStrength × 0.25`

#### Scenario: No deformation when grid is stationary

- **WHEN** `scrollEnergy < 0.001`
- **THEN** all vertex `position.z` values SHALL remain at `0`
- **AND** geometry `needsUpdate` SHALL NOT be set to `true` for any plane

---

### Requirement: Pointer world-space position is derived from pointer clip-space coordinates

The immersive scene SHALL convert the current pointer position (normalised DevicePixelRatio-corrected CSS coords relative to block) to world-space using the inverse of the OrthographicCamera's projection:

`pointerWorldX = (pointerNDC.x) × blockWidth/2`
`pointerWorldY = -(pointerNDC.y) × blockHeight/2`

where `pointerNDC` is in `[-1, 1]` on both axes (standard Three.js NDC convention).

#### Scenario: Pointer at block center maps to world origin

- **WHEN** the pointer is exactly at the center of the block
- **THEN** `pointerWorldX = 0` and `pointerWorldY = 0`

#### Scenario: Pointer at top-right maps to positive X, positive Y

- **WHEN** the pointer is at the top-right corner of the block (NDC = (1, 1))
- **THEN** `pointerWorldX = blockWidth/2` and `pointerWorldY = blockHeight/2`
