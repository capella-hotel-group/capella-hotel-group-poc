## MODIFIED Requirements

### Requirement: Block supports an advance mode flag
The block SHALL read a boolean `advance` field from the authored CMS content. The AEM Universal Editor field for `advance` SHALL use `"component": "boolean"` (renders as a toggle). When the field is absent or `false`, the block SHALL behave identically to the existing non-advance implementation. When `true`, the block SHALL activate the advance animation layer system. The `debug-config.ts` advance override SHALL take precedence over the CMS value when it is not `undefined`.

#### Scenario: Flag absent — existing behaviour preserved
- **WHEN** the block is rendered on a page where no `advance` field has been authored
- **THEN** the block functions exactly as the non-advance version: single background plane with pointer-driven vertex displacement, no overlay planes loaded

#### Scenario: Flag present and true — advance mode activated
- **WHEN** the block is rendered with `advance` set to `true` in the authored CMS content
- **THEN** `initScene()` is called with `config.advance === true`
- **AND** the background plane is created with minimal geometry (4×4 segments)
- **AND** no vertex displacement is applied to the background plane

#### Scenario: Debug config overrides CMS advance flag
- **WHEN** `debugConfig.advance` is set to `true` in `debug-config.ts`
- **THEN** advance mode is active regardless of the CMS row value

#### Scenario: Universal Editor shows advance toggle
- **WHEN** an author opens the block properties panel in Universal Editor
- **THEN** a boolean toggle labelled "Advance Mode" is visible and togglable

## ADDED Requirements

### Requirement: Decor layers animate as rotating branches
The `updateDecorLayer` function SHALL implement a rigid-body rotation model. All vertices in a single decoration plane SHALL share a single frame rotation angle `θ = sinAmplitude × sin(advAngle + phaseOffset)`. Each vertex displacement SHALL be the difference between the rotated offset vector `(ax, ay)` (from the anchor) and the original offset vector: `dispX = ax×(cosθ−1) − ay×sinθ`, `dispY = ax×sinθ + ay×(cosθ−1)`. The `phaseScale` and `velocityScale` parameters SHALL be removed from `UpdateDecorLayerParams`; they have no role in the rotation model.

#### Scenario: Vertices near anchor barely displace
- **WHEN** `updateDecorLayer` is called with non-zero `sinAmplitude`
- **THEN** vertices with `(ax, ay)` close to `(0, 0)` (near the anchor) produce near-zero displacement
- **AND** vertices far from the anchor produce displacement proportional to their distance

#### Scenario: Displacement is tangential to radius vector
- **WHEN** `updateDecorLayer` runs with a given `θ`
- **THEN** the displacement vector `(dispX, dispY)` for each vertex is perpendicular to its offset vector `(ax, ay)` from the anchor (i.e., dot product ≈ 0 for small `θ`)

#### Scenario: Left and right decors are out of phase
- **WHEN** `decorLeft` is updated with `phaseOffset: 0`
- **AND** `decorRight` is updated with `phaseOffset: DECOR_PHASE_RIGHT` (e.g., `Math.PI * 0.7`)
- **THEN** the two planes are visually oscillating at different points in their cycle at any given frame

### Requirement: Canvas text font is resolved from the leaf text element
The `getTextRenderInfo` helper SHALL traverse the DOM from the given element downward, following `firstElementChild`, until reaching an element with no element children. It SHALL call `getComputedStyle` on this leaf element to read `fontSize`, `fontFamily`, `fontWeight`, and `color`. This ensures that CSS rules targeting `h1`, `h2`, or `p` (which carry the typographic declarations) are resolved correctly rather than the inherited values from a wrapper `<div>`.

#### Scenario: Font resolved from h1 inside heading wrapper
- **WHEN** `headingEl` is the `.lighting-interaction-heading` div containing an `h1`
- **THEN** `getTextRenderInfo` computes the canvas font string using the `fontSize` / `fontFamily` of the `h1`, not the wrapper div

#### Scenario: Element has no child elements — treated as leaf
- **WHEN** the element passed to `getTextRenderInfo` has no `firstElementChild`
- **THEN** `getComputedStyle` is called directly on that element (no traversal needed)
