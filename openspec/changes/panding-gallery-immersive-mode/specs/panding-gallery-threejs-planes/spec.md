## ADDED Requirements

### Requirement: One PlaneGeometry per grid cell sized and positioned to match the DOM layout

For each image in each column, the immersive scene SHALL create a `THREE.PlaneGeometry(cellWidth, cellHeight, 8, 8)` and a `THREE.Mesh` textured with that cell's image. Plane positions SHALL be computed in pixel-space world coordinates to match the DOM cell's layout position relative to the block's top-left corner.

The OrthographicCamera SHALL use `left = -blockWidth/2`, `right = blockWidth/2`, `top = blockHeight/2`, `bottom = -blockHeight/2`, `near = -1000`, `far = 1000`; `camera.position.z = 1`. This maps one Three.js world unit to one CSS pixel.

#### Scenario: Plane count matches image count

- **WHEN** the immersive scene initialises with 20 images across 5 columns
- **THEN** exactly 20 `Mesh` objects SHALL exist in the scene

#### Scenario: Plane dimensions match DOM cell dimensions

- **WHEN** a column item has `offsetWidth = 240` and `offsetHeight = 320`
- **THEN** its corresponding `PlaneGeometry` SHALL be created with `width = 240` and `height = 320`

#### Scenario: Plane base positions match DOM cell origins

- **WHEN** a cell's top-left is at `(x, y)` relative to the block (no scroll offset applied)
- **THEN** the mesh's initial `position.x` SHALL equal `x + cellWidth/2 - blockWidth/2`
- **AND** the mesh's initial `position.y` SHALL equal `-(y + cellHeight/2 - blockHeight/2)`

---

### Requirement: Plane positions are synchronised with scroll-motion offsets every frame

Every animation frame, the immersive scene SHALL read the current scroll-motion state and apply the same logical `translateX` / `translateY` transforms to the corresponding Three.js `Mesh` world positions that the DOM scroll-motion applies via CSS `transform`.

The immersive scene SHALL receive a reference to the `ScrollMotionController` and read its publicly exposed per-column X offset and per-item Y offset values each frame.

#### Scenario: Horizontal scroll moves all planes uniformly

- **WHEN** the scroll-motion controller's globalOffsetX advances by 5px
- **THEN** the X position of every plane SHALL increase by 5px in the same frame

#### Scenario: Vertical scroll moves per-column planes by their column weight

- **WHEN** column 0's net vertical offset is 100px and column 1's is 70px
- **THEN** all planes in column 0 SHALL have their Y position adjusted by 100px
- **AND** all planes in column 1 SHALL have their Y position adjusted by 70px

#### Scenario: Per-item Y offsets from infinity loop teleportation are reflected

- **WHEN** a scroll-motion item receives an `itemOffsetY` teleportation correction of `+totalColumnHeight`
- **THEN** the corresponding Three.js plane SHALL apply the same Y correction in the same frame

---

### Requirement: Textures are loaded from existing DOM image elements

The immersive scene SHALL create textures by passing the existing `<img>` element's `src` URL to `THREE.TextureLoader`. The material SHALL use `THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide })`.

If a texture fails to load, the corresponding plane SHALL render with a transparent black fallback material and SHALL NOT throw an uncaught error.

#### Scenario: Texture loaded from img src

- **WHEN** an image element with `src = "/media/photo.jpg"` is present in a column
- **THEN** `TextureLoader.load("/media/photo.jpg")` SHALL be called for that cell's mesh

---

### Requirement: ResizeObserver re-synchronises camera frustum and plane base positions

When the block's dimensions change, the immersive scene SHALL:

1. Update the renderer size via `renderer.setSize(newW, newH, false)`.
2. Recalculate and apply the new camera frustum values.
3. Recompute all plane base positions from live DOM `offsetLeft` / `offsetTop` values.

#### Scenario: Resize updates camera and planes

- **WHEN** the block's `clientWidth` changes from 1200px to 800px
- **THEN** the camera `left` SHALL be updated to `-400` and `right` to `400`
- **AND** all plane X base positions SHALL be recalculated from the new block dimensions

---

### Requirement: Scroll-motion controller exposes a public scrollEnergy getter

The `ScrollMotionController` class SHALL expose `get scrollEnergy(): number`, returning a value in the range `[0, 1]` computed as `Math.tanh(Math.hypot(dx, dy) / ENERGY_SCALE)` where `dx`/`dy` are the current frame's velocity values and `ENERGY_SCALE = 15`.

#### Scenario: Energy is 0 when grid is stationary

- **WHEN** no scroll input has been received for multiple frames and velocity has decayed to zero
- **THEN** `controller.scrollEnergy` SHALL return `0`

#### Scenario: Energy approaches 1 for large scroll velocities

- **WHEN** the user applies a large, fast scroll gesture producing `|velocity| >> ENERGY_SCALE`
- **THEN** `controller.scrollEnergy` SHALL approach but never exceed `1.0`
