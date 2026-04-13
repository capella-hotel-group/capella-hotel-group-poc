## Purpose

Defines the pointer velocity decay model for the lighting-interaction Three.js scene. Governs how `smoothDelta` (the smoothed pointer velocity used to drive mesh displacement) fades to zero after pointer movement stops.

---

## Requirements

### Requirement: Velocity smoothly decays to zero when pointer stops
The scene SHALL use an exponential decay model for `smoothDelta`. Each frame where no new pointer input arrives, `smoothDelta` SHALL be multiplied by `(1 - VELOCITY_DECAY_RATE)`. Once the magnitude of `smoothDelta` falls below `VELOCITY_DECAY_THRESHOLD`, `smoothDelta` SHALL snap to `(0, 0)`. Both constants SHALL be configurable via `debugConfig`.

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
