## Purpose

Defines per-vertex displacement behaviour for `panding-gallery` immersive mode planes, producing a bendy-card effect driven by pointer proximity and scroll velocity direction.

---

## Requirements

### Requirement: Per-vertex XY bendy-card displacement driven by pointer proximity and scroll velocity

Every animation frame, the immersive scene SHALL displace each vertex in each plane's `position` BufferAttribute in the XY plane (scroll direction), creating a bendy-card effect. Vertices **closer** to the pointer deform more; vertices at the radius edge are unaffected.

The function operates on `restPositions` — the original undisplaced local-space vertex positions stored at geometry creation time — to prevent accumulated drift across frames.

Per-frame algorithm:

1. Compute `mag = Math.hypot(scrollDx, scrollDy)`. If `mag < 0.001`: reset all vertices to `restPositions` (Z = 0), set `needsUpdate = true`, return.
2. Compute `energy = Math.tanh(mag / 15)` (normalised to [0, 1]).
3. Compute scroll direction unit vector: `dirX = scrollDx / mag`, `dirY = -scrollDy / mag` (Y axis flipped: DOM +Y = Three.js −Y).
4. For each vertex:
   a. Compute vertex absolute world XY: `vWorldX = restX + meshWorldX`, `vWorldY = restY + meshWorldY`.
   b. Compute `dist = distance(vWorldXY, pointerWorldXY)`.
   c. If `dist >= deformRadius`: set vertex to `(restX, restY, 0)` — no deformation.
   d. If `dist < deformRadius`: `proximityFactor = 1 - dist / deformRadius` (1 at pointer, 0 at edge). `deform = deformStrength × energy × proximityFactor`. Set vertex to `(restX + dirX × deform, restY + dirY × deform, 0)`.
5. Set `geometry.attributes.position.needsUpdate = true`.

#### Scenario: Vertex directly under pointer receives maximum XY displacement

- **WHEN** a plane vertex world position exactly coincides with the pointer world position
- **THEN** `proximityFactor = 1` and the vertex XY displacement SHALL be `deformStrength × energy`

#### Scenario: Vertex at the deformRadius boundary has zero displacement

- **WHEN** a vertex is at `dist = deformRadius` from the pointer
- **THEN** `proximityFactor = 0` and the vertex SHALL remain at its rest position

#### Scenario: Vertex beyond deformRadius is unaffected

- **WHEN** a vertex is at `dist = deformRadius × 1.5` from the pointer
- **THEN** the vertex SHALL be at its rest position with no XY or Z offset

#### Scenario: Deformation direction follows scroll direction

- **WHEN** the user scrolls horizontally (scrollDx > 0, scrollDy = 0) and a vertex is directly under the pointer
- **THEN** the vertex SHALL be displaced in the +X direction by `deformStrength × energy`

#### Scenario: No deformation when scroll velocity is negligible

- **WHEN** `Math.hypot(scrollDx, scrollDy) < 0.001`
- **THEN** all vertices SHALL be reset to their `restPositions` (Z = 0)
- **AND** `needsUpdate` SHALL be set to `true`

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
