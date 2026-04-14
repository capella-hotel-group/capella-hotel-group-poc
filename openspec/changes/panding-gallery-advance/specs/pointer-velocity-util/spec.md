## ADDED Requirements

### Requirement: PointerVelocityTracker provides smoothed pointer velocity

The `PointerVelocityTracker` class exported from `src/utils/pointer-velocity.ts` SHALL track pointer movement over a target element and expose a continuously-decaying smoothed velocity vector (`smoothDelta: { x: number; y: number }`).

The tracker SHALL implement the same exponential-decay momentum model currently inline in `lighting-interaction/scene.ts`:

- Each animation frame SHALL apply the formula: `smoothDelta = (smoothDelta + pendingDelta) * (1 - decayRate)`.
- `pendingDelta` SHALL be reset to `{ x: 0, y: 0 }` after each frame's accumulation step.
- When `|smoothDelta|` falls below `decayThreshold`, `smoothDelta` SHALL snap to `{ x: 0, y: 0 }`.

Both `decayRate` and `decayThreshold` SHALL be configurable via constructor options with sensible defaults matching current `lighting-interaction` constants (`VELOCITY_DECAY_RATE = 0.032`, `VELOCITY_DECAY_THRESHOLD = 0.0001`).

#### Scenario: Smooth decay after pointer stops

- **WHEN** the pointer stops moving after a fast swipe
- **THEN** `smoothDelta` decreases each frame
- **AND** eventually reaches exactly `{ x: 0, y: 0 }` after a finite number of frames

#### Scenario: Pending delta accumulates within the same frame

- **WHEN** the pointer fires multiple `pointermove` events between two animation frames
- **THEN** all movement since the last frame SHALL be summed into `pendingDelta`
- **AND** applied to `smoothDelta` on the next `update()` call

#### Scenario: Custom decay rate accepted

- **WHEN** the tracker is constructed with `decayRate: 0.1`
- **THEN** that value is used instead of the default
- **AND** higher `decayRate` produces faster fade-out

### Requirement: PointerVelocityTracker manages its own listener lifecycle

The tracker SHALL expose `attach(element: Element): void` and `detach(): void` methods.

`attach` SHALL add a `pointermove` listener to the element and begin accumulating delta values.
`detach` SHALL remove the previously-attached listener and stop accumulating.

#### Scenario: Attach registers listener

- **WHEN** `tracker.attach(element)` is called
- **THEN** subsequent `pointermove` events on `element` update `pendingDelta`

#### Scenario: Detach removes listener

- **WHEN** `tracker.detach()` is called after `attach`
- **THEN** subsequent `pointermove` events on the same element no longer update `pendingDelta`

#### Scenario: Double-detach is safe

- **WHEN** `tracker.detach()` is called when no element is attached
- **THEN** no error is thrown

### Requirement: PointerVelocityTracker update method advances the momentum state

The tracker SHALL expose an `update(): void` method that the caller invokes once per animation frame.

`update()` SHALL apply the exponential decay, accumulate `pendingDelta`, and snap to zero when below threshold — as defined in the decay requirement above.

After `update()` returns, `tracker.smoothDelta` SHALL reflect the new decayed value for that frame.

#### Scenario: Update without active pointer

- **WHEN** `update()` is called with no recent pointer movement
- **THEN** `smoothDelta` continues to decay toward zero

#### Scenario: Update with pending input

- **WHEN** pointer moved since last `update()` call
- **THEN** `pendingDelta` is merged into `smoothDelta` before the decay step
