## Purpose

Defines the pointer velocity decay model for the lighting-interaction Three.js scene. Governs how `smoothDelta` (the smoothed pointer velocity used to drive mesh displacement) fades to zero after pointer movement stops. The decay logic is implemented by the shared `PointerVelocityTracker` utility.

---

## Requirements

### Requirement: Velocity smoothly decays to zero when pointer stops

The scene SHALL use an exponential decay model for `smoothDelta`. Each frame where no new pointer input arrives, `smoothDelta` SHALL be multiplied by `(1 - VELOCITY_DECAY_RATE)`. Once the magnitude of `smoothDelta` falls below `VELOCITY_DECAY_THRESHOLD`, `smoothDelta` SHALL snap to `(0, 0)`. Both constants SHALL be configurable via `debugConfig`.

The implementation of this decay model SHALL be delegated to the shared `PointerVelocityTracker` utility (`src/utils/pointer-velocity.ts`). The scene SHALL instantiate a `PointerVelocityTracker` instead of maintaining inline `pendingDelta` / `smoothDelta` state. All behavioural requirements remain unchanged.

#### Scenario: Velocity fades after pointer stops

- **WHEN** the pointer stops moving after a fast swipe
- **THEN** `smoothDelta` decreases each frame rather than holding at a fixed scaled value
- **AND** reaches exactly `(0, 0)` after a finite number of frames

#### Scenario: Velocity decay rate configurable

- **WHEN** `debugConfig.velocityDecayRate` is set to a value between 0 and 1
- **THEN** that value is used as `VELOCITY_DECAY_RATE` for the current scene session
- **AND** a higher value causes faster decay

#### Scenario: Threshold prevents sub-epsilon infinite loop

- **WHEN** `smoothDelta` magnitude falls below `VELOCITY_DECAY_THRESHOLD`
- **THEN** `smoothDelta` is immediately set to `(0, 0)` on that frame

---

### Requirement: New pointer input accumulates onto decaying velocity

When the pointer moves while velocity is still decaying, the incoming `pendingDelta` SHALL be added to `smoothDelta` after applying the decay on that same frame. This preserves momentum from sustained movement while still allowing natural fade-out.

#### Scenario: Continued motion reinforces velocity

- **WHEN** the pointer moves continuously
- **THEN** `smoothDelta` remains non-zero and tracks the pointer's recent motion

---

### Requirement: Scene delegates velocity tracking to PointerVelocityTracker

`lighting-interaction/scene.ts` SHALL NOT contain inline `pendingDelta`, `smoothDelta`, `lastNDC` accumulators, or the inline `pointermove` listener that was previously used for velocity tracking. These SHALL be replaced by a `PointerVelocityTracker` instance.

`initScene` SHALL construct the tracker with decay constants sourced from `debugConfig` (with fallback to module-level defaults) and call `tracker.attach(container)`. `cleanupScene` SHALL call `tracker.detach()`.

Each animation frame SHALL call `tracker.update()` and read `tracker.smoothDelta` in place of the previous inline `smoothDelta` variable.

#### Scenario: Scene uses tracker smoothDelta

- **WHEN** the scene animation loop runs a frame after pointer movement
- **THEN** the value used for mesh displacement is read from `tracker.smoothDelta`
- **AND** the scene behaviour is identical to the previous inline implementation

#### Scenario: Tracker detached on cleanup

- **WHEN** `cleanupScene()` is called
- **THEN** `tracker.detach()` has been called
- **AND** no further `pointermove` events update tracker state
