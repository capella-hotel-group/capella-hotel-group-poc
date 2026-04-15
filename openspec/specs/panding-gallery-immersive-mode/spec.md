## Purpose

Defines the author-facing immersive mode toggle and supporting configuration fields for the `panding-gallery` block, along with the Three.js canvas overlay contract and lazy-import requirements.

---

## Requirements

### Requirement: Block model exposes an immersiveMode toggle

The `panding-gallery` AEM component model SHALL include an `immersiveMode` field of type `boolean` rendered as a checkbox in the Universal Editor. Its default value SHALL be `false`.

When `immersiveMode` is `false`, the block SHALL behave identically to its pre-immersive-mode behaviour (no Three.js code is loaded, DOM grid is unmodified).

#### Scenario: Default value is off

- **WHEN** an author creates a new Panding Gallery block without editing any properties
- **THEN** the block's `immersiveMode` config value SHALL be `false`
- **AND** Phase 2 shall activate without loading any Three.js immersive code

#### Scenario: Author enables immersive mode in UE

- **WHEN** an author opens the Universal Editor and enables the `immersiveMode` checkbox on a Panding Gallery block
- **THEN** the serialised `immersiveMode` field value SHALL be `"true"` in the block content
- **AND** Phase 2 activation SHALL initialise the immersive Three.js scene

---

### Requirement: Block model exposes deformRadius and deformStrength configuration fields

The `panding-gallery` AEM component model SHALL expose `deformRadius` (number, default `200`) and `deformStrength` (number, default `40`) as author-configurable numeric fields visible in the Universal Editor.

Both values SHALL be treated as CSS pixel units internally and passed directly to the immersive scene on initialisation.

#### Scenario: Default deform parameters produce visible but subtle deformation

- **WHEN** `immersiveMode` is `true` and no custom `deformRadius` / `deformStrength` values have been set
- **THEN** the immersive scene SHALL use `deformRadius = 200` and `deformStrength = 40` as the operative values

#### Scenario: Author overrides deform parameters

- **WHEN** an author sets `deformRadius = 350` and `deformStrength = 80` in the Universal Editor
- **THEN** the immersive scene SHALL respect those values for all vertex displacement calculations

---

### Requirement: Immersive Three.js canvas overlays the block

When immersive mode is active (after Phase 2, `immersiveMode = true`), the block SHALL insert a `<canvas>` element as the first child of the block element. The canvas SHALL be:

- Absolutely positioned to cover the block's full bounding rect (`position: absolute; inset: 0`).
- Sized to the block's pixel dimensions (`clientWidth × clientHeight`) with `devicePixelRatio` applied to the renderer.
- Updated in size by a `ResizeObserver` whenever the block's dimensions change.

#### Scenario: Canvas covers the block exactly

- **WHEN** the immersive scene initialises on a block with dimensions 1200px × 800px
- **THEN** the `<canvas>` element SHALL have `width = 1200 × devicePixelRatio` and `height = 800 × devicePixelRatio`
- **AND** the canvas SHALL be positioned at the block's origin via `position: absolute`

#### Scenario: Canvas resizes with the block

- **WHEN** the block's width changes (e.g. viewport resize)
- **THEN** the renderer SHALL call `renderer.setSize(newWidth, newHeight, false)`
- **AND** the camera frustum SHALL be updated to match the new pixel dimensions

---

### Requirement: HTML column grid is hidden while immersive scene is active

When the immersive canvas is mounted, the `.panding-gallery-columns` element SHALL have `visibility: hidden` applied (not `display: none`) to preserve layout dimensions.

When the immersive scene is destroyed (cleanup), `visibility` SHALL be restored to `''` (empty string, i.e. computed default).

#### Scenario: Grid hidden on immersive activation

- **WHEN** the immersive scene initialises successfully
- **THEN** the `.panding-gallery-columns` element SHALL have `visibility: hidden`
- **AND** the `<canvas>` SHALL be visible on top of it

#### Scenario: Grid restored on cleanup

- **WHEN** the immersive scene's `cleanup()` method is called
- **THEN** the `<canvas>` element SHALL be removed from the DOM
- **AND** the `.panding-gallery-columns` element's `visibility` style SHALL be reset to `''`

---

### Requirement: Immersive module is lazily imported only when flag is enabled

The `immersive-scene.ts` module, `vertex-deform.ts`, and `rgb-shift-pass.ts` SHALL NOT be imported or evaluated unless `immersiveMode === true` at Phase 2 activation time.

#### Scenario: Non-immersive blocks do not load Three.js scene modules

- **WHEN** a block has `immersiveMode = false` and Phase 2 activates
- **THEN** no dynamic import for `./immersive-scene` SHALL be issued
- **AND** the existing scroll-motion controller initialises as today
