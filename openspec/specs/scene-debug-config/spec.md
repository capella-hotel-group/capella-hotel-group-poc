## Purpose

Defines the debug configuration mechanism for the lighting-interaction block's Three.js scene. A single exported `debugConfig` object in `debug-config.ts` provides build-time-only overrides for scene behaviour, enabling developers to toggle advance mode, layer visibility, wireframe rendering, and debug overlays without modifying authored CMS content.

---

## Requirements

### Requirement: Debug config file exports typed overrides
A file `src/blocks/lighting-interaction/debug-config.ts` SHALL export a single `const debugConfig` object. Every field in the object SHALL be typed as `T | undefined`. When a field is `undefined`, the runtime SHALL ignore it and fall back to the CMS value or hardcoded constant. When a field is set to a concrete value, the runtime SHALL use that value instead.

#### Scenario: All fields undefined — no behaviour change
- **WHEN** every field in `debugConfig` is `undefined`
- **THEN** the block behaves identically to a build with no debug-config file at all

#### Scenario: advance override set to true
- **WHEN** `debugConfig.advance` is set to `true`
- **THEN** the block activates advance mode regardless of what the CMS `advance` row contains

#### Scenario: advance override set to false
- **WHEN** `debugConfig.advance` is set to `false`
- **THEN** the block runs in standard mode regardless of what the CMS `advance` row contains

---

### Requirement: Layer visibility can be toggled via debug config
The debug config SHALL include per-layer visibility booleans: `showDecorLeft`, `showDecorRight`, `showForeground`. When any of these is set to `false`, the corresponding Three.js mesh SHALL have `visible = false` and SHALL NOT update its vertex attributes each frame.

#### Scenario: Decor left hidden
- **WHEN** `debugConfig.showDecorLeft` is `false`
- **THEN** the decor-left mesh is invisible and its per-vertex loop is skipped

#### Scenario: Layer hidden but mesh still in scene
- **WHEN** a layer is hidden via debug config
- **THEN** the mesh object remains in the Three.js scene graph (not removed) so it can be re-shown by toggling the flag

---

### Requirement: Wireframe mode can be toggled per layer via debug config
The debug config SHALL include per-layer wireframe booleans: `wireframeDecorLeft`, `wireframeDecorRight`, `wireframeForeground`. When any of these is `true`, the corresponding mesh's `MeshBasicMaterial.wireframe` property SHALL be set to `true` at scene init time.

#### Scenario: Wireframe enabled for foreground
- **WHEN** `debugConfig.wireframeForeground` is `true`
- **THEN** the foreground mesh renders as a wireframe

#### Scenario: Wireframe not enabled by default
- **WHEN** wireframe fields are `undefined`
- **THEN** all layers render with their textured material as normal

---

### Requirement: Pointer velocity vector debug overlay
When `debugConfig.showVelocityVector` is `true`, the scene SHALL render a Canvas 2D overlay positioned absolutely over the WebGL canvas. Each frame the overlay SHALL clear and draw a line from the current screen-space pointer position in the direction of the current `smoothDelta` velocity vector, with the line length proportional to the velocity magnitude scaled by a configurable `debugConfig.velocityVectorScale` (default 200 px per unit).

#### Scenario: Velocity vector drawn while pointer moves
- **WHEN** `debugConfig.showVelocityVector` is `true` and the pointer is moving
- **THEN** a line is visible on the overlay pointing from the pointer's screen position in the direction of pointer movement

#### Scenario: Velocity vector fades as velocity decays
- **WHEN** the pointer stops and velocity decays toward zero
- **THEN** the line progressively shortens until it disappears when velocity reaches zero

#### Scenario: Overlay absent when flag is false
- **WHEN** `debugConfig.showVelocityVector` is `undefined` or `false`
- **THEN** no overlay canvas is created or drawn
