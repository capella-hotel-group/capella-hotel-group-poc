## Purpose

Controls whether the headline canvas-texture plane is created in advance mode. When opted in, DOM heading/tagline text is composited onto a Three.js plane that responds to pointer displacement; otherwise the DOM text remains visible as-is.

---

## Requirements

### Requirement: Headline plane creation is opt-in
The system SHALL only create the headline canvas-texture plane when `SceneConfig.headlineInteraction` is explicitly `true`. When the field is absent or `false`, the headline plane SHALL NOT be created, the DOM content element SHALL remain visible, and the `lighting-interaction--text-swapped` class SHALL NOT be added to the block.

#### Scenario: headlineInteraction absent — DOM text preserved
- **WHEN** `initScene` is called with a config that has no `headlineInteraction` field
- **THEN** `createHeadlinePlane` is NOT called
- **AND** the block element does NOT receive the `lighting-interaction--text-swapped` class
- **AND** the `.lighting-interaction-content` DOM element remains fully visible

#### Scenario: headlineInteraction false — DOM text preserved
- **WHEN** `initScene` is called with `config.headlineInteraction === false`
- **THEN** `createHeadlinePlane` is NOT called
- **AND** the block element does NOT receive the `lighting-interaction--text-swapped` class

#### Scenario: headlineInteraction true — headline plane created
- **WHEN** `initScene` is called with `config.headlineInteraction === true`
- **AND** `config.headingEl` or `config.taglineEl` references a non-empty DOM element
- **THEN** a `HeadlinePlane` is created and added to the Three.js scene
- **AND** the block element receives the `lighting-interaction--text-swapped` class
- **AND** the `.lighting-interaction-content` element is hidden via CSS

#### Scenario: headlineInteraction true but no elements — no plane
- **WHEN** `initScene` is called with `config.headlineInteraction === true`
- **AND** both `config.headingEl` and `config.taglineEl` are `null` or contain no text
- **THEN** `createHeadlinePlane` returns `null`
- **AND** no class is added to the block element
