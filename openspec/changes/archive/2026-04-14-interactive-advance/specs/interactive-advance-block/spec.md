## ADDED Requirements

### Requirement: Block renders full-screen placeholder on page load

The block SHALL render a full-screen placeholder element containing an optional background image and a CTA text label. No Three.js or WebGL code SHALL be loaded during this phase.

#### Scenario: Placeholder visible on page load

- **WHEN** the AEM page containing the block is loaded
- **THEN** the block occupies the full viewport height (`100vh`) with the authored placeholder image and CTA text visible
- **AND** no Three.js chunk appears in the browser network waterfall during page load

### Requirement: Three.js scene loads on user click

The block SHALL defer loading of the Three.js scene chunk until the user clicks the placeholder. The chunk SHALL be fetched via dynamic `import()` at click time.

#### Scenario: User clicks placeholder

- **WHEN** the user clicks anywhere within the placeholder element
- **THEN** a loading state is shown on the placeholder
- **AND** the Three.js scene chunk is fetched from the network
- **AND** the WebGL renderer initialises on the block's canvas element

#### Scenario: Scene replaces placeholder after load

- **WHEN** `initScene()` resolves
- **THEN** the placeholder is hidden (opacity 0, pointer-events none)
- **AND** the canvas with the running Three.js scene is fully visible

#### Scenario: Double-click does not reinitialise

- **WHEN** the user clicks the placeholder while the scene is already initialising or loaded
- **THEN** `initScene()` is NOT called a second time

### Requirement: Scene responds to block resize

The Three.js renderer and camera SHALL update their dimensions when the block container is resized.

#### Scenario: Browser window resized after scene load

- **WHEN** the browser viewport width or height changes after the scene has initialised
- **THEN** the renderer size and camera aspect ratio are updated to match the new block dimensions

### Requirement: Block is authorable in AEM Universal Editor

The block SHALL expose two authoring fields via its component model JSON.

#### Scenario: Author sets placeholder text

- **WHEN** an author enters text in the `placeholder-text` field in Universal Editor
- **THEN** that text is rendered as the CTA label on the placeholder

#### Scenario: Author sets placeholder image

- **WHEN** an author selects an image in the `placeholder-image` field
- **THEN** that image is rendered as the background of the placeholder via an AEM-optimised `<picture>` element
