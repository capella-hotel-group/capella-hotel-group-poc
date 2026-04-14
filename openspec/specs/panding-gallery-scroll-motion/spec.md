## Purpose

Defines the scroll-motion interaction layer for the `panding-gallery` block. Governs input modes, bidirectional movement, per-column speed weights, and infinity-loop swapping on both axes.

---

## Requirements

### Requirement: Default input mode is scroll/wheel delta

The scroll-motion module SHALL read input from `wheel` events on the block element by default. The block's AEM model SHALL include an `inputMode` field accepting `"scroll"` (default) or `"pointer"`.

Wheel delta SHALL be normalised before use:

- `deltaMode === 0` (pixels): `normalisedDelta = wheelEvent.delta / 100`
- `deltaMode === 1` (lines): `normalisedDelta = wheelEvent.delta * 20 / 100`

Both `deltaX` and `deltaY` SHALL be consumed and applied to the respective scroll axes.

#### Scenario: Scroll/wheel drives grid movement

- **WHEN** the user scrolls the mouse wheel over the block
- **THEN** the grid translates in the direction of the scroll
- **AND** the scroll event is NOT propagated to the page (default prevented)

#### Scenario: Pointer mode selected via model field

- **WHEN** `inputMode` is set to `"pointer"` in the AEM model
- **THEN** the `PointerVelocityTracker` is attached and drives grid movement
- **AND** `wheel` events are ignored

### Requirement: Grid moves bidirectionally along X and Y simultaneously

Every frame, the scroll-motion module SHALL apply a global horizontal offset (`offsetX`) to all column positions and a per-column vertical offset (`offsetY[col]`) to each column's items.

Both offsets update in the same animation frame; they are independent (a diagonal velocity drives both axes at once).

#### Scenario: Diagonal input moves grid in both axes

- **WHEN** the input velocity vector has non-zero X and Y components
- **THEN** all columns shift horizontally
- **AND** each column shifts vertically by its own weighted amount
- **AND** both changes occur in the same animation frame

### Requirement: Per-column Y-axis speed multipliers

The scroll-motion module SHALL maintain an array of 5 multipliers (`columnWeights: number[]`) — one per column — that scale the input Y-velocity before applying it to that column's `offsetY`.

Default hardcoded weights SHALL be: `[1.0, 0.7, 1.2, 0.85, 1.1]`. The weights SHALL be configurable at initialisation time.

#### Scenario: Columns scroll at different vertical speeds

- **WHEN** the input provides a Y velocity of 1.0
- **THEN** column 0 moves at 1.0× speed
- **AND** column 1 moves at 0.7× speed
- **AND** column 2 moves at 1.2× speed
- **AND** column 3 moves at 0.85× speed
- **AND** column 4 moves at 1.1× speed

#### Scenario: Custom weights override defaults

- **WHEN** the motion controller is initialised with `columnWeights: [2, 2, 2, 2, 2]`
- **THEN** all columns scroll at 2× the base Y velocity

### Requirement: Horizontal movement is uniform across all columns

The X axis SHALL apply the same `offsetX` delta to every column's horizontal position each frame. There are no per-column X weights.

#### Scenario: All columns shift equally on horizontal input

- **WHEN** the input provides an X velocity of 5px
- **THEN** every column's X position increases by 5px in that frame

### Requirement: Y-axis infinity loop via item teleportation

For each column, when an item's effective screen Y position falls outside the range `[-swapPadding, viewportHeight + swapPadding]`, its logical position SHALL be shifted by ±`totalColumnHeight` to place it at the opposite end.

`swapPadding` SHALL be a configurable constant (default: `200` px).
`totalColumnHeight` is the sum of all item heights plus inter-item gaps within that column (gap counted after every item, including the last, to ensure a consistent slot size).

#### Scenario: Item scrolling off top teleports to bottom

- **WHEN** a column item's screen Y exceeds `-swapPadding` in the upward direction (i.e., `effectiveY < -swapPadding`)
- **THEN** that item's logical Y offset is increased by `totalColumnHeight`
- **AND** the item appears at the bottom of the column without visual discontinuity

#### Scenario: Item scrolling off bottom teleports to top

- **WHEN** a column item's screen Y exceeds `viewportHeight + swapPadding`
- **THEN** that item's logical Y offset is decreased by `totalColumnHeight`
- **AND** the item appears at the top of the column

#### Scenario: Swap padding configurable

- **WHEN** `swapPadding` is set to `0`
- **THEN** teleportation occurs as soon as an item crosses the viewport edge

### Requirement: X-axis infinity loop via column teleportation

When a column's effective screen X position falls outside `[-swapPadding, viewportWidth + swapPadding]`, the column's logical X offset SHALL be shifted by ±`totalGridWidth`.

`totalGridWidth = (columnWidth + gap) * columnCount` (gap counted after every column for consistency with the Y-axis convention).

#### Scenario: Column scrolling off left teleports to right

- **WHEN** a column's screen X exceeds `-swapPadding` in the leftward direction
- **THEN** that column's logical X offset is increased by `totalGridWidth`
- **AND** the column appears at the right edge

#### Scenario: Column scrolling off right teleports to left

- **WHEN** a column's screen X exceeds `viewportWidth + swapPadding`
- **THEN** that column's logical X offset is decreased by `totalGridWidth`
- **AND** the column appears at the left edge

### Requirement: RAF loop stops when block is removed from DOM

The scroll-motion module SHALL cancel its `requestAnimationFrame` loop and remove all event listeners when `cleanup()` is called.

#### Scenario: Cleanup releases resources

- **WHEN** `cleanup()` is called on the motion controller
- **THEN** the RAF loop is cancelled
- **AND** all registered event listeners are removed
- **AND** no further DOM updates occur
