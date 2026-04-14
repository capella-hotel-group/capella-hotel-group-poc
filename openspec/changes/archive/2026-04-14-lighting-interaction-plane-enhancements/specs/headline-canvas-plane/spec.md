## ADDED Requirements

### Requirement: A canvas-texture plane composites the block's heading and tagline text

When advance mode is active and the block contains heading or tagline content, a `PlaneGeometry` plane at `renderOrder = 4` SHALL be added to the Three.js scene. Its material SHALL use a `CanvasTexture` backed by an offscreen `<canvas>` element. At init time the canvas SHALL be drawn with the heading and tagline text at positions and styles that match their computed CSS layout on-screen. On resize, the canvas SHALL be repainted to reflect the new layout.

#### Scenario: Headline plane appears above foreground

- **WHEN** advance mode is fully initialised
- **THEN** the headline plane renders above the foreground plane (renderOrder 4 > foreground renderOrder 3)

#### Scenario: Canvas text matches DOM heading position and style

- **WHEN** the headline canvas is painted at init
- **THEN** text is drawn using the font family, size, weight, and colour read from `getComputedStyle` of the heading and tagline DOM elements
- **AND** the vertical position within the canvas matches the `getBoundingClientRect().top / containerHeight` ratio

#### Scenario: DOM heading is hidden when headline plane is active

- **WHEN** `createHeadlinePlane` resolves successfully
- **THEN** the block element receives the class `lighting-interaction--text-swapped`
- **AND** the `.lighting-interaction-content` element transitions to `opacity: 0; pointer-events: none` via CSS

#### Scenario: Headline plane is absent without heading content

- **WHEN** the block has no heading or tagline rows
- **THEN** no headline plane is added to the scene and the DOM is not modified

---

### Requirement: Headline plane responds to pointer displacement like the standard-mode background

The headline plane's vertex displacement SHALL use the same Gaussian-weighted impulse + spring-back model as the standard-mode background, using `applyStandardDisplacement` and `applySpringBack` from `scene-animation.ts`. The plane has its own independent displacement arrays (`hlDispX`, `hlDispY`, `hlDispZ`).

#### Scenario: Pointer moves over headline plane

- **WHEN** the pointer moves over the block in advance mode
- **THEN** the headline plane vertices near the pointer position are displaced in the direction of pointer movement

#### Scenario: Headline vertices spring back after pointer stops

- **WHEN** the pointer stops moving
- **THEN** the headline plane vertices spring back toward their rest positions using `SPRING_DAMPING`

#### Scenario: Headline plane has independent displacement from background

- **WHEN** advance mode is active
- **THEN** the background plane (at rest in advance mode) is not displaced by pointer, while the headline plane displaces independently
